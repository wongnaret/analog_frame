import exifr from 'exifr';
import { parseAnalogExif, type ParsedExifResult } from './parser';

export async function readExifFromFile(
  input: File | Blob | ArrayBuffer | Uint8Array,
): Promise<ParsedExifResult> {
  const fileName =
    typeof File !== 'undefined' && input instanceof File ? input.name : undefined;
  try {
    const raw = await exifr.parse(input, {
      tiff: true,
      exif: true,
      xmp: true,
      userComment: true,
      iptc: false,
      icc: false,
    });
    return parseAnalogExif(raw as Record<string, unknown> | undefined, fileName);
  } catch {
    return parseAnalogExif(undefined, fileName);
  }
}
