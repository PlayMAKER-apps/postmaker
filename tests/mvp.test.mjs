import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createProject, addGraphic, duplicateGraphic, parseProject, serializeProject } from '../packages/editor-core/src/project.ts';
import { copyTemplate, templates } from '../packages/editor-core/src/templates.ts';
import { dimensions } from '../packages/editor-core/src/model.ts';
import { coverRect, renderDesign } from '../packages/editor-core/src/render.ts';

const fixture = { id: 'fixture-1', home: { id: 'hawks', name: 'Harbor Hawks' }, away: { id: 'foxes', name: 'River Foxes' }, competition: 'Community League', date: '2026-11-08', time: '18:30', venue: 'North Hall', homeScore: 72, awayScore: 68 };
function fakeCanvas() {
  const calls = [];
  const ctx = new Proxy({}, { get(target, prop) {
    if (prop in target) return target[prop];
    return (...args) => calls.push([prop, ...args]);
  }, set(target, prop, value) { target[prop] = value; return true; } });
  return { canvas: { width: 0, height: 0, getContext: () => ctx }, calls };
}

test('project JSON survives a round trip and rejects unsupported versions and local paths', () => {
  const project = createProject('Harbor Club', 'project-fixture');
  project.matches.push(fixture);
  project.graphics[0].design.selectedMatchId = fixture.id;
  const roundTrip = parseProject(serializeProject(project));
  assert.deepEqual(roundTrip, project);
  assert.throws(() => parseProject(JSON.stringify({ ...project, schemaVersion: 2 })), /version/);
  assert.throws(() => parseProject(JSON.stringify({ ...project, brand: { ...project.brand, logo: 'C:\\local\\logo.png' } })), /non-portable/);
});

test('graphics share one project match list while duplicated layers remain independent', () => {
  const project = createProject('Harbor Club', 'project-fixture'); project.matches = [fixture];
  const withWeek = addGraphic(project, 'week');
  const duplicate = duplicateGraphic(withWeek, withWeek.activeGraphicId);
  assert.equal(duplicate.matches.length, 1);
  assert.equal(duplicate.graphics.length, 3);
  assert.notEqual(duplicate.graphics[1].design.elements, duplicate.graphics[2].design.elements);
  assert.equal(duplicate.graphics[1].design.selectedMatchId, fixture.id);
});

test('all four versioned templates render at post, story and square sizes', async () => {
  for (const category of ['calendar', 'week', 'matchday', 'result']) {
    assert.equal(templates[category].version, 1);
    for (const format of ['post', 'story', 'square']) {
      const project = createProject('Harbor Club', 'project-fixture');
      const design = project.graphics[0].design;
      design.template = category; design.format = format; design.elements = copyTemplate(category);
      design.matches = [fixture]; design.match = fixture;
      const { canvas, calls } = fakeCanvas();
      const warnings = await renderDesign(canvas, design);
      assert.equal(canvas.height, dimensions(design).height);
      assert.equal(canvas.width, 1080);
      assert.deepEqual(warnings, []);
      assert.ok(calls.some(call => call[0] === 'fillText'), `${category} should draw text`);
      assert.ok(calls.some(call => call[0] === 'fillRect'), `${category} should draw background`);
    }
  }
});

test('crop math clamps pan and rejects invalid images', () => {
  const left = coverRect(2000, 1000, 1080, 1350, 1, -5, 0);
  const right = coverRect(2000, 1000, 1080, 1350, 1, 5, 0);
  assert.ok(left.x < right.x);
  assert.throws(() => coverRect(0, 1000, 1080, 1350, 1, 0, 0), /positive/);
});
