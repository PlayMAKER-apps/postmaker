export type Format = 'post' | 'story' | 'square';
export type Template = 'calendar' | 'week' | 'matchday' | 'result';
export type Layer = 'behind' | 'front';
export interface Team { id: string; name: string; logo?: string }
export interface Match {
  id: string; home: Team; away: Team; competition: string;
  date: string; time: string; venue: string;
  homeScore?: number; awayScore?: number;
  player?: string;
}
export interface Glass {
  id: string; kind: 'match' | 'sponsor'; layer: Layer;
  x: number; y: number; width: number; height: number;
  match?: Match; image?: string;
}
export interface Design {
  template: Template; format: Format; title: string;
  color: string; accent: string; match?: Match; matches: Match[];
  background?: string; subject?: string; sponsor?: string;
  backgroundSourceSize?: { width: number; height: number };
  panX: number; panY: number; zoom: number; blur: number;
  glasses: Glass[]; featuredTeamId?: string;
  elements?: TemplateElement[];
  font?: FontChoice;
  selectedMatchId?: string;
}
export type FontChoice = 'Arial' | 'Georgia' | 'Trebuchet MS';
export type ElementKind = 'headline' | 'calendar' | 'match' | 'result' | 'glass' | 'text' | 'shape' | 'image' | 'subject' | 'sponsor';
export interface TemplateElement {
  id: string; kind: ElementKind; layer: Layer;
  x: number; y: number; width: number; height: number;
  text?: string; image?: string; fill?: string; blur?: number;
  matchId?: string; visible?: boolean;
}
export interface TemplateConfig {
  version: 1; category: Template; name: string; elements: TemplateElement[];
}
export interface BrandAsset { id: string; name: string; image: string; license: string }
export interface BrandPreset { id: string; name: string; template: Template; color: string; accent: string; font: FontChoice; elements: TemplateElement[] }
export interface BrandKit {
  clubName: string; teams: Team[]; primaryColor: string; accentColor: string;
  font: FontChoice; logo?: string; sponsors: BrandAsset[]; assets: BrandAsset[]; presets: BrandPreset[];
}
export interface GraphicDocument { id: string; name: string; design: Design }
export interface Project {
  schemaVersion: 1; id: string; name: string; brand: BrandKit;
  matches: Match[]; graphics: GraphicDocument[]; activeGraphicId: string; updatedAt: string;
  publicSource?: {
    kind: 'file' | 'url'; url?: string; exportedAt: string; importedAt: string;
    selectedSquadId?: string; selectedRosterId?: string; snapshot: unknown;
  };
}
export const WIDTH = 1080;
export function dimensions(design: Pick<Design, 'format'>) {
  return { width: WIDTH, height: design.format === 'story' ? 1920 : design.format === 'square' ? 1080 : 1350 };
}
export function clampGlass(glass: Glass, height: number): Glass {
  const width = Math.min(WIDTH, Math.max(100, glass.width));
  const safeHeight = Math.min(height, Math.max(80, glass.height));
  return { ...glass, width, height: safeHeight,
    x: Math.min(WIDTH - width, Math.max(0, glass.x)),
    y: Math.min(height - safeHeight, Math.max(0, glass.y)) };
}
export function clampElement(element: TemplateElement): TemplateElement {
  const width = Math.min(WIDTH, Math.max(40, Number.isFinite(element.width) ? element.width : 40));
  const height = Math.min(1350, Math.max(40, Number.isFinite(element.height) ? element.height : 40));
  return { ...element, width, height,
    x: Math.min(WIDTH - width, Math.max(0, Number.isFinite(element.x) ? element.x : 0)),
    y: Math.min(1350 - height, Math.max(0, Number.isFinite(element.y) ? element.y : 0)) };
}
