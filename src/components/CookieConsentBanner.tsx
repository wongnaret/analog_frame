import { Cookie } from 'lucide-react';
import { useState } from 'react';
import { updateAnalyticsConsent } from '../core/analytics/ga4';
import {
  loadCookieConsent,
  saveCookieConsent,
  type CookieConsentChoice,
} from '../core/presets/cookieConsent';

interface CookieConsentBannerProps {
  hasPhotos: boolean;
}

export function CookieConsentBanner({ hasPhotos }: CookieConsentBannerProps) {
  const [consent, setConsent] = useState<CookieConsentChoice | null>(() =>
    loadCookieConsent(),
  );

  if (consent !== null) {
    return null;
  }

  const handleChoose = (choice: CookieConsentChoice) => {
    saveCookieConsent(choice);
    updateAnalyticsConsent(choice);
    setConsent(choice);
  };

  return (
    <aside
      role="dialog"
      aria-label="Cookie and local storage consent"
      className={`fixed inset-x-3 z-40 mx-auto max-w-2xl rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all ${
        hasPhotos ? 'bottom-20 lg:bottom-4' : 'bottom-4'
      }`}
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 95%, transparent)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
            style={{
              backgroundColor: 'var(--accent-amber-soft)',
              borderColor: 'var(--accent-amber)',
              color: 'var(--accent-amber)',
            }}
          >
            <Cookie className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider">
              Cookies & Browser Storage
            </h2>
            <p
              className="mt-0.5 text-xs leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              We use essential cookies and local browser storage to remember your
              theme, gear presets, and watermark text, plus optional anonymous
              analytics (GA4) when accepted. Your photos stay 100% on your device.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleChoose('essential')}
            className="rounded-xl border px-3 py-2 text-xs font-medium transition hover:opacity-85"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={() => handleChoose('accepted')}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-black transition hover:brightness-105 active:scale-[0.98]"
            style={{ backgroundColor: 'var(--accent-amber)' }}
          >
            Accept Cookies
          </button>
        </div>
      </div>
    </aside>
  );
}
