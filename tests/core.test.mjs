import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
async function moduleFrom(path) {
  const source = await readFile(resolve(root, path), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function('exports', code)(exports);
  return exports;
}

test('CSV handles quoted commas and maps unknown teams without club defaults', async () => {
  const { importGamesCsv } = await moduleFrom('packages/data-connectors/src/index.ts');
  const matches = importGamesCsv('home_team,away_team,date,venue,home_score\n"Harbor, Hawks",River Foxes,2026-11-08,"North, Hall",72');
  assert.equal(matches[0].home.name, 'Harbor, Hawks');
  assert.equal(matches[0].venue, 'North, Hall');
  assert.equal(matches[0].homeScore, 72);
  assert.equal(matches[0].awayScore, undefined);
});

test('CSV rejects missing required columns', async () => {
  const { importGamesCsv } = await moduleFrom('packages/data-connectors/src/index.ts');
  assert.throws(() => importGamesCsv('date,home_team\n2026-11-08,Harbor Hawks'), /away_team/);
});

test('glass positions stay within canvas', async () => {
  const { clampGlass } = await moduleFrom('packages/editor-core/src/model.ts');
  const glass = clampGlass({ id: '1', kind: 'match', layer: 'front', x: 1200, y: -30, width: 440, height: 500 }, 1350);
  assert.deepEqual([glass.x, glass.y], [640, 0]);
});
