import { describe, it, expect } from 'vitest';
import exifr from 'exifr';
import {
  buildExifFilmDescription,
  detectPhotoMode,
  extractFrameNumberFromFileName,
  incrementFrameNumber,
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
      focalLength: false,
      aperture: false,
      shutterSpeed: false,
      date: true,
      artist: true,
      frameNumber: false,
    });
    expect(metadata.mode).toBe('film');
  });

  it('auto-detects digital cameras with exposure telemetry and ignores digital filename counters', () => {
    const { metadata, detected } = parseAnalogExif(
      {
        Make: 'SONY',
        Model: 'ILCE-7CM2',
        LensModel: 'FE 35mm F1.4 GM',
        FocalLength: 35,
        FNumber: 1.4,
        ExposureTime: 0.002,
        ISO: 400,
      },
      'DSC0017.JPG',
    );

    expect(metadata.mode).toBe('digital');
    expect(metadata.focalLength).toBe('35mm');
    expect(metadata.aperture).toBe('f/1.4');
    expect(metadata.shutterSpeed).toBe('1/500s');
    expect(metadata.iso).toBe('400');
    expect(metadata.scanner).toBe('');
    expect(metadata.frameNumber).toBe('');
    expect(detected.focalLength).toBe(true);
    expect(detected.aperture).toBe(true);
    expect(detected.shutterSpeed).toBe(true);
    expect(detected.frameNumber).toBe(false);
  });

  it('keeps explicit film/scanner scans in film mode even when exposure tags exist, and defaults EXIF-less uploads to film', () => {
    const taggedFilm = parseAnalogExif({
      Make: 'Nikon',
      Model: 'F3',
      Software: 'Noritsu HS-1800',
      FNumber: 2.8,
      ExposureTime: 0.008,
    });
    expect(taggedFilm.metadata.mode).toBe('film');

    const emptyScan = parseAnalogExif(undefined);
    expect(emptyScan.metadata.mode).toBe('film');

    expect(
      detectPhotoMode({
        filmStock: '',
        scanner: '',
        camera: 'FUJIFILM X100VI',
        focalLength: '23mm',
        aperture: 'f/2',
        shutterSpeed: '1/250s',
      }),
    ).toBe('digital');
  });

  it('extracts frame number from EXIF ImageNumber / UserComment and filename fallbacks', () => {
    const byTag = parseAnalogExif({ ImageNumber: 17 });
    expect(byTag.metadata.frameNumber).toBe('17');
    expect(byTag.detected.frameNumber).toBe(true);

    const byComment = parseAnalogExif({
      UserComment: 'Film: Kodak Gold 200 | EI: 200 | Frame: 06A',
    });
    expect(byComment.metadata.filmStock).toBe('Kodak Gold 200');
    expect(byComment.metadata.iso).toBe('200');
    expect(byComment.metadata.frameNumber).toBe('06A');
    expect(byComment.detected.frameNumber).toBe(true);

    const byFile = parseAnalogExif({}, '000041400022.jpg');
    expect(byFile.metadata.frameNumber).toBe('22');
    expect(byFile.detected.frameNumber).toBe(false);
  });

  it('detects known film scanners from Software tag, normalizes EZ Controller, and ignores non-scanner software', () => {
    const frontier = parseAnalogExif({ Software: 'Frontier SP-3000' });
    expect(frontier.metadata.scanner).toBe('Frontier SP-3000');
    expect(frontier.detected.scanner).toBe(true);

    const ez = parseAnalogExif({ Software: 'EZ Controller' });
    expect(ez.metadata.scanner).toBe('Noritsu HS-1800');
    expect(ez.detected.scanner).toBe(true);

    const noritsuEz = parseAnalogExif({ Software: 'NORITSU KOKI EZ Controller' });
    expect(noritsuEz.metadata.scanner).toBe('Noritsu HS-1800');
    expect(noritsuEz.detected.scanner).toBe(true);

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

  it('extracts frame numbers from common scan filenames and increments sequentially', () => {
    expect(extractFrameNumberFromFileName('roll01_14A.jpg')).toBe('14A');
    expect(extractFrameNumberFromFileName('Frame_05A.jpg')).toBe('05A');
    expect(extractFrameNumberFromFileName('000041400017.jpg')).toBe('17');
    expect(extractFrameNumberFromFileName('20260913_143005.jpg')).toBe('');

    expect(incrementFrameNumber('06A')).toBe('07A');
    expect(incrementFrameNumber('17')).toBe('18');
    expect(incrementFrameNumber('09A')).toBe('10A');
  });
});

describe('writeExifToJpegDataUrl round-trip', () => {
  it('writes key metadata into JPEG and survives exifr read-back', async () => {
    const taggedDataUrl = writeExifToJpegDataUrl(MINIMAL_1X1_JPEG_DATA_URL, {
      mode: 'film',
      camera: 'Pentax 17',
      lens: '25mm F3.5',
      scanner: 'Frontier SP-3000',
      filmStock: 'Kodak Portra 400',
      iso: '400',
      focalLength: '',
      aperture: '',
      shutterSpeed: '',
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
    expect(metadata.frameNumber).toBe('01A');
  });
});
