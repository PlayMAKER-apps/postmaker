import { clampElement, dimensions, type Design, type Match, type TemplateElement, WIDTH } from './model.ts';
import { copyTemplate } from './templates.ts';

type Ctx = CanvasRenderingContext2D;
const imageCache = new Map<string, Promise<HTMLImageElement>>();

async function image(source: string | undefined, warnings: string[]): Promise<HTMLImageElement | undefined> {
  if (!source) return;
  if (!imageCache.has(source)) imageCache.set(source, new Promise((resolve, reject) => {
    const img = new Image();
    if (!source.startsWith('data:') && !source.startsWith('blob:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => { imageCache.delete(source); reject(new Error('Image unavailable or blocked by CORS.')); };
    img.src = source;
  }));
  try { return await imageCache.get(source); }
  catch { warnings.push('An image is missing or blocked by CORS.'); return; }
}

export function coverRect(iw: number, ih: number, width: number, height: number, zoom: number, panX: number, panY: number) {
  if (iw <= 0 || ih <= 0 || width <= 0 || height <= 0) throw new Error('Image dimensions must be positive.');
  const scale = Math.max(width / iw, height / ih) * Math.max(1, zoom);
  const w = iw * scale, h = ih * scale;
  return { x: (width - w) / 2 + Math.max(0, w - width) * Math.max(-1, Math.min(1, panX)) / 2,
    y: (height - h) / 2 + Math.max(0, h - height) * Math.max(-1, Math.min(1, panY)) / 2, width: w, height: h };
}
function cover(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number, design: Design) {
  const box = coverRect(img.naturalWidth, img.naturalHeight, w, h, design.zoom, design.panX, design.panY);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + box.x, y + box.y, box.width, box.height); ctx.restore();
}
function fit(ctx: Ctx, img: HTMLImageElement | undefined, x: number, y: number, w: number, h: number) {
  if (!img) return;
  const s = Math.min(w / img.naturalWidth, h / img.naturalHeight), dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}
function box(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(30, w / 10, h / 10)); ctx.fillStyle = fill; ctx.fill();
}
function write(ctx: Ctx, value: string, x: number, y: number, w: number, size: number, design: Design, align: CanvasTextAlign = 'left') {
  ctx.textAlign = align; ctx.textBaseline = 'top'; ctx.font = `bold ${size}px "${design.font ?? 'Arial'}", Arial, sans-serif`;
  ctx.fillText(value, x, y, w);
}
function selectedMatch(design: Design, element: TemplateElement): Match | undefined {
  return design.matches.find(match => match.id === element.matchId) ?? design.match;
}
async function teamLogo(ctx: Ctx, source: string | undefined, name: string, x: number, y: number, size: number, design: Design, warnings: string[]) {
  const loaded = await image(source, warnings);
  if (loaded) fit(ctx, loaded, x, y, size, size);
  else { box(ctx, x, y, size, size, '#ffffff28'); ctx.fillStyle = '#fff'; write(ctx, name.slice(0, 2).toUpperCase() || '?', x + size / 2, y + size * .32, size * .8, size * .35, design, 'center'); }
}
async function matchCard(ctx: Ctx, match: Match | undefined, x: number, y: number, w: number, h: number, design: Design, warnings: string[], glass: boolean) {
  ctx.save(); ctx.shadowColor = '#0008'; ctx.shadowBlur = glass ? 26 : 0; box(ctx, x, y, w, h, glass ? '#172638db' : '#ffffff20'); ctx.restore();
  if (glass) { ctx.strokeStyle = '#ffffffa0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, y, w, h, 30); ctx.stroke(); }
  const inset = Math.max(22, w * .045), logo = Math.min(w * .2, h * .25);
  ctx.fillStyle = '#fff'; write(ctx, match?.competition.toUpperCase() || 'COMPETITION', x + inset, y + h * .07, w - 2 * inset, Math.min(34, w * .045), design);
  await teamLogo(ctx, match?.home.logo, match?.home.name ?? 'HOME', x + inset, y + h * .24, logo, design, warnings);
  await teamLogo(ctx, match?.away.logo, match?.away.name ?? 'AWAY', x + w - inset - logo, y + h * .24, logo, design, warnings);
  ctx.fillStyle = design.accent; write(ctx, 'VS', x + w / 2, y + h * .28, w * .18, Math.min(58, w * .07), design, 'center');
  ctx.fillStyle = '#fff';
  write(ctx, match?.home.name || 'Home team', x + inset, y + h * .56, w * .43, 34, design);
  write(ctx, match?.away.name || 'Away team', x + w - inset, y + h * .56, w * .43, 34, design, 'right');
  ctx.font = `26px "${design.font ?? 'Arial'}", Arial, sans-serif`; ctx.textAlign = 'left';
  ctx.fillText(`${match?.date || 'Date'}  ${match?.time || 'Time'}`, x + inset, y + h * .73, w - inset * 2);
  ctx.fillText(match?.venue || 'Venue', x + inset, y + h * .83, w - inset * 2);
  if (match?.player) ctx.fillText(`Player: ${match.player}`, x + inset, y + h * .91, w - inset * 2);
}
async function resultCard(ctx: Ctx, match: Match | undefined, x: number, y: number, w: number, h: number, design: Design, warnings: string[]) {
  box(ctx, x, y, w, h, '#ffffff20'); const size = Math.min(210, w * .22);
  await teamLogo(ctx, match?.home.logo, match?.home.name ?? 'HOME', x + w * .1, y + h * .14, size, design, warnings);
  await teamLogo(ctx, match?.away.logo, match?.away.name ?? 'AWAY', x + w * .68, y + h * .14, size, design, warnings);
  ctx.fillStyle = '#fff';
  write(ctx, match?.home.name || 'Home team', x + w * .22, y + h * .47, w * .4, 39, design, 'center');
  write(ctx, match?.away.name || 'Away team', x + w * .78, y + h * .47, w * .4, 39, design, 'center');
  const home = match?.homeScore == null ? '–' : String(match.homeScore), away = match?.awayScore == null ? '–' : String(match.awayScore);
  ctx.fillStyle = design.accent; write(ctx, `${home} : ${away}`, x + w / 2, y + h * .66, w * .82, 140, design, 'center');
  ctx.fillStyle = '#fff'; write(ctx, match?.competition || 'Competition', x + w / 2, y + h * .9, w * .8, 30, design, 'center');
}
function calendar(ctx: Ctx, matches: Match[], x: number, y: number, w: number, h: number, design: Design) {
  const rowHeight = Math.min(145, h / Math.max(1, matches.length));
  matches.slice(0, Math.floor(h / 90)).forEach((match, i) => {
    const top = y + i * rowHeight;
    box(ctx, x, top, w, rowHeight - 12, '#ffffff20');
    ctx.fillStyle = design.accent; write(ctx, match.date, x + 24, top + 18, w * .22, 34, design);
    ctx.fillStyle = '#fff'; write(ctx, `${match.home.name} — ${match.away.name}`, x + w * .26, top + 12, w * .7, 38, design);
    ctx.font = `25px "${design.font ?? 'Arial'}", Arial, sans-serif`; ctx.textAlign = 'left';
    ctx.fillText(`${match.time} · ${match.venue}`, x + w * .26, top + 64, w * .7);
  });
}
async function drawElement(ctx: Ctx, source: TemplateElement, design: Design, outputHeight: number, warnings: string[]) {
  if (source.visible === false) return;
  const element = clampElement(source), { x, width: w } = element, y = element.y * outputHeight / 1350, h = element.height * outputHeight / 1350;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  switch (element.kind) {
    case 'headline': ctx.fillStyle = '#fff'; write(ctx, (element.text || design.title).toUpperCase(), x, y, w, Math.min(82, h * .83), design); break;
    case 'calendar': calendar(ctx, design.matches, x, y, w, h, design); break;
    case 'match': case 'glass': await matchCard(ctx, selectedMatch(design, element), x, y, w, h, design, warnings, element.kind === 'glass'); break;
    case 'result': await resultCard(ctx, selectedMatch(design, element), x, y, w, h, design, warnings); break;
    case 'text': ctx.fillStyle = element.fill || '#fff'; write(ctx, element.text || 'Text', x, y, w, Math.min(72, h * .75), design); break;
    case 'shape': box(ctx, x, y, w, h, element.fill || design.accent); break;
    case 'image': case 'sponsor': fit(ctx, await image(element.image || (element.kind === 'sponsor' ? design.sponsor : undefined), warnings), x, y, w, h); break;
    case 'subject': { const loaded = await image(element.image || design.subject, warnings); if (loaded) cover(ctx, loaded, x, y, w, h, design); break; }
  }
  ctx.restore();
}

export async function renderDesign(canvas: HTMLCanvasElement, design: Design): Promise<string[]> {
  const { height } = dimensions(design); canvas.width = WIDTH; canvas.height = height;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas 2D is unavailable.');
  const warnings: string[] = [];
  if (typeof document !== 'undefined' && document.fonts) await document.fonts.ready;
  ctx.fillStyle = design.color; ctx.fillRect(0, 0, WIDTH, height);
  const background = await image(design.background, warnings);
  if (background) {
    ctx.save(); ctx.filter = `blur(${Math.max(0, Math.min(30, design.blur))}px)`; cover(ctx, background, 0, 0, WIDTH, height, design); ctx.restore();
    ctx.fillStyle = '#07111bb0'; ctx.fillRect(0, 0, WIDTH, height);
  }
  ctx.fillStyle = design.accent; ctx.fillRect(0, 0, 20, height);
  const elements = design.elements ?? copyTemplate(design.template);
  for (const item of elements.filter(e => e.kind !== 'subject' && e.layer === 'behind')) await drawElement(ctx, item, design, height, warnings);
  for (const item of elements.filter(e => e.kind === 'subject')) await drawElement(ctx, item, design, height, warnings);
  for (const item of elements.filter(e => e.kind !== 'subject' && e.layer === 'front')) await drawElement(ctx, item, design, height, warnings);
  return [...new Set(warnings)];
}
export function exportPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed.')), 'image/png'));
}
