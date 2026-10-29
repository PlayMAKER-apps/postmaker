export interface PreparedImage { data: string; width: number; height: number }

export async function prepareImage(file: File, preserveTransparency = false): Promise<PreparedImage> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPG or WebP image.');
  if (file.size > 20 * 1024 * 1024) throw new Error('The image exceeds the 20 MB upload limit.');
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error('The image could not be decoded.'); }
  try {
    if (bitmap.width * bitmap.height > 70_000_000) throw new Error('The image has too many pixels.');
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image processing is unavailable.');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const mime = preserveTransparency || file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    return { data: canvas.toDataURL(mime, mime === 'image/jpeg' ? .88 : undefined), width: bitmap.width, height: bitmap.height };
  } finally { bitmap.close(); }
}
