import { normalizeHashtag } from './hashtags';
import type { CaptionMoodId, CaptionPreferences } from './types';

const CAPTION_PREFS_STORAGE_KEY = 'analog_frame_caption_prefs_v1';
const MAX_CUSTOM_HASHTAGS = 20;

const VALID_MOODS: CaptionMoodId[] = [
  'auto',
  'stoic',
  'light',
  'street',
  'mechanical',
  'night',
  'monochrome',
];

export const DEFAULT_CAPTION_PREFERENCES: CaptionPreferences = {
  includeOpeningLine: false,
  includeScanner: false,
  mood: 'auto',
  customHashtags: [],
  geminiApiKey: '',
};

export function loadCaptionPreferences(): CaptionPreferences {
  try {
    if (typeof localStorage === 'undefined') {
      return { ...DEFAULT_CAPTION_PREFERENCES };
    }
    const raw = localStorage.getItem(CAPTION_PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CAPTION_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<CaptionPreferences>;

    const customHashtags = Array.isArray(parsed.customHashtags)
      ? parsed.customHashtags
          .map((tag) => (typeof tag === 'string' ? normalizeHashtag(tag) : ''))
          .filter(Boolean)
          .slice(0, MAX_CUSTOM_HASHTAGS)
      : [];

    const mood =
      typeof parsed.mood === 'string' &&
      VALID_MOODS.includes(parsed.mood as CaptionMoodId)
        ? (parsed.mood as CaptionMoodId)
        : 'auto';

    return {
      includeOpeningLine: Boolean(parsed.includeOpeningLine),
      includeScanner: Boolean(parsed.includeScanner),
      mood,
      customHashtags,
      geminiApiKey:
        typeof parsed.geminiApiKey === 'string' ? parsed.geminiApiKey.trim() : '',
    };
  } catch {
    return { ...DEFAULT_CAPTION_PREFERENCES };
  }
}

export function saveCaptionPreferences(prefs: CaptionPreferences): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(CAPTION_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export function rememberCustomHashtag(
  prefs: CaptionPreferences,
  rawTag: string,
): CaptionPreferences {
  const normalized = normalizeHashtag(rawTag);
  if (!normalized) return prefs;
  const nextList = [
    normalized,
    ...prefs.customHashtags.filter((tag) => tag !== normalized),
  ].slice(0, MAX_CUSTOM_HASHTAGS);
  const next = { ...prefs, customHashtags: nextList };
  saveCaptionPreferences(next);
  return next;
}
