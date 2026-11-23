import exifr from 'exifr';
import { parseAnalogExif, type ParsedExifResult } from './parser';

export async function readExifFromFile(
  input: File | Blob | ArrayBuffer | Uint8Array,
): Promise<ParsedExifResult> {
  try {
    const raw = await exifr.parse(input, {
      tiff: true,
      exif: true,
      xmp: true,
      userComment: true,
      iptc: false,
      icc: false,
    });
    return parseAnalogExif(raw as Record<string, unknown> | undefined);
  } catch {
    return parseAnalogExif(undefined);
  }
}
