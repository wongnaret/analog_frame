import type { MattePalette, MattePaletteId } from '../types';

export const DEFAULT_MATTE_ID: MattePaletteId = 'white';

export const MATTE_PALETTES: MattePalette[] = [
  {
    id: 'white',
    label: 'White',
    background: '#FFFFFF',
    primaryText: '#141414',
    secondaryText: '#666666',
    hairline: '#E2E0DC',
    cardBg: '#F9F8F6',
    swatchHex: '#FFFFFF',
  },
  {
    id: 'warm-paper',
    label: 'Warm Paper',
    background: '#F5F1E8',
    primaryText: '#1C1A17',
    secondaryText: '#6F6A61',
    hairline: '#DDD5C7',
    cardBg: '#EFE9DC',
    swatchHex: '#F5F1E8',
  },
  {
    id: 'darkroom',
    label: 'Darkroom',
    background: '#101010',
    primaryText: '#F2F0EB',
    secondaryText: '#96928A',
    hairline: '#2A2A2D',
    cardBg: '#18181A',
    swatchHex: '#101010',
  },
];

export function getMattePalette(id: MattePaletteId): MattePalette {
  return (
    MATTE_PALETTES.find((palette) => palette.id === id) ?? MATTE_PALETTES[0]
  );
}
