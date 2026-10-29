import { useEffect, useRef, useState } from 'react';
import { activeGraphic, addGraphic, clampElement, copyTemplate, createDesign, createProject, createProjectZip, dimensions, duplicateGraphic, exportPng, parseProjectBackup, renderDesign, serializeProject,
  type BrandAsset, type Design, type ElementKind, type Match, type Project, type Template, type TemplateElement, type Team } from '../../../packages/editor-core/src';
import { clubMatches, fetchClubPublic, importGamesCsv, parseClubPublic, resolvePublicImage, validateClubPublic, type PublicClubDocument } from '../../../packages/data-connectors/src';
import { Field, Panel } from '../../../packages/ui/src';
import { prepareImage } from './assets';
import { desktopImageFile, isDesktopRuntime, openDesktopFile, saveDesktopFile } from './desktop';
import { activateUpdate, registerPwa } from './pwa';
import { clearProjects, deleteProject, listProjects, requestPersistentStorage, saveProject, storageStatus, type StorageStatus } from './storage';

const templates: Template[] = ['calendar', 'week', 'matchday', 'result'];
const elementKinds: ElementKind[] = ['text', 'shape', 'glass', 'image', 'sponsor'];
const newId = () => crypto.randomUUID();
const blankMatch = (): Match => ({ id: newId(), home: { id: newId(), name: '' }, away: { id: newId(), name: '' }, competition: '', date: '', time: '', venue: '' });
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
async function shareOrDownload(blob: Blob, filename: string, title: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.maxTouchPoints > 0 && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title });
    return 'Shared from this device.';
  }
  downloadBlob(blob, filename);
  return 'Download started.';
}
function bytes(value?: number) {
  if (value == null) return 'unavailable';
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
function imageOfTeam(team: Team, project: Project): Team {
  const brandTeam = project.brand.teams.find(item => item.id === team.id || item.name.toLowerCase() === team.name.toLowerCase());
  return { ...team, logo: team.logo || brandTeam?.logo };
}
function renderable(project: Project): Design {
  const design = activeGraphic(project).design;
  const matches = project.matches.map(match => ({ ...match, home: imageOfTeam(match.home, project), away: imageOfTeam(match.away, project) }));
  return { ...design, matches, match: matches.find(match => match.id === design.selectedMatchId) ?? matches[0],
    sponsor: design.sponsor || project.brand.sponsors[0]?.image,
    elements: (design.elements ?? copyTemplate(design.template)).map(element => element.id === 'club-logo' && !element.image ? { ...element, image: project.brand.logo } : element) };
}

export function App() {
  const desktop = isDesktopRuntime();
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [saveState, setSaveState] = useState('Saved locally');
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [selectedElementId, setSelectedElementId] = useState('');
  const [clubPreview, setClubPreview] = useState<{ document: PublicClubDocument; kind: 'file' | 'url'; url?: string } | null>(null);
  const [clubUrl, setClubUrl] = useState('');
  const [importMode, setImportMode] = useState(false);
  const [localStorage, setLocalStorage] = useState<StorageStatus>({});
  const [offlineReady, setOfflineReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [projectPath, setProjectPath] = useState<string>();
  const [lastExportPath, setLastExportPath] = useState<string>();
  const [fileDirty, setFileDirty] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderSequence = useRef(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    listProjects().then(items => setProjects(items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
      .catch(error => setMessage(error instanceof Error ? error.message : 'Local projects could not be loaded.'))
      .finally(() => setLoaded(true));
    void storageStatus().then(setLocalStorage).catch(() => {});
    const change = () => setOnline(navigator.onLine);
    window.addEventListener('online', change); window.addEventListener('offline', change);
    return () => { window.removeEventListener('online', change); window.removeEventListener('offline', change); };
  }, []);

  useEffect(() => {
    void registerPwa({
      onReady: () => setOfflineReady(true),
      onUpdate: worker => setWaitingWorker(worker),
      onError: error => setMessage(`PWA setup failed: ${error}`)
    });
  }, []);

  useEffect(() => {
    if (!desktop || !fileDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [desktop, fileDirty]);

  useEffect(() => {
    if (!project) return;
    setSaveState('Unsaved changes');
    const timer = setTimeout(() => {
      const snapshot = project;
      setSaveState('Saving locally…');
      saveQueue.current = saveQueue.current.catch(() => {}).then(() => saveProject(snapshot));
      saveQueue.current.then(() => { setSaveState('Saved locally'); setProjects(items => [snapshot, ...items.filter(item => item.id !== snapshot.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))); void storageStatus().then(setLocalStorage).catch(() => {}); })
        .catch(error => { setSaveState('Save failed'); setMessage(error instanceof Error ? error.message : 'Local save failed. Export a JSON backup.'); });
    }, 350);
    return () => clearTimeout(timer);
  }, [project]);

  const design = project ? activeGraphic(project).design : null;
  const liveDesign = project ? renderable(project) : null;
  const selected = design?.elements?.find(element => element.id === selectedElementId);
  useEffect(() => {
    if (!liveDesign) return;
    const id = ++renderSequence.current, frame = document.createElement('canvas');
    setReady(false);
    renderDesign(frame, liveDesign).then(warnings => {
      if (id !== renderSequence.current || !canvas.current) return;
      canvas.current.width = frame.width; canvas.current.height = frame.height;
      canvas.current.getContext('2d')?.drawImage(frame, 0, 0);
      setReady(true);
      if (warnings.length) setMessage(warnings.join(' '));
    }).catch(error => { if (id === renderSequence.current) setMessage(error instanceof Error ? error.message : 'Rendering failed.'); });
  }, [project]);

  function changeProject(map: (current: Project) => Project) {
    if (desktop) setFileDirty(true);
    setProject(current => current ? { ...map(current), updatedAt: new Date().toISOString() } : current);
  }
  function changeDesign(patch: Partial<Design>) {
    changeProject(current => ({ ...current, graphics: current.graphics.map(graphic => graphic.id === current.activeGraphicId ? { ...graphic, design: { ...graphic.design, ...patch } } : graphic) }));
  }
  function changeElement(id: string, patch: Partial<TemplateElement>) {
    if (!design) return;
    changeDesign({ elements: (design.elements ?? []).map(element => element.id === id ? clampElement({ ...element, ...patch }) : element) });
  }
  function selectTemplate(template: Template) {
    if (!project || !design) return;
    const fresh = createDesign(template, project.brand);
    changeDesign({ ...fresh, format: design.format, selectedMatchId: design.selectedMatchId, background: design.background, backgroundSourceSize: design.backgroundSourceSize, color: design.color, accent: design.accent });
    setSelectedElementId('');
  }
  function addMatch() {
    const match = blankMatch();
    changeProject(current => ({ ...current, matches: [...current.matches, match], graphics: current.graphics.map(graphic => graphic.id === current.activeGraphicId ? { ...graphic, design: { ...graphic.design, selectedMatchId: match.id } } : graphic) }));
  }
  function changeMatch(patch: Partial<Match>) {
    if (!design?.selectedMatchId) return;
    changeProject(current => ({ ...current, matches: current.matches.map(match => match.id === design.selectedMatchId ? { ...match, ...patch } : match) }));
  }
  function changeScore(side: 'homeScore' | 'awayScore', value: string) {
    if (value && !/^\d{1,3}$/.test(value)) return;
    changeMatch({ [side]: value === '' ? undefined : Number(value) });
  }
  async function upload(file: File | undefined, apply: (data: string, size: { width: number; height: number }) => void, transparent = false) {
    if (!file) return;
    try { const prepared = await prepareImage(file, transparent); apply(prepared.data, prepared); setMessage('Image added to this local project.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Image upload failed.'); }
  }
  async function uploadSubject(file?: File) {
    if (!file || !design) return;
    if (file.type !== 'image/png') { setMessage('The subject overlay must be a transparent PNG.'); return; }
    if (!design.backgroundSourceSize) { setMessage('Add a background photo first.'); return; }
    try {
      const prepared = await prepareImage(file, true);
      if (prepared.width !== design.backgroundSourceSize.width || prepared.height !== design.backgroundSourceSize.height) throw new Error('The subject PNG must match the background photo dimensions.');
      changeDesign({ subject: prepared.data }); setMessage('Subject overlay added.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Subject upload failed.'); }
  }
  function changeBrandColor(key: 'primaryColor' | 'accentColor', value: string) {
    changeProject(current => ({ ...current,
      brand: { ...current.brand, [key]: value },
      graphics: current.graphics.map(graphic => graphic.id === current.activeGraphicId ? { ...graphic, design: { ...graphic.design, [key === 'primaryColor' ? 'color' : 'accent']: value } } : graphic)
    }));
  }
  function savePreset() {
    if (!design) return;
    const name = prompt('Preset name', `${design.template} preset`);
    if (!name?.trim()) return;
    changeProject(current => ({ ...current, brand: { ...current.brand, presets: [...current.brand.presets,
      { id: newId(), name: name.trim(), template: design.template, color: design.color, accent: design.accent, font: design.font ?? 'Arial', elements: structuredClone(design.elements ?? []) }] } }));
  }
  function applyPreset(id: string) {
    const preset = project?.brand.presets.find(item => item.id === id);
    if (!preset) return;
    changeDesign({ template: preset.template, color: preset.color, accent: preset.accent, font: preset.font, elements: structuredClone(preset.elements) });
    setSelectedElementId('');
  }
  async function importCsv(file?: File) {
    if (!file) return;
    try {
      const matches = importGamesCsv(await file.text());
      changeProject(current => ({ ...current, matches, graphics: current.graphics.map(graphic => ({ ...graphic, design: { ...graphic.design, selectedMatchId: matches.some(match => match.id === graphic.design.selectedMatchId) ? graphic.design.selectedMatchId : matches[0]?.id } })) }));
      setMessage(`${matches.length} matches imported.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'CSV import failed.'); }
  }
  async function previewClubFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('Public club file is too large.');
      setClubPreview({ document: parseClubPublic(await file.text()), kind: 'file' });
      setMessage('Public club data validated. Review the preview before importing.');
    } catch (error) { setClubPreview(null); setMessage(error instanceof Error ? error.message : 'Public club import failed.'); }
  }
  async function previewClubUrl(url = clubUrl) {
    try {
      const document = await fetchClubPublic(url);
      setClubPreview({ document, kind: 'url', url });
      setMessage('Public club data validated. Review the preview before importing.');
    } catch (error) { setClubPreview(null); setMessage(error instanceof Error ? error.message : 'Public club fetch failed.'); }
  }
  function applyClubPreview() {
    if (!clubPreview) return;
    const { document, kind, url } = clubPreview;
    const imported = clubMatches(document);
    changeProject(current => {
      const byId = new Map(current.matches.map(match => [match.id, match]));
      for (const match of imported) byId.set(match.id, match);
      const teams = document.squads.map(squad => document.teams.find(team => team.id === squad.team_id)!).map(team => ({ id: team.id, name: team.name, logo: resolvePublicImage(team.logo_url, document) }));
      const firstMatch = imported[0]?.id;
      return { ...current, name: current.name === 'My club' ? document.club.name : current.name,
        brand: { ...current.brand, clubName: document.club.name, primaryColor: document.club.branding.primary_color, accentColor: document.club.branding.accent_color,
          logo: resolvePublicImage(document.club.branding.logo_url, document), teams,
          sponsors: (document.sponsors ?? []).map(sponsor => ({ id: sponsor.id, name: sponsor.name, image: resolvePublicImage(sponsor.logo_url, document)!, license: sponsor.license ?? 'Public source' })) },
        matches: [...byId.values()],
        graphics: current.graphics.map(graphic => graphic.id === current.activeGraphicId ? { ...graphic, design: {
          ...graphic.design, color: document.club.branding.primary_color, accent: document.club.branding.accent_color,
          selectedMatchId: graphic.design.selectedMatchId || firstMatch
        } } : graphic),
        publicSource: { kind, url, exportedAt: document.exported_at, importedAt: new Date().toISOString(),
          selectedSquadId: document.squads[0]?.id, selectedRosterId: document.rosters?.[0]?.id, snapshot: document }
      };
    });
    setClubPreview(null); setImportMode(false); setMessage(`${imported.length} public fixtures imported. Missing fields remain editable.`);
  }
  async function importProjectBytes(data: Uint8Array, filename: string, path?: string) {
    const imported = parseProjectBackup(data, filename);
    if (imported.publicSource) validateClubPublic(imported.publicSource.snapshot);
    if (projects.some(item => item.id === imported.id) && !confirm(`Replace local project "${imported.name}" with this backup?`)) return;
    await saveProject(imported);
    setProjects(items => [imported, ...items.filter(item => item.id !== imported.id)]);
    setProject(imported); setProjectPath(path); setFileDirty(false); setSelectedElementId(''); setMessage('Project file imported.');
  }
  async function importJson(file?: File) {
    if (!file) return;
    try {
      await importProjectBytes(new Uint8Array(await file.arrayBuffer()), file.name);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Project import failed.'); }
  }
  async function openDesktopProject() {
    try { const file = await openDesktopFile('project'); if (file) await importProjectBytes(file.bytes, file.name, file.path); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Desktop project open failed.'); }
  }
  async function openDesktopPublicData() {
    try {
      const file = await openDesktopFile('public-data');
      if (!file) return;
      setClubPreview({ document: parseClubPublic(new TextDecoder().decode(file.bytes)), kind: 'file' });
      setMessage(`Validated public club data from ${file.path}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Public club import failed.'); }
  }
  async function openDesktopImage(target: 'background' | 'subject' | 'club-logo') {
    try {
      const selected = await openDesktopFile('image');
      if (!selected) return;
      const file = desktopImageFile(selected);
      if (target === 'subject') await uploadSubject(file);
      else if (target === 'club-logo') await upload(file, data => changeProject(current => ({ ...current, brand: { ...current.brand, logo: data } })));
      else await upload(file, (data, sourceSize) => changeDesign({ background: data, backgroundSourceSize: sourceSize, subject: undefined }));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Desktop image open failed.'); }
  }
  async function closeProject() {
    if (!project) return;
    if (desktop && fileDirty && !confirm('This project has changes not saved to its file. Return to the project list anyway? The local recovery cache will remain available.')) return;
    try { await saveQueue.current.catch(() => {}); await saveProject(project); setProject(null); setProjectPath(undefined); setFileDirty(false); setSelectedElementId(''); setSaveState('Saved locally'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Save failed. Export a JSON backup before closing.'); }
  }
  async function removeProject(item: Project) {
    if (!confirm(`Delete local project "${item.name}"? Export a backup first if needed.`)) return;
    try { await deleteProject(item.id); setProjects(items => items.filter(project => project.id !== item.id)); if (project?.id === item.id) setProject(null); setLocalStorage(await storageStatus()); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Project deletion failed.'); }
  }
  async function removeAllLocalData() {
    if (!confirm('Delete every local PostMAKER project from this browser? Export backups first.')) return;
    try { await clearProjects(); setProjects([]); setProject(null); setLocalStorage(await storageStatus()); setMessage('All local projects were deleted from this browser.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Local data deletion failed.'); }
  }
  async function makeStoragePersistent() {
    try { const granted = await requestPersistentStorage(); setLocalStorage(await storageStatus()); setMessage(granted ? 'The browser granted persistent storage.' : 'Persistent storage was not granted. Keep JSON backups.'); }
    catch { setMessage('Persistent storage could not be requested. Keep JSON backups.'); }
  }
  async function exportJson() {
    if (!project) return;
    try {
      const name = `${project.name.trim().replace(/[^a-z0-9-]+/gi, '-').toLowerCase() || 'postmaker'}-backup.json`;
      if (desktop) { const path = await saveDesktopFile(new TextEncoder().encode(serializeProject(project)), name, 'project-json'); if (path) { setLastExportPath(path); setMessage(`JSON backup saved to ${path}`); } }
      else setMessage(await shareOrDownload(new Blob([serializeProject(project)], { type: 'application/json' }), name, 'PostMAKER project backup'));
    }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Backup export failed.'); }
  }
  async function exportZip() {
    if (!project) return;
    try {
      const name = `${project.name.trim().replace(/[^a-z0-9-]+/gi, '-').toLowerCase() || 'postmaker'}-backup.zip`;
      const data = createProjectZip(project);
      if (desktop) { const path = await saveDesktopFile(data, name, 'project-zip'); if (path) { setLastExportPath(path); setMessage(`ZIP backup saved to ${path}`); } }
      else setMessage(await shareOrDownload(new Blob([Uint8Array.from(data).buffer], { type: 'application/zip' }), name, 'PostMAKER ZIP backup'));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'ZIP backup export failed.'); }
  }
  async function saveDesktopProject(saveAs = false) {
    if (!project || !desktop) return;
    try {
      const zip = !saveAs && projectPath?.toLowerCase().endsWith('.zip');
      const name = `${project.name.trim().replace(/[^a-z0-9-]+/gi, '-').toLowerCase() || 'postmaker'}.${zip ? 'zip' : 'postmaker.json'}`;
      const data = zip ? createProjectZip(project) : new TextEncoder().encode(serializeProject(project));
      const path = await saveDesktopFile(data, name, zip ? 'project-zip' : 'project-json', saveAs ? undefined : projectPath);
      if (path) { setProjectPath(path); setFileDirty(false); setMessage(`Project saved to ${path}`); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Desktop project save failed.'); }
  }
  async function exportImage() {
    if (!ready || !canvas.current || !design) return;
    try {
      const name = `postmaker-${design.template}-${design.format}.png`, blob = await exportPng(canvas.current);
      if (desktop) { const path = await saveDesktopFile(new Uint8Array(await blob.arrayBuffer()), name, 'png'); if (path) { setLastExportPath(path); setMessage(`PNG saved to ${path}`); } }
      else setMessage(await shareOrDownload(blob, name, 'PostMAKER graphic'));
    }
    catch (error) { setMessage(error instanceof Error ? error.message : 'PNG export failed.'); }
  }
  function addElement(kind: ElementKind) {
    if (!design) return;
    const element: TemplateElement = { id: newId(), kind, layer: 'front', x: 110, y: 310, width: kind === 'text' ? 500 : 700, height: kind === 'text' ? 110 : 420, visible: true, text: kind === 'text' ? 'Your text' : undefined, matchId: design.selectedMatchId };
    changeDesign({ elements: [...(design.elements ?? []), element] }); setSelectedElementId(element.id);
  }
  const match = project?.matches.find(item => item.id === design?.selectedMatchId);
  let connected: PublicClubDocument | null = null;
  try { if (project?.publicSource) connected = validateClubPublic(project.publicSource.snapshot); } catch { /* A damaged cache can be disconnected. */ }
  const size = design ? dimensions(design) : null;

  if (!loaded) return <div className="loading">Loading local projects…</div>;
  if (!project || !design || !size) return <div className="app"><header><img src={`${import.meta.env.BASE_URL}postmaker.png`} alt="PostMAKER logo" /><div><p>PLAYMAKER / POSTMAKER</p><h1>Sports graphics workspace</h1></div><span className="badge">{desktop ? 'Windows desktop · offline core' : online ? offlineReady ? 'Offline ready' : 'Online' : 'Offline'}</span></header>
    <main className="welcome"><div className="welcome-lead"><p className="eyebrow">WELCOME</p><h2>Create sports graphics on your device</h2><p>{desktop ? 'Create or open a local PostMAKER project. Files are read and written only after you choose them in a Windows dialog.' : 'Use PostMAKER in a browser or install the PWA after its first online load. Projects stay in this browser; export JSON backups for recovery.'}</p><div className="welcome-actions"><button className="primary" onClick={() => { const next = createProject(); setProject(next); setProjectPath(undefined); setFileDirty(desktop); }}>Start Manual mode</button>{desktop && <button onClick={() => void openDesktopProject()}>Open JSON or ZIP project</button>}<button onClick={() => { const next = createProject(); setProject(next); setProjectPath(undefined); setFileDirty(desktop); setImportMode(true); }}>Import from WebMAKER</button><label className="file-button">Import project JSON or ZIP<input type="file" accept=".json,.zip,application/json,application/zip" onChange={event => void importJson(event.target.files?.[0])} /></label></div>{waitingWorker && <button className="update-button" onClick={() => activateUpdate(waitingWorker)}>Update PostMAKER now</button>}</div>
    <section className="project-list"><h2>Local projects</h2>{projects.length ? projects.map(item => <div className="project-row" key={item.id}><div><strong>{item.name}</strong><small>{item.graphics.length} graphics · {item.matches.length} matches</small></div><button onClick={() => { setProject(item); setProjectPath(undefined); setFileDirty(desktop); }}>Open</button><button className="quiet" onClick={() => void removeProject(item)}>Delete</button></div>) : <p>No local projects yet.</p>}<div className="storage-status"><span>Storage used: {bytes(localStorage.usage)}{localStorage.quota ? ` of ${bytes(localStorage.quota)}` : ''}</span><span>{localStorage.persisted ? 'Persistent storage granted' : 'Storage may be cleared by the runtime'}</span></div><div className="action-row"><button onClick={() => void makeStoragePersistent()} disabled={localStorage.persisted}>Request persistent storage</button><button className="danger" onClick={() => void removeAllLocalData()} disabled={!projects.length}>Delete all local data</button></div><small>{desktop ? 'The local project list is a convenience cache. Use Save or Save as to create an explicit project file.' : 'Offline use starts only after one successful online visit. Browser storage is not an indefinite backup.'}</small></section>{message && <p role="status" className="message">{message}</p>}</main></div>;

  return <div className="app"><header><img src={`${import.meta.env.BASE_URL}postmaker.png`} alt="PostMAKER logo" /><div><p>PLAYMAKER / POSTMAKER</p><h1>{project.name}</h1></div><span className="badge">{desktop ? fileDirty || !projectPath ? 'Desktop · file changes not saved' : 'Desktop · project file saved' : online ? saveState : `${saveState} · offline`}</span></header>
    <nav className="toolbar"><button onClick={() => void closeProject()}>Projects</button><select aria-label="Current graphic" value={project.activeGraphicId} onChange={event => changeProject(current => ({ ...current, activeGraphicId: event.target.value }))}>{project.graphics.map(graphic => <option key={graphic.id} value={graphic.id}>{graphic.name}</option>)}</select><button onClick={() => changeProject(current => addGraphic(current, design.template))}>New graphic</button><button onClick={() => changeProject(current => duplicateGraphic(current, current.activeGraphicId))}>Duplicate</button>{desktop && <><button className="primary-save" onClick={() => void saveDesktopProject()}>Save</button><button onClick={() => void saveDesktopProject(true)}>Save as</button><button onClick={() => void exportZip()}>Backup ZIP</button></>}<button className="backup" onClick={() => void exportJson()}>{desktop ? 'Backup JSON' : 'Share or export backup'}</button>{waitingWorker && <button className="update-button" onClick={() => activateUpdate(waitingWorker)}>Update app</button>}</nav>{desktop && <div className="desktop-paths"><span>Project file: {projectPath ?? 'not selected'}</span>{lastExportPath && <span>Last export: {lastExportPath}</span>}</div>}
    <nav className="mobile-steps" aria-label="Editor sections"><a href="#project-panel">Template</a><a href="#brand-panel">Brand</a><a href="#match-panel">Match</a><a href="#photo-panel">Photo</a><a href="#preview-panel">Export</a></nav><p className="mobile-note">Small-screen mode supports the complete form workflow. Precise layer positioning still uses numeric controls and is easier on a larger screen.</p>
    <main><div className="controls">
      {desktop && <Panel id="desktop-files" title="Desktop file actions"><p>Every path is chosen in a Windows dialog. PostMAKER does not scan or modify other folders.</p><div className="action-row"><button onClick={() => void openDesktopPublicData()}>Import WebMAKER JSON</button><button onClick={() => void openDesktopImage('background')}>Choose background image</button><button onClick={() => void openDesktopImage('subject')}>Choose subject PNG</button><button onClick={() => void openDesktopImage('club-logo')}>Choose club logo</button><button onClick={() => void exportZip()}>Save ZIP backup</button></div></Panel>}
      <Panel id="webmaker-panel" title="WebMAKER public data"><p>Import a public club 0.1 JSON file or HTTPS URL. Data is validated before it changes this project.</p><div className="action-row"><label className="file-button">Choose public JSON<input type="file" accept=".json,application/json" onChange={event => void previewClubFile(event.target.files?.[0])} /></label><input aria-label="Public club HTTPS URL" type="url" placeholder="https://club.example/data/playmaker-club-0.1.json" value={clubUrl} onChange={event => setClubUrl(event.target.value)} /><button onClick={() => void previewClubUrl()} disabled={!clubUrl.trim()}>Preview URL</button></div>{clubPreview && <div className="import-preview"><strong>{clubPreview.document.club.name}</strong><p>{clubPreview.document.club.sport} · {clubPreview.document.teams.length} teams · {clubPreview.document.squads.length} squads · {clubPreview.document.fixtures.length} fixtures · {clubPreview.document.results.length} results · {clubPreview.document.rosters?.length ?? 0} rosters</p><p>Exported {clubPreview.document.exported_at}. Available fields: team names, competition, date, time, venue, scores{clubPreview.document.players ? ', players and rosters' : ''}.</p><ul>{clubPreview.document.fixtures.slice(0, 5).map(fixture => <li key={fixture.id}>{fixture.date} · {fixture.home_team_id} vs {fixture.away_team_id} · {fixture.status}</li>)}</ul><button className="primary" onClick={applyClubPreview}>Import into project</button><button className="quiet" onClick={() => setClubPreview(null)}>Cancel</button></div>}{connected && project.publicSource && <div className="connected-data"><p>Data updated at {project.publicSource.exportedAt} · imported {project.publicSource.importedAt} · {project.publicSource.kind === 'url' ? 'HTTPS source' : 'local file cache'}</p><div className="action-row">{project.publicSource.kind === 'url' && <button onClick={() => void previewClubUrl(project.publicSource?.url)}>Refresh</button>}<button className="quiet" onClick={() => changeProject(current => ({ ...current, publicSource: undefined }))}>Disconnect source</button></div><div className="fields"><label>Squad<select value={project.publicSource.selectedSquadId ?? ''} onChange={event => changeProject(current => ({ ...current, publicSource: { ...current.publicSource!, selectedSquadId: event.target.value, selectedRosterId: undefined } }))}><option value="">Choose squad</option>{connected.squads.map(squad => <option key={squad.id} value={squad.id}>{squad.label ?? squad.id}</option>)}</select></label><label>Roster<select value={project.publicSource.selectedRosterId ?? ''} onChange={event => changeProject(current => ({ ...current, publicSource: { ...current.publicSource!, selectedRosterId: event.target.value } }))}><option value="">Choose roster</option>{(connected.rosters ?? []).filter(roster => !project.publicSource?.selectedSquadId || roster.squad_id === project.publicSource.selectedSquadId).map(roster => <option key={roster.id} value={roster.id}>{roster.id}</option>)}</select></label></div>{project.publicSource.selectedRosterId && <label className="field"><span>Use roster player in selected match</span><select value="" onChange={event => { const player = connected.players?.find(item => item.id === event.target.value); if (player) changeMatch({ player: player.name }); }}><option value="">Choose player</option>{(connected.rosters ?? []).find(roster => roster.id === project.publicSource?.selectedRosterId)?.player_ids.map(id => { const player = connected.players?.find(item => item.id === id); return player ? <option key={id} value={id}>{player.name}</option> : null; })}</select></label>}</div>}{importMode && !clubPreview && !connected && <p>Choose a WebMAKER public export to begin.</p>}</Panel>
      <Panel title="1. Project and template"><div className="fields"><Field label="Project name" value={project.name} onChange={name => changeProject(current => ({ ...current, name }))} /><Field label="Graphic name" value={activeGraphic(project).name} onChange={name => changeProject(current => ({ ...current, graphics: current.graphics.map(graphic => graphic.id === current.activeGraphicId ? { ...graphic, name } : graphic) }))} /></div><div className="template-grid">{templates.map(template => <button key={template} className={design.template === template ? 'selected' : ''} onClick={() => selectTemplate(template)}>{template}</button>)}</div><div className="format-grid">{(['post', 'story', 'square'] as const).map(format => <button key={format} className={design.format === format ? 'selected' : ''} onClick={() => changeDesign({ format })}>{format} · 1080 × {format === 'story' ? '1920' : format === 'square' ? '1080' : '1350'}</button>)}</div><Field label="Headline" value={design.title} onChange={title => changeDesign({ title })} /></Panel>
      <Panel title="2. Brand Kit"><div className="fields"><Field label="Club name" value={project.brand.clubName} onChange={clubName => changeProject(current => ({ ...current, brand: { ...current.brand, clubName } }))} /><label>Font<select value={project.brand.font} onChange={event => { const font = event.target.value as Design['font']; changeProject(current => ({ ...current, brand: { ...current.brand, font: font! } })); changeDesign({ font }); }}><option>Arial</option><option>Georgia</option><option>Trebuchet MS</option></select></label><label>Primary color<input type="color" value={design.color} onChange={event => changeBrandColor('primaryColor', event.target.value)} /></label><label>Accent color<input type="color" value={design.accent} onChange={event => changeBrandColor('accentColor', event.target.value)} /></label></div><label className="file-button">Upload club logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void upload(event.target.files?.[0], data => changeProject(current => ({ ...current, brand: { ...current.brand, logo: data } })))} /></label><div className="subheading"><strong>Teams</strong><button onClick={() => changeProject(current => ({ ...current, brand: { ...current.brand, teams: [...current.brand.teams, { id: newId(), name: 'New team' }] } }))}>Add team</button></div>{project.brand.teams.map(team => <div className="team-row" key={team.id}><Field label="Team name" value={team.name} onChange={name => changeProject(current => ({ ...current, brand: { ...current.brand, teams: current.brand.teams.map(item => item.id === team.id ? { ...item, name } : item) } }))} /><label className="file-button">Logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void upload(event.target.files?.[0], data => changeProject(current => ({ ...current, brand: { ...current.brand, teams: current.brand.teams.map(item => item.id === team.id ? { ...item, logo: data } : item) } })))} /></label><button className="quiet" onClick={() => changeProject(current => ({ ...current, brand: { ...current.brand, teams: current.brand.teams.filter(item => item.id !== team.id) } }))}>Remove</button></div>)}<div className="subheading"><strong>Sponsors and assets</strong><label className="file-button">Add sponsor<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void upload(event.target.files?.[0], data => { const asset: BrandAsset = { id: newId(), name: event.target.files?.[0]?.name ?? 'Sponsor', image: data, license: 'User supplied' }; changeProject(current => ({ ...current, brand: { ...current.brand, sponsors: [...current.brand.sponsors, asset] } })); })} /></label></div>{project.brand.sponsors.map(asset => <div className="asset-row" key={asset.id}><span>{asset.name}</span><input aria-label={`License for ${asset.name}`} value={asset.license} onChange={event => changeProject(current => ({ ...current, brand: { ...current.brand, sponsors: current.brand.sponsors.map(item => item.id === asset.id ? { ...item, license: event.target.value } : item) } }))} /><button className="quiet" onClick={() => changeProject(current => ({ ...current, brand: { ...current.brand, sponsors: current.brand.sponsors.filter(item => item.id !== asset.id) } }))}>Remove</button></div>)}</Panel>
      <Panel title="Brand assets and presets"><div className="action-row"><label className="file-button">Add brand asset<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file = event.target.files?.[0]; void upload(file, data => { const asset: BrandAsset = { id: newId(), name: file?.name ?? 'Asset', image: data, license: 'User supplied' }; changeProject(current => ({ ...current, brand: { ...current.brand, assets: [...current.brand.assets, asset] } })); }); }} /></label><button onClick={savePreset}>Save current as preset</button></div>{project.brand.assets.map(asset => <div className="asset-row" key={asset.id}><span>{asset.name}</span><input aria-label={`License for ${asset.name}`} value={asset.license} onChange={event => changeProject(current => ({ ...current, brand: { ...current.brand, assets: current.brand.assets.map(item => item.id === asset.id ? { ...item, license: event.target.value } : item) } }))} />{selected && (selected.kind === 'image' || selected.kind === 'sponsor') && <button onClick={() => changeElement(selected.id, { image: asset.image })}>Use in layer</button>}<button className="quiet" onClick={() => changeProject(current => ({ ...current, brand: { ...current.brand, assets: current.brand.assets.filter(item => item.id !== asset.id) } }))}>Remove</button></div>)}<label className="field"><span>Apply preset</span><select value="" onChange={event => applyPreset(event.target.value)}><option value="">Choose preset</option>{project.brand.presets.map(preset => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label></Panel>      <Panel title="3. Match data"><p>Matches belong to this project and can be reused by every graphic.</p><div className="action-row"><button onClick={addMatch}>Add match manually</button><label className="file-button">Import match CSV<input type="file" accept=".csv,text/csv" onChange={event => void importCsv(event.target.files?.[0])} /></label></div><select aria-label="Selected match" value={design.selectedMatchId ?? ''} onChange={event => changeDesign({ selectedMatchId: event.target.value })}><option value="">Select a match</option>{project.matches.map(item => <option key={item.id} value={item.id}>{item.home.name || 'Home'} vs {item.away.name || 'Away'} · {item.date || 'No date'}</option>)}</select>{match && <><div className="fields"><Field label="Home team" value={match.home.name} onChange={name => changeMatch({ home: { ...match.home, name } })} /><Field label="Away team" value={match.away.name} onChange={name => changeMatch({ away: { ...match.away, name } })} /><Field label="Competition" value={match.competition} onChange={competition => changeMatch({ competition })} /><Field label="Date" value={match.date} type="date" onChange={date => changeMatch({ date })} /><Field label="Time" value={match.time} type="time" onChange={time => changeMatch({ time })} /><Field label="Venue" value={match.venue} onChange={venue => changeMatch({ venue })} /><Field label="Home score" value={match.homeScore == null ? '' : String(match.homeScore)} onChange={value => changeScore('homeScore', value)} /><Field label="Away score" value={match.awayScore == null ? '' : String(match.awayScore)} onChange={value => changeScore('awayScore', value)} /><Field label="Player" value={match.player ?? ''} onChange={player => changeMatch({ player })} /></div><button className="quiet" onClick={() => changeProject(current => ({ ...current, matches: current.matches.filter(item => item.id !== match.id), graphics: current.graphics.map(graphic => ({ ...graphic, design: graphic.design.selectedMatchId === match.id ? { ...graphic.design, selectedMatchId: undefined } : graphic.design })) }))}>Remove match</button></>}</Panel>
      <Panel title="4. Photo and layers"><div className="action-row"><label className="file-button">Background photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void upload(event.target.files?.[0], (data, sourceSize) => changeDesign({ background: data, backgroundSourceSize: sourceSize, subject: undefined }))} /></label><label className="file-button">Subject PNG<input type="file" accept="image/png" onChange={event => void uploadSubject(event.target.files?.[0])} /></label></div><div className="fields">{(['zoom', 'panX', 'panY', 'blur'] as const).map(key => <label key={key}>{key} · {design[key]}<input type="range" min={key === 'zoom' ? 1 : key === 'blur' ? 0 : -1} max={key === 'zoom' ? 2 : key === 'blur' ? 30 : 1} step={key === 'blur' ? 1 : .05} value={design[key]} onChange={event => changeDesign({ [key]: Number(event.target.value) })} /></label>)}</div><div className="subheading"><strong>Template layers</strong><div className="action-row">{elementKinds.map(kind => <button key={kind} onClick={() => addElement(kind)}>+ {kind}</button>)}</div></div><div className="layer-list">{design.elements?.map(element => <button key={element.id} className={selectedElementId === element.id ? 'selected' : ''} onClick={() => setSelectedElementId(element.id)}>{element.kind} · {element.id.slice(0, 8)}</button>)}</div>{selected && <div className="layer-editor"><div className="fields"><label>Layer<select value={selected.layer} onChange={event => changeElement(selected.id, { layer: event.target.value as TemplateElement['layer'] })}><option value="behind">Behind subject</option><option value="front">In front</option></select></label><label>Visible<input type="checkbox" checked={selected.visible !== false} onChange={event => changeElement(selected.id, { visible: event.target.checked })} /></label>{(['x', 'y', 'width', 'height'] as const).map(key => <label key={key}>{key}<input type="number" min="0" max={key === 'y' || key === 'height' ? 1350 : 1080} value={selected[key]} onChange={event => changeElement(selected.id, { [key]: Number(event.target.value) })} /></label>)}{(selected.kind === 'text' || selected.kind === 'headline') && <Field label="Text" value={selected.text ?? ''} onChange={text => changeElement(selected.id, { text })} />}{(selected.kind === 'shape' || selected.kind === 'text') && <label>Fill<input type="color" value={selected.fill || design.accent} onChange={event => changeElement(selected.id, { fill: event.target.value })} /></label>}{(selected.kind === 'glass' || selected.kind === 'match' || selected.kind === 'result') && <label>Match<select value={selected.matchId || ''} onChange={event => changeElement(selected.id, { matchId: event.target.value })}><option value="">Current match</option>{project.matches.map(item => <option key={item.id} value={item.id}>{item.home.name || 'Home'} vs {item.away.name || 'Away'}</option>)}</select></label>}</div>{(selected.kind === 'image' || selected.kind === 'sponsor') && <label className="file-button">Upload layer image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void upload(event.target.files?.[0], data => changeElement(selected.id, { image: data }))} /></label>}<div className="action-row"><button onClick={() => { const copy = { ...selected, id: newId(), x: Math.min(900, selected.x + 30), y: Math.min(1200, selected.y + 30) }; changeDesign({ elements: [...(design.elements ?? []), copy] }); setSelectedElementId(copy.id); }}>Duplicate layer</button><button className="quiet" onClick={() => { changeDesign({ elements: design.elements?.filter(item => item.id !== selected.id) }); setSelectedElementId(''); }}>Delete layer</button></div></div>}</Panel>
    </div><aside className="preview" id="preview-panel"><div className="preview-title"><h2>Live preview</h2><span>{size.width} × {size.height} px</span></div><canvas ref={canvas} aria-label="PostMAKER design preview" /><button className="export" disabled={!ready} onClick={() => void exportImage()}>{desktop ? 'Export PNG file' : 'Share or download PNG'}</button><button className="backup secondary-backup" onClick={() => void exportJson()}>{desktop ? 'Save JSON backup' : 'Share or export backup'}</button>{message && <p role="status" className="message">{message}</p>}<small>{desktop ? 'IndexedDB autosave is a convenience cache. Save an explicit project file and keep ZIP backups.' : 'Projects auto-save in this browser. Storage may be cleared; keep JSON backups. Offline use requires one successful online visit.'}</small></aside></main></div>;
}
