import type { Match, Team } from '../../editor-core/src/model.ts';

export interface PublicClubDocument {
  schema_version: '0.1';
  club: { id: string; name: string; sport: string; timezone: string; branding: { primary_color: string; accent_color: string; logo_url?: string } };
  squads: { id: string; team_id: string; label?: string }[];
  teams: { id: string; name: string; short_name?: string; logo_url?: string }[];
  competitions: { id: string; name: string; season: string; squad_ids: string[] }[];
  fixtures: { id: string; competition_id: string; home_team_id: string; away_team_id: string; date: string; time?: string; venue?: string; status: 'scheduled' | 'final' }[];
  results: { fixture_id: string; home_score: number; away_score: number }[];
  players?: { id: string; name: string; number?: number }[];
  rosters?: { id: string; squad_id: string; competition_id: string; player_ids: string[] }[];
  player_stats?: { fixture_id: string; player_id: string; values: Record<string, number> }[];
  sponsors?: { id: string; name: string; logo_url: string; license?: string }[];
  source: { product: 'webmaker'; site_url: string; base_path: string };
  exported_at: string;
}

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const id = (value: unknown) => string(value) && /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(value);
const only = (value: Record<string, unknown>, keys: string[], label: string) => {
  const extra = Object.keys(value).find(key => !keys.includes(key));
  if (extra) throw new Error(`${label} contains unsupported field ${extra}.`);
};
const array = (value: unknown, name: string): Record<string, unknown>[] => {
  if (!Array.isArray(value) || !value.every(object)) throw new Error(`Public club data requires ${name} array.`);
  return value;
};
const unique = (items: Record<string, unknown>[], name: string) => {
  const ids = items.map(item => item.id);
  if (ids.some(value => !id(value)) || new Set(ids).size !== ids.length) throw new Error(`Invalid or duplicate ${name} ID.`);
  return new Set(ids as string[]);
};
const imageUrl = (value: unknown) => value === undefined || (string(value) && /^(https:\/\/[^\s]+|\/[^\s]+)\.(png|jpe?g|webp|svg)(\?[^\s]*)?$/i.test(value));
const color = (value: unknown) => string(value) && /^#[0-9a-f]{6}$/i.test(value);
const day = (value: unknown) => {
  if (!string(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, date] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, date));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === date;
};
const time = (value: unknown) => value === undefined || (string(value) && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
const score = (value: unknown) => Number.isInteger(value) && Number(value) >= 0;

export function validateClubPublic(value: unknown): PublicClubDocument {
  if (!object(value) || value.schema_version !== '0.1') throw new Error('Unsupported public club schema version. Expected 0.1.');
  only(value, ['schema_version', 'club', 'squads', 'teams', 'competitions', 'fixtures', 'results', 'players', 'rosters', 'player_stats', 'sponsors', 'source', 'exported_at'], 'Public club data');
  if (!object(value.club) || !id(value.club.id) || !string(value.club.name) || !string(value.club.sport) || !string(value.club.timezone) || !object(value.club.branding)) throw new Error('Public club data is missing club identity or branding.');
  only(value.club, ['id', 'name', 'sport', 'timezone', 'branding'], 'Club');
  only(value.club.branding, ['primary_color', 'accent_color', 'logo_url'], 'Branding');
  try { new Intl.DateTimeFormat('en', { timeZone: value.club.timezone }).format(); }
  catch { throw new Error('Invalid club timezone.'); }
  if (!color(value.club.branding.primary_color) || !color(value.club.branding.accent_color) || !imageUrl(value.club.branding.logo_url)) throw new Error('Invalid public branding.');
  if (!object(value.source) || value.source.product !== 'webmaker' || !string(value.source.site_url) || !value.source.site_url.startsWith('https://') || typeof value.source.base_path !== 'string' || !/^$|^\/[A-Za-z0-9/_-]+$/.test(value.source.base_path)) throw new Error('Invalid public source metadata.');
  only(value.source, ['product', 'site_url', 'base_path'], 'Source');
  try { if (new URL(value.source.site_url).protocol !== 'https:') throw new Error(); }
  catch { throw new Error('Invalid public source URL.'); }
  if (!string(value.exported_at) || !/Z$/.test(value.exported_at) || Number.isNaN(Date.parse(value.exported_at))) throw new Error('Invalid export timestamp.');
  const teams = array(value.teams, 'teams'), squads = array(value.squads, 'squads'), competitions = array(value.competitions, 'competitions'), fixtures = array(value.fixtures, 'fixtures'), results = array(value.results, 'results');
  const teamIds = unique(teams, 'team'), squadIds = unique(squads, 'squad'), competitionIds = unique(competitions, 'competition'), fixtureIds = unique(fixtures, 'fixture');
  teams.forEach(item => only(item, ['id', 'name', 'short_name', 'logo_url'], 'Team'));
  squads.forEach(item => only(item, ['id', 'team_id', 'label'], 'Squad'));
  competitions.forEach(item => only(item, ['id', 'name', 'season', 'squad_ids'], 'Competition'));
  fixtures.forEach(item => only(item, ['id', 'competition_id', 'home_team_id', 'away_team_id', 'date', 'time', 'venue', 'status'], 'Fixture'));
  results.forEach(item => only(item, ['fixture_id', 'home_score', 'away_score'], 'Result'));
  if (teams.some(item => !string(item.name) || !imageUrl(item.logo_url))) throw new Error('Invalid public team.');
  if (squads.some(item => !teamIds.has(item.team_id as string))) throw new Error('Squad refers to a missing team.');
  if (competitions.some(item => !string(item.name) || !string(item.season) || !/^\d{4}-\d{2}$/.test(item.season) || !Array.isArray(item.squad_ids) || item.squad_ids.some(id => !squadIds.has(id)))) throw new Error('Competition refers to a missing squad.');
  if (fixtures.some(item => !competitionIds.has(item.competition_id as string) || !teamIds.has(item.home_team_id as string) || !teamIds.has(item.away_team_id as string) || item.home_team_id === item.away_team_id || !day(item.date) || !time(item.time) || !['scheduled', 'final'].includes(item.status as string))) throw new Error('Invalid fixture or missing team/competition.');
  const finalIds = new Set(fixtures.filter(item => item.status === 'final').map(item => item.id));
  if (results.some(item => !fixtureIds.has(item.fixture_id as string) || !finalIds.has(item.fixture_id) || !score(item.home_score) || !score(item.away_score))) throw new Error('Result requires a final fixture and valid scores.');
  if (new Set(results.map(item => item.fixture_id)).size !== results.length) throw new Error('Duplicate result fixture ID.');
  const players = value.players === undefined ? [] : array(value.players, 'players');
  const playerIds = unique(players, 'player');
  players.forEach(item => only(item, ['id', 'name', 'number'], 'Player'));
  if (players.some(item => !string(item.name) || (item.number !== undefined && !score(item.number)))) throw new Error('Invalid public player.');
  const rosters = value.rosters === undefined ? [] : array(value.rosters, 'rosters');
  unique(rosters, 'roster');
  rosters.forEach(item => only(item, ['id', 'squad_id', 'competition_id', 'player_ids'], 'Roster'));
  if (rosters.some(item => !squadIds.has(item.squad_id as string) || !competitionIds.has(item.competition_id as string) || !Array.isArray(item.player_ids) || item.player_ids.some(id => !playerIds.has(id)) || new Set(item.player_ids).size !== item.player_ids.length)) throw new Error('Roster has a missing reference.');
  const sponsors = value.sponsors === undefined ? [] : array(value.sponsors, 'sponsors');
  unique(sponsors, 'sponsor');
  sponsors.forEach(item => only(item, ['id', 'name', 'logo_url', 'license'], 'Sponsor'));
  if (sponsors.some(item => !string(item.name) || !imageUrl(item.logo_url))) throw new Error('Invalid public sponsor.');
  const stats = value.player_stats === undefined ? [] : array(value.player_stats, 'player_stats');
  stats.forEach(item => only(item, ['fixture_id', 'player_id', 'values'], 'Player stat'));
  if (stats.some(item => !fixtureIds.has(item.fixture_id as string) || !playerIds.has(item.player_id as string) || !object(item.values) || Object.values(item.values).some(n => typeof n !== 'number' || n < 0))) throw new Error('Player stat has a missing reference.');
  return value as unknown as PublicClubDocument;
}

export function parseClubPublic(text: string): PublicClubDocument {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('Invalid JSON file.'); }
  return validateClubPublic(parsed);
}

export function resolvePublicImage(url: string | undefined, document: PublicClubDocument): string | undefined {
  if (!url) return;
  return new URL(url, document.source.site_url).href;
}

export function clubMatches(document: PublicClubDocument): Match[] {
  const teams = new Map(document.teams.map(item => [item.id, item]));
  const competitions = new Map(document.competitions.map(item => [item.id, item.name]));
  const results = new Map(document.results.map(item => [item.fixture_id, item]));
  const team = (id: string): Team => {
    const source = teams.get(id)!;
    return { id, name: source.name, logo: resolvePublicImage(source.logo_url, document) };
  };
  return document.fixtures.map(fixture => {
    const result = results.get(fixture.id);
    return { id: fixture.id, home: team(fixture.home_team_id), away: team(fixture.away_team_id),
      competition: competitions.get(fixture.competition_id)!, date: fixture.date, time: fixture.time ?? '', venue: fixture.venue ?? '',
      ...(result ? { homeScore: result.home_score, awayScore: result.away_score } : {}) };
  });
}

export async function fetchClubPublic(url: string, timeoutMs = 8000): Promise<PublicClubDocument> {
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error('Enter a valid public HTTPS URL.'); }
  if (parsed.protocol !== 'https:') throw new Error('Public club URL must use HTTPS.');
  let response: Response;
  try { response = await fetch(parsed.href, { mode: 'cors', credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) }); }
  catch (error) { throw new Error(error instanceof DOMException && error.name === 'TimeoutError' ? 'Public club request timed out.' : 'Public club request failed. Check the URL, network, and CORS headers.'); }
  if (!response.ok) throw new Error(`Public club request returned HTTP ${response.status}.`);
  const body = await response.text();
  if (body.length > 5_000_000) throw new Error('Public club document is too large.');
  return parseClubPublic(body);
}
