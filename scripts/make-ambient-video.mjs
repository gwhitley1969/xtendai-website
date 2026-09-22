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
 *   Masters are generated to end on their own first frame (a locked-off
 *   camera, or a flight that climbs back to its starting view), so the fade
 *   only bridges a small residual and the lattice cannot ghost.
 * - Grade: done at 16-bit with BT.709 stated explicitly (swscale assumes
 *   BT.601 otherwise). The black floor is LIFTED to the page background
 *   #0a0a0f rather than crushed: the video sits on the page at partial
 *   opacity, and pixels darker than the page would read as a dirty box.
 * - Deband + error-diffusion dither: dark navy gradients band badly in
 *   8-bit H.264. Added luma noise (`grade.grain`) exists per clip but is OFF
 *   by default: measured on real footage it took a loop from 0.26 MB to
 *   8 MB at crf 16, because x264 faithfully encodes per-frame noise, and at
 *   sane crf it is quantized away before it can hide anything. `noise` is
 *   8-bit only in ffmpeg, so when used it runs last.
 * - Encode: H.264 High with an explicit level (veryslow alone lands at
 *   L5.1, which some phone hardware decoders refuse), a single GOP so the
 *   loop has no mid-clip keyframe pulse, no audio track at all, CFR, and
 *   +faststart so playback can begin before the file has fully arrived.
 *   The one keyframe at the loop restart differs from the frame before it
 *   by a mean of about 0.5 luma levels (of 255), measured; flattening
 *   ipratio/pbratio or disabling mbtree did not reduce that and cost size,
 *   so x264's defaults stay.
 * - Budget: a rendition over budget is deleted and the run fails. Budgets
 *   are part of the brief (XTEND-AI-WEB.md §14.2), not a suggestion.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';

const MASTERS = 'video-masters';
const WORK = 'video-masters/.work';
const OUT = 'src/assets/video';

/**
 * The curve rolls the highlights off (1.0 -> 0.84): mid-ride the flare blows
 * out to white right under the headline, and a capped, still-saturated blue
 * costs the text far less contrast. The ride and the loop MUST share one
 * grade, or the lattice nodes would change brightness at each handover.
 */
const DEFAULT_GRADE = {
  balance: 'rs=-0.04:bs=0.06:rm=-0.03:bm=0.05',
  curve: '0/0 0.5/0.46 0.85/0.76 1/0.84',
  grain: 0,
};

/**
 * One entry per shipped clip.
 * - `fadeSeconds`: length of the tail-into-head crossfade that closes a
 *   loop. 0 = the clip plays once (an intro) and is left as generated.
 * - `denoise`: light temporal denoise; good for calm footage, smears fast
 *   motion, so energetic clips switch it off.
 * - `still`: export the first frame beside each rendition (default true).
 * - `cropX` / `cropY` steer the crop window when a rendition's aspect
 *   differs from the master's: 0 = left/top edge, 1 = right/bottom edge. A
 *   string is an ffmpeg expression of `t` (seconds) with `D` = duration, so
 *   the window can travel: the ride's portrait crop starts and ends where
 *   the loop's crop sits (0.8, on the lattice) and swings to the centre,
 *   where the vanishing point is, in between.
 */
const CLIPS = {
  // The perpetual flight under the home hero (2026-09-22, owner request:
  // the opening ride, on repeat): from the high wide view the camera dives,
  // races over the lattice and climbs back to the same view, so the end
  // lands near the start and a short crossfade closes the cycle. Generated
  // with the cloudless frame as BOTH start and end image; the lattice glows
  // steadily (co-founder request), so nothing pulses. The portrait crop
  // travels with the camera: it starts and ends where the lattice sits
  // (0.8) and swings to the centre, where the vanishing point is.
  'beneath-hero': {
    master: 'beneath-flight-master.mp4',
    fadeSeconds: 0.8,
    denoise: false,
    renditions: [
      { suffix: 'd', width: 1600, height: 900, level: '4.0', crf: 27, budgetBytes: 3_500_000 },
      { suffix: 'm', width: 540, height: 960, level: '3.1', crf: 27, budgetBytes: 1_500_000, cropX: '0.8-0.3*sin(PI*t/D)' },
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

/**
 * Lossless 10-bit intermediate. For a loop, the last `fadeFrames` are
 * crossfaded into the first (N frames in, N - fadeFrames out). A play-once
 * clip (`fadeFrames` 0) passes through untouched. `denoise` is a light
 * temporal filter that helps calm footage compress; it smears fast motion,
 * so energetic clips turn it off.
 */
function buildIntermediate(master, out, { fpsExpr, fps, frames, fadeFrames, denoise }) {
  const pre = `fps=${fpsExpr},format=yuv444p10le${denoise ? ',hqdn3d=0:0:3:3' : ''}`;
  const graph = fadeFrames > 0
    ? `[0:v]${pre},split[a][b];` +
      `[a]trim=start_frame=${fadeFrames},setpts=PTS-STARTPTS[body];` +
      `[b]trim=end_frame=${fadeFrames},setpts=PTS-STARTPTS[head];` +
      `[body][head]xfade=transition=fade:duration=${(fadeFrames / fps).toFixed(4)}:offset=${((frames - 2 * fadeFrames) / fps - 0.001).toFixed(3)}[v]`
    : `[0:v]${pre}[v]`;
  run('ffmpeg', [
    '-y', '-hide_banner', '-v', 'error', '-i', master, '-an', '-filter_complex', graph,
    '-map', '[v]', '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'yuv444p10le', out,
  ]);
  const got = probe(out).frames;
  const want = frames - fadeFrames;
  if (got !== want) throw new Error(`intermediate has ${got} frames, expected ${want}`);
}

function cropFilter(src, r) {
  const srcAspect = src.width / src.height;
  const dstAspect = r.width / r.height;
  if (Math.abs(srcAspect - dstAspect) < 0.01) return [];
  // Expressions may use `t`; `D` is substituted with the clip duration.
  const pos = (v) => String(v ?? 0.5).replaceAll('D', (src.frames / src.fps).toFixed(4));
  return dstAspect < srcAspect
    ? [`crop=w=ih*${r.width}/${r.height}:h=ih:x='(iw-ow)*(${pos(r.cropX)})':y=0`]
    : [`crop=w=iw:h=iw*${r.height}/${r.width}:x=0:y='(ih-oh)*(${pos(r.cropY)})'`];
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

/**
 * First frame of the finished rendition, as the still that paints under the
 * clip. Taken from the encode itself, not the master, so the video fades in
 * over a pixel-identical frame and the picture simply starts to move.
 */
function exportStill(rendition, still) {
  run('ffmpeg', ['-y', '-hide_banner', '-v', 'error', '-i', rendition, '-frames:v', '1', '-update', '1', still]);
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
  const fadeFrames = Math.round((clip.fadeSeconds ?? 0) * src.fps);
  const intermediate = `${WORK}/${name}.mkv`;
  buildIntermediate(master, intermediate, { ...src, fadeFrames, denoise: clip.denoise ?? true });
  console.log(fadeFrames
    ? `looped ${name}: ${src.frames} -> ${src.frames - fadeFrames} frames @ ${src.fpsExpr} fps`
    : `prepared ${name}: ${src.frames} frames @ ${src.fpsExpr} fps (plays once, no loop)`);

  const grade = { ...DEFAULT_GRADE, ...clip.grade };
  for (const r of clip.renditions) {
    const out = `${OUT}/${name}-${r.suffix}.mp4`;
    encodeRendition(intermediate, out, src, r, grade);
    const size = checkBudget(out, r.budgetBytes);
    console.log(`wrote ${out} (${r.width}x${r.height}, ${(size / 1e6).toFixed(2)} MB)`);
    if (clip.still ?? true) {
      const still = `${OUT}/${name}-${r.suffix}.png`;
      exportStill(out, still);
      console.log(`wrote ${still}`);
    }
  }
}

const requested = process.argv.slice(2);
for (const name of requested.length ? requested : Object.keys(CLIPS)) makeClip(name);
