import type { GearHistory, PhotoMetadata } from '../types';

const STORAGE_KEY = 'analog_frame_gear_history_v1';
const WATERMARK_STORAGE_KEY = 'analog_frame_watermark_text_v1';
const MAX_ITEMS_PER_LIST = 12;

const EMPTY_HISTORY: GearHistory = {
  cameras: [],
  lenses: [],
  scanners: [],
  filmStocks: [],
  artists: [],
};

function sanitizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, MAX_ITEMS_PER_LIST);
}

function pushUnique(list: string[], value: string): string[] {
  const clean = value.trim();
  if (!clean) return list;
  const filtered = list.filter((item) => item.toLowerCase() !== clean.toLowerCase());
  return [clean, ...filtered].slice(0, MAX_ITEMS_PER_LIST);
}

export function loadGearHistory(): GearHistory {
  try {
    if (typeof localStorage === 'undefined') return { ...EMPTY_HISTORY };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_HISTORY };
    const parsed = JSON.parse(raw) as Partial<GearHistory>;
    return {
      cameras: sanitizeList(parsed.cameras),
      lenses: sanitizeList(parsed.lenses),
      scanners: sanitizeList(parsed.scanners),
      filmStocks: sanitizeList(parsed.filmStocks),
      artists: sanitizeList(parsed.artists),
    };
  } catch {
    return { ...EMPTY_HISTORY };
  }
}

export function saveGearHistory(history: GearHistory): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export function recordMetadataInGearHistory(
  current: GearHistory,
  metadata: Partial<PhotoMetadata>,
): GearHistory {
  const next: GearHistory = {
    cameras: metadata.camera ? pushUnique(current.cameras, metadata.camera) : current.cameras,
    lenses: metadata.lens ? pushUnique(current.lenses, metadata.lens) : current.lenses,
    scanners: metadata.scanner
      ? pushUnique(current.scanners, metadata.scanner)
      : current.scanners,
    filmStocks: metadata.filmStock
      ? pushUnique(current.filmStocks, metadata.filmStock)
      : current.filmStocks,
    artists: metadata.artist ? pushUnique(current.artists, metadata.artist) : current.artists,
  };
  saveGearHistory(next);
  return next;
}

export function loadSavedWatermarkText(fallback: string): string {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const saved = localStorage.getItem(WATERMARK_STORAGE_KEY);
    if (saved !== null && saved.trim().length > 0) {
      return saved;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function saveWatermarkText(text: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const clean = text.trim();
    if (clean.length > 0) {
      localStorage.setItem(WATERMARK_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(WATERMARK_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota or private-mode errors
  }
}
