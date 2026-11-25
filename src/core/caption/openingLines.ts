import type { PhotoMetadata } from '../types';
import type { CaptionMoodId, CaptionMoodOption } from './types';

export const CAPTION_MOODS: CaptionMoodOption[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'stoic', label: 'Stoic' },
  { id: 'light', label: 'Light' },
  { id: 'street', label: 'Street' },
  { id: 'mechanical', label: 'Mechanical' },
  { id: 'night', label: 'Night' },
  { id: 'monochrome', label: 'B&W' },
];

type ConcreteMood = Exclude<CaptionMoodId, 'auto'>;

const OPENING_LINES_BY_MOOD: Record<ConcreteMood, string[]> = {
  stoic: [
    'Slowing down, one frame at a time.',
    'Stillness held in grain and shadow.',
    'Nothing rushed. Just silver and patience.',
    'Quiet moments resist the hurry of time.',
    'Less noise, more honest light.',
    'Measured breaths between shutter clicks.',
  ],
  light: [
    'Quiet light through vintage glass.',
    'Late afternoon light settles on celluloid.',
    'Warm shadows linger on 35mm grain.',
    'Soft sun, sharp glass, slow afternoon.',
    'Chasing quiet light across familiar streets.',
    'Light recorded the old-fashioned way.',
  ],
  street: [
    'Passing silhouettes, held still on 35mm.',
    'Unrehearsed geometry along quiet streets.',
    'Observed from the edge of the sidewalk.',
    'City rhythm slowed to one exposure.',
    'Brief encounters etched in silver halide.',
    'Ordinary corners framed with mechanical patience.',
  ],
  mechanical: [
    'Mechanical rhythm, captured on silver halide.',
    'Brass gears, manual focus, honest grain.',
    'No batteries required—only light and mechanics.',
    'Click, wind, wait for the darkroom.',
    'Precision metal meeting fleeting daylight.',
    'Purely mechanical, purposefully unhurried.',
  ],
  night: [
    'Tungsten glow bleeding into midnight grain.',
    'After-hours quiet, exposed one stop slow.',
    'Neon shadows held on cinema stock.',
    'Night air, wide aperture, steady hands.',
    'Late streets softened by halation and grain.',
    'Quiet hours framed under sodium light.',
  ],
  monochrome: [
    'Stripped to shadow, silver, and form.',
    'No color needed when light speaks clearly.',
    'Contrast and grain tell the quieter truth.',
    'Monochrome stillness on classic silver emulsion.',
    'Just highlights, shadows, and patient grain.',
    'Gray tones holding onto a quiet hour.',
  ],
};

export function inferMoodFromMetadata(metadata: PhotoMetadata): ConcreteMood {
  const film = metadata.filmStock.toLowerCase();
  const iso = Number.parseInt(metadata.iso.trim(), 10);

  if (/ilford|hp5|fp4|delta|xp2|tri-?x|acros|b&w|monochrome/.test(film)) {
    return 'monochrome';
  }
  if (/800t|500t|cinestill\s*800|tungsten/.test(film) || (Number.isFinite(iso) && iso >= 800)) {
    return 'night';
  }
  if (/praktica|nikon\s*f|leica|om-1|fm2|m42/.test(metadata.camera.toLowerCase())) {
    return 'mechanical';
  }
  if (/portra|gold|vision3\s*250d|ektar|colorplus/.test(film)) {
    return 'light';
  }
  return 'stoic';
}

export function pickOpeningLine(
  mood: CaptionMoodId,
  metadata: PhotoMetadata,
  excludeLine?: string,
  indexSeed?: number,
): string {
  const resolvedMood: ConcreteMood =
    mood === 'auto' ? inferMoodFromMetadata(metadata) : mood;
  const pool = OPENING_LINES_BY_MOOD[resolvedMood];
  const candidates = excludeLine
    ? pool.filter((line) => line !== excludeLine)
    : pool;
  const activePool = candidates.length > 0 ? candidates : pool;

  if (typeof indexSeed === 'number' && Number.isFinite(indexSeed)) {
    return activePool[Math.abs(Math.floor(indexSeed)) % activePool.length];
  }

  const idx = Math.floor(Math.random() * activePool.length);
  return activePool[idx];
}
