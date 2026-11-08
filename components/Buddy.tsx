'use client';

import { useEffect, useRef, useState } from 'react';
import { reducedMotion } from '@/lib/pixel';

// "Tea": the loader's cup, grown legs and a face. It pops up from the bottom corner once you start
// scrolling, walks while you scroll (facing the way you go), says something about the section you
// stop on, hops when tapped, and ducks away when the contact section takes over.
// Drawn on one small canvas; it only redraws when its frame changes, a few times a second at most.
const W = 23, H = 19, CELL = 4;
const C = { o: '#FF9600', d: '#9A4F00', w: '#F7F3EC', k: '#111111', s: 'rgba(255,255,255,.75)' };

type Frame = 'stand' | 'walkA' | 'walkB' | 'blink';
function cellsFor(f: Frame, steam: number) {
  const out: [number, number, string][] = [];
  const put = (x: number, y: number, c: string) => out.push([x, y, c]);
  // steam: two short wisps that sway between frames
  const sx = steam ? 1 : 0;
  [[6 + sx, 0], [7 - sx, 1], [6 + sx, 2], [11 - sx, 1], [12 + sx, 2], [11 - sx, 3]].forEach(([x, y]) => put(x, y, C.s));
  for (let x = 2; x <= 17; x++) put(x, 4, C.w);                       // rim
  for (let y = 5; y <= 13; y++) for (let x = 2; x <= 17; x++) put(x, y, C.o); // body
  for (let x = 3; x <= 16; x++) put(x, 14, C.o);                      // rounded base
  [[18, 6], [19, 6], [20, 7], [20, 8], [20, 9], [19, 10], [18, 10]].forEach(([x, y]) => put(x, y, C.o)); // handle
  // face
  if (f === 'blink') { [6, 7, 12, 13].forEach((x) => put(x, 9, C.k)); }
  else { [[6, 8], [7, 8], [6, 9], [7, 9], [12, 8], [13, 8], [12, 9], [13, 9]].forEach(([x, y]) => put(x, y, C.k)); put(7, 8, C.w); put(13, 8, C.w); }
  [9, 10].forEach((x) => put(x, 11, C.k));
  // legs
  const legs = f === 'walkA' ? [[4, 5], [14, 15]] : f === 'walkB' ? [[6, 7], [12, 13]] : [[5, 6], [13, 14]];
  legs.forEach(([a, b], i) => {
    const lift = (f === 'walkA' && i === 1) || (f === 'walkB' && i === 0) ? 1 : 0;
    for (let y = 15; y <= 17 - lift; y++) { put(a, y, C.o); put(b, y, C.o); }
    put(i === 0 ? a - 1 : b + 1, 17 - lift, C.o);
  });
  return out;
}

const LINES: Record<string, string> = {
  about: "That's Isaac up there.",
  services: 'He does all of this.',
  work: 'Pick a world!',
  faq: 'Ask away.',
};
const TAPS = ['Hi!', 'Tea break?', 'Keep scrolling!', 'Made pixel by pixel.', 'Careful, I’m hot.'];

export default function Buddy() {
  const box = useRef<HTMLButtonElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [say, setSay] = useState('');
  const sayRef = useRef<(s: string, ms?: number) => void>(() => {});

  useEffect(() => {
    const el = box.current, c = cv.current;
    if (!el || !c) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = (W + 1) * CELL * dpr; c.height = (H + 1) * CELL * dpr;
    const ctx = c.getContext('2d')!;
    const k = CELL * dpr;
    let last = '';
    const draw = (f: Frame, steam: number) => {
      const key = f + steam;
      if (key === last) return;
      last = key;
      ctx.clearRect(0, 0, c.width, c.height);
      const cells = cellsFor(f, steam);
      ctx.fillStyle = C.d; // the darker side gives it depth, like a little 3D block
      cells.forEach(([x, y, col]) => { if (col !== C.s) ctx.fillRect((x + 1) * k, (y + 1) * k, k, k); });
      cells.forEach(([x, y, col]) => { ctx.fillStyle = col; ctx.fillRect(x * k, y * k, k, k); });
    };
    draw('stand', 0);

    const rm = reducedMotion();
    let walking = false, step = 0, lastY = scrollY, tick = 0 as unknown as ReturnType<typeof setInterval>;
    let stopT = 0 as unknown as ReturnType<typeof setTimeout>, idleT = stopT, sayT = stopT, blinkT = stopT;
    let saidFor = '';

    const say = (s: string, ms = 2600) => { clearTimeout(sayT); setSay(s); sayT = setTimeout(() => setSay(''), ms); };
    sayRef.current = say;

    const where = () => {
      const mid = innerHeight * 0.5;
      for (const id of ['faq', 'work', 'services', 'about']) {
        const s = document.getElementById(id);
        if (s) { const r = s.getBoundingClientRect(); if (r.top < mid && r.bottom > mid) return id; }
      }
      return '';
    };

    const blink = () => {
      blinkT = setTimeout(() => {
        if (!walking && el.classList.contains('up')) { draw('blink', step % 2); setTimeout(() => !walking && draw('stand', step % 2), 140); }
        blink();
      }, 2800 + Math.random() * 2400);
    };
    blink();

    const update = () => {
      const y = scrollY;
      const contact = document.getElementById('contact');
      const hero = document.querySelector('.hero');
      // stay hidden in the tunnel; come out once the About section has landed
      const inHero = hero ? hero.getBoundingClientRect().bottom - innerHeight > 40 : y < innerHeight * 0.6;
      const away = inHero || (contact ? contact.getBoundingClientRect().top < innerHeight * 0.55 : false);
      el.classList.toggle('up', !away);
      if (away) { setSay(''); return; }
      if (y !== lastY) el.classList.toggle('left', y < lastY);
      lastY = y;
      if (rm) return;
      if (!walking) {
        walking = true;
        clearInterval(tick);
        tick = setInterval(() => { step++; draw(step % 2 ? 'walkA' : 'walkB', step % 2); }, 150);
      }
      clearTimeout(stopT); clearTimeout(idleT);
      stopT = setTimeout(() => { walking = false; clearInterval(tick); draw('stand', step % 2); }, 180);
      idleT = setTimeout(() => {
        const w = where();
        if (w && w !== saidFor && LINES[w]) { saidFor = w; say(LINES[w]); }
      }, 1100);
    };
    addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      removeEventListener('scroll', update);
      clearInterval(tick); [stopT, idleT, sayT, blinkT].forEach(clearTimeout);
    };
  }, []);

  const tap = () => {
    const el = box.current;
    if (!el) return;
    el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop');
    sayRef.current(TAPS[Math.floor(Math.random() * TAPS.length)], 1800);
  };

  return (
    <button type="button" className="buddy" ref={box} onClick={tap} aria-label="Tea, the site mascot. Tap to say hi.">
      <span className={`buddy-say${say ? ' on' : ''}`} aria-live="polite">{say}</span>
      <span className="buddy-body"><canvas ref={cv} /></span>
    </button>
  );
}
