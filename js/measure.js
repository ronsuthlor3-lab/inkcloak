import { setupLang, setupTheme, t } from './i18n.js';
import { psnr, ssim, cosine, composeCloak, rng } from './core.js';
import { canvasToRgb, rgbToCanvas, fitCanvas, jpegRoundTrip, scaleCanvas } from './imageio.js';
import { initBackend, optimise, randomDelta, embed, decoyEmbedding, WORK_SIDE } from './cloak.js';
import { makeSample, SAMPLES } from './samples.js';

const $ = (id) => document.getElementById(id);
const EPS = [4, 8, 16];
const CONDS = ['none', 'jpeg', 'half'];
const MODEL_NAMES = ['attack', 'holdout'];
let results = null;

const applyTheme = setupTheme($('theme'));
setupLang(() => { applyTheme(); if (results) renderTable(results); });

async function condition(rgbObj, cond) {
  if (cond === 'none') return rgbObj;
  const c = rgbToCanvas(rgbObj.rgb, rgbObj.w, rgbObj.h);
  return canvasToRgb(cond === 'jpeg' ? await jpegRoundTrip(c, 0.85) : scaleCanvas(c, 0.5));
}

async function measureImage(canvas, eps255, steps, decoys, seed, onProgress) {
  const full = canvasToRgb(canvas);
  const work = full.w <= WORK_SIDE && full.h <= WORK_SIDE ? full : canvasToRgb(fitCanvas(canvas, WORK_SIDE));
  const opt = await optimise(full, work, { eps255, steps, onProgress });
  const cloak = composeCloak(full.rgb, opt.delta, opt.epsMap, 1);
  const rnd = randomDelta(full, eps255, rng(seed));
  const noise = composeCloak(full.rgb, rnd.delta, rnd.epsMap, 1);
  const wrap = (rgb) => ({ rgb, w: full.w, h: full.h });
  const row = {
    psnr: psnr(full.rgb, cloak.rgb), ssim: ssim(full.rgb, cloak.rgb, full.w, full.h),
    psnrRand: psnr(full.rgb, noise.rgb), ms: opt.ms, m: {},
  };
  for (const cond of CONDS) {
    const [o, c, r] = await Promise.all([full, wrap(cloak.rgb), wrap(noise.rgb)].map((x) => condition(x, cond)));
    for (const name of MODEL_NAMES) {
      const eo = await embed(name, o.rgb, o.w, o.h);
      const ec = await embed(name, c.rgb, c.w, c.h);
      const er = await embed(name, r.rgb, r.w, r.h);
      row.m[`${name}/${cond}`] = {
        shift: 1 - cosine(eo, ec),
        shiftRand: 1 - cosine(eo, er),
        towardDecoy: cosine(ec, decoys[name]) - cosine(eo, decoys[name]),
      };
    }
  }
  return row;
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

function aggregate(perImage) {
  const out = [];
  for (const eps of EPS) {
    const rows = perImage.filter((r) => r.eps === eps);
    for (const name of MODEL_NAMES) for (const cond of CONDS) {
      const k = `${name}/${cond}`;
      out.push({
        eps, model: name, cond,
        shift: mean(rows.map((r) => r.m[k].shift)),
        shiftRand: mean(rows.map((r) => r.m[k].shiftRand)),
        towardDecoy: mean(rows.map((r) => r.m[k].towardDecoy)),
        psnr: mean(rows.map((r) => r.psnr)), ssim: mean(rows.map((r) => r.ssim)),
      });
    }
  }
  return out;
}

function renderTable(res) {
  const tb = $('tbody');
  tb.textContent = '';
  let prevEps = null;
  for (const r of res.summary) {
    const tr = document.createElement('tr');
    if (r.eps !== prevEps) tr.className = 'group';
    const cells = [
      r.eps !== prevEps ? `${r.eps}/255` : '',
      t(r.model === 'attack' ? 'mAttack' : 'mHoldout'),
      t({ none: 'condNone', jpeg: 'condJpeg', half: 'condHalf' }[r.cond]),
      r.shift.toFixed(4), r.shiftRand.toFixed(4),
      (r.towardDecoy >= 0 ? '+' : '') + r.towardDecoy.toFixed(4),
      r.model === 'attack' && r.cond === 'none' ? `${r.psnr.toFixed(1)} dB / ${r.ssim.toFixed(3)}` : '',
    ];
    for (const c of cells) { const td = document.createElement('td'); td.textContent = c; tr.appendChild(td); }
    tb.appendChild(tr);
    prevEps = r.eps;
  }
  $('out').hidden = false;
  $('copy').hidden = false;
}

$('run').addEventListener('click', async () => {
  $('run').disabled = true;
  const prog = $('progress');
  prog.hidden = false;
  const t0 = performance.now();
  try {
    const backend = await initBackend();
    const steps = Number($('steps').value);
    const images = Object.keys(SAMPLES).map((n) => ({ name: n, canvas: makeSample(n, 512) }));
    for (const f of $('own').files || []) {
      const bmp = await createImageBitmap(f);
      images.push({ name: f.name, canvas: fitCanvas(bmp, 1024) });
    }
    const decoys = {};
    for (const n of MODEL_NAMES) decoys[n] = await decoyEmbedding(n);
    const perImage = [];
    const total = images.length * EPS.length;
    let k = 0;
    for (const eps of EPS) {
      for (const [i, img] of images.entries()) {
        const label = t('mProgress', { k: k + 1, n: total });
        $('status').textContent = label;
        const row = await measureImage(img.canvas, eps, steps, decoys, 1000 + i, (s, n) => {
          $('status').textContent = `${label} (${s}/${n})`;
          prog.value = (k + s / n) / total;
        });
        perImage.push({ image: img.name, eps, ...row });
        prog.value = ++k / total;
      }
    }
    results = {
      backend, steps, images: images.map((x) => x.name), date: new Date().toISOString(),
      userAgent: navigator.userAgent, summary: aggregate(perImage), perImage,
    };
    window.inkcloakResults = results;
    renderTable(results);
    $('status').textContent = t('mDone', { s: ((performance.now() - t0) / 1000).toFixed(0), b: backend });
  } catch (e) {
    console.error(e);
    $('status').textContent = String(e.message || e);
  } finally {
    $('run').disabled = false;
    prog.hidden = true;
  }
});

$('copy').addEventListener('click', () => {
  navigator.clipboard?.writeText(JSON.stringify(results, null, 2));
});
