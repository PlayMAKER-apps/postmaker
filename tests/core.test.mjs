import assert from 'node:assert/strict';
import { test } from 'node:test';
import { importGamesCsv } from '../packages/data-connectors/src/index.ts';
import { clampGlass } from '../packages/editor-core/src/model.ts';

test('CSV handles quoted commas and maps unknown teams without club defaults', () => {
  const matches = importGamesCsv('home_team,away_team,date,venue,home_score\n"Harbor, Hawks",River Foxes,2026-11-08,"North, Hall",72');
  assert.equal(matches[0].home.name, 'Harbor, Hawks');
  assert.equal(matches[0].venue, 'North, Hall');
  assert.equal(matches[0].homeScore, 72);
  assert.equal(matches[0].awayScore, undefined);
});

test('CSV rejects missing required columns', () => {
  assert.throws(() => importGamesCsv('date,home_team\n2026-11-08,Harbor Hawks'), /away_team/);
});

test('glass positions stay within canvas', () => {
  const glass = clampGlass({ id: '1', kind: 'match', layer: 'front', x: 1200, y: -30, width: 440, height: 500 }, 1350);
  assert.deepEqual([glass.x, glass.y], [640, 0]);
});
