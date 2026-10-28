import { useEffect, useRef, useState } from 'react';
import { dimensions, exportPng, renderDesign, type Design, type Template } from '../../../packages/editor-core/src';
import { importGamesCsv } from '../../../packages/data-connectors/src';
import { Field, Panel } from '../../../packages/ui/src';

const sample = importGamesCsv('id,home_team,away_team,date,time,competition,venue,home_score,away_score\nsample-1,Harbor Hawks,River Foxes,2026-11-08,18:30,Community League,North Hall,72,68\nsample-2,Mountain Bears,Coastal Stars,2026-11-15,20:00,Community League,West Arena,,');
const initial: Design = {
  template: 'matchday', format: 'post', title: 'Game day', color: '#101b2d', accent: '#f0a64a',
  match: sample[0], matches: sample, panX: 0, panY: 0, zoom: 1, blur: 0,
  glasses: [{ id: 'sample-glass', kind: 'match', layer: 'front', x: 110, y: 310, width: 860, height: 630, match: sample[0] }]
};
const templates: Template[] = ['calendar', 'week', 'matchday', 'result'];

export function App() {
  const [design, setDesign] = useState<Design>(initial);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sequence = useRef(0);
  const update = (patch: Partial<Design>) => setDesign(current => ({ ...current, ...patch }));

  useEffect(() => {
    const id = ++sequence.current;
    const frame = document.createElement('canvas'); setReady(false);
    renderDesign(frame, design).then(() => {
      if (id !== sequence.current || !canvas.current) return;
      canvas.current.width = frame.width; canvas.current.height = frame.height;
      canvas.current.getContext('2d')?.drawImage(frame, 0, 0); setReady(true); setMessage('');
    }).catch(error => { if (id === sequence.current) setMessage(error instanceof Error ? error.message : 'Render failed.'); });
  }, [design]);

  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('Choose an image file.'); return; }
    const reader = new FileReader();
    reader.onload = () => update({ background: String(reader.result) });
    reader.readAsDataURL(file);
  }
  async function importCsv(file?: File) {
    if (!file) return;
    try {
      const matches = importGamesCsv(await file.text());
      update({ matches, match: matches[0], glasses: design.glasses.map(glass => glass.kind === 'match' ? { ...glass, match: matches[0] } : glass) });
      setMessage(`${matches.length} matches imported.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'CSV import failed.'); }
  }
  async function download() {
    if (!canvas.current || !ready) return;
    try {
      const url = URL.createObjectURL(await exportPng(canvas.current));
      const link = document.createElement('a'); link.href = url; link.download = `postmaker-${design.template}.png`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'PNG export failed.'); }
  }
  const setMatch = (patch: Partial<NonNullable<Design['match']>>) => {
    if (!design.match) return;
    const match = { ...design.match, ...patch };
    update({ match, matches: design.matches.map(item => item.id === match.id ? match : item),
      glasses: design.glasses.map(glass => glass.kind === 'match' && glass.match?.id === match.id ? { ...glass, match } : glass) });
  };
  const setMatchText = (field: 'competition' | 'date' | 'time' | 'venue', value: string) => setMatch({ [field]: value });
  const size = dimensions(design);
  return <div className="app">
    <header><img src="/postmaker.png" alt="PostMAKER logo" /><div><p>PLAYMAKER / POSTMAKER</p><h1>Sports graphics workspace</h1></div><span className="badge">Prototype 0.1</span></header>
    <main><div className="controls">
      <Panel title="1. Composition"><div className="template-grid">{templates.map(template => <button key={template} className={design.template === template ? 'selected' : ''} onClick={() => update({ template })}>{template}</button>)}</div>
        <div className="format-grid"><button className={design.format === 'post' ? 'selected' : ''} onClick={() => update({ format: 'post' })}>Post · 1080 × 1350</button><button className={design.format === 'story' ? 'selected' : ''} onClick={() => update({ format: 'story' })}>Story · 1080 × 1920</button></div>
        <Field label="Headline" value={design.title} onChange={title => update({ title })} /><div className="colors"><label>Background<input type="color" value={design.color} onChange={event => update({ color: event.target.value })} /></label><label>Accent<input type="color" value={design.accent} onChange={event => update({ accent: event.target.value })} /></label></div></Panel>
      <Panel title="2. Match data"><p>Import a CSV with home_team, away_team and date columns, or edit the selected match.</p><label className="file-button">Import match CSV<input type="file" accept=".csv,text/csv" onChange={event => void importCsv(event.target.files?.[0])} /></label>
        <select aria-label="Selected match" value={design.match?.id ?? ''} onChange={event => { const match = design.matches.find(item => item.id === event.target.value); update({ match }); }}>{design.matches.map(match => <option key={match.id} value={match.id}>{match.home.name} vs {match.away.name}</option>)}</select>
        {design.match && <div className="fields"><Field label="Home team" value={design.match.home.name} onChange={name => setMatch({ home: { ...design.match!.home, name } })} /><Field label="Away team" value={design.match.away.name} onChange={name => setMatch({ away: { ...design.match!.away, name } })} /><Field label="Competition" value={design.match.competition} onChange={value => setMatchText('competition', value)} /><Field label="Date" value={design.match.date} onChange={value => setMatchText('date', value)} /><Field label="Time" value={design.match.time} onChange={value => setMatchText('time', value)} /><Field label="Venue" value={design.match.venue} onChange={value => setMatchText('venue', value)} /></div>}</Panel>
      <Panel title="3. Background"><label className="file-button">Choose local image<input type="file" accept="image/*" onChange={event => void upload(event.target.files?.[0])} /></label><div className="fields"><label>Zoom · {design.zoom.toFixed(2)}<input type="range" min="1" max="2" step=".05" value={design.zoom} onChange={event => update({ zoom: Number(event.target.value) })} /></label><label>Horizontal pan<input type="range" min="-1" max="1" step=".05" value={design.panX} onChange={event => update({ panX: Number(event.target.value) })} /></label><label>Vertical pan<input type="range" min="-1" max="1" step=".05" value={design.panY} onChange={event => update({ panY: Number(event.target.value) })} /></label><label>Blur · {design.blur}px<input type="range" min="0" max="30" value={design.blur} onChange={event => update({ blur: Number(event.target.value) })} /></label></div></Panel>
    </div><aside className="preview"><div className="preview-title"><h2>Live preview</h2><span>{size.width} × {size.height} px</span></div><canvas ref={canvas} aria-label="PostMAKER design preview" /><button className="export" disabled={!ready} onClick={() => void download()}>Download PNG</button>{message && <p role="status">{message}</p>}<small>Files stay in this browser session. This is an early editor prototype.</small></aside></main>
  </div>;
}
