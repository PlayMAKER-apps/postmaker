export type DesktopFileKind = 'project' | 'project-json' | 'project-zip' | 'public-data' | 'image' | 'png';

export interface DesktopFile {
  path: string;
  name: string;
  bytes: Uint8Array;
}

const filters = {
  project: [{ name: 'PostMAKER project', extensions: ['json', 'zip'] }],
  'project-json': [{ name: 'PostMAKER JSON project', extensions: ['json'] }],
  'project-zip': [{ name: 'PostMAKER ZIP backup', extensions: ['zip'] }],
  'public-data': [{ name: 'Public club JSON', extensions: ['json'] }],
  image: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
  png: [{ name: 'PNG image', extensions: ['png'] }]
} satisfies Record<DesktopFileKind, { name: string; extensions: string[] }[]>;

export function isDesktopRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function fileName(path: string): string {
  return path.split(/[\\/]/).at(-1) || 'file';
}

export async function openDesktopFile(kind: DesktopFileKind): Promise<DesktopFile | null> {
  if (!isDesktopRuntime()) return null;
  const [{ open }, { readFile }] = await Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/plugin-fs')]);
  const selected = await open({ title: kind === 'project' ? 'Open PostMAKER project' : kind === 'public-data' ? 'Import public club data' : 'Choose image', filters: filters[kind], multiple: false, directory: false });
  if (!selected || Array.isArray(selected)) return null;
  return { path: selected, name: fileName(selected), bytes: await readFile(selected) };
}

export async function saveDesktopFile(data: Uint8Array, defaultName: string, kind: DesktopFileKind, existingPath?: string): Promise<string | null> {
  if (!isDesktopRuntime()) return null;
  const [{ save }, { writeFile }] = await Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/plugin-fs')]);
  const path = existingPath ?? await save({ title: kind === 'png' ? 'Export PostMAKER PNG' : 'Save PostMAKER project', defaultPath: defaultName, filters: filters[kind] });
  if (!path) return null;
  await writeFile(path, data);
  return path;
}

export function desktopImageFile(file: DesktopFile): File {
  const extension = file.name.toLowerCase().split('.').at(-1);
  const type = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  return new File([Uint8Array.from(file.bytes).buffer], file.name, { type });
}
