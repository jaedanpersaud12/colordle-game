export interface Color {
  name: string;
  hex: string;
  goodName: boolean;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex));
}

export function calculateColorSimilarity(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  // Calculate Euclidean distance in RGB color space
  const rDiff = rgb1.r - rgb2.r;
  const gDiff = rgb1.g - rgb2.g;
  const bDiff = rgb1.b - rgb2.b;

  // Maximum possible distance in RGB space: sqrt(255² + 255² + 255²) ≈ 441.67
  const maxDistance = Math.sqrt(3 * 255 * 255);
  const actualDistance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);

  // Convert distance to similarity percentage (0-100), rounded to 2 decimal places
  const similarity = (1 - actualDistance / maxDistance) * 100;
  return Math.round(similarity * 100) / 100;
}

export function getColorDistance(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const rDiff = rgb1.r - rgb2.r;
  const gDiff = rgb1.g - rgb2.g;
  const bDiff = rgb1.b - rgb2.b;

  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

export async function loadColors(): Promise<Color[]> {
  const response = await fetch('/colornames.csv');
  const text = await response.text();
  const lines = text.split('\n').slice(1); // Skip header

  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const [name, hex, goodName] = line.split(',');
      return {
        name: name.trim(),
        hex: hex.trim(),
        goodName: goodName?.trim() !== 'x',
      };
    });
}

export function getRandomColor(colors: Color[]): Color {
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getSimilarColors(
  targetColor: Color,
  allColors: Color[],
  count: number = 9
): Color[] {
  return allColors
    .map((color) => ({
      color,
      distance: getColorDistance(targetColor.hex, color.hex),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(1, count + 1)
    .map((item) => item.color);
}
