import { clampGlass, dimensions, type Design, type Glass, type Match, WIDTH } from './model';

type Context = CanvasRenderingContext2D;
const cache = new Map<string, Promise<HTMLImageElement>>();

async function loadImage(source?: string): Promise<HTMLImageElement | undefined> {
  if (!source) return undefined;
  if (!cache.has(source)) cache.set(source, new Promise((resolve, reject) => {
    const image = new Image();
    if (!source.startsWith('data:') && !source.startsWith('blob:')) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => { cache.delete(source); reject(new Error('An image could not be loaded.')); };
    image.src = source;
  }));
  return cache.get(source);
}

export function coverRect(imageWidth: number, imageHeight: number, width: number, height: number, zoom: number, panX: number, panY: number) {
  if (imageWidth <= 0 || imageHeight <= 0 || width <= 0 || height <= 0) throw new Error('Image and canvas dimensions must be positive.');
  const scale = Math.max(width / imageWidth, height / imageHeight) * Math.max(1, zoom);
  const drawWidth = imageWidth * scale, drawHeight = imageHeight * scale;
  const dx = (width - drawWidth) / 2 + Math.max(0, drawWidth - width) * Math.max(-1, Math.min(1, panX)) / 2;
  const dy = (height - drawHeight) / 2 + Math.max(0, drawHeight - height) * Math.max(-1, Math.min(1, panY)) / 2;
  return { x: dx, y: dy, width: drawWidth, height: drawHeight };
}

function cover(ctx: Context, image: HTMLImageElement, width: number, height: number, design: Design) {
  const rect = coverRect(image.naturalWidth, image.naturalHeight, width, height, design.zoom, design.panX, design.panY);
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
}

function fit(ctx: Context, image: HTMLImageElement | undefined, x: number, y: number, width: number, height: number) {
  if (!image) return;
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}

function label(ctx: Context, value: string, x: number, y: number, maxWidth: number, size: number, align: CanvasTextAlign = 'left') {
  ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.font = `800 ${size}px Arial, sans-serif`;
  ctx.fillText(value, x, y, maxWidth);
}

function panel(ctx: Context, x: number, y: number, width: number, height: number, color: string) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, 30);
  ctx.fillStyle = color; ctx.fill();
}

async function drawMatchCard(ctx: Context, match: Match, x: number, y: number, width: number, height: number, accent: string) {
  const [homeLogo, awayLogo] = await Promise.all([loadImage(match.home.logo), loadImage(match.away.logo)]);
  ctx.fillStyle = '#fff';
  label(ctx, match.competition.toUpperCase(), x + 26, y + 24, width - 52, Math.min(27, width * .06));
  fit(ctx, homeLogo, x + 25, y + height * .22, width * .28, height * .26);
  fit(ctx, awayLogo, x + width * .69, y + height * .22, width * .28, height * .26);
  ctx.fillStyle = accent; label(ctx, 'VS', x + width / 2, y + height * .27, width * .22, 50, 'center');
  ctx.fillStyle = '#fff';
  label(ctx, match.home.name, x + 25, y + height * .55, width * .45, 30);
  label(ctx, match.away.name, x + width - 25, y + height * .55, width * .45, 30, 'right');
  ctx.font = '25px Arial, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`${match.date}  ${match.time}`, x + 25, y + height * .73, width - 50);
  ctx.fillText(match.venue, x + 25, y + height * .84, width - 50);
}

async function drawGlass(ctx: Context, raw: Glass, canvasHeight: number, accent: string) {
  const glass = clampGlass(raw, canvasHeight);
  const { x, y, width, height } = glass;
  ctx.save();
  ctx.shadowColor = '#0009'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 12;
  panel(ctx, x, y, width, height, '#101925b8');
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = '#ffffff9c'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x, y, width, height, 30); ctx.stroke();
  if (glass.kind === 'match' && glass.match) await drawMatchCard(ctx, glass.match, x, y, width, height, accent);
  if (glass.kind === 'sponsor') fit(ctx, await loadImage(glass.image), x + 24, y + 24, width - 48, height - 48);
  ctx.restore();
}

export async function renderDesign(canvas: HTMLCanvasElement, design: Design): Promise<void> {
  const { height } = dimensions(design);
  canvas.width = WIDTH; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable.');
  if (typeof document !== 'undefined' && document.fonts) await document.fonts.ready;
  ctx.fillStyle = design.color; ctx.fillRect(0, 0, WIDTH, height);
  const background = await loadImage(design.background);
  if (background) {
    ctx.save(); ctx.filter = `blur(${Math.max(0, Math.min(30, design.blur))}px)`;
    cover(ctx, background, WIDTH, height, design); ctx.restore();
    ctx.fillStyle = '#07111bc2'; ctx.fillRect(0, 0, WIDTH, height);
  }
  ctx.fillStyle = design.accent; ctx.fillRect(0, 0, 20, height);
  ctx.fillStyle = '#fff';
  label(ctx, design.title.toUpperCase(), 66, 66, 948, 82);
  ctx.fillStyle = design.accent; ctx.fillRect(66, 178, 210, 9);

  if (design.template === 'calendar') {
    const matches = design.matches.slice(0, height === 1920 ? 10 : 7);
    matches.forEach((match, index) => {
      const y = 230 + index * 145;
      panel(ctx, 64, y, 950, 122, '#ffffff20');
      ctx.fillStyle = design.accent; label(ctx, match.date, 90, y + 18, 210, 35);
      ctx.fillStyle = '#fff';
      label(ctx, `${match.home.name}  —  ${match.away.name}`, 320, y + 15, 660, 38);
      ctx.font = '25px Arial, sans-serif'; ctx.fillText(`${match.time}  ·  ${match.venue}`, 320, y + 72, 640);
    });
  }
  if (design.template === 'matchday' && design.match) {
    panel(ctx, 64, 255, 950, 700, '#ffffff20');
    await drawMatchCard(ctx, design.match, 93, 300, 895, 600, design.accent);
  }
  if (design.template === 'result' && design.match) {
    const match = design.match;
    const [homeLogo, awayLogo] = await Promise.all([loadImage(match.home.logo), loadImage(match.away.logo)]);
    panel(ctx, 64, 265, 950, 760, '#ffffff20');
    fit(ctx, homeLogo, 130, 375, 240, 240); fit(ctx, awayLogo, 715, 375, 240, 240);
    ctx.fillStyle = '#fff';
    label(ctx, match.home.name, 252, 660, 360, 40, 'center');
    label(ctx, match.away.name, 828, 660, 360, 40, 'center');
    const homeScore = match.homeScore ?? 0, awayScore = match.awayScore ?? 0;
    ctx.fillStyle = design.accent; label(ctx, `${homeScore} : ${awayScore}`, 540, 770, 800, 140, 'center');
    ctx.fillStyle = '#fff'; label(ctx, match.competition, 540, 970, 800, 32, 'center');
  }
  if (design.template === 'week') {
    for (const glass of design.glasses.filter(item => item.layer === 'behind')) await drawGlass(ctx, glass, height, design.accent);
    const subject = await loadImage(design.subject);
    if (subject) cover(ctx, subject, WIDTH, height, design);
    for (const glass of design.glasses.filter(item => item.layer === 'front')) await drawGlass(ctx, glass, height, design.accent);
  }
  fit(ctx, await loadImage(design.sponsor), 760, height - 175, 235, 105);
}

export function exportPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed.')), 'image/png'));
}
