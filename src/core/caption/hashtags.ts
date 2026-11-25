import type { PhotoMetadata, TemplateId } from '../types';

export const CORE_ANALOG_HASHTAGS: string[] = [
  '#35mmfilm',
  '#analogphotography',
  '#filmphotography',
  '#vintagecamera',
  '#mechanicalcamera',
  '#believeinfilm',
  '#filmcommunity',
];

export const CORE_DIGITAL_HASHTAGS: string[] = [
  '#photography',
  '#digitalphotography',
  '#streetphotography',
  '#visualstorytelling',
  '#lightandshadow',
  '#minimalphotography',
  '#photocommunity',
];

const FILM_HASHTAG_MAP: Array<[RegExp, string]> = [
  [/ilford\s+hp5/i, '#ilfordhp5'],
  [/ilford\s+fp4/i, '#ilfordfp4'],
  [/ilford\s+delta\s*400/i, '#ilforddelta400'],
  [/ilford\s+xp2/i, '#ilfordxp2'],
  [/kodak\s+vision3/i, '#kodakvision3'],
  [/kodak\s+portra\s*400/i, '#kodakportra400'],
  [/kodak\s+portra\s*160/i, '#kodakportra160'],
  [/kodak\s+portra\s*800/i, '#kodakportra800'],
  [/kodak\s+gold\s*200/i, '#kodakgold200'],
  [/kodak\s+ultramax/i, '#kodakultramax400'],
  [/kodak\s+colorplus/i, '#kodakcolorplus200'],
  [/kodak\s+ektar/i, '#kodakektar100'],
  [/kodak\s+tri-?x/i, '#kodaktrix400'],
  [/fuji(?:film)?\s+superia/i, '#fujisuperia400'],
  [/fuji(?:film)?\s+c200/i, '#fujic200'],
  [/fuji(?:film)?\s+pro\s*400h/i, '#fujipro400h'],
  [/fuji(?:film)?\s+.*acros/i, '#fujiacros100'],
  [/cinestill\s*800t/i, '#cinestill800t'],
  [/cinestill\s*400d/i, '#cinestill400d'],
  [/harman\s+phoenix/i, '#harmanphoenix200'],
];

export function normalizeHashtag(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^#+/, '')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
  return cleaned ? `#${cleaned}` : '';
}

function dedupeHashtags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const normalized = normalizeHashtag(tag);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

export function buildFilmHashtag(filmStock: string): string {
  const clean = filmStock.trim();
  if (!clean) return '';

  for (const [pattern, tag] of FILM_HASHTAG_MAP) {
    if (pattern.test(clean)) return tag;
  }

  return normalizeHashtag(clean);
}

export function buildCameraHashtags(
  camera: string,
  templateId?: TemplateId,
): string[] {
  const clean = camera.trim();
  const isHalfFrameTemplate =
    templateId === 'half-frame-single' || templateId === 'half-frame-diptych';

  if (/praktica\s*fx/i.test(clean)) {
    return ['#praktica', '#prakticafx', '#m42lens', '#waistlevelfinder', '#vintageslr'];
  }
  if (/praktica|m42|zenit|spotmatic/i.test(clean)) {
    const slug = normalizeHashtag(clean);
    return dedupeHashtags([
      slug,
      '#praktica',
      '#m42lens',
      '#vintageslr',
      '#waistlevelfinder',
    ]).slice(0, 5);
  }
  if (/nikon\s*f3/i.test(clean)) {
    return ['#nikonf3', '#nikonanalog', '#nikkorlens', '#nikonfilm'];
  }
  if (/pentax\s*17/i.test(clean)) {
    return ['#pentax17', '#halfframe', '#halfframecamera', '#pentaxfilm'];
  }
  if (
    /half[\s-]?frame|olympus\s*pen|canon\s*demi|konica\s*recorder/i.test(clean) ||
    isHalfFrameTemplate
  ) {
    const slug = normalizeHashtag(clean);
    return dedupeHashtags([
      slug,
      '#halfframe',
      '#halfframecamera',
      '#35mmhalfframe',
    ]).slice(0, 4);
  }

  if (!clean) {
    return ['#35mm', '#shootfilm', '#filmisnotdead'];
  }

  const slug = normalizeHashtag(clean);
  const brand = clean.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const brandTags: string[] = [];

  if (brand === 'nikon') {
    brandTags.push('#nikonanalog', '#nikkorlens', '#nikonfilm');
  } else if (brand === 'pentax') {
    brandTags.push('#pentaxfilm', '#pentaxanalog', '#vintageslr');
  } else if (brand === 'leica') {
    brandTags.push('#leicafilm', '#rangefinder', '#leicacamera');
  } else if (brand === 'olympus') {
    brandTags.push('#olympusfilm', '#olympusanalog', '#vintageslr');
  } else if (brand === 'canon') {
    brandTags.push('#canonfilm', '#canonanalog', '#vintageslr');
  } else if (brand === 'contax') {
    brandTags.push('#contaxfilm', '#contaxanalog', '#zeisslens');
  } else if (brand === 'minolta') {
    brandTags.push('#minoltafilm', '#minoltaanalog', '#vintageslr');
  } else if (brand === 'hasselblad' || brand === 'mamiya' || brand === 'rollei') {
    brandTags.push(`#${brand}`, '#mediumformat', '#120film');
  } else if (brand) {
    brandTags.push(`#${brand}film`, '#35mmcamera', '#filmisnotdead');
  }

  return dedupeHashtags([slug, ...brandTags]).slice(0, 4);
}

export function buildDigitalCameraHashtags(camera: string): string[] {
  const clean = camera.trim();
  if (!clean) {
    return ['#digitalcamera', '#rawphotography', '#streetshot'];
  }

  const slug = normalizeHashtag(clean);
  const lower = clean.toLowerCase();
  const brandTags: string[] = [];

  if (/iphone/.test(lower)) {
    brandTags.push('#shotoniphone', '#iphonephotography', '#mobilephotography');
  } else if (/pixel/.test(lower)) {
    brandTags.push('#teampixel', '#pixelphotography', '#mobilephotography');
  } else if (/sony|ilce/.test(lower)) {
    brandTags.push('#sonyalpha', '#sonyphotography', '#mirrorless');
  } else if (/fuji/.test(lower)) {
    brandTags.push('#fujifilm', '#fujixseries', '#fujilove');
  } else if (/ricoh/.test(lower)) {
    brandTags.push('#ricohgr', '#grsnaps', '#streetcamera');
  } else if (/leica/.test(lower)) {
    brandTags.push('#leicacamera', '#leicaphotography', '#rangefinder');
  } else if (/canon/.test(lower)) {
    brandTags.push('#canonphotography', '#canonr', '#mirrorless');
  } else if (/nikon/.test(lower)) {
    brandTags.push('#nikonphotography', '#nikonz', '#mirrorless');
  } else {
    brandTags.push('#digitalcamera', '#mirrorless', '#rawphotography');
  }

  return dedupeHashtags([slug, ...brandTags]).slice(0, 4);
}

/**
 * Generates 8 to 12 curated hashtags tailored to Film (@flk.analog) or Digital mode.
 */
export function buildDefaultHashtags(
  metadata: PhotoMetadata,
  templateId?: TemplateId,
): string[] {
  if (metadata.mode === 'digital') {
    const cameraTags = buildDigitalCameraHashtags(metadata.camera);
    const coreLimit = Math.max(5, Math.min(7, 12 - cameraTags.length));
    const coreTags = CORE_DIGITAL_HASHTAGS.slice(0, coreLimit);
    return dedupeHashtags([...coreTags, ...cameraTags]).slice(0, 12);
  }

  const cameraTags = buildCameraHashtags(metadata.camera, templateId);
  const filmTag = buildFilmHashtag(metadata.filmStock);

  const nonCoreCount = cameraTags.length + (filmTag ? 1 : 0);
  const coreLimit = Math.max(5, Math.min(7, 12 - nonCoreCount));
  const coreTags = CORE_ANALOG_HASHTAGS.slice(0, coreLimit);

  return dedupeHashtags([
    ...coreTags,
    ...cameraTags,
    ...(filmTag ? [filmTag] : []),
  ]).slice(0, 12);
}

export function extractHashtagsFromText(text: string): string[] {
  const matches = text.match(/#[a-zA-Z0-9_]+/g) ?? [];
  return dedupeHashtags(matches);
}
