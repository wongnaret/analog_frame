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

function parseFilmAndEiFromText(text: string): { filmStock: string; ei: string } {
  if (!text) return { filmStock: '', ei: '' };

  // Matches fix_exif.ps1 format: "Film: Ilford HP5 Plus 400 | EI: 400"
  const pipeMatch = text.match(/Film:\s*([^|\r\n]+?)(?:\s*\|\s*EI:\s*(\d+))?$/im);
  if (pipeMatch) {
    return {
      filmStock: pipeMatch[1].trim(),
      ei: pipeMatch[2]?.trim() ?? '',
    };
  }

  const filmOnly = text.match(/Film:\s*([^\r\n|]+)/i);
  const eiOnly = text.match(/\bEI:\s*(\d+)/i);
  return {
    filmStock: filmOnly ? filmOnly[1].trim() : '',
    ei: eiOnly ? eiOnly[1].trim() : '',
  };
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

const KNOWN_SCANNER_PATTERN =
  /noritsu|frontier|sp-?3000|sp-?2000|sp-?500|ez controller|qss|pakon|plustek|coolscan|flextight|imacon|epson|silverfast|vuescan/i;

function extractScannerFromSoftware(softwareRaw: unknown): string {
  const software = cleanString(softwareRaw);
  if (!software || /^analog frame$/i.test(software)) return '';
  return KNOWN_SCANNER_PATTERN.test(software) ? software : '';
}

export function parseAnalogExif(
  raw: Record<string, unknown> | null | undefined,
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
  for (const candidate of descriptionCandidates) {
    const parsed = parseFilmAndEiFromText(candidate);
    if (parsed.filmStock && !filmStock) filmStock = parsed.filmStock;
    if (parsed.ei && !eiFromText) eiFromText = parsed.ei;
  }

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
      frameNumber: '',
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
    },
  };
}
