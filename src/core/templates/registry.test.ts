import { describe, it, expect } from 'vitest';
import {
  FULL_FRAME_SPROCKET_COUNT,
  HALF_FRAME_SPROCKET_COUNT,
  computeSprocketHoles,
  getFilmEdgeCode,
} from './drawFilmHelpers';
import { DEFAULT_TEMPLATE_ID, getTemplate, TEMPLATES } from './registry';

describe('template registry', () => {
  it('registers all 6 analog frame templates with minimal-matte first', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual([
      'minimal-matte',
      '35mm-sprocket',
      'film-rebate',
      'editorial-card',
      'half-frame-single',
      'half-frame-diptych',
    ]);
  });

  it('defaults to minimal-matte and marks diptych support accurately', () => {
    expect(DEFAULT_TEMPLATE_ID).toBe('minimal-matte');
    expect(getTemplate('half-frame-diptych').supportsDiptych).toBe(true);
    expect(getTemplate('half-frame-single').supportsDiptych).toBe(false);
    expect(getTemplate('editorial-card').usesCustomFooter).toBe(true);
  });
});

describe('35mm sprocket geometry', () => {
  it('renders 8 perforations for full-frame 35mm and diptych strips with 4 per half-frame', () => {
    const stripBand = { x: 100, y: 100, width: 1866, height: 190 };
    const full = computeSprocketHoles(stripBand, 'horizontal', FULL_FRAME_SPROCKET_COUNT, 1);

    expect(full.holes).toHaveLength(8);
    // Real 135 perforation is taller across the strip than wide along it
    expect(full.holes[0].height).toBeGreaterThan(full.holes[0].width);
    // 4 holes lie purely left of center septum, 4 holes lie purely right of center septum
    const midX = stripBand.x + stripBand.width / 2;
    expect(full.holes.filter((h) => h.x + h.width < midX)).toHaveLength(4);
    expect(full.holes.filter((h) => h.x > midX)).toHaveLength(4);
  });

  it('renders 4 perforations for single half-frame strips (both horizontal and vertical)', () => {
    const horiz = computeSprocketHoles(
      { x: 100, y: 100, width: 1200, height: 210 },
      'horizontal',
      HALF_FRAME_SPROCKET_COUNT,
      1,
    );
    expect(horiz.holes).toHaveLength(4);
    expect(horiz.holes[0].height).toBeGreaterThan(horiz.holes[0].width);

    const vert = computeSprocketHoles(
      { x: 100, y: 100, width: 210, height: 1200 },
      'vertical',
      HALF_FRAME_SPROCKET_COUNT,
      1,
    );
    expect(vert.holes).toHaveLength(4);
    expect(vert.holes[0].width).toBeGreaterThan(vert.holes[0].height);
  });

  it('maps film stocks to authentic outer edge rebate codes', () => {
    expect(getFilmEdgeCode('Kodak Gold 200')).toBe('KODAK GB 200-7');
    expect(getFilmEdgeCode('Ilford HP5 Plus 400')).toBe('ILFORD HP5 PLUS');
    expect(getFilmEdgeCode('Kodak Portra 400')).toBe('KODAK PORTRA 400');
  });
});
