import type { FilmStockPreset } from '../types';

export const FILM_STOCK_PRESETS: FilmStockPreset[] = [
  { name: 'Kodak Gold 200', brand: 'Kodak', defaultIso: '200', type: 'Color Negative' },
  { name: 'Kodak ColorPlus 200', brand: 'Kodak', defaultIso: '200', type: 'Color Negative' },
  { name: 'Kodak Ultramax 400', brand: 'Kodak', defaultIso: '400', type: 'Color Negative' },
  { name: 'Kodak Portra 160', brand: 'Kodak', defaultIso: '160', type: 'Color Negative' },
  { name: 'Kodak Portra 400', brand: 'Kodak', defaultIso: '400', type: 'Color Negative' },
  { name: 'Kodak Portra 800', brand: 'Kodak', defaultIso: '800', type: 'Color Negative' },
  { name: 'Kodak Ektar 100', brand: 'Kodak', defaultIso: '100', type: 'Color Negative' },
  { name: 'Kodak Tri-X 400', brand: 'Kodak', defaultIso: '400', type: 'B&W' },
  { name: 'Kodak Vision3 250D', brand: 'Kodak', defaultIso: '250', type: 'Cinema' },
  { name: 'Kodak Vision3 500T', brand: 'Kodak', defaultIso: '500', type: 'Cinema' },
  { name: 'Ilford HP5 Plus 400', brand: 'Ilford', defaultIso: '400', type: 'B&W' },
  { name: 'Ilford FP4 Plus 125', brand: 'Ilford', defaultIso: '125', type: 'B&W' },
  { name: 'Ilford Delta 400', brand: 'Ilford', defaultIso: '400', type: 'B&W' },
  { name: 'Ilford XP2 Super 400', brand: 'Ilford', defaultIso: '400', type: 'B&W' },
  { name: 'Fujifilm Superia X-TRA 400', brand: 'Fujifilm', defaultIso: '400', type: 'Color Negative' },
  { name: 'Fujifilm C200', brand: 'Fujifilm', defaultIso: '200', type: 'Color Negative' },
  { name: 'Fujifilm Pro 400H', brand: 'Fujifilm', defaultIso: '400', type: 'Color Negative' },
  { name: 'Fujifilm Neopan Acros 100 II', brand: 'Fujifilm', defaultIso: '100', type: 'B&W' },
  { name: 'CineStill 800T', brand: 'CineStill', defaultIso: '800', type: 'Cinema' },
  { name: 'CineStill 400D', brand: 'CineStill', defaultIso: '400', type: 'Cinema' },
  { name: 'Harman Phoenix 200', brand: 'Harman', defaultIso: '200', type: 'Color Negative' },
];

export function inferIsoFromFilmStock(filmStock: string): string | null {
  const trimmed = filmStock.trim();
  if (!trimmed) return null;

  const preset = FILM_STOCK_PRESETS.find(
    (item) => item.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (preset) return preset.defaultIso;

  const match = trimmed.match(/\b(50|64|100|125|160|200|250|320|400|500|800|1600|3200)\b/);
  return match ? match[1] : null;
}

export function getFilmAccentColor(filmStock: string): string {
  const lower = filmStock.toLowerCase();
  if (lower.includes('cinestill')) return '#E86A42';
  if (lower.includes('fuji')) return '#63B86A';
  if (lower.includes('ilford') || lower.includes('tri-x') || lower.includes('acros') || lower.includes('hp5') || lower.includes('fp4') || lower.includes('delta')) {
    return '#D6D4CE';
  }
  if (lower.includes('kodak') || lower.includes('portra') || lower.includes('gold') || lower.includes('ektar') || lower.includes('ultramax') || lower.includes('vision')) {
    return '#E8A838';
  }
  if (lower.includes('harman') || lower.includes('phoenix')) return '#E07A4B';
  return '#DFC99B';
}
