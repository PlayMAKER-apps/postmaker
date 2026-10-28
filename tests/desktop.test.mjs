import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import { createProject, createProjectZip, parseProjectBackup } from '../packages/editor-core/src/index.ts';

test('ZIP backups use the same validated project model as JSON backups', () => {
  const project = createProject('Desktop Club', 'desktop-project');
  project.brand.primaryColor = '#5b21b6';
  project.graphics[0].design.title = 'Desktop and PWA';
  assert.deepEqual(parseProjectBackup(createProjectZip(project), 'desktop-club.zip'), project);
});

test('Tauri points to the shared web build and has no duplicated editor frontend', async () => {
  const config = JSON.parse(await readFile(new URL('../apps/desktop/src-tauri/tauri.conf.json', import.meta.url), 'utf8'));
  assert.equal(config.build.beforeBuildCommand, 'npm run build:desktop');
  assert.equal(config.build.frontendDist, '../../../dist/desktop');
  assert.equal(config.app.windows[0].label ?? 'main', 'main');
  assert.equal(config.plugins?.updater, undefined);
  const desktopEntries = await readdir(new URL('../apps/desktop/', import.meta.url), { recursive: true });
  const desktopSourceEntries = desktopEntries.filter(entry => !/^src-tauri[\\/](?:target|gen)[\\/]/i.test(entry));
  assert.equal(desktopSourceEntries.some(entry => /\.(tsx?|jsx?)$/i.test(entry)), false, 'desktop must not fork the React editor');
});

test('desktop file permissions require a user-selected dialog path', async () => {
  const capability = JSON.parse(await readFile(new URL('../apps/desktop/src-tauri/capabilities/default.json', import.meta.url), 'utf8'));
  assert.deepEqual(capability.permissions.sort(), ['core:default', 'dialog:allow-open', 'dialog:allow-save', 'fs:allow-read-file', 'fs:allow-write-file'].sort());
  assert.equal(capability.permissions.some(permission => typeof permission === 'object' && permission.identifier === 'fs:scope'), false);
});
