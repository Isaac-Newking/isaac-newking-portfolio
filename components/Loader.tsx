'use client';

import { useEffect, useRef, useState } from 'react';
import { clamp, reducedMotion } from '@/lib/pixel';

// A pixel cup fills with tea (orange, with a moving wave, a lighter crest, rising bubbles and steam),
// then the screen dissolves in blocks into the hero. 1.1s in total; first visit per session only.
const RUN = 780, OUT = 320;

const C = {
  bg: '#000', dot: 'rgba(255,255,255,.07)', line: '#FFFFFF',
  tea: '#FF9600', deep: '#E07A00', crest: '#FFC266', back: '#FFDCA8', bubble: '#FFE6BF', steam: 'rgba(255,255,255,', text: '#FFFFFF',
};

// Cup body is 16 × 13 cells: rim on row 0, walls on columns 0 and 15, a rounded base on row 12.
const W = 16, H = 13, IN_TOP = 1, IN_BOTTOM = 11;
const OUTLINE: [number, number][] = [];
for (let x = 0; x < W; x++) OUTLINE.push([x, 0]);
for (let y = 1; y <= 11; y++) OUTLINE.push([0, y], [W - 1, y]);
for (let x = 1; x < W - 1; x++) OUTLINE.push([x, 12]);
// handle: a pixel C on the right
OUTLINE.push([16, 2], [17, 2], [18, 3], [18, 4], [18, 5], [17, 6], [16, 6]);
// saucer: a long line and a short dash, like the reference
for (let x = -3; x <= 15; x++) OUTLINE.push([x, 14]);
for (let x = 17; x <= 19; x++) OUTLINE.push([x, 14]);

const BUBBLES = [{ x: 4, speed: 0.0085, off: 0 }, { x: 9, speed: 0.011, off: 3.5 }, { x: 12, speed: 0.0072, off: 7 }];

export default function Loader({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [gone, setGone] = useState(false);
  const finishRef = useRef<() => void>(() => {});

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('in-intro') === '1'; } catch { /* storage blocked */ }
    if (reducedMotion() || seen) { setGone(true); onDone(); return; }
    const c = ref.current!, ctx = c.getContext('2d')!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    // the cup and saucer are about 23 cells wide and 22 tall; size cells so it reads on phones and desktops
    const cell = Math.max(6, Math.round(Math.min(c.width / 30, c.height / 46)));
    const cols = Math.ceil(c.width / cell), rows = Math.ceil(c.height / cell);
    const ox = Math.floor(cols / 2 - 8), oy = Math.floor(rows / 2 - 8);
    const pixelFont = getComputedStyle(document.documentElement).getPropertyValue('--font-pixel').trim() || 'monospace';
    const t0 = performance.now();
    let finished = false, raf = 0;

    const px = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect((ox + x) * cell + 1, (oy + y) * cell + 1, cell - 2, cell - 2);
    };

    const draw = (p: number, t: number) => {
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = C.dot;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) ctx.fillRect(x * cell + cell / 2 - 1, y * cell + cell / 2 - 1, 2, 2);

      // tea: level rises with p; each column's surface rides a moving sine wave
      const depth = IN_BOTTOM - IN_TOP + 1;
      const level = 0.4 + p * (depth - 1.4);
      for (let x = 1; x < W - 1; x++) {
        const front = level + Math.sin(x * 0.75 + t * 0.012) * 0.75;
        const back = level + 0.7 + Math.sin(x * 0.75 - t * 0.009 + 2.1) * 0.75;
        for (let y = IN_TOP; y <= IN_BOTTOM; y++) {
          const h = IN_BOTTOM - y + 1; // height of this cell above the base
          if (h <= front) {
            const surface = h > front - 1;
            px(x, y, surface ? C.crest : h <= depth * 0.3 ? C.deep : C.tea);
          } else if (h <= back) {
            px(x, y, C.back);
          }
        }
      }
      // bubbles drift up through the tea
      for (const b of BUBBLES) {
        const span = Math.max(1, Math.floor(level) - 1);
        const rise = ((t * b.speed + b.off) % span);
        const y = IN_BOTTOM - Math.floor(rise);
        if (IN_BOTTOM - y + 1 < level - 0.5) px(b.x, y, C.bubble);
      }
      // cup, handle and saucer on top
      for (const [x, y] of OUTLINE) px(x, y, C.line);
      // steam appears once the cup is nearly full
      if (p > 0.55) {
        const a = clamp((p - 0.55) / 0.45, 0, 1) * 0.55;
        for (const [sx, phase] of [[5, 0], [10, 1.7]] as const) {
          for (let k = 1; k <= 4; k++) {
            const wob = Math.round(Math.sin(k * 1.3 + t * 0.01 + phase));
            px(sx + wob, -k - 1, C.steam + (a * (1 - k / 5)).toFixed(3) + ')');
          }
        }
      }
      // label with ticking dots
      const dots = '.'.repeat(Math.floor(t / 160) % 4);
      ctx.fillStyle = C.text;
      ctx.font = `${Math.round(cell * 1.15)}px ${pixelFont}`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const label = 'LOADING';
      const lw = ctx.measureText(label + '...').width;
      ctx.fillText(label + dots, (ox + 8) * cell - lw / 2, (oy + 16.4) * cell);
    };

    const dissolve = () => {
      const order: [number, number, number][] = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) order.push([x, y, Math.random()]);
      order.sort((a, b) => a[2] - b[2]);
      const s = performance.now();
      c.parentElement!.style.background = 'transparent';
      const step = (now: number) => {
        const q = clamp((now - s) / OUT, 0, 1), k = Math.floor(q * order.length);
        for (let i = 0; i < k; i++) ctx.clearRect(order[i][0] * cell, order[i][1] * cell, cell, cell);
        if (q < 1) raf = requestAnimationFrame(step); else setGone(true);
      };
      raf = requestAnimationFrame(step);
    };
    const finish = () => {
      if (finished) return; finished = true;
      try { sessionStorage.setItem('in-intro', '1'); } catch { /* storage blocked */ }
      cancelAnimationFrame(raf); draw(1, performance.now() - t0); dissolve(); onDone();
    };
    finishRef.current = finish;
    const tick = (now: number) => {
      if (finished) return;
      const t = now - t0, p = clamp(t / RUN, 0, 1);
      draw(p * p * (3 - 2 * p), t);
      if (p < 1) raf = requestAnimationFrame(tick); else finish();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  if (gone) return null;
  return (
    <div className="loader" role="status" aria-label="Loading">
      <canvas ref={ref} />
      <button className="skip" type="button" onClick={() => finishRef.current()}>Skip</button>
    </div>
  );
}
