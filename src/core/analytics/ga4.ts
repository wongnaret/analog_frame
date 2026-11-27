import {
  loadCookieConsent,
  type CookieConsentChoice,
} from '../presets/cookieConsent';
import type {
  ExportFormat,
  PhotoItem,
  PhotoMode,
  TemplateId,
} from '../types';

export function getGa4MeasurementId(): string {
  const raw = import.meta.env?.VITE_GA4_MEASUREMENT_ID;
  return typeof raw === 'string' ? raw.trim() : '';
}

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isAnalyticsEnabledHost(hostname?: string): boolean {
  const host =
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  if (!host) return false;
  return !LOCAL_HOSTNAMES.has(host.toLowerCase());
}

export function sanitizeAnalyticsParam(
  value: string | undefined,
  maxLength = 80,
): string | undefined {
  if (!value) return undefined;
  const cleaned = value.trim().replace(/\s+/g, ' ');
  if (!cleaned) return undefined;
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

export function updateAnalyticsConsent(choice: CookieConsentChoice): void {
  const measurementId = getGa4MeasurementId();
  if (
    !measurementId ||
    typeof window === 'undefined' ||
    typeof window.gtag !== 'function'
  ) {
    return;
  }

  const granted = choice === 'accepted';
  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
  });

  if (granted && isAnalyticsEnabledHost()) {
    window.gtag('config', measurementId, {
      send_page_view: true,
    });
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>,
): void {
  if (
    !getGa4MeasurementId() ||
    typeof window === 'undefined' ||
    typeof window.gtag !== 'function'
  ) {
    return;
  }
  if (!isAnalyticsEnabledHost()) return;
  if (loadCookieConsent() !== 'accepted') return;

  const cleanParams: Record<string, string | number | boolean> = {};
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        cleanParams[key] = value;
      }
    }
  }

  window.gtag('event', eventName, cleanParams);
}

export function trackPhotoUpload(params: {
  count: number;
  isSample?: boolean;
}): void {
  trackEvent('photo_upload', {
    photo_count: params.count,
    is_sample: Boolean(params.isSample),
  });
}

export function trackTemplateSelect(templateId: TemplateId): void {
  trackEvent('select_template', {
    template_id: templateId,
  });
}

export function trackCaptureModeSwitch(captureMode: PhotoMode): void {
  trackEvent('switch_capture_mode', {
    capture_mode: captureMode,
  });
}

export function trackFrameExport(params: {
  photo: PhotoItem;
  format: ExportFormat;
  delivery: 'share' | 'download';
  withCaptionCopy?: boolean;
}): void {
  const { photo, format, delivery, withCaptionCopy } = params;
  const captureMode = photo.metadata.mode ?? 'film';

  trackEvent('export_frame', {
    template_id: photo.settings.templateId,
    aspect_ratio: photo.settings.aspectRatioId,
    matte_palette: photo.settings.matteId,
    capture_mode: captureMode,
    format,
    delivery,
    with_caption_copy: Boolean(withCaptionCopy),
    camera: sanitizeAnalyticsParam(photo.metadata.camera),
    lens: sanitizeAnalyticsParam(photo.metadata.lens),
    film_stock:
      captureMode === 'film'
        ? sanitizeAnalyticsParam(photo.metadata.filmStock)
        : undefined,
  });
}

export function trackBatchZipExport(params: {
  count: number;
  photo: PhotoItem;
  format: ExportFormat;
}): void {
  const { count, photo, format } = params;
  const captureMode = photo.metadata.mode ?? 'film';

  trackEvent('export_zip', {
    photo_count: count,
    template_id: photo.settings.templateId,
    aspect_ratio: photo.settings.aspectRatioId,
    capture_mode: captureMode,
    format,
    camera: sanitizeAnalyticsParam(photo.metadata.camera),
    lens: sanitizeAnalyticsParam(photo.metadata.lens),
    film_stock:
      captureMode === 'film'
        ? sanitizeAnalyticsParam(photo.metadata.filmStock)
        : undefined,
  });
}

export function trackCaptionCopy(params: {
  photo: PhotoItem;
  hasOpeningLine: boolean;
  hashtagCount: number;
  source: 'caption_tab' | 'export_tab' | 'copy_and_share';
}): void {
  const { photo, hasOpeningLine, hashtagCount, source } = params;
  const captureMode = photo.metadata.mode ?? 'film';

  trackEvent('copy_ig_caption', {
    capture_mode: captureMode,
    template_id: photo.settings.templateId,
    has_opening_line: hasOpeningLine,
    hashtag_count: hashtagCount,
    source,
    camera: sanitizeAnalyticsParam(photo.metadata.camera),
    film_stock:
      captureMode === 'film'
        ? sanitizeAnalyticsParam(photo.metadata.filmStock)
        : undefined,
  });
}

export function trackDiptychPartnerSelect(
  partnerSource: 'queue' | 'upload' | 'cleared',
): void {
  trackEvent('select_diptych_partner', {
    partner_source: partnerSource,
  });
}

export function trackAiCaptionGenerate(params: {
  captureMode: PhotoMode;
  hasContextNote: boolean;
  status: 'success' | 'error';
}): void {
  trackEvent('generate_ai_caption', {
    capture_mode: params.captureMode,
    has_context_note: params.hasContextNote,
    status: params.status,
  });
}

export function trackSupportCoffeeClick(destination?: string): void {
  trackEvent('support_coffee_click', {
    destination: sanitizeAnalyticsParam(destination),
  });
}

export function trackThemeToggle(theme: 'dark' | 'light'): void {
  trackEvent('toggle_theme', {
    theme,
  });
}
