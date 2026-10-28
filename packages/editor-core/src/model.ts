export type Format = 'post' | 'story';
export type Template = 'calendar' | 'week' | 'matchday' | 'result';
export type Layer = 'behind' | 'front';
export interface Team { id: string; name: string; logo?: string }
export interface Match {
  id: string; home: Team; away: Team; competition: string;
  date: string; time: string; venue: string;
  homeScore?: number; awayScore?: number;
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
  panX: number; panY: number; zoom: number; blur: number;
  glasses: Glass[]; featuredTeamId?: string;
}
export const WIDTH = 1080;
export function dimensions(design: Pick<Design, 'format'>) {
  return { width: WIDTH, height: design.format === 'story' ? 1920 : 1350 };
}
export function clampGlass(glass: Glass, height: number): Glass {
  const width = Math.min(WIDTH, Math.max(100, glass.width));
  const safeHeight = Math.min(height, Math.max(80, glass.height));
  return { ...glass, width, height: safeHeight,
    x: Math.min(WIDTH - width, Math.max(0, glass.x)),
    y: Math.min(height - safeHeight, Math.max(0, glass.y)) };
}
