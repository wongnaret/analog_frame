import { describe, it, expect } from 'vitest';
import { DEFAULT_TEMPLATE_ID, getTemplate, TEMPLATES } from './registry';

describe('template registry', () => {
  it('registers all 6 analog frame templates', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual([
      '35mm-sprocket',
      'film-rebate',
      'minimal-matte',
      'editorial-card',
      'half-frame-single',
      'half-frame-diptych',
    ]);
  });

  it('defaults to 35mm-sprocket and marks diptych support accurately', () => {
    expect(DEFAULT_TEMPLATE_ID).toBe('35mm-sprocket');
    expect(getTemplate('half-frame-diptych').supportsDiptych).toBe(true);
    expect(getTemplate('half-frame-single').supportsDiptych).toBe(false);
    expect(getTemplate('editorial-card').usesCustomFooter).toBe(true);
  });
});
