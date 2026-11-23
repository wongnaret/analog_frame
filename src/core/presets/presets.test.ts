import { describe, it, expect, beforeEach } from 'vitest';
import {
  ASPECT_RATIO_PRESETS,
  DEFAULT_ASPECT_RATIO_ID,
  getAspectRatioPreset,
} from './aspectRatios';
import { getFilmAccentColor, inferIsoFromFilmStock } from './filmStocks';
import { DEFAULT_MATTE_ID, getMattePalette } from './mattePalettes';
import { loadGearHistory, recordMetadataInGearHistory } from './gearStorage';

describe('aspectRatios preset', () => {
  it('uses 3:4 Profile Grid (2160 x 2880) as default', () => {
    expect(DEFAULT_ASPECT_RATIO_ID).toBe('3:4');
    const preset = getAspectRatioPreset(DEFAULT_ASPECT_RATIO_ID);
    expect(preset.width).toBe(2160);
    expect(preset.height).toBe(2880);
  });

  it('includes all 4 Instagram presets', () => {
    expect(ASPECT_RATIO_PRESETS.map((p) => p.id)).toEqual(['3:4', '4:5', '1:1', '9:16']);
  });
});

describe('mattePalettes preset', () => {
  it('defaults to white matte', () => {
    expect(DEFAULT_MATTE_ID).toBe('white');
    expect(getMattePalette('white').background).toBe('#FFFFFF');
    expect(getMattePalette('darkroom').background).toBe('#101010');
  });
});

describe('filmStocks preset', () => {
  it('infers ISO from preset and custom names', () => {
    expect(inferIsoFromFilmStock('Ilford HP5 Plus 400')).toBe('400');
    expect(inferIsoFromFilmStock('Kodak Vision3 250D')).toBe('250');
    expect(inferIsoFromFilmStock('Custom Film 800')).toBe('800');
  });

  it('returns brand-specific accent colors', () => {
    expect(getFilmAccentColor('Kodak Portra 400')).toBe('#E8A838');
    expect(getFilmAccentColor('Fujifilm C200')).toBe('#63B86A');
    expect(getFilmAccentColor('Ilford HP5 Plus 400')).toBe('#D6D4CE');
    expect(getFilmAccentColor('CineStill 800T')).toBe('#E86A42');
  });
});

describe('gearStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('records unique gear items in localStorage', () => {
    let history = loadGearHistory();
    history = recordMetadataInGearHistory(history, {
      camera: 'Pentax 17',
      lens: '25mm F3.5',
      filmStock: 'Kodak Portra 400',
      artist: 'W. Studio',
    });
    history = recordMetadataInGearHistory(history, {
      camera: 'Leica M6',
      lens: '35mm Summicron',
    });

    const loaded = loadGearHistory();
    expect(loaded.cameras).toEqual(['Leica M6', 'Pentax 17']);
    expect(loaded.lenses).toEqual(['35mm Summicron', '25mm F3.5']);
    expect(loaded.filmStocks).toEqual(['Kodak Portra 400']);
    expect(loaded.artists).toEqual(['W. Studio']);
  });
});
