import piexifModule from 'piexifjs';
import type { PhotoMetadata } from '../types';
import { buildExifFilmDescription, splitCameraMakeModel } from './parser';

// Handle ESM/CJS interop across Vite & Node test environments
const piexif =
  (piexifModule as unknown as { default?: typeof piexifModule }).default ?? piexifModule;

function toAsciiSafe(input: string): string {
  // piexifjs throws if ASCII EXIF fields contain characters outside 0x00..0x7F
  return input
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

function resolveExifDateTime(metadata: PhotoMetadata): string {
  if (/^\d{4}:\d{2}:\d{2}\s\d{2}:\d{2}:\d{2}$/.test(metadata.exifDateTime.trim())) {
    return metadata.exifDateTime.trim();
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(metadata.date.trim())) {
    return `${metadata.date.trim().replace(/-/g, ':')} 12:00:00`;
  }
  return '';
}

export function writeExifToJpegDataUrl(
  jpegDataUrl: string,
  metadata: PhotoMetadata,
): string {
  const zeroth: Record<number, string | number | number[]> = {};
  const exif: Record<number, string | number | number[]> = {};

  zeroth[piexif.ImageIFD.Software] = 'Analog Frame';

  if (metadata.camera.trim()) {
    const { make, model } = splitCameraMakeModel(metadata.camera);
    const safeMake = toAsciiSafe(make);
    const safeModel = toAsciiSafe(model);
    if (safeMake) zeroth[piexif.ImageIFD.Make] = safeMake;
    if (safeModel) zeroth[piexif.ImageIFD.Model] = safeModel;
  }

  const desc = toAsciiSafe(buildExifFilmDescription(metadata.filmStock, metadata.iso));
  const safeFrame = toAsciiSafe(metadata.frameNumber).replace(/^#/, '');
  const userCommentParts = [desc, safeFrame ? `Frame: ${safeFrame}` : ''].filter(Boolean);
  if (desc) {
    zeroth[piexif.ImageIFD.ImageDescription] = desc;
  }
  if (userCommentParts.length > 0) {
    exif[piexif.ExifIFD.UserComment] = `ASCII\0\0\0${userCommentParts.join(' | ')}`;
  }

  const parsedFrameNum = Number.parseInt(safeFrame, 10);
  if (Number.isFinite(parsedFrameNum) && parsedFrameNum >= 0 && piexif.ImageIFD.ImageNumber) {
    zeroth[piexif.ImageIFD.ImageNumber] = parsedFrameNum;
  }

  if (metadata.artist.trim()) {
    const safeArtist = toAsciiSafe(metadata.artist);
    if (safeArtist) {
      zeroth[piexif.ImageIFD.Artist] = safeArtist;
      zeroth[piexif.ImageIFD.Copyright] = safeArtist;
    }
  }

  const safeLens = toAsciiSafe(metadata.lens);
  if (safeLens) {
    const lensTag = piexif.ExifIFD.LensModel ?? 0xa434;
    exif[lensTag] = safeLens;
  }

  const parsedIso = Number.parseInt(metadata.iso.trim(), 10);
  if (Number.isFinite(parsedIso) && parsedIso > 0) {
    exif[piexif.ExifIFD.ISOSpeedRatings] = parsedIso;
  }

  const exifDateTime = resolveExifDateTime(metadata);
  if (exifDateTime) {
    zeroth[piexif.ImageIFD.DateTime] = exifDateTime;
    exif[piexif.ExifIFD.DateTimeOriginal] = exifDateTime;
    exif[piexif.ExifIFD.DateTimeDigitized] = exifDateTime;
  }

  const exifBytes = piexif.dump({ '0th': zeroth, Exif: exif });
  return piexif.insert(exifBytes, jpegDataUrl);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

export async function writeExifToJpegBlob(
  blob: Blob,
  metadata: PhotoMetadata,
): Promise<Blob> {
  try {
    const dataUrl = await blobToDataUrl(blob);
    const taggedDataUrl = writeExifToJpegDataUrl(dataUrl, metadata);
    return dataUrlToBlob(taggedDataUrl);
  } catch {
    return blob;
  }
}
