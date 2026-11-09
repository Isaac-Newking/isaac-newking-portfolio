'use client';

import { useEffect, useRef } from 'react';
import { SITE } from '@/content/site';
import { clamp, reducedMotion } from '@/lib/pixel';

// Pixel-art panels hung on the room's walls: [file, side, depth px, top as share of viewport, width px, cells wide, cells tall]
// Drawn at 1 px per cell (public/img/pixel) and scaled up crisply, so ten panels weigh about 40KB in total.
const PLATES: [string, 'l' | 'r', number, number, number, number, number][] = [
  ['px-window', 'l', 520, 0.16, 360, 48, 36], ['px-sunset', 'r', 760, 0.2, 380, 48, 36],
  ['px-pen', 'l', 1150, 0.5, 400, 48, 36], ['px-rocket', 'r', 1400, 0.42, 270, 36, 48],
  ['px-avatar', 'l', 1800, 0.08, 260, 36, 48], ['px-palette', 'r', 2050, 0.12, 330, 48, 36],
  ['px-cup', 'r', 2500, 0.42, 300, 48, 36], ['px-layers', 'l', 2700, 0.45, 380, 48, 36],
  ['px-gamepad', 'r', 3100, 0.18, 380, 48, 36], ['px-heart', 'l', 3300, 0.2, 260, 36, 48],
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
    // the title's break-apart masks are only needed once you scroll, so build them when the browser is idle
    // (or at the first scroll), keeping the first second of the page free for the loader and hero
    let built = false;
    const buildOnce = () => { if (built) return; built = true; removeEventListener('scroll', buildOnce); (document.fonts?.ready ?? Promise.resolve()).then(make); };
    addEventListener('scroll', buildOnce, { passive: true });
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) ric(buildOnce, { timeout: 2500 }); else setTimeout(buildOnce, 1200);
    let rt = 0 as unknown as ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(make, 200); };
    addEventListener('resize', onResize);

    const move = (e: PointerEvent) => {
      mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
      if (coords.current) coords.current.textContent = `x ${(mx + 0.5).toFixed(2)}  y ${(my + 0.5).toFixed(2)}`;
    };
    addEventListener('pointermove', move, { passive: true });

    // The About section waits at the end of the tunnel. During the fly-in a copy of its first screen sits
    // inside the sticky stage, so the browser keeps it pinned (no scroll correction, no shake), and only its
    // scale changes. When the copy fills the screen the real section is exactly underneath and takes over.
    const next = document.getElementById('about');
    let mt = 0, kS = -1, ghost: HTMLDivElement | null = null;
    const measure = () => { if (next) mt = parseFloat(getComputedStyle(next).marginTop) || 0; };
    measure();
    addEventListener('resize', measure);
    const makeGhost = () => {
      const stage = hero.current?.querySelector('.stage');
      if (!next || !stage) return null;
      const g = document.createElement('div');
      g.className = 'portal';
      const copy = next.cloneNode(true) as HTMLElement;
      copy.removeAttribute('id');
      copy.style.margin = '0';
      copy.style.visibility = 'visible';
      copy.setAttribute('aria-hidden', 'true');
      // canvases (the avatar) don't copy their pixels with the DOM
      const src = next.querySelectorAll('canvas'), dst = copy.querySelectorAll('canvas');
      dst.forEach((cv, i) => { const o = src[i]; if (o && o.width) cv.getContext('2d')?.drawImage(o, 0, 0); });
      g.appendChild(copy);
      stage.appendChild(g);
      return g;
    };
    const dropGhost = () => { ghost?.remove(); ghost = null; };
    const showReal = (on: boolean) => { if (next) next.style.visibility = on ? '' : 'hidden'; };

    const frame = () => {
      smx += (mx - smx) * 0.06; smy += (my - smy) * 0.06;
      const t = title.current, r = room.current, h = hero.current;
      if (!h || !r || !t) return;
      const hr = h.getBoundingClientRect();
      if (next && !rm && mt < 0) {
        const L = -mt, top = hr.top + hr.height + mt; // where the real section sits now
        const target = clamp(1 - top / L, 0, 1);
        if (kS < 0) kS = target;
        kS += (target - kS) * 0.22; // gentle easing of the zoom only; the position is pinned by the browser
        if (Math.abs(target - kS) < 0.001 || top <= 0) kS = target;
        if (kS > 0 && kS < 1) {
          if (!ghost) ghost = makeGhost();
          showReal(false);
          if (ghost) {
            const e = kS * kS * (3 - 2 * kS), sc = Math.exp(Math.log(0.04) * (1 - e));
            ghost.style.transform = `scale(${sc.toFixed(4)})`;
            ghost.style.opacity = String(clamp(kS / 0.08, 0, 1));
          }
        } else {
          dropGhost();
          showReal(kS >= 1);
        }
      }
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
        r.classList.toggle('lit', -hr.top > 4);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); removeEventListener('resize', onResize); removeEventListener('resize', measure); removeEventListener('scroll', buildOnce); clearTimeout(rt); dropGhost(); showReal(true); };
  }, []);

  const roles = [...SITE.roles, ...SITE.roles, ...SITE.roles, ...SITE.roles];
  return (
    <section className="hero" ref={hero} aria-label="Intro">
      <div className="stage">
        <div className="room" ref={room}>
          <div className="face f-floor" /><div className="face f-ceil" />
          <div className="face f-left" /><div className="face f-right" />
          <div className="face f-back" />
          {PLATES.map(([file, side, z, top, width, cw, ch]) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={file} src={`/img/pixel/${file}.png`} alt="" className={`plate px-plate ${side}`} width={width} height={Math.round((width * ch) / cw)} decoding="async"
              style={{ width, transform: `translateY(${top * 100}vh) translateZ(${-z}px) rotateY(${side === 'l' ? 90 : -90}deg)` }} />
          ))}
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
