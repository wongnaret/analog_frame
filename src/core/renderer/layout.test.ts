import { describe, it, expect } from 'vitest';
import { computeCanvasLayout, fitRectInBox, getRotatedDimensions } from './layout';
import { formatFooterLines } from './typography';

describe('layout geometry', () => {
  it('defaults to 3:4 (2160 x 2880) at full scale', () => {
    const layout = computeCanvasLayout('3:4', 1, false);
    expect(layout.width).toBe(2160);
    expect(layout.height).toBe(2880);
    expect(layout.frameRegion.width).toBeGreaterThan(0);
    expect(layout.footerRegion.height).toBeGreaterThan(0);
  });

  it('fits landscape, portrait, and square images inside frame box without cropping', () => {
    const box = { x: 100, y: 100, width: 1000, height: 1200 };

    const landscape = fitRectInBox(3000, 2000, box);
    expect(landscape.width).toBeCloseTo(1000);
    expect(landscape.height).toBeCloseTo(666.67, 1);

    const portrait = fitRectInBox(2000, 3000, box);
    expect(portrait.height).toBeCloseTo(1200);
    expect(portrait.width).toBeCloseTo(800);

    const square = fitRectInBox(2000, 2000, box);
    expect(square.width).toBeCloseTo(1000);
    expect(square.height).toBeCloseTo(1000);
  });

  it('swaps dimensions on 90 and 270 degree rotations', () => {
    expect(getRotatedDimensions(3000, 2000, 0)).toEqual({ width: 3000, height: 2000 });
    expect(getRotatedDimensions(3000, 2000, 90)).toEqual({ width: 2000, height: 3000 });
    expect(getRotatedDimensions(3000, 2000, 180)).toEqual({ width: 3000, height: 2000 });
    expect(getRotatedDimensions(3000, 2000, 270)).toEqual({ width: 2000, height: 3000 });
  });
});

describe('formatFooterLines', () => {
  it('omits empty fields cleanly and respects visibility toggles', () => {
    const lines = formatFooterLines(
      {
        camera: 'Pentax 17',
        lens: '',
        filmStock: 'Ilford HP5 Plus 400',
        iso: '400',
        date: '2026-09-13',
        exifDateTime: '2026:09:13 12:00:00',
        artist: 'Edd',
        frameNumber: '04A',
        caption: 'Wedding day',
      },
      {
        showDate: true,
        showArtist: false,
        showFrameNumber: true,
        showCaption: false,
      },
    );

    expect(lines.primaryLine).toBe('PENTAX 17');
    expect(lines.filmLine).toBe('ILFORD HP5 PLUS 400  ·  EI 400');
    expect(lines.detailLine).toBe('2026-09-13  ·  #04A');
    expect(lines.captionLine).toBe('');
  });
});
