'use client';

import { useEffect, useRef } from 'react';
import { findPiece } from '@/content/worlds';
import { SITE } from '@/content/site';
import { clamp, reducedMotion } from '@/lib/pixel';

// Work hung on the room's walls: [world, piece, side, depth px, top as share of viewport, width px]
const PLATES: [string, string, 'l' | 'r', number, number, number][] = [
  ['branding', 'eh-billboard', 'l', 520, 0.16, 360], ['fission', 'fission-jt-redo-2', 'r', 760, 0.2, 380],
  ['uiux', 'new-pairs', 'l', 1150, 0.5, 420], ['web3', 'launch-copy-ai', 'r', 1400, 0.48, 380],
  ['branding', 'eh-post2', 'l', 1800, 0.1, 260], ['flyers', 'joji-goe-to-japan-3', 'r', 2050, 0.12, 300],
  ['branding', 'eu-poster2', 'r', 2500, 0.4, 260], ['uiux', 'dappbuilder-2', 'l', 2700, 0.45, 420],
  ['fission', 'fission-tokenomics', 'r', 3100, 0.18, 400], ['web3', 'profit-ai-score', 'l', 3300, 0.2, 380],
];

// The title's mask covers a larger area than its box so the "2026" sticker and name label are included.
const MASK_W = 1.6, MASK_H = 2.0, STEPS = 12;

// Builds a sequence of masks where more and more square cells are knocked out,
// so the title breaks apart pixel by pixel as the camera moves in.
function buildMasks(w: number, h: number) {
  const W = Math.round(w * MASK_W), H = Math.round(h * MASK_H);
  const cell = Math.max(10, Math.round(Math.min(w, h) / 22));
  const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
  const order: number[] = [];
  for (let i = 0; i < cols * rows; i++) order.push(i);
  // cells nearer the centre go last, so the edges crumble first
  const score = (i: number) => { const x = (i % cols) / cols - 0.5, y = Math.floor(i / cols) / rows - 0.5; return Math.random() * 0.8 - Math.hypot(x, y); };
  const s = order.map(score); order.sort((a, b) => s[a] - s[b]);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d')!;
  const masks: string[] = [];
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  let k = 0;
  for (let step = 1; step < STEPS; step++) {
    const target = Math.floor((step / (STEPS - 1)) * order.length);
    for (; k < target; k++) { const i = order[k]; ctx.clearRect((i % cols) * cell, Math.floor(i / cols) * cell, cell, cell); }
    masks.push(c.toDataURL('image/png'));
  }
  return masks; // masks[0] = a few cells gone … masks[last] = everything gone
}

export default function HeroRoom() {
  const hero = useRef<HTMLElement>(null);
  const room = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const coords = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mx = 0, my = 0, smx = 0, smy = 0, raf = 0, step = -1;
    let masks: string[] = [];
    const rm = reducedMotion();
    const make = () => { const t = title.current; if (!t || rm) return; masks = buildMasks(t.offsetWidth, t.offsetHeight); step = -1; };
    (document.fonts?.ready ?? Promise.resolve()).then(make);
    let rt = 0 as unknown as ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(make, 200); };
    addEventListener('resize', onResize);

    const move = (e: PointerEvent) => {
      mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
      if (coords.current) coords.current.textContent = `x ${(mx + 0.5).toFixed(2)}  y ${(my + 0.5).toFixed(2)}`;
    };
    addEventListener('pointermove', move, { passive: true });

    const frame = () => {
      smx += (mx - smx) * 0.06; smy += (my - smy) * 0.06;
      const t = title.current, r = room.current, h = hero.current;
      if (!h || !r || !t) return;
      const hr = h.getBoundingClientRect();
      if (hr.bottom > 0) {
        const p = clamp(-hr.top / (hr.height - innerHeight), 0, 1), e = p * p * (3 - 2 * p);
        r.style.transform = `translateZ(${e * 3400}px) rotateY(${smx * 4}deg) rotateX(${-smy * 3}deg)`;
        t.style.transform = `translate(calc(-50% + ${smx * -18}px), calc(-50% + ${smy * -12}px)) scale(${1 + p * 2.2})`;
        // The title breaks apart across most of the zoom (4% → 44%) and only fades at the end (34% → 50%),
        // so scrolling back up rebuilds it pixel by pixel in step with the walls coming back.
        const s = masks.length ? Math.round(clamp((p - 0.04) / 0.4, 0, 1) * masks.length) : 0;
        if (s !== step) {
          step = s;
          const m = s === 0 ? 'none' : `url(${masks[s - 1]})`;
          t.style.maskImage = m; t.style.setProperty('-webkit-mask-image', m);
        }
        t.style.opacity = String(clamp(1 - (p - 0.34) / 0.16, 0, 1));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); removeEventListener('resize', onResize); clearTimeout(rt); };
  }, []);

  const roles = [...SITE.roles, ...SITE.roles, ...SITE.roles, ...SITE.roles];
  return (
    <section className="hero" ref={hero} aria-label="Intro">
      <div className="stage">
        <div className="room" ref={room}>
          <div className="face f-floor" /><div className="face f-ceil" />
          <div className="face f-left" /><div className="face f-right" />
          <div className="face f-back" />
          {PLATES.map(([w, key, side, z, top, width]) => {
            const p = findPiece(w, key);
            if (!p) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={key} src={p.src} alt="" className={`plate ${side}`} width={width} height={Math.round((width * p.h) / p.w)}
                style={{ width, transform: `translateY(${top * 100}vh) translateZ(${-z}px) rotateY(${side === 'l' ? 90 : -90}deg)` }} />
            );
          })}
        </div>
        <div className="corner">{SITE.email}</div>
        <div className="title" ref={title}>
          <div className="by">{SITE.name}</div>
          <h1><span>Design</span><span>Portfolio</span></h1>
          <div className="sticker">2026</div>
        </div>
        <div className="band">
          <div className="track">{roles.map((r, i) => <span key={i} className="role">{r}<i aria-hidden="true" /></span>)}</div>
        </div>
        <div className="coords" ref={coords}>x 0.50  y 0.50</div>
        <div className="scrollhint">Scroll</div>
      </div>
    </section>
  );
}
