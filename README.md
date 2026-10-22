# Inkcloak (experimental)

**ภาษาไทย: [README.th.md](README.th.md)** · **App: https://ronsuthlor3-lab.github.io/inkcloak/** · **Measurements page: https://ronsuthlor3-lab.github.io/inkcloak/measure.html**

> [!WARNING]
> **This is an experimental, research-grade tool. It is unproven.**
>
> - Inkcloak does **not** prevent or block AI training or style mimicry. It adds a faint perturbation that changes how **one small model (MobileNetV2)** sees an image.
> - The effect may be removed or ignored by resizing, JPEG compression, denoising/upscaling, or simply by a different or newer model. In our own tests (below), on a second model the cloak never saw, it moved images **only slightly more than random noise of the same strength**.
> - It is **not a substitute for [Glaze](https://glaze.cs.uchicago.edu/) or [Nightshade](https://nightshade.cs.uchicago.edu/)** from the University of Chicago SAND Lab. If you want the strongest protection currently available to artists, use those.
> - Treat it as a learning/experimentation tool, not as protection you can rely on.

## What it does

Everything runs in your browser (no uploads, no server):

1. Your image is downscaled to at most 512 px for optimisation.
2. A pretrained **MobileNetV2** feature extractor (TensorFlow.js) embeds it.
3. **Projected gradient ascent** (PGD, sign steps) changes the pixels so the embedding moves toward a built-in **decoy** image (a hard-edged geometric mosaic), within an **L∞ budget** you pick (2–16 levels out of 255).
   - The budget is **texture-aware**: flat areas get as little as 35% of it, busy areas the full amount, because noise is most visible in flat areas.
   - Each step averages the gradient over three views — as-is, downscaled 50%, and with mild noise — a cheap form of *Expectation over Transformation*, so the change is less trivially undone by resizing.
4. The perturbation is upscaled to full resolution, re-projected, quantised to 8 bits and saved as PNG.

The app shows a before/after slider, an ×10 difference view, **PSNR / SSIM / max change**, and the embedding similarity on the model it attacked. Moving the strength slider after a run gives an instant **preview** (the existing cloak rescaled); press *Apply cloak* again to re-optimise.

Limits: images larger than 3000 px are downscaled first. WebGL is used when available (≈0.15–0.3 s per step on a desktop GPU at 512 px; much slower on CPU/phones).

## Measured results (our own run, 2026-10-22)

Run with the [measurement page](https://ronsuthlor3-lab.github.io/inkcloak/measure.html) on 4 procedurally drawn 512×512 samples (landscape, portrait, line art, painterly), 40 steps, WebGL on an RTX 4060 Ti (Chromium 152). Raw summary: [`docs/measurements-2026-10-22.json`](docs/measurements-2026-10-22.json). You can rerun it yourself; numbers vary slightly between runs and machines.

- **shift** = 1 − cosine(embedding of original, embedding of cloaked). 0 = the model sees no change.
- **random** = the same metric for random ±budget noise using the same texture-aware budget (a baseline; it uses *more* of the budget than the cloak, so its PSNR is lower).
- **toward decoy** = how much closer (cosine) the cloaked image's embedding gets to the decoy.
- **JPEG q85** / **50% resize** = both the original and the cloaked image went through that transformation before embedding.
- **MobileNetV2** = the model the cloak was optimised against. **MobileNetV1 0.5** = a different model never used during optimisation (a stand-in for "some other model").

| Budget | Image quality (cloak) | Model | Condition | shift (cloak) | shift (random) | toward decoy |
|---|---|---|---|---|---|---|
| 4/255 | PSNR 43.5 dB, SSIM 0.991 | MobileNetV2 (attacked) | PNG | 0.401 | 0.006 | +0.427 |
| | | | JPEG q85 | 0.318 | 0.004 | +0.361 |
| | | | 50% resize | 0.389 | 0.006 | +0.415 |
| | | MobileNetV1 (unseen) | PNG | 0.029 | 0.020 | +0.012 |
| | | | JPEG q85 | 0.019 | 0.003 | +0.004 |
| | | | 50% resize | 0.028 | 0.021 | +0.010 |
| 8/255 | PSNR 38.9 dB, SSIM 0.973 | MobileNetV2 (attacked) | PNG | 0.541 | 0.054 | +0.552 |
| | | | JPEG q85 | 0.498 | 0.052 | +0.529 |
| | | | 50% resize | 0.537 | 0.053 | +0.549 |
| | | MobileNetV1 (unseen) | PNG | 0.057 | 0.041 | +0.020 |
| | | | JPEG q85 | 0.042 | 0.015 | +0.014 |
| | | | 50% resize | 0.055 | 0.038 | +0.015 |
| 16/255 | PSNR 34.7 dB, SSIM 0.934 | MobileNetV2 (attacked) | PNG | 0.589 | 0.107 | +0.589 |
| | | | JPEG q85 | 0.565 | 0.106 | +0.584 |
| | | | 50% resize | 0.586 | 0.108 | +0.590 |
| | | MobileNetV1 (unseen) | PNG | 0.090 | 0.058 | +0.039 |
| | | | JPEG q85 | 0.081 | 0.053 | +0.029 |
| | | | 50% resize | 0.086 | 0.056 | +0.035 |

### What these numbers mean, honestly

- **Against the model it was optimised for, the cloak works and largely survives JPEG q85 and 50% resizing** (we trained against resizing; JPEG q85 keeps ~79–96% of the shift). This is the expected, easy case — it is a white-box attack.
- **Against a model it never saw, the effect is small.** On MobileNetV1 (PNG, no compression) the shift is only about 1.4–1.55× that of random noise, and the move toward the decoy is +0.01 to +0.04 in cosine similarity (for line art at low strength it was slightly *negative*). Real training pipelines use other, much larger encoders (e.g. CLIP, the Stable Diffusion VAE), which we did **not** test; there is no evidence here that the cloak affects them.
- At 4/255 the change is essentially invisible (PSNR ≈ 43 dB). At 16/255 it is visible on flat colours and gradients.
- 4 synthetic images is a small sample. These are not artwork by real artists, and no actual fine-tuning / style-mimicry experiment was run.
- Not tested: denoisers/upscalers, adversarial purification (e.g. diffusion-based), screenshots, re-drawing, crops, colour edits — any of these may remove the cloak.

## Using it with Inkseal

If you also seal your work with [Inkseal](https://ronsuthlor3-lab.github.io/inkseal/), **cloak first, then seal** the downloaded PNG. Applying the cloak after Inkseal would perturb (and may damage) Inkseal's invisible watermark.

## Why not a stronger model?

A real cloak needs gradients through an image encoder. ONNX Runtime Web and Transformers.js are built for inference and do not expose input gradients in the browser, so we used **TensorFlow.js**, which has automatic differentiation. Two small ImageNet MobileNets were the practical choice for download size (~12 MB total) and speed on ordinary devices. Running CLIP-class encoders with gradients in the browser is possible in principle but much heavier; that is the most obvious direction for future work — and even then, results like Glaze's took dedicated research and user studies.

## Development

No build step. Serve the folder with any static file server and open `index.html`.

```bash
node --test test/core.test.js
```

The tests cover the pure logic in `js/core.js`: PSNR, SSIM, cosine similarity, the texture-aware budget map, L∞ projection, bilinear and antialiased resampling (used to make resizing differentiable), and final composition/quantisation. CI runs them on Node 20 and 22.

| File | Purpose |
|---|---|
| `js/core.js` | Pure math (tested) |
| `js/cloak.js` | TensorFlow.js PGD optimisation and embeddings |
| `js/app.js`, `index.html` | Cloak UI |
| `js/measure.js`, `measure.html` | Measurement page |
| `js/samples.js` | Procedural sample images and the decoy |
| `vendor/`, `models/` | Third-party TensorFlow.js and MobileNet weights (Apache-2.0) — see [THIRD_PARTY.md](THIRD_PARTY.md) |

## License

Code: [MIT](LICENSE). TensorFlow.js and the MobileNet weights are Apache-2.0 and redistributed unmodified; see [THIRD_PARTY.md](THIRD_PARTY.md).
