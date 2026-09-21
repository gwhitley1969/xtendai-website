/**
 * Turns a generated master clip into the seamless, web-ready loops the site
 * ships as ambient background video. Run manually after a new master lands
 * in video-masters/ (gitignored):
 *
 *   node scripts/make-ambient-video.mjs                # every clip in CLIPS
 *   node scripts/make-ambient-video.mjs beneath-hero   # just one
 *
 * then commit the outputs in src/assets/video/. Not part of the build.
 *
 * Needs ffmpeg and ffprobe on PATH. Unlike sharp (which Astro ships), ffmpeg
 * is a system prerequisite for regenerating loops only; `npm run build`
 * never touches it.
 *
 * What each step is for:
 * - Loop: the tail of the clip is crossfaded into its head, so the last
 *   frame flows into the first. Frame-exact trims, asserted afterwards.
 *   Masters are shot locked-off (only cloud and light move), which is what
 *   keeps the fixed lattice from ghosting during the fade.
 * - Grade: done at 16-bit with BT.709 stated explicitly (swscale assumes
 *   BT.601 otherwise). The black floor is LIFTED to the page background
 *   #0a0a0f rather than crushed: the video sits on the page at partial
 *   opacity, and pixels darker than the page would read as a dirty box.
 * - Deband + dither + a little luma noise: dark navy gradients band badly
 *   in 8-bit H.264. `noise` is 8-bit only in ffmpeg, so it runs last.
 * - Encode: H.264 High with an explicit level (veryslow alone lands at
 *   L5.1, which some phone hardware decoders refuse), a single GOP so the
 *   loop has no mid-clip keyframe pulse, no audio track at all, CFR, and
 *   +faststart so playback can begin before the file has fully arrived.
 * - Budget: a rendition over budget is deleted and the run fails. Budgets
 *   are part of the brief (XTEND-AI-WEB.md §14.2), not a suggestion.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';

const MASTERS = 'video-masters';
const WORK = 'video-masters/.work';
const OUT = 'src/assets/video';

const DEFAULT_GRADE = {
  balance: 'rs=-0.04:bs=0.06:rm=-0.03:bm=0.05',
  curve: '0/0 0.5/0.46 1/0.94',
  grain: 4,
};

/**
 * One entry per shipped clip. `cropX` / `cropY` (0..1) steer the crop window
 * when a rendition's aspect differs from the master's: 0 = left/top edge,
 * 1 = right/bottom edge.
 */
const CLIPS = {
  'beneath-hero': {
    master: 'beneath-hero-master.mp4',
    fadeSeconds: 1.5,
    renditions: [
      { suffix: 'd', width: 1600, height: 900, level: '4.0', crf: 24, budgetBytes: 1_500_000 },
      { suffix: 'm', width: 540, height: 960, level: '3.1', crf: 25, budgetBytes: 600_000, cropX: 0.8 },
    ],
  },
};

function run(bin, args) {
  const res = spawnSync(bin, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (res.error) throw new Error(`${bin} could not start: ${res.error.message}. Is it on PATH?`);
  if (res.status !== 0) throw new Error(`${bin} exited ${res.status}:\n${res.stderr.split('\n').slice(-12).join('\n')}`);
  return res.stdout;
}

/** Real frame count and frame rate; nothing about the master is assumed. */
function probe(file) {
  const out = run('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0', '-count_frames',
    '-show_entries', 'stream=width,height,r_frame_rate,nb_read_frames',
    '-of', 'json', file,
  ]);
  const s = JSON.parse(out).streams[0];
  const [num, den] = s.r_frame_rate.split('/').map(Number);
  return { width: s.width, height: s.height, fps: num / den, fpsExpr: s.r_frame_rate, frames: Number(s.nb_read_frames) };
}

/** Crossfades the last `fadeFrames` into the first: N frames in, N - fadeFrames out. */
function buildLoop(master, loop, { fpsExpr, fps, frames, fadeFrames }) {
  const fadeDur = (fadeFrames / fps).toFixed(4);
  const offset = ((frames - 2 * fadeFrames) / fps - 0.001).toFixed(3);
  run('ffmpeg', [
    '-y', '-hide_banner', '-v', 'error', '-i', master, '-an',
    '-filter_complex',
    `[0:v]fps=${fpsExpr},format=yuv444p10le,hqdn3d=0:0:3:3,split[a][b];` +
      `[a]trim=start_frame=${fadeFrames},setpts=PTS-STARTPTS[body];` +
      `[b]trim=end_frame=${fadeFrames},setpts=PTS-STARTPTS[head];` +
      `[body][head]xfade=transition=fade:duration=${fadeDur}:offset=${offset}[v]`,
    '-map', '[v]', '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'yuv444p10le', loop,
  ]);
  const got = probe(loop).frames;
  const want = frames - fadeFrames;
  if (got !== want) throw new Error(`loop has ${got} frames, expected ${want}`);
}

function cropFilter(src, r) {
  const srcAspect = src.width / src.height;
  const dstAspect = r.width / r.height;
  if (Math.abs(srcAspect - dstAspect) < 0.01) return [];
  return dstAspect < srcAspect
    ? [`crop=w=ih*${r.width}/${r.height}:h=ih:x=(iw-ow)*${r.cropX ?? 0.5}:y=0`]
    : [`crop=w=iw:h=iw*${r.height}/${r.width}:x=0:y=(ih-oh)*${r.cropY ?? 0.5}`];
}

function encodeRendition(loop, out, src, r, grade) {
  const chain = [
    'scale=in_color_matrix=bt709:in_range=tv', 'format=gbrp16le',
    `colorbalance=${grade.balance}`, `curves=all='${grade.curve}'`,
    'colorlevels=romin=0.0392:gomin=0.0392:bomin=0.0588', // floor = #0a0a0f
    'deband=1thr=0.015:2thr=0.015:3thr=0.015:range=16:blur=1',
    ...cropFilter(src, r),
    `scale=w=${r.width}:h=${r.height}:flags=lanczos+accurate_rnd+full_chroma_int:sws_dither=ed:out_color_matrix=bt709:out_range=tv`,
    'format=yuv420p',
    ...(grade.grain > 0 ? [`noise=c0s=${grade.grain}:c0f=t+u`] : []),
  ];
  run('ffmpeg', [
    '-y', '-hide_banner', '-v', 'error', '-i', loop, '-vf', chain.join(','),
    '-c:v', 'libx264', '-preset', 'veryslow', '-profile:v', 'high', '-level:v', r.level, '-crf', String(r.crf),
    '-x264-params', 'keyint=infinite:scenecut=0:aq-mode=3:aq-strength=1.0:deblock=-1,-1',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
    '-fps_mode', 'cfr', '-an', '-movflags', '+faststart', '-map_metadata', '-1', out,
  ]);
}

function checkBudget(out, budgetBytes) {
  const size = statSync(out).size;
  if (size > budgetBytes) {
    rmSync(out);
    throw new Error(`${out} is ${(size / 1e6).toFixed(2)} MB, over its ${(budgetBytes / 1e6).toFixed(2)} MB budget (deleted). Raise crf, shorten the loop, or lower the resolution.`);
  }
  return size;
}

function makeClip(name) {
  const clip = CLIPS[name];
  if (!clip) throw new Error(`unknown clip "${name}". Known: ${Object.keys(CLIPS).join(', ')}`);
  const master = `${MASTERS}/${clip.master}`;
  if (!existsSync(master)) throw new Error(`missing master ${master}`);
  mkdirSync(WORK, { recursive: true });
  mkdirSync(OUT, { recursive: true });

  const src = probe(master);
  const fadeFrames = Math.round(clip.fadeSeconds * src.fps);
  const loop = `${WORK}/${name}-loop.mkv`;
  buildLoop(master, loop, { ...src, fadeFrames });
  console.log(`looped ${name}: ${src.frames} -> ${src.frames - fadeFrames} frames @ ${src.fpsExpr} fps`);

  const grade = { ...DEFAULT_GRADE, ...clip.grade };
  for (const r of clip.renditions) {
    const out = `${OUT}/${name}-${r.suffix}.mp4`;
    encodeRendition(loop, out, src, r, grade);
    const size = checkBudget(out, r.budgetBytes);
    console.log(`wrote ${out} (${r.width}x${r.height}, ${(size / 1e6).toFixed(2)} MB)`);
  }
}

const requested = process.argv.slice(2);
for (const name of requested.length ? requested : Object.keys(CLIPS)) makeClip(name);
