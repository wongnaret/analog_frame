import type { ExifDetectedFlags, PhotoMetadata } from '../types';

export interface ParsedExifResult {
  metadata: PhotoMetadata;
  detected: ExifDetectedFlags;
}

function cleanString(value: unknown): string {
  if (typeof value === 'string') {
    return value.replace(/\0+$/g, '').trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (value && typeof value === 'object' && 'value' in value) {
    return cleanString((value as { value: unknown }).value);
  }
  return '';
}

function decodeUserComment(value: unknown): string {
  if (typeof value === 'string') {
    return value.replace(/^ASCII\0*/i, '').replace(/\0+$/g, '').trim();
  }
  if (value instanceof Uint8Array) {
    let bytes = value;
    // Strip standard 8-byte EXIF UserComment encoding prefix (ASCII\0\0\0 / UNICODE\0)
    if (bytes.length >= 8) {
      const prefix = String.fromCharCode(...bytes.slice(0, 5));
      if (prefix === 'ASCII' || prefix === 'UNICO') {
        bytes = bytes.slice(8);
      }
    }
    try {
      return new TextDecoder('utf-8').decode(bytes).replace(/\0+$/g, '').trim();
    } catch {
      return '';
    }
  }
  return cleanString(value);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatExifDate(value: unknown): { date: string; exifDateTime: string } {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = pad2(value.getMonth() + 1);
    const d = pad2(value.getDate());
    const hh = pad2(value.getHours());
    const mm = pad2(value.getMinutes());
    const ss = pad2(value.getSeconds());
    return {
      date: `${y}-${m}-${d}`,
      exifDateTime: `${y}:${m}:${d} ${hh}:${mm}:${ss}`,
    };
  }

  const raw = cleanString(value);
  if (!raw) return { date: '', exifDateTime: '' };

  const match = raw.match(
    /^(\d{4})[:-](\d{1,2})[:-](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/,
  );
  if (!match) return { date: '', exifDateTime: '' };

  const y = match[1];
  const m = pad2(Number(match[2]));
  const d = pad2(Number(match[3]));
  const hh = pad2(Number(match[4] ?? 12));
  const mm = pad2(Number(match[5] ?? 0));
  const ss = pad2(Number(match[6] ?? 0));

  return {
    date: `${y}-${m}-${d}`,
    exifDateTime: `${y}:${m}:${d} ${hh}:${mm}:${ss}`,
  };
}

function combineCameraName(makeRaw: unknown, modelRaw: unknown): string {
  const make = cleanString(makeRaw);
  const model = cleanString(modelRaw);
  if (!make && !model) return '';
  if (!make) return model;
  if (!model) return make;
  if (model.toLowerCase().startsWith(make.toLowerCase())) {
    return model;
  }
  return `${make} ${model}`;
}

function parseFilmAndEiFromText(text: string): {
  filmStock: string;
  ei: string;
  frameNumber: string;
} {
  if (!text) return { filmStock: '', ei: '', frameNumber: '' };

  const filmMatch = text.match(/Film:\s*([^|\r\n]+)/i);
  const eiMatch = text.match(/\bEI:\s*(\d+)/i);
  const frameMatch = text.match(/\bFrame:\s*#?(\d{1,3}[A-Z]?)\b/i);

  return {
    filmStock: filmMatch ? filmMatch[1].trim() : '',
    ei: eiMatch ? eiMatch[1].trim() : '',
    frameNumber: frameMatch ? frameMatch[1].trim().toUpperCase() : '',
  };
}

function normalizeFrameNumber(raw: unknown): string {
  const clean = cleanString(raw).replace(/^#/, '').toUpperCase();
  if (!clean) return '';
  if (/^\d{1,3}[A-Z]?$/.test(clean)) {
    return clean;
  }
  return '';
}

export function extractFrameNumberFromFileName(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, '').trim();
  if (!stem) return '';

  // Explicit "frame_05A" or "frame-12"
  const explicit = stem.match(/frame[-_\s]*0*(\d{1,2}[A-Z]?)\b/i);
  if (explicit) {
    return explicit[1].padStart(explicit[1].match(/[A-Z]/i) ? 3 : 2, '0').toUpperCase();
  }

  // Standalone frame name like "05.jpg" or "17A.jpg"
  if (/^\d{1,2}[A-Z]?$/i.test(stem)) {
    return stem.toUpperCase();
  }

  // Avoid mistaking timestamps like "20260913_143005" for frame numbers
  if (/(?:^|[-_])(?:19|20)\d{6}[-_]\d{6}$/.test(stem)) {
    return '';
  }

  // Trailing separator frame number like "roll01_14A" or "4140_07"
  const trailingSep = stem.match(/[-_](\d{1,3}[A-Z]?)$/i);
  if (trailingSep) {
    const token = trailingSep[1].toUpperCase();
    // Ignore 3-digit tokens >= 100 unless 0-padded like 017
    if (token.length <= 2 || /^0\d{2}[A-Z]?$/.test(token) || /^\d{1,2}[A-Z]$/.test(token)) {
      return token.replace(/^0(\d{2}[A-Z]?)$/, '$1');
    }
  }

  // Lab scan numeric filename (e.g. Noritsu/Frontier "000041400017.jpg" -> "17")
  if (!/^(?:19|20)\d{6}/.test(stem)) {
    const labMatch = stem.match(/^\d{6,10}?(\d{2}[A-Z]?)$/i);
    if (labMatch) {
      return labMatch[1].toUpperCase();
    }
  }

  return '';
}

export function incrementFrameNumber(frameNumber: string): string {
  const clean = frameNumber.trim().toUpperCase();
  if (!clean) return '02A';

  const match = clean.match(/^(\d+)([A-Z]*)$/);
  if (!match) return clean;

  const numStr = match[1];
  const suffix = match[2];
  const nextNum = Number.parseInt(numStr, 10) + 1;
  const padded = String(nextNum).padStart(numStr.length, '0');
  return `${padded}${suffix}`;
}

export function splitCameraMakeModel(camera: string): { make: string; model: string } {
  const trimmed = camera.trim();
  if (!trimmed) return { make: '', model: '' };
  const match = trimmed.match(/^([^\s]+)\s+(.+)$/);
  if (match) {
    return { make: match[1], model: match[2] };
  }
  return { make: trimmed, model: trimmed };
}

export function buildExifFilmDescription(filmStock: string, iso: string): string {
  const cleanFilm = filmStock.trim();
  const cleanIso = iso.trim();
  if (cleanFilm && cleanIso) return `Film: ${cleanFilm} | EI: ${cleanIso}`;
  if (cleanFilm) return `Film: ${cleanFilm}`;
  if (cleanIso) return `EI: ${cleanIso}`;
  return '';
}

export const DEFAULT_SCANNER = 'Noritsu HS-1800';

const KNOWN_SCANNER_PATTERN =
  /noritsu|frontier|sp-?3000|sp-?2000|sp-?500|ez controller|qss|pakon|plustek|coolscan|flextight|imacon|epson|silverfast|vuescan/i;

const NORITSU_GENERIC_PATTERN =
  /(?:^|\b)(?:ez controller|noritsu(?:\s+koki)?)(?:\b|$)/i;
const NORITSU_EXPLICIT_MODEL_PATTERN =
  /\b(?:hs-\d+|ls-\d+|qss[-\s]?\d+|s-\d+)\b/i;

function extractScannerFromSoftware(softwareRaw: unknown): string {
  const software = cleanString(softwareRaw);
  if (!software || /^analog frame$/i.test(software)) return '';
  if (!KNOWN_SCANNER_PATTERN.test(software)) return '';

  if (
    NORITSU_GENERIC_PATTERN.test(software) &&
    !NORITSU_EXPLICIT_MODEL_PATTERN.test(software)
  ) {
    return DEFAULT_SCANNER;
  }

  return software;
}

export function parseAnalogExif(
  raw: Record<string, unknown> | null | undefined,
  fileName?: string,
): ParsedExifResult {
  const data = raw ?? {};

  const camera = combineCameraName(data.Make ?? data.make, data.Model ?? data.model);
  const lens = cleanString(data.LensModel ?? data.Lens ?? data.lensModel ?? data.lens);
  const scanner = extractScannerFromSoftware(data.Software ?? data.software);

  const descriptionCandidates = [
    cleanString(data.ImageDescription),
    cleanString(data.description),
    cleanString(data.Description),
    decodeUserComment(data.UserComment ?? data.userComment),
  ].filter(Boolean);

  let filmStock = '';
  let eiFromText = '';
  let frameFromText = '';
  for (const candidate of descriptionCandidates) {
    const parsed = parseFilmAndEiFromText(candidate);
    if (parsed.filmStock && !filmStock) filmStock = parsed.filmStock;
    if (parsed.ei && !eiFromText) eiFromText = parsed.ei;
    if (parsed.frameNumber && !frameFromText) frameFromText = parsed.frameNumber;
  }

  const frameFromTag =
    normalizeFrameNumber(data.ImageNumber) ||
    normalizeFrameNumber(data.FrameNumber) ||
    normalizeFrameNumber(data.frameNumber) ||
    normalizeFrameNumber(data.SequenceNumber) ||
    normalizeFrameNumber(data.ImageUniqueID);

  const frameNumber =
    frameFromTag ||
    frameFromText ||
    (fileName ? extractFrameNumberFromFileName(fileName) : '');
  const frameDetectedFromExif = Boolean(frameFromTag || frameFromText);

  const rawIso =
    data.ISO ??
    data.ISOSpeedRatings ??
    data.PhotographicSensitivity ??
    data.iso;
  const isoValue = cleanString(Array.isArray(rawIso) ? rawIso[0] : rawIso) || eiFromText;

  const { date, exifDateTime } = formatExifDate(
    data.DateTimeOriginal ?? data.CreateDate ?? data.ModifyDate ?? data.DateTime,
  );

  const artist = cleanString(data.Artist ?? data.Creator ?? data.Copyright);

  return {
    metadata: {
      camera,
      lens,
      scanner,
      filmStock,
      iso: isoValue,
      date,
      exifDateTime,
      artist,
      frameNumber,
      caption: '',
    },
    detected: {
      camera: Boolean(camera),
      lens: Boolean(lens),
      scanner: Boolean(scanner),
      filmStock: Boolean(filmStock),
      iso: Boolean(isoValue),
      date: Boolean(date),
      artist: Boolean(artist),
      frameNumber: frameDetectedFromExif,
    },
  };
}
