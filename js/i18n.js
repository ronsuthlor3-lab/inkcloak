export const STRINGS = {
  th: {
    tagline: 'เครื่องมือทดลอง: ใส่ "ผ้าคลุม" สัญญาณรบกวนบาง ๆ ลงในภาพผลงาน',
    warnTitle: 'โปรดอ่านก่อน — นี่คือเครื่องมือทดลองระดับงานวิจัย ยังไม่ได้รับการพิสูจน์',
    warn1: 'Inkcloak ไม่ได้ "ป้องกัน" หรือ "บล็อก" AI ได้ มันแค่เปลี่ยนภาพเล็กน้อยเพื่อให้โมเดลขนาดเล็กหนึ่งตัว (MobileNetV2) "มองเห็น" ภาพผิดไปจากเดิม',
    warn2: 'ผลอาจหายไปเมื่อภาพถูกย่อขนาด บีบอัด (JPEG) ลดสัญญาณรบกวน หรือเมื่อเจอโมเดลรุ่นใหม่/ตัวอื่น ซึ่งเป็นสิ่งที่โมเดล AI สร้างภาพส่วนใหญ่ใช้จริง ในการทดสอบของเราเอง กับโมเดลตัวที่สองที่ไม่ได้ใช้ตอนคำนวณ ผ้าคลุมเปลี่ยนภาพได้มากกว่าสัญญาณรบกวนแบบสุ่มที่แรงเท่ากันเพียงเล็กน้อยเท่านั้น',
    warn3: 'ไม่สามารถใช้แทน Glaze หรือ Nightshade จากมหาวิทยาลัยชิคาโกได้ ถ้าต้องการการป้องกันที่จริงจังกว่า ให้ใช้เครื่องมือเหล่านั้น',
    warn4: 'ดูตัวเลขที่วัดได้จริงในหน้า "ผลการวัด" ก่อนตัดสินใจใช้',
    privacy: 'ทุกอย่างทำงานในเบราว์เซอร์ของคุณ ภาพไม่ถูกอัปโหลดไปไหน',
    navTool: 'ใส่ผ้าคลุม',
    navMeasure: 'ผลการวัด',
    pick: 'เลือกภาพผลงาน',
    pickHint: 'หรือลากไฟล์มาวาง (PNG / JPEG / WebP)',
    orSample: 'หรือลองกับภาพตัวอย่าง:',
    sLandscape: 'ทิวทัศน์', sPortrait: 'ภาพคน', sLineart: 'ลายเส้น', sPainterly: 'ฝีแปรง',
    strength: 'ความแรง (งบสัญญาณรบกวนสูงสุด)',
    strengthUnit: 'ระดับสี จาก 255',
    steps: 'จำนวนรอบการคำนวณ',
    stepsFast: 'เร็ว (20)', stepsNormal: 'ปกติ (40)', stepsSlow: 'ละเอียด (80)',
    run: 'ใส่ผ้าคลุม',
    running: 'กำลังคำนวณ… รอบ {i}/{n}',
    loadingModel: 'กำลังโหลดโมเดล (~12 MB ครั้งแรก)…',
    done: 'เสร็จใน {s} วินาที',
    before: 'ต้นฉบับ', after: 'ใส่ผ้าคลุมแล้ว',
    slider: 'เลื่อนเพื่อเทียบก่อน/หลัง',
    amplify: 'ขยายความต่างให้เห็น (×10)',
    psnr: 'PSNR', ssim: 'SSIM', maxChange: 'เปลี่ยนสูงสุด',
    psnrHint: 'ยิ่งสูงยิ่งเหมือนต้นฉบับ (> 40 dB มักมองไม่ออก)',
    ssimHint: '1.000 = เหมือนเดิมทุกประการ',
    previewNote: 'ตัวเลขด้านบนเป็นการ "พรีวิว" โดยย่อ/ขยายผ้าคลุมเดิม — กด "ใส่ผ้าคลุม" อีกครั้งเพื่อคำนวณใหม่ที่ความแรงนี้',
    encTitle: 'โมเดล MobileNetV2 มองภาพนี้ต่างไปแค่ไหน',
    encSim: 'ความคล้าย (cosine) ระหว่างต้นฉบับกับภาพที่คลุม',
    encDecoy: 'ความคล้ายกับ "ภาพล่อ" ก่อน → หลัง',
    encNote: 'ตัวเลขนี้วัดกับโมเดลที่ใช้คำนวณผ้าคลุมเอง จึงดูดีเกินจริงเสมอ ดูหน้า "ผลการวัด" สำหรับโมเดลอื่นและหลังบีบอัด',
    download: 'ดาวน์โหลด PNG',
    inksealTitle: 'ต่อด้วย Inkseal (ไม่บังคับ)',
    inksealBody: 'ถ้าจะประทับตราลายเซ็นด้วย Inkseal ให้ใส่ผ้าคลุมก่อน แล้วค่อยนำไฟล์ PNG ที่ได้ไปประทับตรา — ถ้าทำกลับกัน ผ้าคลุมจะไปทับลายน้ำของ Inkseal',
    inksealLink: 'เปิด Inkseal',
    errModel: 'โหลดโมเดลไม่สำเร็จ: {e}',
    errImage: 'เปิดภาพนี้ไม่ได้',
    scaledNote: 'ภาพใหญ่เกิน {n} px จึงย่อลงก่อนประมวลผล',
    themeAuto: 'ธีมตามระบบ', themeLight: 'ธีมสว่าง', themeDark: 'ธีมมืด',
    footer: 'โอเพนซอร์ส (MIT) · โมเดลจาก TensorFlow Hub (Apache-2.0)',
    // measure page
    mTitle: 'ผลการวัดประสิทธิภาพ (วัดจริงในเบราว์เซอร์ของคุณ)',
    mIntro: 'หน้านี้ใส่ผ้าคลุมให้ภาพตัวอย่าง 4 ภาพที่ความแรงต่าง ๆ แล้ววัดว่า "ความหมาย" ของภาพในสายตาโมเดลเปลี่ยนไปเท่าไร ทั้งกับโมเดลที่ใช้คำนวณ และโมเดลอีกตัวที่ไม่เคยเห็น รวมถึงหลังบีบอัด JPEG และหลังย่อภาพ 50% เทียบกับสัญญาณรบกวนแบบสุ่มขนาดเท่ากัน',
    mHow: 'อ่านตารางอย่างไร: "ระยะที่เลื่อน" = 1 − cosine(ต้นฉบับ, ภาพคลุม) ยิ่งมากยิ่งเปลี่ยน · "เข้าใกล้ภาพล่อ" = cosine กับภาพล่อที่เพิ่มขึ้น ถ้าตัวเลขของผ้าคลุมไม่ต่างจากสัญญาณสุ่มมากนัก แปลว่าแทบไม่ได้ผล',
    mRun: 'เริ่มวัด',
    mSteps: 'รอบต่อภาพ',
    mAddOwn: 'เพิ่มภาพของคุณเอง (ไม่บังคับ)',
    mProgress: 'กำลังวัด {k}/{n} …',
    mDone: 'วัดเสร็จ ({s} วินาที) — backend: {b}',
    mColEps: 'ความแรง',
    mColModel: 'โมเดล',
    mColCond: 'เงื่อนไข',
    mColShift: 'ระยะที่เลื่อน (ผ้าคลุม)',
    mColRand: 'ระยะที่เลื่อน (สุ่ม)',
    mColDecoy: 'เข้าใกล้ภาพล่อ',
    mColQuality: 'PSNR / SSIM',
    condNone: 'ไฟล์ PNG ตรง ๆ', condJpeg: 'หลัง JPEG q85', condHalf: 'หลังย่อ 50%',
    mAttack: 'MobileNetV2 (ใช้คำนวณ)', mHoldout: 'MobileNetV1 (ไม่เคยเห็น)',
    mCopy: 'คัดลอกผลเป็น JSON',
    mCaveat: 'ข้อจำกัด: โมเดลทั้งสองเป็นโมเดลจำแนกภาพขนาดเล็ก ไม่ใช่ตัวเข้ารหัสภาพที่ระบบสร้างภาพ AI ใช้จริง (เช่น CLIP หรือ VAE ของ Stable Diffusion) ผลกับระบบเหล่านั้นไม่ได้วัด และอาจต่ำกว่านี้มาก',
  },
  en: {
    tagline: 'Experimental: add a faint protective "cloak" perturbation to artwork',
    warnTitle: 'Read this first — this is an experimental, research-grade tool. It is unproven.',
    warn1: 'Inkcloak does not "prevent" or "block" AI. It changes the image slightly so that one small model (MobileNetV2) "sees" it differently.',
    warn2: 'The effect may disappear after resizing, JPEG compression, denoising, or against newer/other models — which is what real image-generation pipelines use. In our own test, on a second model the cloak never saw, it moved images only slightly more than random noise of the same strength.',
    warn3: 'It is not a substitute for Glaze or Nightshade from the University of Chicago. If you need stronger protection, use those.',
    warn4: 'Check the real measured numbers on the "Measurements" page before relying on it.',
    privacy: 'Everything runs in your browser. Your image is never uploaded.',
    navTool: 'Cloak',
    navMeasure: 'Measurements',
    pick: 'Choose artwork',
    pickHint: 'or drop a file here (PNG / JPEG / WebP)',
    orSample: 'or try a sample:',
    sLandscape: 'Landscape', sPortrait: 'Portrait', sLineart: 'Line art', sPainterly: 'Painterly',
    strength: 'Strength (max perturbation budget)',
    strengthUnit: 'levels out of 255',
    steps: 'Optimisation steps',
    stepsFast: 'Fast (20)', stepsNormal: 'Normal (40)', stepsSlow: 'Thorough (80)',
    run: 'Apply cloak',
    running: 'Optimising… step {i}/{n}',
    loadingModel: 'Loading model (~12 MB the first time)…',
    done: 'Done in {s} s',
    before: 'Original', after: 'Cloaked',
    slider: 'Drag to compare before/after',
    amplify: 'Amplify the difference (×10)',
    psnr: 'PSNR', ssim: 'SSIM', maxChange: 'Max change',
    psnrHint: 'Higher = closer to the original (> 40 dB is usually invisible)',
    ssimHint: '1.000 = identical',
    previewNote: 'These numbers are a preview made by rescaling the existing cloak — press "Apply cloak" again to re-optimise at this strength.',
    encTitle: 'How differently MobileNetV2 sees this image',
    encSim: 'Cosine similarity, original vs cloaked',
    encDecoy: 'Similarity to the decoy, before → after',
    encNote: 'This is measured on the same model the cloak was optimised against, so it always looks better than reality. See "Measurements" for another model and after compression.',
    download: 'Download PNG',
    inksealTitle: 'Continue in Inkseal (optional)',
    inksealBody: 'If you also seal your work with Inkseal, cloak FIRST, then seal the downloaded PNG. The other way round, the cloak would damage Inkseal\'s watermark.',
    inksealLink: 'Open Inkseal',
    errModel: 'Could not load the model: {e}',
    errImage: 'Could not open this image',
    scaledNote: 'Image larger than {n} px — it was downscaled first.',
    themeAuto: 'System theme', themeLight: 'Light theme', themeDark: 'Dark theme',
    footer: 'Open source (MIT) · Models from TensorFlow Hub (Apache-2.0)',
    mTitle: 'Measured effectiveness (run live in your browser)',
    mIntro: 'This page cloaks 4 sample images at several strengths and measures how far each image\'s embedding moves — on the model the cloak was optimised against, on a second model it never saw, after JPEG q85, and after a 50% resize — compared with random noise of the same size.',
    mHow: 'How to read it: "shift" = 1 − cosine(original, cloaked); bigger means the model sees a bigger change. "Toward decoy" = increase in cosine similarity to the decoy image. If the cloak\'s numbers are close to random noise, it is doing little.',
    mRun: 'Run measurement',
    mSteps: 'steps per image',
    mAddOwn: 'Add your own images (optional)',
    mProgress: 'Measuring {k}/{n} …',
    mDone: 'Finished ({s} s) — backend: {b}',
    mColEps: 'Strength',
    mColModel: 'Model',
    mColCond: 'Condition',
    mColShift: 'Shift (cloak)',
    mColRand: 'Shift (random)',
    mColDecoy: 'Toward decoy',
    mColQuality: 'PSNR / SSIM',
    condNone: 'PNG as saved', condJpeg: 'after JPEG q85', condHalf: 'after 50% resize',
    mAttack: 'MobileNetV2 (optimised against)', mHoldout: 'MobileNetV1 (never seen)',
    mCopy: 'Copy results as JSON',
    mCaveat: 'Limitation: both models are small ImageNet classifiers, not the image encoders real generators use (e.g. CLIP or the Stable Diffusion VAE). Effects on those were not measured and may be much smaller.',
  },
};

const KEY = 'inkcloak.lang';

export function getLang() {
  try {
    const s = localStorage.getItem(KEY);
    if (s === 'th' || s === 'en') return s;
  } catch { /* storage unavailable */ }
  return (navigator.language || '').toLowerCase().startsWith('th') ? 'th' : 'en';
}

let lang = getLang();

export function t(key, vars = {}) {
  let s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

export function applyI18n(root = document) {
  document.documentElement.lang = lang;
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}

export function setupLang(onChange) {
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
    lang = b.dataset.lang;
    try { localStorage.setItem(KEY, lang); } catch { /* ignore */ }
    applyI18n();
    onChange?.();
  }));
  applyI18n();
}

const THEMES = ['auto', 'light', 'dark'];
const THEME_KEY = 'inkcloak.theme';

export function setupTheme(btn) {
  let theme = 'auto';
  try { theme = localStorage.getItem(THEME_KEY) || 'auto'; } catch { /* ignore */ }
  const apply = () => {
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    btn.textContent = theme === 'dark' ? '☾' : theme === 'light' ? '☀' : '◐';
    const label = t(theme === 'dark' ? 'themeDark' : theme === 'light' ? 'themeLight' : 'themeAuto');
    btn.title = label;
    btn.setAttribute('aria-label', label);
  };
  btn.addEventListener('click', () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
    apply();
  });
  apply();
  return apply;
}
