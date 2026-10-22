/* global tf */
// Projected-gradient "cloak" against a small image encoder, run entirely in the browser
// with TensorFlow.js (vendor/tf.min.js). See README for what this does and does not do.
import { textureEpsMap, resizeBilinear, composeCloak, rgbaToRgb, resampleMatrix, matMul } from './core.js';
import { makeDecoy } from './samples.js';

export const MODELS = {
  // The encoder the cloak is optimised against.
  attack: { url: 'models/mobilenet_v2_100/model.json', label: 'MobileNetV2 1.0 (ImageNet)' },
  // A different encoder never used during optimisation — measures transfer.
  holdout: { url: 'models/mobilenet_v1_050/model.json', label: 'MobileNetV1 0.5 (ImageNet)' },
};

export const WORK_SIDE = 512; // optimisation resolution (longest side)
const cache = {};
let decoyEmb = null;

export async function initBackend() {
  for (const b of ['webgl', 'cpu']) {
    try {
      if (await tf.setBackend(b)) { await tf.ready(); return tf.getBackend(); }
    } catch { /* try next */ }
  }
  throw new Error('No TensorFlow.js backend available');
}

export async function loadModel(name) {
  if (!cache[name]) {
    cache[name] = tf.loadGraphModel(new URL(MODELS[name].url, document.baseURI).href);
  }
  return cache[name];
}

// Let the page repaint between steps. A MessageChannel hop is not throttled in background
// tabs the way requestAnimationFrame and setTimeout are.
function yieldToUi() {
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => resolve();
    ch.port2.postMessage(0);
  });
}

// Resampling matrices as (kept) tensors, keyed "src>dst" or "src>mid>dst" for a two-stage resize.
const mats = {};
function resizeMatrix(...sizes) {
  const key = sizes.join('>');
  if (!mats[key]) {
    let m = resampleMatrix(sizes[0], sizes[1]);
    for (let i = 2; i < sizes.length; i++) {
      m = matMul(resampleMatrix(sizes[i - 1], sizes[i]), m, sizes[i], sizes[i - 1], sizes[0]);
    }
    mats[key] = tf.keep(tf.tensor2d(m, [sizes[sizes.length - 1], sizes[0]]));
  }
  return mats[key];
}

// Antialiased resize as Ry · X · Rxᵀ. TF.js's own resizeBilinear gradient is very slow on WebGL.
function resizeT(x4, ry, rx) {
  const [, H, W, C] = x4.shape;
  const h = ry.shape[0], w = rx.shape[0];
  let t = tf.matMul(ry, x4.reshape([H, W * C])).reshape([h, W, C]);
  t = t.transpose([0, 2, 1]).reshape([h * C, W]);
  t = tf.matMul(t, rx, false, true).reshape([h, C, w]);
  return t.transpose([0, 2, 1]).expandDims(0);
}

// x4: [1,h,w,3] in [0,1]. TF-Hub image modules take [0,1] and rescale internally.
// `chain` optionally inserts intermediate sizes, e.g. 0.5 to simulate a 50% downscale first.
function embedT(model, x4, chain = []) {
  const [, H, W] = x4.shape;
  const ry = resizeMatrix(H, ...chain.map((f) => Math.max(8, Math.round(H * f))), 224);
  const rx = resizeMatrix(W, ...chain.map((f) => Math.max(8, Math.round(W * f))), 224);
  return model.predict(resizeT(x4, ry, rx)).reshape([-1]);
}

/** Embedding of an RGB float image (any size). */
export async function embed(name, rgb, w, h) {
  const model = await loadModel(name);
  const t = tf.tidy(() => embedT(model, tf.tensor4d(rgb, [1, h, w, 3])));
  const out = await t.data();
  t.dispose();
  return out;
}

/** Embedding of the built-in decoy image under the attack encoder. */
export async function decoyEmbedding(name = 'attack') {
  if (name === 'attack' && decoyEmb) return decoyEmb;
  const c = makeDecoy(256);
  const rgb = rgbaToRgb(c.getContext('2d').getImageData(0, 0, 256, 256).data);
  const e = await embed(name, rgb, 256, 256);
  if (name === 'attack') decoyEmb = e;
  return e;
}

/**
 * Optimise a perturbation that pulls the attack encoder's embedding toward the decoy.
 *
 * @param {{rgb: Float32Array, w: number, h: number}} full  full-resolution image
 * @param {{rgb: Float32Array, w: number, h: number}} work  same image downscaled (longest side <= WORK_SIDE)
 * @param {object} opts  eps255 (L-inf budget in 8-bit levels), steps, onProgress(i, steps, score)
 * @returns {{delta: Float32Array, epsMap: Float32Array, eps: number, ms: number}}
 *          full-resolution delta (already projected) and per-pixel budget
 */
export async function optimise(full, work, { eps255 = 8, steps = 40, onProgress } = {}) {
  const t0 = performance.now();
  const model = await loadModel('attack');
  const target = await decoyEmbedding('attack');
  const eps = eps255 / 255;
  const { w, h } = work;
  const epsSmall = textureEpsMap(work.rgb, w, h, eps);

  const x0 = tf.tensor4d(work.rgb, [1, h, w, 3]);
  const epsT = tf.tensor4d(epsSmall, [1, h, w, 1]);
  const stepT = epsT.mul(2.5 / steps); // per-pixel step: smaller where the budget is smaller
  const tgt = tf.tidy(() => { const t = tf.tensor1d(target); return t.div(t.norm()); });
  // Average over a few input transformations so the change is less trivially undone
  // by resizing or mild noise (a cheap form of Expectation over Transformation).
  const score = (d) => {
    const x = x0.add(d).clipByValue(0, 1);
    const views = [
      [x, []],
      [x, [0.5]],
      [x.add(tf.randomNormal(x.shape, 0, 3 / 255)).clipByValue(0, 1), []],
    ];
    let s = tf.scalar(0);
    for (const [v, chain] of views) {
      const e = embedT(model, v, chain);
      s = s.add(e.div(e.norm()).mul(tgt).sum());
    }
    return s.div(views.length);
  };
  const gradFn = tf.valueAndGrad(score);

  let delta = tf.tidy(() => tf.randomUniform([1, h, w, 3], -0.5, 0.5).mul(epsT));
  for (let i = 0; i < steps; i++) {
    const { value, grad } = gradFn(delta);
    const next = tf.tidy(() => {
      let d = delta.add(grad.sign().mul(stepT));
      d = tf.minimum(tf.maximum(d, epsT.neg()), epsT);
      return x0.add(d).clipByValue(0, 1).sub(x0);
    });
    const sv = (await value.data())[0];
    value.dispose(); grad.dispose(); delta.dispose();
    delta = next;
    if (onProgress) onProgress(i + 1, steps, sv);
    await yieldToUi();
  }

  const small = await delta.data();
  [x0, epsT, stepT, tgt, delta].forEach((t) => t.dispose());

  const up = w === full.w && h === full.h
    ? Float32Array.from(small)
    : resizeBilinear(small, w, h, 3, full.w, full.h);
  const epsMap = textureEpsMap(full.rgb, full.w, full.h, eps);
  return { delta: up, epsMap, eps, ms: performance.now() - t0 };
}

/** Same-budget random baseline: random ±budget sign noise (for comparison only). */
export function randomDelta(full, eps255, seedFn = Math.random) {
  const eps = eps255 / 255;
  const epsMap = textureEpsMap(full.rgb, full.w, full.h, eps);
  const delta = new Float32Array(full.rgb.length);
  for (let p = 0; p < epsMap.length; p++) {
    for (let c = 0; c < 3; c++) delta[p * 3 + c] = (seedFn() < 0.5 ? -1 : 1) * epsMap[p];
  }
  return { delta, epsMap, eps };
}

export { composeCloak };
