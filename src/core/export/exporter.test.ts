import { describe, it, expect } from 'vitest';
import { buildExportFilename } from './exporter';

describe('buildExportFilename', () => {
  it('formats clean filenames for JPEG and PNG', () => {
    expect(buildExportFilename('IMG 001.JPG', '3:4', '35mm-sprocket', 'jpeg')).toBe(
      'IMG_001_3x4_35mm.jpg',
    );
    expect(buildExportFilename('wedding scan-02.tiff', '4:5', 'half-frame-diptych', 'png')).toBe(
      'wedding_scan-02_4x5_diptych.png',
    );
  });

  it('handles empty or symbol-only filenames safely', () => {
    expect(buildExportFilename('***.jpg', '1:1', 'minimal-matte', 'jpeg')).toBe(
      'analog_frame_1x1_matte.jpg',
    );
  });
});
