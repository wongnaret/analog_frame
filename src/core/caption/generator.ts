import { normalizeHashtag } from './hashtags';
import type { FormatCaptionParams } from './types';

export function formatInstagramCaption({
  openingLine,
  includeOpeningLine,
  includeScanner,
  metadata,
  hashtags,
}: FormatCaptionParams): string {
  const sections: string[] = [];

  if (includeOpeningLine && openingLine.trim()) {
    sections.push(openingLine.trim());
  }

  const specLines: string[] = [];
  if (metadata.camera.trim()) {
    specLines.push(`Camera: ${metadata.camera.trim()}`);
  }
  if (metadata.lens.trim()) {
    specLines.push(`Lens: ${metadata.lens.trim()}`);
  }
  if (metadata.filmStock.trim()) {
    specLines.push(`Film: ${metadata.filmStock.trim()}`);
  }
  if (includeScanner && metadata.scanner?.trim()) {
    specLines.push(`Scanner: ${metadata.scanner.trim()}`);
  }

  if (specLines.length > 0) {
    sections.push(specLines.join('\n'));
  }

  const cleanTags = hashtags
    .map((tag) => normalizeHashtag(tag))
    .filter(Boolean);
  if (cleanTags.length > 0) {
    sections.push(cleanTags.join(' '));
  }

  return sections.join('\n\n');
}

/**
 * Replaces the trailing hashtag block in a manually-edited caption while
 * preserving the user's opening line and metadata lines intact.
 */
export function syncHashtagsInCaptionText(
  currentText: string,
  nextHashtags: string[],
): string {
  const cleanTags = nextHashtags
    .map((tag) => normalizeHashtag(tag))
    .filter(Boolean);
  const tagBlock = cleanTags.join(' ');

  const lines = currentText.replace(/\r\n/g, '\n').split('\n');
  while (lines.length > 0) {
    const tail = lines[lines.length - 1].trim();
    if (!tail || /^(?:#[a-zA-Z0-9_]+\s*)+$/.test(tail)) {
      lines.pop();
    } else {
      break;
    }
  }

  const body = lines.join('\n').trimEnd();
  if (!body) return tagBlock;
  if (!tagBlock) return body;
  return `${body}\n\n${tagBlock}`;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to execCommand below
  }

  try {
    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    }
  } catch {
    return false;
  }

  return false;
}
