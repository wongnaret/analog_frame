import { useCallback, useMemo, useState } from 'react';
import {
  formatInstagramCaption,
  syncHashtagsInCaptionText,
} from '../core/caption/generator';
import { trackAiCaptionGenerate } from '../core/analytics/ga4';
import { generateCaptionWithGemini } from '../core/caption/geminiClient';
import {
  buildDefaultHashtags,
  extractHashtagsFromText,
  normalizeHashtag,
} from '../core/caption/hashtags';
import { pickOpeningLine } from '../core/caption/openingLines';
import {
  loadCaptionPreferences,
  rememberCustomHashtag,
  saveCaptionPreferences,
} from '../core/caption/storage';
import type {
  CaptionDraft,
  CaptionMoodId,
  CaptionPreferences,
} from '../core/caption/types';
import type { PhotoItem } from '../core/types';

function resolvePhotoDraft(
  photo: PhotoItem,
  prefs: CaptionPreferences,
  stored: CaptionDraft | undefined,
): CaptionDraft {
  const openingLine =
    stored?.openingLine ||
    pickOpeningLine(prefs.mood, photo.metadata, undefined, 0);

  const hashtags = stored?.hasCustomHashtags
    ? stored.hashtags
    : buildDefaultHashtags(photo.metadata, photo.settings.templateId);

  const text = stored?.isManuallyEdited
    ? stored.text
    : formatInstagramCaption({
        openingLine,
        includeOpeningLine: prefs.includeOpeningLine,
        includeScanner: prefs.includeScanner,
        metadata: photo.metadata,
        hashtags,
      });

  return {
    openingLine,
    hashtags,
    hasCustomHashtags: stored?.hasCustomHashtags ?? false,
    contextNote: stored?.contextNote ?? '',
    text,
    isManuallyEdited: stored?.isManuallyEdited ?? false,
  };
}

export function useCaptionManager(selectedPhoto: PhotoItem | null) {
  const [prefs, setPrefs] = useState<CaptionPreferences>(() =>
    loadCaptionPreferences(),
  );
  const [drafts, setDrafts] = useState<Record<string, CaptionDraft>>({});
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const updatePrefs = useCallback(
    (updater: (prev: CaptionPreferences) => CaptionPreferences) => {
      setPrefs((prev) => {
        const next = updater(prev);
        saveCaptionPreferences(next);
        return next;
      });
    },
    [],
  );

  const currentDraft = useMemo(() => {
    if (!selectedPhoto) return null;
    return resolvePhotoDraft(selectedPhoto, prefs, drafts[selectedPhoto.id]);
  }, [selectedPhoto, prefs, drafts]);

  const getCaptionForPhoto = useCallback(
    (photo: PhotoItem): string => {
      return resolvePhotoDraft(photo, prefs, drafts[photo.id]).text;
    },
    [prefs, drafts],
  );

  const setCaptionText = useCallback(
    (text: string) => {
      if (!selectedPhoto) return;
      setDrafts((prev) => {
        const current = resolvePhotoDraft(selectedPhoto, prefs, prev[selectedPhoto.id]);
        return {
          ...prev,
          [selectedPhoto.id]: {
            ...current,
            text,
            hashtags: extractHashtagsFromText(text),
            hasCustomHashtags: true,
            isManuallyEdited: true,
          },
        };
      });
    },
    [selectedPhoto, prefs],
  );

  const addHashtag = useCallback(
    (rawInput: string) => {
      if (!selectedPhoto) return;
      const tokens = rawInput
        .split(/[\s,]+/)
        .map((token) => normalizeHashtag(token))
        .filter(Boolean);
      if (tokens.length === 0) return;

      let nextPrefs = prefs;
      for (const token of tokens) {
        nextPrefs = rememberCustomHashtag(nextPrefs, token);
      }
      setPrefs(nextPrefs);

      setDrafts((prev) => {
        const current = resolvePhotoDraft(
          selectedPhoto,
          nextPrefs,
          prev[selectedPhoto.id],
        );
        const existing = new Set(current.hashtags);
        const appended = [...current.hashtags];
        for (const token of tokens) {
          if (!existing.has(token)) {
            existing.add(token);
            appended.push(token);
          }
        }

        const nextText = current.isManuallyEdited
          ? syncHashtagsInCaptionText(current.text, appended)
          : formatInstagramCaption({
              openingLine: current.openingLine,
              includeOpeningLine: nextPrefs.includeOpeningLine,
              includeScanner: nextPrefs.includeScanner,
              metadata: selectedPhoto.metadata,
              hashtags: appended,
            });

        return {
          ...prev,
          [selectedPhoto.id]: {
            ...current,
            hashtags: appended,
            hasCustomHashtags: true,
            text: nextText,
          },
        };
      });
    },
    [selectedPhoto, prefs],
  );

  const removeHashtag = useCallback(
    (tagToRemove: string) => {
      if (!selectedPhoto) return;
      const normalized = normalizeHashtag(tagToRemove);
      setDrafts((prev) => {
        const current = resolvePhotoDraft(selectedPhoto, prefs, prev[selectedPhoto.id]);
        const nextTags = current.hashtags.filter((tag) => tag !== normalized);
        const nextText = current.isManuallyEdited
          ? syncHashtagsInCaptionText(current.text, nextTags)
          : formatInstagramCaption({
              openingLine: current.openingLine,
              includeOpeningLine: prefs.includeOpeningLine,
              includeScanner: prefs.includeScanner,
              metadata: selectedPhoto.metadata,
              hashtags: nextTags,
            });

        return {
          ...prev,
          [selectedPhoto.id]: {
            ...current,
            hashtags: nextTags,
            hasCustomHashtags: true,
            text: nextText,
          },
        };
      });
    },
    [selectedPhoto, prefs],
  );

  const toggleOpeningLine = useCallback(() => {
    const nextValue = !prefs.includeOpeningLine;
    const nextPrefs = { ...prefs, includeOpeningLine: nextValue };
    setPrefs(nextPrefs);
    saveCaptionPreferences(nextPrefs);

    if (selectedPhoto) {
      setDrafts((prev) => {
        const stored = prev[selectedPhoto.id];
        if (!stored?.isManuallyEdited) return prev;
        return {
          ...prev,
          [selectedPhoto.id]: {
            ...stored,
            isManuallyEdited: false,
            text: formatInstagramCaption({
              openingLine: stored.openingLine,
              includeOpeningLine: nextValue,
              includeScanner: nextPrefs.includeScanner,
              metadata: selectedPhoto.metadata,
              hashtags: stored.hashtags,
            }),
          },
        };
      });
    }
  }, [prefs, selectedPhoto]);

  const toggleScanner = useCallback(() => {
    const nextValue = !prefs.includeScanner;
    const nextPrefs = { ...prefs, includeScanner: nextValue };
    setPrefs(nextPrefs);
    saveCaptionPreferences(nextPrefs);

    if (selectedPhoto) {
      setDrafts((prev) => {
        const stored = prev[selectedPhoto.id];
        if (!stored?.isManuallyEdited) return prev;
        return {
          ...prev,
          [selectedPhoto.id]: {
            ...stored,
            isManuallyEdited: false,
            text: formatInstagramCaption({
              openingLine: stored.openingLine,
              includeOpeningLine: nextPrefs.includeOpeningLine,
              includeScanner: nextValue,
              metadata: selectedPhoto.metadata,
              hashtags: stored.hashtags,
            }),
          },
        };
      });
    }
  }, [prefs, selectedPhoto]);

  const setMood = useCallback(
    (mood: CaptionMoodId) => {
      updatePrefs((prev) => ({ ...prev, mood }));
      if (!selectedPhoto) return;
      setDrafts((prev) => {
        const current = resolvePhotoDraft(selectedPhoto, prefs, prev[selectedPhoto.id]);
        const nextLine = pickOpeningLine(
          mood,
          selectedPhoto.metadata,
          current.openingLine,
        );
        return {
          ...prev,
          [selectedPhoto.id]: {
            ...current,
            openingLine: nextLine,
            isManuallyEdited: false,
          },
        };
      });
    },
    [selectedPhoto, prefs, updatePrefs],
  );

  const setContextNote = useCallback(
    (contextNote: string) => {
      if (!selectedPhoto) return;
      setDrafts((prev) => {
        const current = resolvePhotoDraft(selectedPhoto, prefs, prev[selectedPhoto.id]);
        return {
          ...prev,
          [selectedPhoto.id]: {
            ...current,
            contextNote,
          },
        };
      });
    },
    [selectedPhoto, prefs],
  );

  const setGeminiApiKey = useCallback(
    (geminiApiKey: string) => {
      setAiError(null);
      updatePrefs((prev) => ({ ...prev, geminiApiKey }));
    },
    [updatePrefs],
  );

  const shuffleOpeningLine = useCallback(() => {
    if (!selectedPhoto) return;
    setDrafts((prev) => {
      const current = resolvePhotoDraft(selectedPhoto, prefs, prev[selectedPhoto.id]);
      const nextLine = pickOpeningLine(
        prefs.mood,
        selectedPhoto.metadata,
        current.openingLine,
      );
      return {
        ...prev,
        [selectedPhoto.id]: {
          ...current,
          openingLine: nextLine,
          isManuallyEdited: false,
        },
      };
    });
  }, [selectedPhoto, prefs]);

  const resetFromExif = useCallback(() => {
    if (!selectedPhoto) return;
    setAiError(null);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[selectedPhoto.id];
      return next;
    });
  }, [selectedPhoto]);

  const generateWithAi = useCallback(async () => {
    if (!selectedPhoto) return;
    setAiError(null);
    setIsGeneratingAi(true);
    const current = resolvePhotoDraft(
      selectedPhoto,
      prefs,
      drafts[selectedPhoto.id],
    );
    const captureMode = selectedPhoto.metadata.mode ?? 'film';
    const hasContextNote = Boolean(current.contextNote.trim());
    try {
      const result = await generateCaptionWithGemini({
        apiKey: prefs.geminiApiKey,
        objectUrl: selectedPhoto.objectUrl,
        metadata: selectedPhoto.metadata,
        templateId: selectedPhoto.settings.templateId,
        contextNote: current.contextNote,
        includeOpeningLine: prefs.includeOpeningLine,
        includeScanner: prefs.includeScanner,
      });

      setDrafts((prev) => ({
        ...prev,
        [selectedPhoto.id]: {
          ...current,
          openingLine: result.openingLine || current.openingLine,
          hashtags: result.hashtags,
          hasCustomHashtags: true,
          text: result.text,
          isManuallyEdited: false,
        },
      }));
      trackAiCaptionGenerate({
        captureMode,
        hasContextNote,
        status: 'success',
      });
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : 'Failed to generate AI caption',
      );
      trackAiCaptionGenerate({
        captureMode,
        hasContextNote,
        status: 'error',
      });
    } finally {
      setIsGeneratingAi(false);
    }
  }, [selectedPhoto, prefs, drafts]);

  return {
    prefs,
    draft: currentDraft,
    isGeneratingAi,
    aiError,
    getCaptionForPhoto,
    setCaptionText,
    addHashtag,
    removeHashtag,
    toggleOpeningLine,
    toggleScanner,
    setMood,
    setContextNote,
    setGeminiApiKey,
    shuffleOpeningLine,
    resetFromExif,
    generateWithAi,
  };
}
