import type { Match, Team } from '../../editor-core/src/model';
export * from './club-public.ts';

export interface ImportedGame {
  id: string; homeId: string; awayId: string; date: string; time: string;
  competition?: string; venue?: string; homeScore?: number | null; awayScore?: number | null;
}
export interface MatchSource {
  listMatches(): Promise<Match[]>;
}

export function mapGames(games: ImportedGame[], teams: Record<string, Team>): Match[] {
  return games.map(game => ({
    id: game.id,
    home: teams[game.homeId] ?? { id: game.homeId, name: game.homeId },
    away: teams[game.awayId] ?? { id: game.awayId, name: game.awayId },
    date: game.date, time: game.time, competition: game.competition ?? '', venue: game.venue ?? '',
    ...(game.homeScore == null ? {} : { homeScore: game.homeScore }),
    ...(game.awayScore == null ? {} : { awayScore: game.awayScore })
  }));
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\r' || char === '\n') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field); if (row.some(cell => cell.trim())) rows.push(row);
      row = []; field = '';
    } else field += char;
  }
  if (quoted) throw new Error('CSV has an unterminated quoted field.');
  row.push(field); if (row.some(cell => cell.trim())) rows.push(row);
  return rows;
}

export function importGamesCsv(text: string, teams: Record<string, Team> = {}): Match[] {
  const [rawHeader, ...rows] = parseCsv(text.replace(/^\ufeff/, ''));
  if (!rawHeader) return [];
  const header = rawHeader.map(value => value.trim().toLowerCase());
  for (const column of ['home_team', 'away_team', 'date']) {
    if (!header.includes(column)) throw new Error(`CSV requires ${column}.`);
  }
  const cell = (row: string[], name: string) => row[header.indexOf(name)]?.trim() ?? '';
  return mapGames(rows.map((row, index) => ({
    id: cell(row, 'id') || `csv-${index + 1}`,
    homeId: cell(row, 'home_team'), awayId: cell(row, 'away_team'), date: cell(row, 'date'),
    time: cell(row, 'time'), competition: cell(row, 'competition'), venue: cell(row, 'venue') || cell(row, 'address'),
    homeScore: cell(row, 'home_score') === '' ? null : Number(cell(row, 'home_score')),
    awayScore: cell(row, 'away_score') === '' ? null : Number(cell(row, 'away_score'))
  })), teams);
}
