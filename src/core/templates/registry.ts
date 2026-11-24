import type { TemplateId } from '../types';
import { editorialCardTemplate } from './editorialCard';
import { filmRebateTemplate } from './filmRebate';
import { filmStrip35mmTemplate } from './filmStrip35mm';
import { halfFrameDiptychTemplate } from './halfFrameDiptych';
import { halfFrameSingleTemplate } from './halfFrameSingle';
import { minimalMatteTemplate } from './minimalMatte';
import type { FrameTemplate } from './types';

export const DEFAULT_TEMPLATE_ID: TemplateId = 'minimal-matte';

export const TEMPLATES: FrameTemplate[] = [
  minimalMatteTemplate,
  filmStrip35mmTemplate,
  filmRebateTemplate,
  editorialCardTemplate,
  halfFrameSingleTemplate,
  halfFrameDiptychTemplate,
];

export function getTemplate(id: TemplateId): FrameTemplate {
  return (
    TEMPLATES.find((template) => template.id === id) ?? minimalMatteTemplate
  );
}
