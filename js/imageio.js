// Canvas helpers (browser only).
import { rgbaToRgb, rgbToRgba } from './core.js';

export const MAX_SIDE = 3000;

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Draw a bitmap/canvas into a new canvas whose longest side is at most maxSide. */
export function fitCanvas(src, maxSide) {
  const sw = src.width, sh = src.height;
  const s = Math.min(1, maxSide / Math.max(sw, sh));
  const c = makeCanvas(Math.max(1, Math.round(sw * s)), Math.max(1, Math.round(sh * s)));
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

export function canvasToRgb(c) {
  const d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
  return { rgb: rgbaToRgb(d), w: c.width, h: c.height };
}

export function rgbToCanvas(rgb, w, h, into) {
  const c = into || makeCanvas(w, h);
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
  c.getContext('2d').putImageData(new ImageData(rgbToRgba(rgb), w, h), 0, 0);
  return c;
}

export async function fileToCanvas(file) {
  const bmp = await createImageBitmap(file);
  const c = fitCanvas(bmp, MAX_SIDE);
  const scaled = c.width !== bmp.width || c.height !== bmp.height;
  bmp.close?.();
  return { canvas: c, scaled };
}

function canvasBlob(c, type, q) {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode failed'))), type, q));
}

export function pngBlob(c) {
  return canvasBlob(c, 'image/png');
}

/** Encode as JPEG at quality q and decode again (what a social site might do). */
export async function jpegRoundTrip(c, q = 0.85) {
  const bmp = await createImageBitmap(await canvasBlob(c, 'image/jpeg', q));
  const out = makeCanvas(bmp.width, bmp.height);
  out.getContext('2d').drawImage(bmp, 0, 0);
  bmp.close?.();
  return out;
}

/** Downscale by factor f with high-quality smoothing. */
export function scaleCanvas(c, f) {
  return fitCanvas(c, Math.round(Math.max(c.width, c.height) * f));
}
