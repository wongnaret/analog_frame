import { loadImageElement } from '../export/exporter';
import { formatInstagramCaption } from './generator';
import { buildDefaultHashtags, extractHashtagsFromText } from './hashtags';
import type { GenerateAiCaptionParams } from './types';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_INSTRUCTION = `You are an AI assistant integrated into a film photography framing app for the Instagram account @flk.analog. Your task is to generate a minimalist, cool, and vintage-toned Instagram caption along with curated hashtags based on the user's photo and camera metadata.

Tone & Style:
- Mood: Stoic, cool, vintage, minimalist, and appreciative of mechanical/analog photography.
- Language: English (concise and poetic, avoiding clichés, excessive emojis, or overly chatty remarks).

Hashtag Selection Rules (Instagram max 5 hashtags — keep them sharp and high-signal):
1. Select AT MOST 5 hashtags total (never exceed 5).
2. Film mode mix: 2 core analog tags (e.g. #35mmfilm #analogphotography) + 2 sharp camera/format tags (e.g. #pentax17 #halfframe, #nikonf3 #nikkorlens, #prakticafx #m42lens) + 1 specific film stock tag if provided (e.g. #ilfordhp5, #kodakvision3).
3. Digital mode mix: 3 sharp photography/mood tags (e.g. #streetphotography #digitalphotography #lightandshadow) + 2 camera/brand tags (e.g. #sonya7cii #sonyalpha).

Constraints:
- Do NOT include conversational filler (e.g., "Here is your caption:"). Output ONLY the ready-to-copy caption block.
- Keep the opening line grounded and understated (max 10 words, e.g. "Mechanical rhythm, captured on silver halide.", "Quiet light through vintage glass.", "Slowing down, one frame at a time.").`;

async function downscalePhotoToBase64Jpeg(
  objectUrl: string,
  maxSide = 512,
): Promise<string> {
  const img = await loadImageElement(objectUrl);
  const ratio = Math.min(1, maxSide / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const width = Math.max(1, Math.round((img.naturalWidth || 512) * ratio));
  const height = Math.max(1, Math.round((img.naturalHeight || 512) * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to prepare image for AI analysis');
  }
  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
  return dataUrl.split(',')[1] ?? '';
}

export interface AiCaptionResult {
  text: string;
  openingLine: string;
  hashtags: string[];
}

export async function generateCaptionWithGemini({
  apiKey,
  objectUrl,
  metadata,
  templateId,
  contextNote,
  includeOpeningLine,
  includeScanner,
}: GenerateAiCaptionParams): Promise<AiCaptionResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Please enter your Gemini API key in AI Settings first.');
  }

  const imageBase64 = await downscalePhotoToBase64Jpeg(objectUrl, 512);

  const isDigital = metadata.mode === 'digital';
  const digitalSettings = [
    metadata.focalLength?.trim() ?? '',
    metadata.aperture?.trim() ?? '',
    metadata.shutterSpeed?.trim() ?? '',
    metadata.iso.trim() ? `ISO ${metadata.iso.trim()}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const lines = isDigital
    ? [
      `Mode: Digital photography`,
      `Camera: ${metadata.camera.trim() || 'Unknown'}`,
      metadata.lens.trim() ? `Lens: ${metadata.lens.trim()}` : 'Lens: (omit line)',
      digitalSettings ? `Settings: ${digitalSettings}` : '',
      contextNote.trim() ? `Photo Context/Vibe: ${contextNote.trim()}` : '',
      includeOpeningLine
        ? 'Include 1 short minimalist opening line (max 10 words) matching the attached photo before the metadata block.'
        : 'Omit the opening line; start directly with Camera:.',
      'Use exactly 5 sharp digital/street/minimal photography hashtags (max 5, avoid 35mm film hashtags). Output ONLY the ready-to-copy Instagram caption block.',
    ].filter(Boolean)
    : [
      `Camera: ${metadata.camera.trim() || 'Unknown'}`,
      metadata.lens.trim() ? `Lens: ${metadata.lens.trim()}` : 'Lens: (omit line)',
      `Film Stock: ${metadata.filmStock.trim() || 'Unknown'}`,
      includeScanner && metadata.scanner?.trim()
        ? `Scanner: ${metadata.scanner.trim()}`
        : 'Scanner: (omit line)',
      contextNote.trim() ? `Photo Context/Vibe: ${contextNote.trim()}` : '',
      includeOpeningLine
        ? 'Include 1 short evocative opening line (max 10 words) matching the attached photo before the metadata block.'
        : 'Omit the opening line; start directly with Camera:.',
      'Output ONLY the ready-to-copy Instagram caption block with up to 5 sharp hashtags on the final line (max 5).',
    ].filter(Boolean);

  const response = await fetch(
    `${GEMINI_ENDPOINT}?key=${encodeURIComponent(cleanKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
              { text: lines.join('\n') },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 300,
        },
      }),
    },
  );

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errJson = (await response.json()) as { error?: { message?: string } };
      if (errJson.error?.message) detail = errJson.error.message;
    } catch {
      // ignore json parse failure
    }
    throw new Error(`Gemini API error: ${detail}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const rawText =
    payload.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('')
      .trim() ?? '';

  if (!rawText) {
    throw new Error('Gemini returned an empty response.');
  }

  const parsedHashtags = extractHashtagsFromText(rawText);
  const hashtags =
    parsedHashtags.length >= 3
      ? parsedHashtags.slice(0, 5)
      : buildDefaultHashtags(metadata, templateId);

  const firstParagraph = rawText.split(/\n\s*\n/)[0]?.trim() ?? '';
  const looksLikeOpeningLine =
    includeOpeningLine &&
    Boolean(firstParagraph) &&
    !/^(Camera|Lens|Film|Scanner):/i.test(firstParagraph) &&
    !firstParagraph.startsWith('#');

  const openingLine = looksLikeOpeningLine ? firstParagraph : '';
  const normalizedText = formatInstagramCaption({
    openingLine,
    includeOpeningLine,
    includeScanner,
    metadata,
    hashtags,
  });

  return {
    text: normalizedText,
    openingLine,
    hashtags,
  };
}
