import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  KeyRound,
  Plus,
  RotateCcw,
  Shuffle,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { copyTextToClipboard } from '../core/caption/generator';
import { CAPTION_MOODS } from '../core/caption/openingLines';
import type {
  CaptionDraft,
  CaptionMoodId,
  CaptionPreferences,
} from '../core/caption/types';

interface CaptionControlsProps {
  draft: CaptionDraft;
  prefs: CaptionPreferences;
  isGeneratingAi: boolean;
  aiError: string | null;
  onChangeText: (text: string) => void;
  onAddHashtag: (rawTag: string) => void;
  onRemoveHashtag: (tag: string) => void;
  onToggleOpeningLine: () => void;
  onToggleScanner: () => void;
  onSelectMood: (mood: CaptionMoodId) => void;
  onChangeContextNote: (note: string) => void;
  onChangeGeminiKey: (key: string) => void;
  onShuffleOpeningLine: () => void;
  onGenerateWithAi: () => void;
  onResetFromExif: () => void;
}

export function CaptionControls({
  draft,
  prefs,
  isGeneratingAi,
  aiError,
  onChangeText,
  onAddHashtag,
  onRemoveHashtag,
  onToggleOpeningLine,
  onToggleScanner,
  onSelectMood,
  onChangeContextNote,
  onChangeGeminiKey,
  onShuffleOpeningLine,
  onGenerateWithAi,
  onResetFromExif,
}: CaptionControlsProps) {
  const [newTagInput, setNewTagInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(draft.text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    onAddHashtag(newTagInput);
    setNewTagInput('');
  };

  const handleAiClick = () => {
    if (!prefs.geminiApiKey.trim()) {
      setShowAiSettings(true);
      return;
    }
    onGenerateWithAi();
  };

  const savedSuggestions = prefs.customHashtags.filter(
    (tag) => !draft.hashtags.includes(tag),
  );

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-black transition hover:brightness-105 active:scale-[0.98]"
          style={{ backgroundColor: 'var(--accent-amber)' }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy IG Caption'}</span>
        </button>

        <button
          type="button"
          onClick={onResetFromExif}
          title="Rebuild caption from EXIF metadata"
          className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition hover:opacity-80"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Caption Structure Toggles */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onToggleOpeningLine}
          className="flex items-center justify-between rounded-xl border px-3 py-2 text-left transition"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div>
            <div className="text-xs font-medium">Opening Line</div>
            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              Poetic stoic opener
            </div>
          </div>
          <span
            className="flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition"
            style={{
              backgroundColor: prefs.includeOpeningLine
                ? 'var(--accent-amber)'
                : 'var(--border-subtle)',
            }}
          >
            <span
              className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                prefs.includeOpeningLine ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleScanner}
          className="flex items-center justify-between rounded-xl border px-3 py-2 text-left transition"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div>
            <div className="text-xs font-medium">Include Scanner</div>
            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              Add Scanner line
            </div>
          </div>
          <span
            className="flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition"
            style={{
              backgroundColor: prefs.includeScanner
                ? 'var(--accent-amber)'
                : 'var(--border-subtle)',
            }}
          >
            <span
              className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                prefs.includeScanner ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </span>
        </button>
      </div>

      {/* Opening Line Mood, Context & AI Controls (when enabled) */}
      {prefs.includeOpeningLine && (
        <div
          className="space-y-3 rounded-xl border p-3.5"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider">
              Vibe / Mood
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CAPTION_MOODS.map((mood) => {
                const active = prefs.mood === mood.id;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => onSelectMood(mood.id)}
                    className="rounded-lg border px-2.5 py-1 text-[11px] font-medium transition"
                    style={{
                      backgroundColor: active
                        ? 'var(--accent-amber-soft)'
                        : 'var(--bg-surface)',
                      borderColor: active
                        ? 'var(--accent-amber)'
                        : 'var(--border-subtle)',
                      color: active ? 'var(--accent-amber)' : 'var(--text-secondary)',
                    }}
                  >
                    {mood.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider">
              Photo Context (Optional for AI)
            </span>
            <input
              type="text"
              value={draft.contextNote}
              onChange={(e) => onChangeContextNote(e.target.value)}
              placeholder="e.g. quiet afternoon shadows, street cat on concrete"
              className="w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-1"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onShuffleOpeningLine}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:opacity-85"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>Shuffle Line</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingAi}
              onClick={handleAiClick}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:opacity-85 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent-amber-soft)',
                borderColor: 'var(--accent-amber)',
                color: 'var(--accent-amber)',
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {isGeneratingAi
                  ? 'Analyzing Photo...'
                  : prefs.geminiApiKey.trim()
                    ? 'Generate with AI'
                    : 'Setup Gemini AI'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowAiSettings((v) => !v)}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium transition hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              <KeyRound className="h-3 w-3" />
              <span>API Key</span>
              {showAiSettings ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>

          {showAiSettings && (
            <div
              className="rounded-lg border p-2.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Gemini API Key (BYOK)
                </span>
                {prefs.geminiApiKey && (
                  <button
                    type="button"
                    onClick={() => onChangeGeminiKey('')}
                    className="text-[10px] underline"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="password"
                value={prefs.geminiApiKey}
                onChange={(e) => onChangeGeminiKey(e.target.value)}
                placeholder="Paste your Gemini API key (AIza...)"
                className="font-mono-tech w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none focus:ring-1"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              />
              <p className="mt-1.5 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                Stored only in your browser localStorage. Sends a 512px preview
                directly to Gemini 2.5 Flash.
              </p>
            </div>
          )}

          {aiError && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-400">
              {aiError}
            </p>
          )}
        </div>
      )}

      {/* Editable Caption Textarea */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Instagram Caption
            </span>
            {draft.isManuallyEdited && (
              <span
                className="font-mono-tech rounded px-1.5 py-0.5 text-[9px] uppercase"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                }}
              >
                Edited
              </span>
            )}
          </div>
          <span
            className="font-mono-tech text-[10px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {draft.hashtags.length} tags · {draft.text.length} chars
          </span>
        </div>

        <textarea
          rows={8}
          value={draft.text}
          onChange={(e) => onChangeText(e.target.value)}
          aria-label="Instagram caption text"
          className="font-mono-tech w-full rounded-xl border p-3 text-xs leading-relaxed outline-none focus:ring-1"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        />
      </div>

      {/* Interactive Hashtag Chips */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider">
            Hashtags ({draft.hashtags.length})
          </h3>
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            Tap × to remove
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {draft.hashtags.map((tag) => (
            <span
              key={tag}
              className="font-mono-tech inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px]"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span>{tag}</span>
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => onRemoveHashtag(tag)}
                className="rounded p-0.5 opacity-70 transition hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={handleAddTagSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            placeholder="Add hashtag (e.g. #flkanalog or bangkok)"
            className="font-mono-tech w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:opacity-85"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </form>

        {savedSuggestions.length > 0 && (
          <div>
            <div
              className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Saved Hashtags
            </div>
            <div className="flex flex-wrap gap-1">
              {savedSuggestions.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onAddHashtag(tag)}
                  className="font-mono-tech rounded border px-1.5 py-0.5 text-[10px] transition hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
