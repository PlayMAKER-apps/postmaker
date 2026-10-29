import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const output = new URL('../dist/web/', import.meta.url);
const template = new URL('../apps/web/sw-template.js', import.meta.url);
const allowed = new Set(['.html', '.js', '.css', '.png', '.webmanifest']);

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]));
  return nested.flat();
}

const outputPath = output.pathname.replace(/^\/(.:\/)/, '$1');
const shell = (await files(outputPath))
  .filter(file => allowed.has(extname(file)) && !file.endsWith('404.html'))
  .map(file => relative(outputPath, file).replaceAll('\\', '/'))
  .sort();
const digest = createHash('sha256').update(shell.join('\n')).digest('hex').slice(0, 12);
const source = (await readFile(template, 'utf8'))
  .replace('__CACHE_VERSION__', `postmaker-shell-${digest}`)
  .replace('__APP_SHELL__', JSON.stringify(shell));
await writeFile(new URL('sw.js', output), source);
