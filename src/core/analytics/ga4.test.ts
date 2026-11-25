import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCookieConsent } from '../presets/cookieConsent';
import type { PhotoItem } from '../types';
import {
  GA4_MEASUREMENT_ID,
  isAnalyticsEnabledHost,
  sanitizeAnalyticsParam,
  trackBatchZipExport,
  trackCaptionCopy,
  trackFrameExport,
  trackPhotoUpload,
  updateAnalyticsConsent,
} from './ga4';

const SAMPLE_PHOTO: PhotoItem = {
  id: 'p1',
  fileName: 'roll01_01A.jpg',
  fileSize: 123456,
  objectUrl: 'blob:mock',
  width: 2000,
  height: 3000,
  exifDetected: {
    camera: true,
    lens: true,
    scanner: false,
    filmStock: true,
    iso: true,
    focalLength: false,
    aperture: false,
    shutterSpeed: false,
    date: true,
    artist: false,
    frameNumber: true,
  },
  metadata: {
    mode: 'film',
    camera: '  Pentax   17  ',
    lens: '25mm F3.5',
    scanner: 'Noritsu HS-1800',
    filmStock: 'Ilford HP5 Plus 400',
    iso: '400',
    focalLength: '',
    aperture: '',
    shutterSpeed: '',
    date: '2026-09-13',
    exifDateTime: '2026:09:13 12:00:00',
    artist: '',
    frameNumber: '01A',
    caption: '',
  },
  settings: {
    templateId: 'half-frame-single',
    aspectRatioId: '3:4',
    matteId: 'white',
    rotation: 0,
    diptychPartnerId: null,
    watermarkText: 'ANALOG FRAME',
    visibility: {
      showDate: false,
      showArtist: false,
      showFrameNumber: true,
      showCaption: false,
      showWatermark: true,
    },
  },
};

describe('GA4 analytics helper', () => {
  const gtagSpy = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'analog_frame_consent=; max-age=0; path=/';
    gtagSpy.mockReset();
    window.gtag = gtagSpy;
    vi.stubGlobal('location', { ...window.location, hostname: 'frame.trailhub.in.th' });
  });

  it('blocks localhost hosts and enables production domain', () => {
    expect(isAnalyticsEnabledHost('localhost')).toBe(false);
    expect(isAnalyticsEnabledHost('127.0.0.1')).toBe(false);
    expect(isAnalyticsEnabledHost('[::1]')).toBe(false);
    expect(isAnalyticsEnabledHost('frame.trailhub.in.th')).toBe(true);
  });

  it('sanitizes and truncates gear metadata parameters safely', () => {
    expect(sanitizeAnalyticsParam('   ')).toBeUndefined();
    expect(sanitizeAnalyticsParam('  Pentax   17 ')).toBe('Pentax 17');
    expect(sanitizeAnalyticsParam('a'.repeat(100), 10)).toBe('a'.repeat(10));
  });

  it('does not send events when cookie consent is not accepted', () => {
    trackPhotoUpload({ count: 3 });
    expect(gtagSpy).not.toHaveBeenCalled();

    saveCookieConsent('essential');
    trackPhotoUpload({ count: 3 });
    expect(gtagSpy).not.toHaveBeenCalled();
  });

  it('updates GA4 consent and sends frame/gear params when accepted', () => {
    saveCookieConsent('accepted');
    updateAnalyticsConsent('accepted');

    expect(gtagSpy).toHaveBeenCalledWith('consent', 'update', {
      analytics_storage: 'granted',
    });
    expect(gtagSpy).toHaveBeenCalledWith('config', GA4_MEASUREMENT_ID, {
      send_page_view: true,
    });

    gtagSpy.mockClear();
    trackFrameExport({
      photo: SAMPLE_PHOTO,
      format: 'jpeg',
      delivery: 'download',
    });

    expect(gtagSpy).toHaveBeenCalledWith('event', 'export_frame', {
      template_id: 'half-frame-single',
      aspect_ratio: '3:4',
      matte_palette: 'white',
      capture_mode: 'film',
      format: 'jpeg',
      delivery: 'download',
      camera: 'Pentax 17',
      lens: '25mm F3.5',
      film_stock: 'Ilford HP5 Plus 400',
    });

    gtagSpy.mockClear();
    trackBatchZipExport({
      count: 5,
      photo: {
        ...SAMPLE_PHOTO,
        metadata: { ...SAMPLE_PHOTO.metadata, mode: 'digital', filmStock: 'Ignored' },
      },
      format: 'png',
    });

    expect(gtagSpy).toHaveBeenCalledWith('event', 'export_zip', {
      photo_count: 5,
      template_id: 'half-frame-single',
      aspect_ratio: '3:4',
      capture_mode: 'digital',
      format: 'png',
      camera: 'Pentax 17',
      lens: '25mm F3.5',
    });

    gtagSpy.mockClear();
    trackCaptionCopy({
      photo: SAMPLE_PHOTO,
      hasOpeningLine: false,
      hashtagCount: 5,
      source: 'caption_tab',
    });

    expect(gtagSpy).toHaveBeenCalledWith('event', 'copy_ig_caption', {
      capture_mode: 'film',
      template_id: 'half-frame-single',
      has_opening_line: false,
      hashtag_count: 5,
      source: 'caption_tab',
      camera: 'Pentax 17',
      film_stock: 'Ilford HP5 Plus 400',
    });
  });
});
