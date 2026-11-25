import { describe, it, expect, beforeEach } from 'vitest';
import type { PhotoMetadata } from '../types';
import { formatInstagramCaption, syncHashtagsInCaptionText } from './generator';
import {
  buildCameraHashtags,
  buildDefaultHashtags,
  buildFilmHashtag,
  extractHashtagsFromText,
  normalizeHashtag,
} from './hashtags';
import { inferMoodFromMetadata, pickOpeningLine } from './openingLines';
import {
  DEFAULT_CAPTION_PREFERENCES,
  loadCaptionPreferences,
  rememberCustomHashtag,
  saveCaptionPreferences,
} from './storage';

const BASE_META: PhotoMetadata = {
  mode: 'film',
  camera: 'Pentax 17',
  lens: '25mm F3.5',
  scanner: 'Noritsu HS-1800',
  filmStock: 'Ilford HP5 Plus 400',
  iso: '400',
  focalLength: '',
  aperture: '',
  shutterSpeed: '',
  date: '2026-09-13',
  exifDateTime: '2026:09:13 12:00:00',
  artist: '',
  frameNumber: '17A',
  caption: '',
};

const DIGITAL_META: PhotoMetadata = {
  mode: 'digital',
  camera: 'Sony A7C II',
  lens: 'FE 35mm F1.4 GM',
  scanner: '',
  filmStock: '',
  iso: '400',
  focalLength: '35mm',
  aperture: 'f/1.4',
  shutterSpeed: '1/500s',
  date: '2026-09-13',
  exifDateTime: '2026:09:13 12:00:00',
  artist: '',
  frameNumber: '',
  caption: '',
};

describe('caption hashtags rules (@flk.analog)', () => {
  it('generates camera-specific hashtags for Praktica FX, Nikon F3, and Pentax 17', () => {
    expect(buildCameraHashtags('Praktica FX')).toEqual([
      '#praktica',
      '#prakticafx',
      '#m42lens',
      '#waistlevelfinder',
      '#vintageslr',
    ]);
    expect(buildCameraHashtags('Nikon F3')).toEqual([
      '#nikonf3',
      '#nikonanalog',
      '#nikkorlens',
      '#nikonfilm',
    ]);
    expect(buildCameraHashtags('Pentax 17')).toEqual([
      '#pentax17',
      '#halfframe',
      '#halfframecamera',
      '#pentaxfilm',
    ]);
  });

  it('produces 8 to 12 deduplicated hashtags including core, camera, and film tags', () => {
    const tags = buildDefaultHashtags(BASE_META, 'half-frame-single');
    expect(tags.length).toBeGreaterThanOrEqual(8);
    expect(tags.length).toBeLessThanOrEqual(12);
    expect(tags).toContain('#35mmfilm');
    expect(tags).toContain('#pentax17');
    expect(tags).toContain('#halfframe');
    expect(tags).toContain('#ilfordhp5');
    expect(new Set(tags).size).toBe(tags.length);
  });

  it('maps film stock names to concise hashtags and normalizes custom tags', () => {
    expect(buildFilmHashtag('Kodak Vision3 250D')).toBe('#kodakvision3');
    expect(buildFilmHashtag('Ilford HP5 Plus 400')).toBe('#ilfordhp5');
    expect(normalizeHashtag('  Bangkok Street! ')).toBe('#bangkokstreet');
    expect(extractHashtagsFromText('Camera: Pentax 17\n\n#35mmfilm #Pentax17')).toEqual([
      '#35mmfilm',
      '#pentax17',
    ]);
  });
});

describe('formatInstagramCaption & syncHashtagsInCaptionText', () => {
  it('formats caption cleanly without opening line and omits blank lens/scanner by default', () => {
    const caption = formatInstagramCaption({
      openingLine: 'Quiet light through vintage glass.',
      includeOpeningLine: false,
      includeScanner: false,
      metadata: { ...BASE_META, lens: '' },
      hashtags: ['#35mmfilm', '#pentax17', '#ilfordhp5'],
    });

    expect(caption).toBe(
      'Camera: Pentax 17\nFilm: Ilford HP5 Plus 400\n\n#35mmfilm #pentax17 #ilfordhp5',
    );
  });

  it('includes opening line, lens, and optional scanner when toggled on', () => {
    const caption = formatInstagramCaption({
      openingLine: 'Quiet light through vintage glass.',
      includeOpeningLine: true,
      includeScanner: true,
      metadata: BASE_META,
      hashtags: ['#35mmfilm', '#pentax17'],
    });

    expect(caption).toBe(
      'Quiet light through vintage glass.\n\nCamera: Pentax 17\nLens: 25mm F3.5\nFilm: Ilford HP5 Plus 400\nScanner: Noritsu HS-1800\n\n#35mmfilm #pentax17',
    );
  });

  it('updates trailing hashtag block without overwriting manual prose edits', () => {
    const edited = 'Custom note from Bangkok.\n\nCamera: Nikon F3\nFilm: Kodak Gold 200\n\n#35mmfilm #nikonf3';
    const synced = syncHashtagsInCaptionText(edited, ['#35mmfilm', '#nikonf3', '#bangkokfilm']);
    expect(synced).toBe(
      'Custom note from Bangkok.\n\nCamera: Nikon F3\nFilm: Kodak Gold 200\n\n#35mmfilm #nikonf3 #bangkokfilm',
    );
  });

  it('formats digital mode captions with Settings and digital hashtags without film tags', () => {
    const tags = buildDefaultHashtags(DIGITAL_META, 'minimal-matte');
    expect(tags.length).toBeGreaterThanOrEqual(8);
    expect(tags.length).toBeLessThanOrEqual(12);
    expect(tags).toContain('#digitalphotography');
    expect(tags).toContain('#sonyalpha');
    expect(tags).not.toContain('#35mmfilm');

    const caption = formatInstagramCaption({
      openingLine: 'Quiet frames after dusk.',
      includeOpeningLine: false,
      includeScanner: true,
      metadata: DIGITAL_META,
      hashtags: tags.slice(0, 3),
    });

    expect(caption).toBe(
      `Camera: Sony A7C II\nLens: FE 35mm F1.4 GM\nSettings: 35mm · f/1.4 · 1/500s · ISO 400\n\n${tags.slice(0, 3).join(' ')}`,
    );
  });
});

describe('openingLines & caption storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('infers monochrome/night moods and avoids repeating excluded line on shuffle', () => {
    expect(inferMoodFromMetadata(BASE_META)).toBe('monochrome');
    expect(inferMoodFromMetadata({ ...BASE_META, filmStock: 'CineStill 800T', iso: '800' })).toBe('night');

    const first = pickOpeningLine('stoic', BASE_META, undefined, 0);
    const next = pickOpeningLine('stoic', BASE_META, first, 0);
    expect(next).not.toBe(first);
  });

  it('persists preferences (opening line OFF by default) and custom hashtags in localStorage', () => {
    expect(loadCaptionPreferences()).toEqual(DEFAULT_CAPTION_PREFERENCES);
    expect(DEFAULT_CAPTION_PREFERENCES.includeOpeningLine).toBe(false);
    expect(DEFAULT_CAPTION_PREFERENCES.includeScanner).toBe(false);

    let prefs = loadCaptionPreferences();
    prefs = rememberCustomHashtag(prefs, 'flkanalog');
    prefs = { ...prefs, includeOpeningLine: true, includeScanner: true, mood: 'street' };
    saveCaptionPreferences(prefs);

    const loaded = loadCaptionPreferences();
    expect(loaded.includeOpeningLine).toBe(true);
    expect(loaded.includeScanner).toBe(true);
    expect(loaded.mood).toBe('street');
    expect(loaded.customHashtags).toEqual(['#flkanalog']);
  });
});
