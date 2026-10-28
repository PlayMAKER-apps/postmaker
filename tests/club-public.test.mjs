import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { parseClubPublic, clubMatches, resolvePublicImage } from '../packages/data-connectors/src/club-public.ts';
import { createDesign } from '../packages/editor-core/src/project.ts';
import { renderDesign } from '../packages/editor-core/src/render.ts';

const source = await readFile(new URL('../examples/webmaker-public-club-0.1.json', import.meta.url), 'utf8');
function fakeCanvas() {
  const calls = [];
  const ctx = new Proxy({}, { get(target, key) { return key in target ? target[key] : (...args) => calls.push([key, ...args]); }, set(target, key, value) { target[key] = value; return true; } });
  return { canvas: { width: 0, height: 0, getContext: () => ctx }, calls };
}

test('WebMAKER fixture validates and maps into Result and Matchday without invented scores', async () => {
  const document = parseClubPublic(source);
  assert.equal(document.club.name, 'Aurora Sport Club');
  const matches = clubMatches(document);
  assert.equal(matches.length, 2);
  assert.deepEqual([matches[0].homeScore, matches[0].awayScore], [78, 72]);
  assert.equal(matches[1].homeScore, undefined);
  for (const template of ['result', 'matchday']) {
    const design = createDesign(template);
    design.matches = matches.map(match => ({ ...match, home: { ...match.home, logo: undefined }, away: { ...match.away, logo: undefined } }));
    design.match = design.matches[0];
    const { canvas, calls } = fakeCanvas();
    await renderDesign(canvas, design);
    assert.equal(canvas.width, 1080);
    assert.ok(calls.some(call => call[0] === 'fillText' && String(call[1]).includes(template === 'result' ? '78 : 72' : 'Aurora')));
  }
});

test('unsupported versions, missing fields and broken results fail clearly', () => {
  const fixture = JSON.parse(source);
  assert.throws(() => parseClubPublic(JSON.stringify({ ...fixture, schema_version: '0.2' })), /version/);
  const missing = structuredClone(fixture); delete missing.club.timezone;
  assert.throws(() => parseClubPublic(JSON.stringify(missing)), /identity or branding/);
  const broken = structuredClone(fixture); broken.results[0].fixture_id = 'demo-02';
  assert.throws(() => parseClubPublic(JSON.stringify(broken)), /final fixture/);
  const privateField = structuredClone(fixture); privateField.club.private_phone = '123';
  assert.throws(() => parseClubPublic(JSON.stringify(privateField)), /unsupported field/);
});

test('root-relative images resolve using the source origin', () => {
  const document = parseClubPublic(source);
  assert.equal(resolvePublicImage('/assets/logo.png', document), 'https://example.github.io/assets/logo.png');
});
