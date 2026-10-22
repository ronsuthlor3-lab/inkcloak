# Third-party components

| Path | What | Source | License |
|---|---|---|---|
| `vendor/tf.min.js` | TensorFlow.js 4.22.0 (unmodified build) | https://www.npmjs.com/package/@tensorflow/tfjs/v/4.22.0 | Apache-2.0 — `vendor/TFJS-LICENSE.txt` |
| `models/mobilenet_v2_100/` | MobileNetV2 1.0 224, ImageNet, feature-vector, TF.js format (unmodified) | https://www.kaggle.com/models/google/mobilenet-v2 (formerly tfhub.dev `google/tfjs-model/imagenet/mobilenet_v2_100_224/feature_vector/3`) | Apache-2.0 |
| `models/mobilenet_v1_050/` | MobileNetV1 0.50 224, ImageNet, feature-vector, TF.js format (unmodified) | https://www.kaggle.com/models/google/mobilenet-v1 (formerly tfhub.dev `google/tfjs-model/imagenet/mobilenet_v1_050_224/feature_vector/3`) | Apache-2.0 |

The Apache-2.0 license text is in `vendor/TFJS-LICENSE.txt`. Weights are redistributed
unmodified so the app works offline and does not depend on a model-hosting service.
MobileNet: Howard et al. 2017 (arXiv:1704.04861), Sandler et al. 2018 (arXiv:1801.04381).
