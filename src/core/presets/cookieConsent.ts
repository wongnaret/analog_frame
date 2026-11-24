export type CookieConsentChoice = 'accepted' | 'essential';

const CONSENT_STORAGE_KEY = 'analog_frame_cookie_consent_v1';
const CONSENT_COOKIE_NAME = 'analog_frame_consent';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function parseConsentValue(value: string | null | undefined): CookieConsentChoice | null {
  if (value === 'accepted' || value === 'essential') {
    return value;
  }
  return null;
}

export function loadCookieConsent(): CookieConsentChoice | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const fromStorage = parseConsentValue(localStorage.getItem(CONSENT_STORAGE_KEY));
      if (fromStorage) return fromStorage;
    }
  } catch {
    // Ignore storage access restrictions
  }

  try {
    if (typeof document !== 'undefined' && document.cookie) {
      const prefix = `${CONSENT_COOKIE_NAME}=`;
      for (const part of document.cookie.split(';')) {
        const trimmed = part.trim();
        if (trimmed.startsWith(prefix)) {
          return parseConsentValue(decodeURIComponent(trimmed.slice(prefix.length)));
        }
      }
    }
  } catch {
    // Ignore cookie read restrictions
  }

  return null;
}

export function saveCookieConsent(choice: CookieConsentChoice): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    }
  } catch {
    // Ignore storage quota or private-mode errors
  }

  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${CONSENT_COOKIE_NAME}=${choice}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
    }
  } catch {
    // Ignore cookie write restrictions
  }
}
