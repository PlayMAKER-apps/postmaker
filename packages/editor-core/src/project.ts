import { copyTemplate } from './templates.ts';
import type { BrandKit, Design, GraphicDocument, Project, Template } from './model.ts';

export function createDesign(template: Template = 'result', brand?: BrandKit): Design {
  return {
    template, format: 'post', title: template === 'result' ? 'Final score' : template === 'calendar' ? 'Calendar' : template === 'week' ? 'This week' : 'Game day',
    color: brand?.primaryColor ?? '#101b2d', accent: brand?.accentColor ?? '#f0a64a',
    font: brand?.font ?? 'Arial', matches: [], panX: 0, panY: 0, zoom: 1, blur: 0, glasses: [], elements: copyTemplate(template)
  };
}

export function createProject(name = 'My club', id = crypto.randomUUID()): Project {
  const brand: BrandKit = { clubName: name, teams: [], primaryColor: '#101b2d', accentColor: '#f0a64a', font: 'Arial', sponsors: [], assets: [], presets: [] };
  const graphic: GraphicDocument = { id: crypto.randomUUID(), name: 'First result', design: createDesign('result', brand) };
  return { schemaVersion: 1, id, name, brand, matches: [], graphics: [graphic], activeGraphicId: graphic.id, updatedAt: new Date().toISOString() };
}

export function activeGraphic(project: Project): GraphicDocument {
  return project.graphics.find(graphic => graphic.id === project.activeGraphicId) ?? project.graphics[0];
}

export function addGraphic(project: Project, template: Template): Project {
  const graphic: GraphicDocument = { id: crypto.randomUUID(), name: `${template[0].toUpperCase()}${template.slice(1)} ${project.graphics.length + 1}`, design: { ...createDesign(template, project.brand), selectedMatchId: project.matches[0]?.id } };
  return { ...project, graphics: [...project.graphics, graphic], activeGraphicId: graphic.id, updatedAt: new Date().toISOString() };
}

export function duplicateGraphic(project: Project, graphicId: string): Project {
  const source = project.graphics.find(graphic => graphic.id === graphicId);
  if (!source) throw new Error('Graphic not found.');
  const copy: GraphicDocument = { id: crypto.randomUUID(), name: `${source.name} copy`, design: structuredClone(source.design) };
  return { ...project, graphics: [...project.graphics, copy], activeGraphicId: copy.id, updatedAt: new Date().toISOString() };
}

export function serializeProject(project: Project): string { validateProject(project); return JSON.stringify(project, null, 2); }
export function parseProject(source: string): Project { const value: unknown = JSON.parse(source); validateProject(value); return value; }
export function validateProject(value: unknown): asserts value is Project {
  if (!value || typeof value !== 'object') throw new Error('Invalid project file.');
  const project = value as Partial<Project>;
  if (project.schemaVersion !== 1) throw new Error('Unsupported project version.');
  if (typeof project.id !== 'string' || typeof project.name !== 'string' || !project.brand || !Array.isArray(project.matches) || !Array.isArray(project.graphics) || !project.graphics.length) throw new Error('Invalid project structure.');
  if (typeof project.brand.clubName !== 'string' || !Array.isArray(project.brand.teams) || !Array.isArray(project.brand.sponsors) || !Array.isArray(project.brand.assets) || !Array.isArray(project.brand.presets)) throw new Error('Invalid brand kit.');
  if (!project.graphics.every(graphic => graphic && typeof graphic.id === 'string' && typeof graphic.name === 'string' && graphic.design && Array.isArray(graphic.design.matches) && Array.isArray(graphic.design.elements))) throw new Error('Invalid graphic data.');
  if (!project.graphics.some(graphic => graphic.id === project.activeGraphicId)) throw new Error('Missing active graphic.');
  if (!project.matches.every(match => match && typeof match.id === 'string' && match.home && match.away && typeof match.date === 'string')) throw new Error('Invalid match data.');
  const imageValues = [project.brand.logo, ...project.brand.teams.map(team => team.logo), ...project.brand.sponsors.map(asset => asset.image), ...project.brand.assets.map(asset => asset.image), ...project.matches.flatMap(match => [match.home.logo, match.away.logo]), ...project.graphics.flatMap(graphic => [graphic.design.background, graphic.design.subject, graphic.design.sponsor, ...(graphic.design.elements ?? []).map(element => element.image)])];
  if (imageValues.some(value => value && !/^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/i.test(value))) throw new Error('Project contains a non-portable image path.');
}
