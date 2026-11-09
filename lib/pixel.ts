// Pixel engine: draw an image at a coarse block size with nearest-neighbour scaling,
// then step the block size down until the image is sharp.

let tiny: HTMLCanvasElement | null = null;

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function drawPixel(canvas: HTMLCanvasElement, img: HTMLImageElement, block: number, cover = false, top = false) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  tiny ??= document.createElement('canvas');
  const tctx = tiny.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  const sw = Math.max(1, Math.round(W / block)), sh = Math.max(1, Math.round(H / block));
  tiny.width = sw; tiny.height = sh;
  let sx = 0, sy = 0, sW = img.naturalWidth, sH = img.naturalHeight;
  if (cover) {
    const r = W / H, ir = sW / sH;
    if (ir > r) { const nw = sH * r; sx = (sW - nw) / 2; sW = nw; } else { const nh = sW / r; sy = top ? 0 : (sH - nh) / 2; sH = nh; }
  }
  tctx.imageSmoothingEnabled = true;
  tctx.drawImage(img, sx, sy, sW, sH, 0, 0, sw, sh);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(tiny, 0, 0, sw, sh, 0, 0, W, H);
}

const STEPS = [56, 40, 28, 20, 14, 10, 7, 5, 3, 2, 1];

export function depixel(canvas: HTMLCanvasElement, img: HTMLImageElement, { cover = false, top = false, step = 60 } = {}) {
  return new Promise<void>((res) => {
    if (reducedMotion()) { drawPixel(canvas, img, 1, cover, top); return res(); }
    let i = 0;
    const tick = () => {
      drawPixel(canvas, img, STEPS[i] * (canvas.width / 900 + 0.4), cover, top);
      if (++i < STEPS.length) setTimeout(tick, step); else res();
    };
    tick();
  });
}

const cache = new Map<string, Promise<HTMLImageElement | null>>();
export function loadImage(src: string) {
  if (!cache.has(src)) {
    cache.set(src, new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = src; }));
  }
  return cache.get(src)!;
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// Work images ship as WebP next to the original JPG/PNG, plus a 1200px copy of anything wider than 1300px
// (made by the image script), so phones and most screens download far less.
const isWork = (src: string) => src.startsWith('/img/work/') && /\.(jpe?g|png)$/i.test(src);
export const webp = (src: string) => (isWork(src) ? src.replace(/\.(jpe?g|png)$/i, '.webp') : src);
export const webpSmall = (src: string, w: number) => (isWork(src) && w > 1300 ? src.replace(/\.(jpe?g|png)$/i, '.w1200.webp') : webp(src));
export const srcSetFor = (src: string, w: number) => (!isWork(src) ? undefined : w > 1300 ? `${webpSmall(src, w)} 1200w, ${webp(src)} ${w}w` : `${webp(src)} ${w}w`);
