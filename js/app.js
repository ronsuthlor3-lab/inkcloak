import { setupLang, setupTheme, t } from './i18n.js';
import { psnr, ssim, cosine, composeCloak } from './core.js';
import { canvasToRgb, rgbToCanvas, fitCanvas, fileToCanvas, pngBlob, MAX_SIDE } from './imageio.js';
import { initBackend, optimise, embed, decoyEmbedding, WORK_SIDE } from './cloak.js';
import { makeSample } from './samples.js';

const $ = (id) => document.getElementById(id);
const state = {
  name: 'artwork',
  full: null,      // {rgb, w, h}
  work: null,      // downscaled copy for optimisation
  delta: null,     // full-resolution perturbation (Float32Array)
  epsMap: null,
  eps255: 0,       // strength the delta was optimised at
  out: null,       // cloaked rgb, quantised
  embInfo: null,
  busy: false,
  scaled: false,
};

let statusKey = null;
let statusVars = {};
function status(key, vars = {}, error = false) {
  statusKey = key; statusVars = vars;
  $('status').textContent = key ? t(key, vars) : '';
  $('status').classList.toggle('error', error);
}

const applyTheme = setupTheme($('theme'));
setupLang(() => { applyTheme(); if (statusKey) status(statusKey, statusVars, $('status').classList.contains('error')); showScaled(); });

function showScaled() {
  $('scaled').hidden = !state.scaled;
  $('scaled').textContent = t('scaledNote', { n: MAX_SIDE });
}

async function loadCanvas(canvas, name, scaled = false) {
  state.name = name;
  state.full = canvasToRgb(canvas);
  state.work = canvasToRgb(fitCanvas(canvas, WORK_SIDE));
  state.delta = state.out = state.embInfo = null;
  state.scaled = scaled;
  showScaled();
  rgbToCanvas(state.full.rgb, state.full.w, state.full.h, $('cv-before'));
  rgbToCanvas(state.full.rgb, state.full.w, state.full.h, $('cv-after'));
  $('viewer').hidden = false;
  $('results').hidden = true;
  $('run').disabled = state.busy;
  status(null);
  layoutCompare();
}

// ---------- input ----------
$('file').addEventListener('change', async (e) => {
  const f = e.target.files?.[0];
  if (f) await openFile(f);
});
async function openFile(f) {
  try {
    const { canvas, scaled } = await fileToCanvas(f);
    await loadCanvas(canvas, f.name.replace(/\.[^.]+$/, '') || 'artwork', scaled);
  } catch {
    status('errImage', {}, true);
  }
}
const drop = $('drop');
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('over')));
drop.addEventListener('drop', (e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) openFile(f); });
document.querySelectorAll('[data-sample]').forEach((b) => b.addEventListener('click', () => {
  loadCanvas(makeSample(b.dataset.sample, 768), `sample-${b.dataset.sample}`);
}));

// ---------- compare slider ----------
function layoutCompare() {
  const p = Number($('split').value) / 100;
  const wrap = $('after-wrap');
  wrap.style.clipPath = `inset(0 0 0 ${p * 100}%)`;
  $('divider').style.left = `calc(${p * 100}% - 1px)`;
  $('cv-after').style.width = '100%';
}
$('split').addEventListener('input', layoutCompare);
const cmp = $('compare');
function dragTo(e) {
  const r = cmp.getBoundingClientRect();
  $('split').value = String(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * 100));
  layoutCompare();
}
cmp.addEventListener('pointerdown', (e) => { cmp.setPointerCapture(e.pointerId); dragTo(e); });
cmp.addEventListener('pointermove', (e) => { if (cmp.hasPointerCapture(e.pointerId)) dragTo(e); });

// ---------- strength & live readout ----------
$('eps').addEventListener('input', () => {
  $('eps-val').textContent = $('eps').value;
  if (state.delta) schedulePreview();
});
$('amplify').addEventListener('change', () => { if (state.out) drawAfter(); });

let previewPending = false;
function schedulePreview() {
  if (previewPending) return;
  previewPending = true;
  requestAnimationFrame(() => {
    previewPending = false;
    const target = Number($('eps').value);
    // Rescale the optimised perturbation to the new budget (a preview, not a re-optimisation).
    const k = target / state.eps255;
    const epsMap = state.epsMap.map((v) => v * k);
    render(composeCloak(state.full.rgb, state.delta, epsMap, k), target !== state.eps255);
  });
}

function drawAfter() {
  const { w, h } = state.full;
  let rgb = state.out;
  if ($('amplify').checked) {
    rgb = new Float32Array(rgb.length);
    for (let i = 0; i < rgb.length; i++) rgb[i] = Math.min(1, Math.max(0, 0.5 + (state.out[i] - state.full.rgb[i]) * 10));
  }
  rgbToCanvas(rgb, w, h, $('cv-after'));
}

function render({ rgb, maxAbs }, isPreview) {
  const { w, h } = state.full;
  state.out = rgb;
  drawAfter();
  const p = psnr(state.full.rgb, rgb);
  $('r-psnr').textContent = Number.isFinite(p) ? `${p.toFixed(1)} dB` : '∞';
  $('r-ssim').textContent = ssim(state.full.rgb, rgb, w, h, { stride: Math.max(4, Math.round(Math.max(w, h) / 256)) }).toFixed(3);
  $('r-max').textContent = `${maxAbs}/255`;
  $('preview-note').hidden = !isPreview;
  $('results').hidden = false;
  if (!isPreview && state.embInfo) {
    $('r-cos').textContent = state.embInfo.cos.toFixed(3);
    $('r-decoy').textContent = `${state.embInfo.d0.toFixed(3)} → ${state.embInfo.d1.toFixed(3)}`;
  } else if (isPreview) {
    $('r-cos').textContent = '–';
    $('r-decoy').textContent = '–';
  }
}

// ---------- run ----------
let backendReady = null;
$('run').addEventListener('click', async () => {
  if (!state.full || state.busy) return;
  state.busy = true;
  $('run').disabled = true;
  const prog = $('progress');
  prog.hidden = false; prog.value = 0;
  try {
    status('loadingModel');
    backendReady ??= initBackend();
    await backendReady;
    const eps255 = Number($('eps').value);
    const steps = Number($('steps').value);
    const res = await optimise(state.full, state.work, {
      eps255, steps,
      onProgress: (i, n) => { prog.value = i / n; status('running', { i, n }); },
    });
    state.delta = res.delta; state.epsMap = res.epsMap; state.eps255 = eps255;
    const out = composeCloak(state.full.rgb, res.delta, res.epsMap, 1);
    const { w, h } = state.full;
    const [eo, ec, ed] = await Promise.all([
      embed('attack', state.full.rgb, w, h), embed('attack', out.rgb, w, h), decoyEmbedding('attack'),
    ]);
    state.embInfo = { cos: cosine(eo, ec), d0: cosine(eo, ed), d1: cosine(ec, ed) };
    render(out, false);
    status('done', { s: (res.ms / 1000).toFixed(1) });
  } catch (e) {
    console.error(e);
    status('errModel', { e: e.message || e }, true);
  } finally {
    state.busy = false;
    $('run').disabled = !state.full;
    prog.hidden = true;
  }
});

$('download').addEventListener('click', async () => {
  if (!state.out) return;
  const c = rgbToCanvas(state.out, state.full.w, state.full.h);
  const url = URL.createObjectURL(await pngBlob(c));
  const a = document.createElement('a');
  a.href = url; a.download = `${state.name}.cloaked.png`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
});
