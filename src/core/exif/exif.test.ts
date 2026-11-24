import { describe, it, expect } from 'vitest';
import exifr from 'exifr';
import {
  buildExifFilmDescription,
  parseAnalogExif,
  splitCameraMakeModel,
} from './parser';
import { writeExifToJpegDataUrl } from './writer';

// Minimal valid 1x1 JPEG data URL for EXIF write + read-back round-trip testing
const MINIMAL_1X1_JPEG_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

describe('parseAnalogExif', () => {
  it('parses metadata written by fix_exif.ps1 accurately', () => {
    const { metadata, detected } = parseAnalogExif({
      Make: 'Pentax',
      Model: '17',
      LensModel: '25mm F3.5',
      ISO: 400,
      ImageDescription: 'Film: Ilford HP5 Plus 400 | EI: 400',
      DateTimeOriginal: new Date(2026, 8, 13, 14, 30, 5), // local time 2026-09-13 14:30:05
      Artist: 'Edd Studio',
    });

    expect(metadata.camera).toBe('Pentax 17');
    expect(metadata.lens).toBe('25mm F3.5');
    expect(metadata.filmStock).toBe('Ilford HP5 Plus 400');
    expect(metadata.iso).toBe('400');
    expect(metadata.date).toBe('2026-09-13');
    expect(metadata.exifDateTime).toBe('2026:09:13 14:30:05');
    expect(metadata.artist).toBe('Edd Studio');
    expect(detected).toEqual({
      camera: true,
      lens: true,
      scanner: false,
      filmStock: true,
      iso: true,
      date: true,
      artist: true,
    });
  });

  it('detects known film scanners from Software tag and ignores non-scanner software', () => {
    const frontier = parseAnalogExif({ Software: 'Frontier SP-3000' });
    expect(frontier.metadata.scanner).toBe('Frontier SP-3000');
    expect(frontier.detected.scanner).toBe(true);

    const lightroom = parseAnalogExif({ Software: 'Adobe Lightroom' });
    expect(lightroom.metadata.scanner).toBe('');
    expect(lightroom.detected.scanner).toBe(false);
  });

  it('deduplicates Make when Model already starts with Make', () => {
    const { metadata } = parseAnalogExif({
      Make: 'Leica',
      Model: 'Leica M6',
    });
    expect(metadata.camera).toBe('Leica M6');
  });

  it('parses UserComment Uint8Array and XMP description objects', () => {
    const commentBytes = new TextEncoder().encode('ASCII\0\0\0Film: Kodak Vision3 250D | EI: 250');
    const { metadata } = parseAnalogExif({
      UserComment: commentBytes,
      description: { value: 'Film: Kodak Vision3 250D | EI: 250' },
    });
    expect(metadata.filmStock).toBe('Kodak Vision3 250D');
    expect(metadata.iso).toBe('250');
  });

  it('handles missing optional fields cleanly', () => {
    const { metadata, detected } = parseAnalogExif({
      Make: 'Olympus',
      Model: 'OM-1',
    });
    expect(metadata.camera).toBe('Olympus OM-1');
    expect(metadata.lens).toBe('');
    expect(metadata.filmStock).toBe('');
    expect(detected.lens).toBe(false);
    expect(detected.filmStock).toBe(false);
  });
});

describe('camera & film helpers', () => {
  it('splits camera name into Make and Model like fix_exif.ps1', () => {
    expect(splitCameraMakeModel('Pentax 17')).toEqual({ make: 'Pentax', model: '17' });
    expect(splitCameraMakeModel('Olympus OM-1')).toEqual({ make: 'Olympus', model: 'OM-1' });
    expect(splitCameraMakeModel('Contax')).toEqual({ make: 'Contax', model: 'Contax' });
  });

  it('formats Film + EI description string', () => {
    expect(buildExifFilmDescription('Kodak Portra 400', '400')).toBe(
      'Film: Kodak Portra 400 | EI: 400',
    );
  });
});

describe('writeExifToJpegDataUrl round-trip', () => {
  it('writes key metadata into JPEG and survives exifr read-back', async () => {
    const taggedDataUrl = writeExifToJpegDataUrl(MINIMAL_1X1_JPEG_DATA_URL, {
      camera: 'Pentax 17',
      lens: '25mm F3.5',
      scanner: 'Frontier SP-3000',
      filmStock: 'Kodak Portra 400',
      iso: '400',
      date: '2026-09-13',
      exifDateTime: '2026:09:13 17:42:00',
      artist: 'Wongnaret',
      frameNumber: '01A',
      caption: 'Golden hour',
    });

    const base64 = taggedDataUrl.split(',')[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const parsedRaw = await exifr.parse(bytes, {
      tiff: true,
      exif: true,
      userComment: true,
    });
    const { metadata } = parseAnalogExif(parsedRaw as Record<string, unknown>);

    expect(metadata.camera).toBe('Pentax 17');
    expect(metadata.lens).toBe('25mm F3.5');
    expect(metadata.filmStock).toBe('Kodak Portra 400');
    expect(metadata.iso).toBe('400');
    expect(metadata.date).toBe('2026-09-13');
    expect(metadata.exifDateTime).toBe('2026:09:13 17:42:00');
    expect(metadata.artist).toBe('Wongnaret');
  });
});
