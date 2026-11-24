import { describe, it, expect } from 'vitest';
import { DEFAULT_TEMPLATE_ID, getTemplate, TEMPLATES } from './registry';

describe('template registry', () => {
  it('registers all 6 analog frame templates with minimal-matte first', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual([
      'minimal-matte',
      '35mm-sprocket',
      'film-rebate',
      'editorial-card',
      'half-frame-single',
      'half-frame-diptych',
    ]);
  });

  it('defaults to minimal-matte and marks diptych support accurately', () => {
    expect(DEFAULT_TEMPLATE_ID).toBe('minimal-matte');
    expect(getTemplate('half-frame-diptych').supportsDiptych).toBe(true);
    expect(getTemplate('half-frame-single').supportsDiptych).toBe(false);
    expect(getTemplate('editorial-card').usesCustomFooter).toBe(true);
  });
});
