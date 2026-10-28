import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import type { Project } from './model.ts';
import { parseProject, serializeProject } from './project.ts';

const PROJECT_ENTRY = 'postmaker-project.json';

export function createProjectZip(project: Project): Uint8Array {
  return zipSync({ [PROJECT_ENTRY]: strToU8(serializeProject(project)) }, { level: 6 });
}

export function parseProjectBackup(data: Uint8Array, filename = ''): Project {
  const zip = filename.toLowerCase().endsWith('.zip') || (data[0] === 0x50 && data[1] === 0x4b);
  if (!zip) return parseProject(new TextDecoder().decode(data));
  let files: Record<string, Uint8Array>;
  try { files = unzipSync(data); }
  catch { throw new Error('Invalid PostMAKER ZIP backup.'); }
  const entry = files[PROJECT_ENTRY] ?? Object.entries(files).find(([name]) => name.toLowerCase().endsWith('.json'))?.[1];
  if (!entry) throw new Error('ZIP backup does not contain a PostMAKER project JSON file.');
  return parseProject(strFromU8(entry));
}
