// Procedurally drawn test images (no third-party artwork is bundled) and the decoy target.
import { rng } from './core.js';

function canvas(s) {
  const c = document.createElement('canvas');
  c.width = c.height = s;
  return c;
}

function landscape(g, s, r) {
  const sky = g.createLinearGradient(0, 0, 0, s);
  sky.addColorStop(0, '#f6b26b'); sky.addColorStop(0.55, '#fde8c8'); sky.addColorStop(1, '#7fa37a');
  g.fillStyle = sky; g.fillRect(0, 0, s, s);
  g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(s * 0.72, s * 0.3, s * 0.09, 0, 7); g.fill();
  const cols = ['#5d6b8a', '#46597a', '#344a5e', '#2b3b33'];
  cols.forEach((col, k) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, s);
    for (let x = 0; x <= s; x += s / 24) g.lineTo(x, s * (0.45 + k * 0.12) - r() * s * 0.12);
    g.lineTo(s, s); g.fill();
  });
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(20,40,25,${0.3 + r() * 0.5})`;
    const x = r() * s, y = s * (0.8 + r() * 0.2), hh = s * (0.04 + r() * 0.06);
    g.beginPath(); g.moveTo(x, y - hh); g.lineTo(x - hh / 3, y); g.lineTo(x + hh / 3, y); g.fill();
  }
}

function portrait(g, s, r) {
  g.fillStyle = '#2e3b55'; g.fillRect(0, 0, s, s);
  const bg = g.createRadialGradient(s * 0.3, s * 0.2, 0, s * 0.3, s * 0.2, s);
  bg.addColorStop(0, 'rgba(120,160,200,0.6)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = bg; g.fillRect(0, 0, s, s);
  g.fillStyle = '#7a3e2a'; g.beginPath(); g.ellipse(s / 2, s * 0.42, s * 0.24, s * 0.3, 0, 0, 7); g.fill();
  const face = g.createRadialGradient(s * 0.45, s * 0.42, s * 0.02, s / 2, s * 0.47, s * 0.22);
  face.addColorStop(0, '#f5d0b0'); face.addColorStop(1, '#c98e68');
  g.fillStyle = face; g.beginPath(); g.ellipse(s / 2, s * 0.48, s * 0.17, s * 0.22, 0, 0, 7); g.fill();
  g.fillStyle = '#3a2418';
  [0.43, 0.57].forEach((x) => { g.beginPath(); g.ellipse(s * x, s * 0.45, s * 0.022, s * 0.014, 0, 0, 7); g.fill(); });
  g.strokeStyle = '#8c4a3a'; g.lineWidth = s * 0.008;
  g.beginPath(); g.arc(s / 2, s * 0.55, s * 0.05, 0.2, Math.PI - 0.2); g.stroke();
  g.fillStyle = '#b5523b'; g.beginPath(); g.ellipse(s / 2, s * 0.98, s * 0.33, s * 0.25, 0, 0, 7); g.fill();
  for (let i = 0; i < 300; i++) {
    g.strokeStyle = `rgba(90,45,30,${r() * 0.4})`; g.lineWidth = 1 + r() * 2;
    const a = r() * Math.PI, x = s / 2 + Math.cos(a) * s * 0.22, y = s * 0.3 + r() * s * 0.25;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 20, y + 25 + r() * 30); g.stroke();
  }
}

function lineart(g, s, r) {
  g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, s, s);
  g.lineCap = 'round';
  for (let i = 0; i < 45; i++) {
    g.strokeStyle = `rgba(20,20,25,${0.5 + r() * 0.5})`; g.lineWidth = 0.8 + r() * 3.5;
    g.beginPath(); g.moveTo(r() * s, r() * s);
    g.bezierCurveTo(r() * s, r() * s, r() * s, r() * s, r() * s, r() * s); g.stroke();
  }
  g.strokeStyle = '#111'; g.lineWidth = 3;
  g.beginPath(); g.arc(s / 2, s / 2, s * 0.28, 0, 7); g.stroke();
}

function painterly(g, s, r) {
  g.fillStyle = '#ece3cf'; g.fillRect(0, 0, s, s);
  const pal = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#6d597a'];
  for (let i = 0; i < 900; i++) {
    g.fillStyle = pal[Math.floor(r() * pal.length)];
    g.globalAlpha = 0.08 + r() * 0.25;
    g.save(); g.translate(r() * s, r() * s); g.rotate(r() * Math.PI);
    g.beginPath(); g.ellipse(0, 0, 4 + r() * s * 0.06, 2 + r() * s * 0.015, 0, 0, 7); g.fill(); g.restore();
  }
  g.globalAlpha = 1;
}

export const SAMPLES = { landscape, portrait, lineart, painterly };

export function makeSample(name, size = 512, seed = 7) {
  const c = canvas(size);
  SAMPLES[name](c.getContext('2d'), size, rng(seed));
  return c;
}

/**
 * The decoy "style": a hard-edged, saturated geometric mosaic, deliberately unlike
 * most painted/drawn artwork. The cloak pulls the encoder's embedding toward it.
 */
export function makeDecoy(size = 256) {
  const c = canvas(size);
  const g = c.getContext('2d');
  const r = rng(1234);
  const pal = ['#ff0054', '#00b4d8', '#ffd60a', '#06d6a0', '#3a0ca3', '#111111', '#ffffff'];
  const n = 8, t = size / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    g.fillStyle = pal[Math.floor(r() * pal.length)]; g.fillRect(x * t, y * t, t, t);
    g.fillStyle = pal[Math.floor(r() * pal.length)];
    g.beginPath();
    if (r() < 0.5) { g.moveTo(x * t, y * t); g.lineTo(x * t + t, y * t); g.lineTo(x * t, y * t + t); }
    else g.arc(x * t + t / 2, y * t + t / 2, t * 0.35, 0, 7);
    g.fill();
  }
  return c;
}
