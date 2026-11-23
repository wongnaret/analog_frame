import { Film, Moon, Plus, Sun, Download } from 'lucide-react';
import { useRef } from 'react';

interface HeaderProps {
  photoCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onAddFiles: (files: FileList) => void;
  onQuickExport: () => void;
  isExporting: boolean;
}

export function Header({
  photoCount,
  theme,
  onToggleTheme,
  onAddFiles,
  onQuickExport,
  isExporting,
}: HeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-md"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-app) 88%, transparent)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg border"
            style={{
              backgroundColor: 'var(--accent-amber-soft)',
              borderColor: 'var(--accent-amber)',
              color: 'var(--accent-amber)',
            }}
          >
            <Film className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wider uppercase">
              Analog Frame
            </h1>
            <p
              className="font-mono-tech hidden text-[10px] sm:block"
              style={{ color: 'var(--text-secondary)' }}
            >
              IG FILM FRAMING · CLIENT-SIDE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                onAddFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:opacity-85 active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Photos</span>
          </button>

          {photoCount > 0 && (
            <button
              type="button"
              disabled={isExporting}
              onClick={onQuickExport}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-black transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-amber)' }}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save Frame</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle color theme"
            className="flex h-8 w-8 items-center justify-center rounded-lg border transition hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
