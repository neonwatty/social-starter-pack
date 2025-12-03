/**
 * Viewport preset definitions for common devices
 */
export interface ViewportPreset {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

/**
 * Mobile device presets
 */
export const MOBILE_PRESETS: Record<string, ViewportPreset> = {
  // iPhones
  'iphone-se': {
    name: 'iPhone SE',
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  'iphone-12': {
    name: 'iPhone 12/13/14',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  'iphone-12-pro-max': {
    name: 'iPhone 12/13/14 Pro Max',
    width: 428,
    height: 926,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  'iphone-15-pro': {
    name: 'iPhone 15 Pro',
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  'iphone-15-pro-max': {
    name: 'iPhone 15 Pro Max',
    width: 430,
    height: 932,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },

  // iPads
  'ipad': {
    name: 'iPad',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  'ipad-pro-11': {
    name: 'iPad Pro 11"',
    width: 834,
    height: 1194,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  'ipad-pro-12': {
    name: 'iPad Pro 12.9"',
    width: 1024,
    height: 1366,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },

  // Android phones
  'pixel-7': {
    name: 'Google Pixel 7',
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
  },
  'pixel-7-pro': {
    name: 'Google Pixel 7 Pro',
    width: 412,
    height: 892,
    deviceScaleFactor: 3.5,
    isMobile: true,
    hasTouch: true,
  },
  'samsung-s21': {
    name: 'Samsung Galaxy S21',
    width: 360,
    height: 800,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  'samsung-s23': {
    name: 'Samsung Galaxy S23',
    width: 360,
    height: 780,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },

  // Android tablets
  'android-tablet': {
    name: 'Android Tablet',
    width: 800,
    height: 1280,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
};

/**
 * Desktop presets
 */
export const DESKTOP_PRESETS: Record<string, ViewportPreset> = {
  'desktop': {
    name: 'Desktop (1920x1080)',
    width: 1920,
    height: 1080,
  },
  'desktop-hd': {
    name: 'Desktop HD (1280x720)',
    width: 1280,
    height: 720,
  },
  'desktop-4k': {
    name: 'Desktop 4K (3840x2160)',
    width: 3840,
    height: 2160,
  },
  'laptop': {
    name: 'Laptop (1440x900)',
    width: 1440,
    height: 900,
  },
  'macbook-air': {
    name: 'MacBook Air (1440x900)',
    width: 1440,
    height: 900,
  },
  'macbook-pro-14': {
    name: 'MacBook Pro 14"',
    width: 1512,
    height: 982,
    deviceScaleFactor: 2,
  },
  'macbook-pro-16': {
    name: 'MacBook Pro 16"',
    width: 1728,
    height: 1117,
    deviceScaleFactor: 2,
  },
};

/**
 * All viewport presets combined
 */
export const VIEWPORT_PRESETS: Record<string, ViewportPreset> = {
  ...MOBILE_PRESETS,
  ...DESKTOP_PRESETS,
};

/**
 * Get a viewport preset by name
 */
export function getViewportPreset(name: string): ViewportPreset | undefined {
  return VIEWPORT_PRESETS[name.toLowerCase()];
}

/**
 * List all available preset names
 */
export function listPresetNames(): string[] {
  return Object.keys(VIEWPORT_PRESETS);
}

/**
 * List mobile preset names only
 */
export function listMobilePresets(): string[] {
  return Object.keys(MOBILE_PRESETS);
}

/**
 * List desktop preset names only
 */
export function listDesktopPresets(): string[] {
  return Object.keys(DESKTOP_PRESETS);
}

/**
 * Parse viewport string (preset name or WxH format)
 * Returns viewport settings or undefined if invalid
 */
export function parseViewport(input: string): ViewportPreset | undefined {
  // Check if it's a preset name
  const preset = getViewportPreset(input);
  if (preset) {
    return preset;
  }

  // Try to parse WxH format
  const match = input.match(/^(\d+)x(\d+)$/i);
  if (match) {
    return {
      name: `Custom (${input})`,
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }

  return undefined;
}
