import test from 'node:test';
import assert from 'node:assert/strict';
import {
  psnr, ssim, cosine, luma, textureEpsMap, projectLinf, resizeBilinear,
  composeCloak, rgbaToRgb, rgbToRgba, rng, resampleMatrix, matMul,
} from '../js/core.js';

function randomImage(w, h, seed) {
  const r = rng(seed);
  const a = new Float32Array(w * h * 3);
  for (let i = 0; i < a.length; i++) a[i] = r();
  return a;
}

test('psnr: identical is Infinity, known MSE gives known dB', () => {
  const a = new Float32Array([0.5, 0.5, 0.5, 0.5]);
  assert.equal(psnr(a, a), Infinity);
  const b = a.map((v) => v + 0.1); // MSE = 0.01 -> 20 dB
  assert.ok(Math.abs(psnr(a, b) - 20) < 1e-4);
});

test('ssim: 1 for identical, lower for noisy, near 0 for unrelated', () => {
  const w = 32, h = 32;
  const a = randomImage(w, h, 1);
  assert.ok(Math.abs(ssim(a, a, w, h) - 1) < 1e-9);
  const r = rng(2);
  const noisy = a.map((v) => Math.min(1, Math.max(0, v + (r() - 0.5) * 0.2)));
  const s = ssim(a, noisy, w, h);
  assert.ok(s < 0.99 && s > 0.3, `ssim ${s}`);
  const other = randomImage(w, h, 3);
  assert.ok(Math.abs(ssim(a, other, w, h)) < 0.2);
});

test('cosine: parallel, orthogonal, opposite', () => {
  assert.ok(Math.abs(cosine([1, 2, 3], [2, 4, 6]) - 1) < 1e-12);
  assert.equal(cosine([1, 0], [0, 1]), 0);
  assert.ok(Math.abs(cosine([1, 1], [-1, -1]) + 1) < 1e-12);
  assert.equal(cosine([0, 0], [1, 1]), 0);
});

test('luma uses Rec.601 weights', () => {
  const y = luma(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]));
  assert.deepEqual(Array.from(y).map((v) => +v.toFixed(3)), [0.299, 0.587, 0.114]);
});

test('textureEpsMap: flat areas get minFrac*eps, busy areas get eps', () => {
  const w = 40, h = 20;
  const img = new Float32Array(w * h * 3).fill(0.5);
  // Right half: checkerboard (high local std).
  for (let y = 0; y < h; y++) for (let x = 20; x < w; x++) {
    const v = (x + y) % 2 ? 1 : 0;
    img.fill(v, (y * w + x) * 3, (y * w + x) * 3 + 3);
  }
  const eps = 8 / 255;
  const m = textureEpsMap(img, w, h, eps, { minFrac: 0.25 });
  assert.ok(Math.abs(m[10 * w + 2] - 0.25 * eps) < 1e-7);
  assert.ok(Math.abs(m[10 * w + 35] - eps) < 1e-7);
  for (const v of m) assert.ok(v >= 0.25 * eps - 1e-7 && v <= eps + 1e-7); // float32 storage
});

test('projectLinf keeps |delta| <= eps and x0+delta in [0,1]', () => {
  const w = 16, h = 16;
  const x0 = randomImage(w, h, 4);
  const r = rng(5);
  const delta = new Float32Array(x0.length).map(() => (r() - 0.5) * 2);
  const eps = new Float32Array(w * h).map(() => r() * 0.05);
  projectLinf(delta, x0, eps);
  for (let p = 0; p < w * h; p++) for (let c = 0; c < 3; c++) {
    const k = p * 3 + c;
    assert.ok(Math.abs(delta[k]) <= eps[p] + 1e-7);
    assert.ok(x0[k] + delta[k] >= -1e-7 && x0[k] + delta[k] <= 1 + 1e-7);
  }
});

test('projectLinf is idempotent and leaves feasible points unchanged', () => {
  const x0 = new Float32Array([0.5, 0.5, 0.5]);
  const eps = new Float32Array([0.1]);
  const d = new Float32Array([0.05, -0.02, 0]);
  projectLinf(d, x0, eps);
  assert.deepEqual(Array.from(d), [0.05, -0.02, 0].map(Math.fround));
  const e = new Float32Array([1, -1, 0.3]);
  projectLinf(e, x0, eps);
  const once = Array.from(e);
  projectLinf(e, x0, eps);
  assert.deepEqual(Array.from(e), once);
});

test('resizeBilinear: constant stays constant, same-size is identity, 2x up interpolates', () => {
  const c = new Float32Array(5 * 4 * 3).fill(0.3);
  for (const v of resizeBilinear(c, 5, 4, 3, 13, 9)) assert.ok(Math.abs(v - 0.3) < 1e-6);
  const img = randomImage(7, 5, 6);
  const same = resizeBilinear(img, 7, 5, 3, 7, 5);
  for (let i = 0; i < img.length; i++) assert.ok(Math.abs(same[i] - img[i]) < 1e-6);
  const up = resizeBilinear(new Float32Array([0, 1]), 2, 1, 1, 4, 1);
  assert.deepEqual(Array.from(up).map((v) => +v.toFixed(3)), [0, 0.25, 0.75, 1]);
});

test('resizeBilinear never leaves the source value range (no overshoot)', () => {
  const img = randomImage(9, 9, 7);
  const up = resizeBilinear(img, 9, 9, 3, 31, 23);
  for (const v of up) assert.ok(v >= 0 && v <= 1);
});

test('resampleMatrix: rows sum to 1, same size is identity, constants preserved', () => {
  for (const [s, d] of [[512, 224], [224, 512], [7, 3], [10, 10]]) {
    const m = resampleMatrix(s, d);
    for (let i = 0; i < d; i++) {
      let sum = 0;
      for (let j = 0; j < s; j++) { sum += m[i * s + j]; assert.ok(m[i * s + j] >= 0); }
      assert.ok(Math.abs(sum - 1) < 1e-5);
    }
  }
  const id = resampleMatrix(5, 5);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) assert.equal(id[i * 5 + j], i === j ? 1 : 0);
});

test('resampleMatrix: 2x downsample averages neighbouring pixels (antialiased)', () => {
  const m = resampleMatrix(4, 2);
  const out = matMul(m, new Float32Array([0, 1, 0, 1]), 2, 4, 1);
  for (const v of out) assert.ok(Math.abs(v - 0.5) < 0.2, `got ${v}`);
});

test('matMul: small known product and composition of resample matrices', () => {
  const p = matMul(new Float32Array([1, 2, 3, 4]), new Float32Array([5, 6, 7, 8]), 2, 2, 2);
  assert.deepEqual(Array.from(p), [19, 22, 43, 50]);
  const c = matMul(resampleMatrix(256, 224), resampleMatrix(512, 256), 224, 256, 512);
  for (let i = 0; i < 224; i++) {
    let sum = 0;
    for (let j = 0; j < 512; j++) sum += c[i * 512 + j];
    assert.ok(Math.abs(sum - 1) < 1e-4);
  }
});

test('composeCloak: result within budget (+ rounding) and scale 0 is identity', () => {
  const w = 12, h = 12;
  const x0 = new Float32Array(rgbaToRgb(rgbToRgba(randomImage(w, h, 8))));
  const eps = new Float32Array(w * h).fill(6 / 255);
  const r = rng(9);
  const delta = new Float32Array(x0.length).map(() => (r() - 0.5));
  const { rgb, maxAbs } = composeCloak(x0, delta, eps, 1);
  assert.ok(maxAbs <= 6, `maxAbs ${maxAbs}`);
  for (let i = 0; i < rgb.length; i++) assert.ok(Math.abs(rgb[i] - x0[i]) <= 6 / 255 + 1e-6);
  const id = composeCloak(x0, delta, eps, 0);
  assert.equal(id.maxAbs, 0);
  assert.equal(psnr(id.rgb, x0), Infinity);
});

test('rgba <-> rgb round-trips 8-bit values exactly', () => {
  const rgba = new Uint8ClampedArray([0, 128, 255, 255, 17, 34, 51, 255]);
  assert.deepEqual(Array.from(rgbToRgba(rgbaToRgb(rgba))), Array.from(rgba));
});

test('rng is deterministic per seed', () => {
  const a = rng(42), b = rng(42);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});
