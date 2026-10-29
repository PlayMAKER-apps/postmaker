import type { Template, TemplateConfig, TemplateElement } from './model.ts';

const layer = (id: string, kind: TemplateElement['kind'], x: number, y: number, width: number, height: number, extra: Partial<TemplateElement> = {}): TemplateElement =>
  ({ id, kind, x, y, width, height, layer: 'front', visible: true, ...extra });

export const templates: Record<Template, TemplateConfig> = {
  calendar: { version: 1, category: 'calendar', name: 'Calendar', elements: [
    layer('title', 'headline', 65, 60, 950, 100),
    layer('schedule', 'calendar', 65, 225, 950, 1010),
    layer('club-logo', 'image', 790, 40, 180, 110)
  ] },
  week: { version: 1, category: 'week', name: 'Week', elements: [
    layer('title', 'headline', 65, 60, 950, 100),
    layer('match-glass', 'glass', 105, 265, 870, 660),
    layer('subject', 'subject', 0, 0, 1080, 1350),
    layer('sponsor', 'sponsor', 740, 1105, 270, 130)
  ] },
  matchday: { version: 1, category: 'matchday', name: 'Matchday', elements: [
    layer('title', 'headline', 65, 60, 950, 100),
    layer('event', 'match', 65, 250, 950, 800),
    layer('sponsor', 'sponsor', 740, 1105, 270, 130)
  ] },
  result: { version: 1, category: 'result', name: 'Result', elements: [
    layer('title', 'headline', 65, 60, 950, 100),
    layer('score', 'result', 65, 260, 950, 780),
    layer('sponsor', 'sponsor', 740, 1105, 270, 130)
  ] }
};

export function copyTemplate(category: Template): TemplateElement[] {
  return templates[category].elements.map(element => ({ ...element }));
}
