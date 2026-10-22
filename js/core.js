// Pure, dependency-free image math used by the browser app and by `node --test`.
// Images are interleaved RGB Float32Arrays with values in [0, 1].

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** RGBA bytes (canvas ImageData.data) -> RGB floats in [0, 1]. */
export function rgbaToRgb(rgba) {
  const n = rgba.length / 4;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    out[i * 3] = rgba[i * 4] / 255;
    out[i * 3 + 1] = rgba[i * 4 + 1] / 255;
    out[i * 3 + 2] = rgba[i * 4 + 2] / 255;
  }
  return out;
}

/** RGB floats -> RGBA bytes (alpha 255), rounded to the nearest 8-bit level. */
export function rgbToRgba(rgb) {
  const n = rgb.length / 3;
  const out = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    out[i * 4] = Math.round(rgb[i * 3] * 255);
    out[i * 4 + 1] = Math.round(rgb[i * 3 + 1] * 255);
    out[i * 4 + 2] = Math.round(rgb[i * 3 + 2] * 255);
    out[i * 4 + 3] = 255;
  }
  return out;
}

/** Rec. 601 luma, one value per pixel. */
export function luma(rgb) {
  const n = rgb.length / 3;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2];
  }
  return out;
}

/** Peak signal-to-noise ratio in dB for signals in [0, 1]. Infinity if identical. */
export function psnr(a, b) {
  if (a.length !== b.length) throw new Error('length mismatch');
  let se = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    se += d * d;
  }
  const mse = se / a.length;
  return mse === 0 ? Infinity : 10 * Math.log10(1 / mse);
}

/**
 * Mean SSIM on luma with square box windows (default 8x8, stride 4).
 * Constants follow Wang et al. 2004 (K1 = 0.01, K2 = 0.03, L = 1).
 */
export function ssim(a, b, w, h, { win = 8, stride = 4 } = {}) {
  const ya = luma(a);
  const yb = luma(b);
  const C1 = 0.01 ** 2;
  const C2 = 0.03 ** 2;
  const ws = Math.min(win, w, h);
  const n = ws * ws;
  let total = 0;
  let count = 0;
  for (let y0 = 0; y0 + ws <= h; y0 += stride) {
    for (let x0 = 0; x0 + ws <= w; x0 += stride) {
      let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
      for (let y = y0; y < y0 + ws; y++) {
        for (let x = x0; x < x0 + ws; x++) {
          const p = ya[y * w + x];
          const q = yb[y * w + x];
          sa += p; sb += q; saa += p * p; sbb += q * q; sab += p * q;
        }
      }
      const ma = sa / n;
      const mb = sb / n;
      const va = saa / n - ma * ma;
      const vb = sbb / n - mb * mb;
      const cov = sab / n - ma * mb;
      total += ((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2));
      count++;
    }
  }
  return count ? total / count : 1;
}

/** Cosine similarity of two vectors. */
export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/**
 * Per-pixel L-infinity budget. Busy/textured areas get the full `eps`;
 * flat areas (where noise is most visible) get down to `minFrac * eps`.
 * Texture = local standard deviation of luma in a (2r+1)^2 box.
 */
export function textureEpsMap(rgb, w, h, eps, { radius = 3, minFrac = 0.35, ref = 0.06 } = {}) {
  const y = luma(rgb);
  // Integral images of y and y^2 (size (w+1)*(h+1)).
  const W = w + 1;
  const s1 = new Float64Array(W * (h + 1));
  const s2 = new Float64Array(W * (h + 1));
  for (let j = 0; j < h; j++) {
    let r1 = 0, r2 = 0;
    for (let i = 0; i < w; i++) {
      const v = y[j * w + i];
      r1 += v; r2 += v * v;
      s1[(j + 1) * W + i + 1] = s1[j * W + i + 1] + r1;
      s2[(j + 1) * W + i + 1] = s2[j * W + i + 1] + r2;
    }
  }
  const out = new Float32Array(w * h);
  for (let j = 0; j < h; j++) {
    const ya = Math.max(0, j - radius), yb = Math.min(h, j + radius + 1);
    for (let i = 0; i < w; i++) {
      const xa = Math.max(0, i - radius), xb = Math.min(w, i + radius + 1);
      const n = (yb - ya) * (xb - xa);
      const a1 = s1[yb * W + xb] - s1[ya * W + xb] - s1[yb * W + xa] + s1[ya * W + xa];
      const a2 = s2[yb * W + xb] - s2[ya * W + xb] - s2[yb * W + xa] + s2[ya * W + xa];
      const mean = a1 / n;
      const sd = Math.sqrt(Math.max(0, a2 / n - mean * mean));
      out[j * w + i] = eps * clamp(minFrac + (1 - minFrac) * (sd / ref), minFrac, 1);
    }
  }
  return out;
}

/**
 * Project a perturbation onto the feasible set, in place:
 * |delta| <= epsMap per pixel (shared across RGB) and x0 + delta inside [0, 1].
 * Returns delta.
 */
export function projectLinf(delta, x0, epsMap) {
  const n = epsMap.length;
  for (let p = 0; p < n; p++) {
    const e = epsMap[p];
    for (let c = 0; c < 3; c++) {
      const k = p * 3 + c;
      let d = clamp(delta[k], -e, e);
      d = clamp(x0[k] + d, 0, 1) - x0[k];
      delta[k] = d;
    }
  }
  return delta;
}

/** Bilinear resample of an interleaved image with `ch` channels (pixel-centre aligned). */
export function resizeBilinear(src, sw, sh, ch, dw, dh) {
  const out = new Float32Array(dw * dh * ch);
  const fx = sw / dw;
  const fy = sh / dh;
  for (let j = 0; j < dh; j++) {
    const sy = clamp((j + 0.5) * fy - 0.5, 0, sh - 1);
    const y0 = Math.floor(sy);
    const y1 = Math.min(y0 + 1, sh - 1);
    const ty = sy - y0;
    for (let i = 0; i < dw; i++) {
      const sx = clamp((i + 0.5) * fx - 0.5, 0, sw - 1);
      const x0 = Math.floor(sx);
      const x1 = Math.min(x0 + 1, sw - 1);
      const tx = sx - x0;
      for (let c = 0; c < ch; c++) {
        const a = src[(y0 * sw + x0) * ch + c];
        const b = src[(y0 * sw + x1) * ch + c];
        const d = src[(y1 * sw + x0) * ch + c];
        const e = src[(y1 * sw + x1) * ch + c];
        out[(j * dw + i) * ch + c] = (a * (1 - tx) + b * tx) * (1 - ty) + (d * (1 - tx) + e * tx) * ty;
      }
    }
  }
  return out;
}

/**
 * 1-D resampling matrix (dst x src, row-major) for an antialiased triangle filter:
 * plain bilinear when upsampling, filter widened by the scale factor when downsampling
 * (like PIL's BILINEAR resize). Rows sum to 1. Applying Ry · X · Rxᵀ resizes an image,
 * which makes resizing differentiable with fast matrix-multiply gradients.
 */
export function resampleMatrix(src, dst) {
  const scale = src / dst;
  const support = Math.max(1, scale);
  const m = new Float32Array(dst * src);
  for (let i = 0; i < dst; i++) {
    const center = (i + 0.5) * scale - 0.5;
    const lo = Math.floor(center - support);
    const hi = Math.ceil(center + support);
    let sum = 0;
    for (let j = lo; j <= hi; j++) {
      const wgt = Math.max(0, 1 - Math.abs(j - center) / support);
      if (!wgt) continue;
      m[i * src + clamp(j, 0, src - 1)] += wgt;
      sum += wgt;
    }
    for (let j = 0; j < src; j++) m[i * src + j] /= sum;
  }
  return m;
}

/** Plain matrix product of row-major a (n x k) and b (k x m). */
export function matMul(a, b, n, k, m) {
  const out = new Float32Array(n * m);
  for (let i = 0; i < n; i++) {
    for (let p = 0; p < k; p++) {
      const v = a[i * k + p];
      if (!v) continue;
      for (let j = 0; j < m; j++) out[i * m + j] += v * b[p * m + j];
    }
  }
  return out;
}

/**
 * Build the final image: x0 + scale * delta, projected, then quantised to 8 bits
 * (what a PNG will actually store). Returns { rgb, maxAbs } where maxAbs is the
 * largest per-channel change in 0..255 units after quantisation.
 */
export function composeCloak(x0, delta, epsMap, scale = 1) {
  const d = new Float32Array(delta.length);
  for (let i = 0; i < d.length; i++) d[i] = delta[i] * scale;
  projectLinf(d, x0, epsMap);
  const rgb = new Float32Array(x0.length);
  let maxAbs = 0;
  for (let i = 0; i < rgb.length; i++) {
    const q = Math.round((x0[i] + d[i]) * 255);
    rgb[i] = q / 255;
    const ch = Math.abs(q - Math.round(x0[i] * 255));
    if (ch > maxAbs) maxAbs = ch;
  }
  return { rgb, maxAbs };
}

/** Mulberry32 PRNG — deterministic samples and tests. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
