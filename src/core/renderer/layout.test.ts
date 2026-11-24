import { describe, it, expect } from 'vitest';
import { computeCanvasLayout, fitRectInBox, getRotatedDimensions } from './layout';
import { formatSplitFooterLines } from './typography';

describe('layout geometry', () => {
  it('defaults to 3:4 (2160 x 2880) at full scale with footer and watermark regions', () => {
    const layout = computeCanvasLayout('3:4', 1, false);
    expect(layout.width).toBe(2160);
    expect(layout.height).toBe(2880);
    expect(layout.frameRegion.width).toBeGreaterThan(0);
    expect(layout.footerRegion.height).toBeGreaterThanOrEqual(300);
    expect(layout.watermarkRegion.height).toBeGreaterThan(0);
    expect(layout.watermarkRegion.y).toBeGreaterThan(
      layout.footerRegion.y + layout.footerRegion.height,
    );
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

describe('formatSplitFooterLines', () => {
  it('places camera + lens on line 1 left, scanner on line 2 left, and film + ISO on the right', () => {
    const lines = formatSplitFooterLines(
      {
        camera: 'Pentax 17',
        lens: '25mm F3.5',
        scanner: 'Frontier SP-3000',
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
        showArtist: true,
        showFrameNumber: true,
        showCaption: true,
        showWatermark: true,
      },
    );

    expect(lines.leftPrimary).toBe('CAMERA: PENTAX 17  ·  LENS: 25MM F3.5');
    expect(lines.leftSecondary).toBe('SCANNER: Frontier SP-3000  ·  ARTIST: Edd');
    expect(lines.rightPrimary).toBe('FILM: ILFORD HP5 PLUS 400');
    expect(lines.rightSecondary).toBe('ISO: 400');
    expect(lines.captionLine).toBe('Wedding day');
  });

  it('handles missing camera or scanner cleanly and respects hidden toggles', () => {
    const lines = formatSplitFooterLines(
      {
        camera: '',
        lens: '50mm f/1.8',
        scanner: '',
        filmStock: 'Kodak Portra 400',
        iso: '400',
        date: '2026-09-13',
        exifDateTime: '2026:09:13 12:00:00',
        artist: 'Edd',
        frameNumber: '04A',
        caption: 'Hidden caption',
      },
      {
        showDate: false,
        showArtist: false,
        showFrameNumber: false,
        showCaption: false,
        showWatermark: true,
      },
    );

    expect(lines.leftPrimary).toBe('LENS: 50MM F/1.8');
    expect(lines.leftSecondary).toBe('');
    expect(lines.rightPrimary).toBe('FILM: KODAK PORTRA 400');
    expect(lines.rightSecondary).toBe('ISO: 400');
    expect(lines.captionLine).toBe('');
  });
});
