import type { Variant } from "@/data/emotions";

export const HIGHLIGHT_INK = "hsl(30 10% 12%)";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatHsl = ({ h, s, l }: { h: number; s: number; l: number }) =>
  `hsl(${h} ${s}% ${l}%)`;

export const parseHsl = (color: string) => {
  const match = color.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/i);
  if (!match) return null;

  return {
    h: Number(match[1]),
    s: Number(match[2]),
    l: Number(match[3]),
  };
};

export const hslToRgb = ({ h, s, l }: { h: number; s: number; l: number }) => {
  const hue = (((h % 360) + 360) % 360) / 360;
  const saturation = s / 100;
  const lightness = l / 100;

  if (saturation === 0) {
    const value = Math.round(lightness * 255);
    return { r: value, g: value, b: value };
  }

  const hueToRgb = (p: number, q: number, t: number) => {
    let adjusted = t;
    if (adjusted < 0) adjusted += 1;
    if (adjusted > 1) adjusted -= 1;
    if (adjusted < 1 / 6) return p + (q - p) * 6 * adjusted;
    if (adjusted < 1 / 2) return q;
    if (adjusted < 2 / 3) return p + (q - p) * (2 / 3 - adjusted) * 6;
    return p;
  };

  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    r: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hue) * 255),
    b: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  };
};

export const relativeLuminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const channels = [r, g, b].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

export const isDarkHsl = (color: string) => {
  const hsl = parseHsl(color);
  if (!hsl) return false;
  return relativeLuminance(hslToRgb(hsl)) < 0.18;
};

export const getEmotionPixelColors = (variant: Variant) => {
  const accent = parseHsl(variant.accent);
  const ink = parseHsl(variant.ink);
  if (!accent) return variant.accent;

  if (isDarkHsl(variant.bg)) {
    return [
      formatHsl({ ...accent, s: clamp(accent.s, 55, 100), l: clamp(accent.l + 16, 70, 88) }),
      formatHsl({ ...accent, s: clamp(accent.s, 45, 100), l: clamp(accent.l + 26, 78, 94) }),
      ink ? formatHsl({ ...ink, l: clamp(ink.l + 8, 76, 96) }) : formatHsl({ ...accent, l: 92 }),
    ].join(",");
  }

  return [
    variant.accent,
    formatHsl({ ...accent, l: clamp(accent.l + 18, 64, 88) }),
    ink ? variant.ink : formatHsl({ ...accent, l: clamp(accent.l - 18, 24, 48) }),
  ].join(",");
};
