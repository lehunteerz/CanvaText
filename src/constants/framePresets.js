/** Presets de quadro (artboard) estilo Figma — dimensões em px lógicos */

export const FRAME_PRESET_CATEGORIES = [
  {
    id: 'celular',
    label: 'Celular',
    presets: [
      { id: 'iphone-14-15', label: 'iPhone 14 / 15', width: 390, height: 844 },
      { id: 'iphone-14-pro-max', label: 'iPhone 14 Pro Max', width: 430, height: 932 },
      { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667 },
      { id: 'pixel-7', label: 'Pixel 7', width: 412, height: 915 },
      { id: 'android-comum', label: 'Android comum', width: 360, height: 800 },
    ],
  },
  {
    id: 'tablet',
    label: 'Tablet',
    presets: [
      { id: 'ipad-mini', label: 'iPad mini', width: 768, height: 1024 },
      { id: 'ipad-11', label: 'iPad 11"', width: 834, height: 1194 },
      { id: 'ipad-pro-129', label: 'iPad Pro 12.9"', width: 1024, height: 1366 },
      { id: 'surface-pro', label: 'Surface Pro', width: 1440, height: 960 },
    ],
  },
  {
    id: 'desktop',
    label: 'Desktop',
    presets: [
      { id: 'hd', label: 'HD 1280 × 720', width: 1280, height: 720 },
      { id: 'hd-plus', label: 'HD+ 1600 × 900', width: 1600, height: 900 },
      { id: 'fhd', label: 'Full HD 1920 × 1080', width: 1920, height: 1080 },
      { id: 'qhd', label: 'QHD 2560 × 1440', width: 2560, height: 1440 },
      { id: 'uhd', label: '4K 3840 × 2160', width: 3840, height: 2160 },
    ],
  },
  {
    id: 'papel',
    label: 'Papel',
    presets: [
      { id: 'a4-portrait', label: 'A4 retrato (96 dpi)', width: 794, height: 1123 },
      { id: 'a4-landscape', label: 'A4 paisagem (96 dpi)', width: 1123, height: 794 },
      { id: 'a5-portrait', label: 'A5 retrato', width: 559, height: 794 },
      { id: 'letter', label: 'Letter EUA', width: 816, height: 1056 },
    ],
  },
];

export function getDefaultFramePreset() {
  return FRAME_PRESET_CATEGORIES[0].presets[0];
}
