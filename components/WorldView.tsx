'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MOTION, SITE } from '@/content/site';
import { WORLDS, isLight, piecePalette, type Palette, type Piece, type World } from '@/content/worlds';
import { depixel, reducedMotion, srcSetFor, webp, webpSmall } from '@/lib/pixel';
import { useShell } from './SiteShell';

function setPalette(p: Palette) {
  const s = document.body.style;
  s.setProperty('--w-bg', p.bg); s.setProperty('--w-fg', p.fg); s.setProperty('--w-accent', p.accent); s.setProperty('--w-line', p.line);
  document.body.style.colorScheme = isLight(p.bg) ? 'light' : 'dark';
}

type Viewing = { src: string; w: number; h: number; name: string; video?: boolean; poster?: string; from: DOMRect };
type Open = (v: Viewing) => void;

// Full-screen preview: the piece grows out of its tile and sharpens from pixels; click outside,
// press Esc or ✕ and it shrinks back into place.
function Lightbox({ item, onClose }: { item: Viewing; onClose: () => void }) {
  const fig = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(false);
  const closing = useRef(false);
  const { lenis } = useShell();

  const box = (() => {
    const s = Math.min((innerWidth * 0.92) / item.w, (innerHeight * 0.82) / item.h);
    const w = Math.round(item.w * s), h = Math.round(item.h * s);
    return { w, h, x: Math.round((innerWidth - w) / 2), y: Math.round((innerHeight - h) / 2 - 12) };
  })();
  const fromTransform = () => {
    const r = item.from, s = Math.min(r.width / box.w, r.height / box.h);
    const dx = r.left + r.width / 2 - (box.x + (box.w * s) / 2), dy = r.top + r.height / 2 - (box.y + (box.h * s) / 2);
    return `translate(${dx}px, ${dy}px) scale(${s})`;
  };

  const close = useCallback(() => {
    if (closing.current) return; closing.current = true;
    setOn(false);
    if (fig.current) fig.current.style.transform = fromTransform();
    setTimeout(onClose, reducedMotion() ? 0 : 420);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  useEffect(() => {
    lenis()?.stop();
    const f = fig.current!;
    f.style.transform = fromTransform();
    requestAnimationFrame(() => requestAnimationFrame(() => { setOn(true); f.style.transform = 'none'; }));
    if (!item.video && canvas.current) {
      const c = canvas.current; c.width = box.w; c.height = box.h;
      const im = new Image(); im.onload = () => depixel(c, im, { step: 38 }).then(() => c.classList.add('done')); im.src = webp(item.src);
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); close(); } };
    addEventListener('keydown', onKey, true);
    return () => { removeEventListener('keydown', onKey, true); lenis()?.start(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`lb${on ? ' on' : ''}`} onClick={close} role="dialog" aria-modal="true" aria-label={item.name}>
      <figure ref={fig} className="lb-fig" style={{ left: box.x, top: box.y, width: box.w, height: box.h }} onClick={(e) => e.stopPropagation()}>
        {item.video
          ? <video src={item.src} poster={item.poster && webp(item.poster)} autoPlay muted loop playsInline />
          : <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={webp(item.src)} alt={item.name} width={item.w} height={item.h} />
              <canvas ref={canvas} aria-hidden="true" />
            </>}
      </figure>
      <div className="lb-bar" onClick={(e) => e.stopPropagation()}>
        <span>{item.name}</span>
        <button type="button" onClick={close} autoFocus>✕ Close</button>
      </div>
    </div>
  );
}

const openFrom = (open: Open, v: Omit<Viewing, 'from'>) => (e: React.MouseEvent | React.KeyboardEvent) => {
  if ('key' in e && e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  const shot = (e.currentTarget as HTMLElement).querySelector('.shot') as HTMLElement;
  open({ ...v, from: shot.getBoundingClientRect() });
};

// Profile pictures for Instagram cards, by handle; others fall back to initials.
const IG_AVATAR: Record<string, string> = { eurban: '/img/ui/eu-avatar.png' };
// a steady, plausible like count per post
const likes = (s: string) => 900 + ([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100000, 7) % 2600);

// One image at the strip's shared height. The frame decides the width from the image's shape.
function Tile({ p, k, world, open }: { p: Piece; k: number; world: World; open: Open }) {
  const tall = (p.mock === 'browser' || p.mock === 'laptop') && p.h / p.w > 1.4;
  const ratio = tall ? 1.6 : p.w / p.h;
  const img = (fit: 'cover' | 'top') => p.video ? (
    // a looping clip plays in place of the still, in any frame; the still is its poster
    <div className="vid"><video src={p.video} poster={webpSmall(p.src, p.w)} width={p.w} height={p.h} muted loop playsInline preload="none" data-autoplay aria-label={`${world.name}: ${p.name}`} style={{ objectPosition: fit === 'top' ? 'top' : 'center' }} /></div>
  ) : (
    <div className={`px${fit === 'top' ? ' top' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.src} srcSet={srcSetFor(p.src, p.w)} sizes="(max-width: 760px) 100vw, 70vw" alt={`${world.name}: ${p.name}`} width={p.w} height={p.h} loading={k < 4 ? 'eager' : 'lazy'} decoding="async" />
      <canvas />
    </div>
  );
  let body: React.ReactNode;
  let width: string;
  if (p.mock === 'browser') {
    width = `calc((var(--sh) - 34px) * ${ratio})`;
    body = <div className="m-browser"><div className="bar"><i /><i /><i /><span /></div><div className="shot" style={{ height: 'calc(var(--sh) - 34px)' }}>{img(tall ? 'top' : 'cover')}</div></div>;
  } else if (p.mock === 'laptop') {
    // 16:10 screen in a slim lid, on a base that is wider than the lid
    width = 'calc(((var(--sh) - 40px) * 1.6 + 22px) / 0.88)';
    body = <div className="m-laptop"><div className="lap-lid"><div className="shot">{img('top')}</div></div><div className="lap-base" /></div>;
  } else if (p.mock === 'phone') {
    width = `calc((var(--sh) - 26px) * ${ratio} + 26px)`;
    body = <div className="m-phone"><div className="shot">{img('cover')}</div></div>;
  } else if (p.mock === 'x') {
    width = 'calc((var(--sh) - 112px) * 3)';
    body = <div className="m-x"><div className="shot" style={{ aspectRatio: '3 / 1' }}>{img('cover')}</div><div className="prof"><span className="av" /><span className="fl">Follow</span><div className="ln" /><div className="ln" /></div></div>;
  } else if (p.mock === 'insta') {
    // an Instagram post card: profile row, the post at its own shape, then the action row
    const handle = (p.group ?? world.name).toLowerCase().replace(/[^a-z0-9]+/g, '');
    width = `calc((var(--sh) - 152px) * ${ratio})`;
    body = (
      <div className="m-ig">
        <div className="ig-top">{IG_AVATAR[handle] ? <img className="ig-av" src={IG_AVATAR[handle]} alt="" width={32} height={32} /> : <span className="ig-av">{handle.slice(0, 2)}</span>}<b>{handle}</b><i className="ig-more" aria-hidden="true" /></div>
        <div className="shot" style={{ height: 'calc(var(--sh) - 152px)' }}>{img('cover')}</div>
        <div className="ig-bar" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="ig-like"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z" /></svg>
          <svg viewBox="0 0 24 24"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20l1.2-4.2A8.5 8.5 0 1 1 20.5 11.5z" /></svg>
          <svg viewBox="0 0 24 24"><path d="M21.5 3 10 14.2M21.5 3l-6.8 18-4.7-6.8L3 9.6z" /></svg>
          <span className="ig-dots"><i /><i /><i /><i /></span>
          <svg viewBox="0 0 24 24" className="ig-save"><path d="M6 3.5h12v17l-6-4.6-6 4.6z" /></svg>
        </div>
        <div className="ig-cap"><b>{likes(p.name).toLocaleString('en-US')} likes</b><span><b>{handle}</b> {p.name.replace(/^[^,]*,\s*/, '')}</span></div>
      </div>
    );
  } else {
    width = `calc(var(--sh) * ${ratio})`;
    body = <div className="shot" style={{ height: 'var(--sh)' }}>{img('cover')}</div>;
  }
  const view = openFrom(open, { src: p.video ?? p.src, w: p.w, h: p.h, name: p.group ? `${p.group}: ${p.name}` : p.name, video: !!p.video, poster: p.video ? p.src : undefined });
  return (
    <figure className="tile" data-k={k} data-mock={p.mock} style={{ width }} role="button" tabIndex={0} aria-label={`View ${p.name} full screen`} onClick={view} onKeyDown={view}>
      {body}<figcaption>{p.name}</figcaption>
    </figure>
  );
}

function MotionTile({ open }: { open: Open }) {
  if (MOTION.length === 0) return null;
  return <>{MOTION.map((m) => (
    <figure className="tile" key={m.src} data-motion style={{ width: `calc(var(--sh) * ${m.w / m.h})` }} role="button" tabIndex={0}
      aria-label={`Play ${m.title} full screen`} onClick={openFrom(open, { src: m.src, w: m.w, h: m.h, name: m.title, video: true, poster: m.poster })}
      onKeyDown={openFrom(open, { src: m.src, w: m.w, h: m.h, name: m.title, video: true, poster: m.poster })}>
      <div className="shot" style={{ height: 'var(--sh)' }}>
        <video src={m.src} poster={m.poster} width={m.w} height={m.h} muted loop playsInline preload="none" data-autoplay aria-label={m.title} />
      </div>
      <figcaption>Motion: {m.title}</figcaption>
    </figure>
  ))}</>;
}

// A row of same-height images with a counter and arrows, like the Adrián reference.
function Strip({ pieces, start, world, motion, open }: { pieces: Piece[]; start: number; world: World; motion?: boolean; open: Open }) {
  const track = useRef<HTMLDivElement>(null);
  const count = (motion ? MOTION.length : 0) + pieces.length;
  // Arrows loop: → past the last piece returns to the first, ← before the first jumps to the last.
  const step = (dir: number) => {
    const t = track.current; if (!t) return;
    const tiles = Array.from(t.children) as HTMLElement[];
    const x = t.scrollLeft, max = t.scrollWidth - t.clientWidth;
    let left: number;
    if (dir > 0) left = x >= max - 4 ? 0 : (tiles.find((el) => el.offsetLeft > x + 4)?.offsetLeft ?? max);
    else left = x <= 4 ? max : ([...tiles].reverse().find((el) => el.offsetLeft < x - 4)?.offsetLeft ?? 0);
    t.scrollTo({ left: Math.min(left, max), behavior: reducedMotion() ? 'auto' : 'smooth' });
  };
  return (
    <div className="strip" data-strip>
      <div className="strip-bar">
        <span className="strip-n" data-n>[1/{count}]</span>
        <span className="strip-arrows">
          <button type="button" onClick={() => step(-1)} aria-label="Previous piece">←</button>
          <button type="button" onClick={() => step(1)} aria-label="Next piece">→</button>
        </span>
      </div>
      <div className="track" ref={track} tabIndex={0} aria-label={`${world.name} pieces`}>
        {motion && <MotionTile open={open} />}
        {pieces.map((p, i) => <Tile key={p.src} p={p} k={start + i} world={world} open={open} />)}
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------------------------
// Branding only: one brand at a time, laid out as a fitted grid (every row fills the width at one
// height, nothing cropped), with press buttons to switch brands in place on the same page.
type Item = { src: string; w: number; h: number; name: string; video?: string; poster?: string };

// Creative mosaic with no cropping. Pieces are laid in blocks whose sizes are solved from the images' own
// shapes, so every piece shows in full: a feature piece beside a stack of two (left or right), justified rows
// of two to four, and very wide pieces on their own. Coordinates are in a 1000-wide space; the page scales them.
type Rect = { x: number; y: number; w: number; h: number };
type Plan = { rects: Rect[]; height: number };

function planMosaic(items: Item[], o: { gap: number; minW: number; rowH: [number, number]; pattern: string[]; maxRow: number }): Plan {
  const W = 1000, g = o.gap, R = items.map((it) => it.w / it.h);
  const rects: Rect[] = new Array(items.length);
  let y = 0, at = 0, step = 0;
  const row = (idx: number[]) => {
    const h = (W - g * (idx.length - 1)) / idx.reduce((a, i) => a + R[i], 0);
    return { h, ok: h >= o.rowH[0] && h <= o.rowH[1] && idx.every((i) => R[i] * h >= o.minW) };
  };
  const putRow = (idx: number[], h: number) => { let x = 0; idx.forEach((i) => { const w = R[i] * h; rects[i] = { x, y, w, h }; x += w + g; }); y += h + g; };
  // feature piece f beside a stack of a over b; widths solved so both sides end at the same height
  const stack = (f: number, a: number, b: number, left: boolean) => {
    const s = 1 / R[a] + 1 / R[b], c = ((W - g) / R[f] - g) / (s + 1 / R[f]), bw = W - g - c, h = bw / R[f];
    const ok = c >= o.minW && bw >= o.minW * 1.5 && h <= o.rowH[1] * 2.1 && c / R[a] >= o.minW * 0.55 && c / R[b] >= o.minW * 0.55;
    return { ok, put: () => {
      const fx = left ? 0 : c + g, sx = left ? bw + g : 0, ha = c / R[a];
      rects[f] = { x: fx, y, w: bw, h }; rects[a] = { x: sx, y, w: c, h: ha }; rects[b] = { x: sx, y: y + ha + g, w: c, h: h - ha - g }; y += h + g;
    } };
  };
  while (at < items.length) {
    const left = items.length - at;
    const want = o.pattern[step % o.pattern.length];
    let done = false;
    // a very wide piece takes the full width
    if (R[at] > 2.4) { putRow([at], W / R[at]); at++; step++; continue; }
    if ((want === 'L' || want === 'R') && left >= 3) {
      const tri = [at, at + 1, at + 2];
      // try each of the three as the feature, keep the first that works (prefer the squarest feature)
      const order = [...tri].sort((p, q) => Math.abs(Math.log(R[p])) - Math.abs(Math.log(R[q])));
      for (const f of order) {
        const [a, b] = tri.filter((t) => t !== f), t = stack(f, a, b, want === 'L');
        if (t.ok) { t.put(); done = true; break; }
      }
      if (done) { at += 3; step++; continue; }
    }
    const n = want === '1' ? 1 : want === '2' ? 2 : want === '3' ? 3 : 3;
    const tries = [n, n === 3 ? 2 : 3, 4, 2, 1].filter((k, i, arr) => k <= left && k <= o.maxRow && arr.indexOf(k) === i);
    for (const k of tries) { const idx = Array.from({ length: k }, (_, j) => at + j), r = row(idx); if (r.ok) { putRow(idx, r.h); at += k; done = true; break; } }
    if (!done) { putRow([at], W / R[at]); at += 1; } // nothing fits: the piece gets the full width on its own
    step++;
  }
  return { rects, height: Math.max(0, y - g) };
}
const DESK = { gap: 10, minW: 190, rowH: [190, 520] as [number, number], pattern: ['L', '3', 'R', '2'], maxRow: 4 };
const MOB = { gap: 16, minW: 440, rowH: [260, 1100] as [number, number], pattern: ['1', 'L', '2', 'R'], maxRow: 2 };

function BrandCase({ w, open }: { w: World; open: Open }) {
  const groups = w.groups ?? [];
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const top = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const { lenis } = useShell();

  // remember the brand in the address (#lonepay) so a link opens straight on it
  const slug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '');
  useEffect(() => {
    const fromHash = () => { const k = groups.findIndex((g) => slug(g.name) === location.hash.slice(1)); if (k >= 0) setI(k); };
    fromHash();
    addEventListener('hashchange', fromHash);
    return () => removeEventListener('hashchange', fromHash);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const g = groups[i];
  const pieces = w.pieces.filter((p) => p.group === g.name);
  const items: Item[] = pieces.map((p) => ({ src: p.src, w: p.w, h: p.h, name: p.name, video: p.video }));
  if (g.motion) MOTION.forEach((m) => items.splice(Math.min(2, items.length), 0, { src: m.poster ?? '', w: m.w, h: m.h, name: m.title, video: m.src }));
  const dPlan = planMosaic(items, DESK), mPlan = planMosaic(items, MOB);
  const pos = (pl: Plan, k: number, p: string) => { const r = pl.rects[k]; return { [`--${p}x`]: `${r.x / 10}%`, [`--${p}y`]: `${(r.y / pl.height) * 100}%`, [`--${p}w`]: `${r.w / 10}%`, [`--${p}h`]: `${(r.h / pl.height) * 100}%` }; };

  // colours follow the brand; videos play only while on screen
  useEffect(() => {
    const first = pieces[0];
    setPalette(first ? piecePalette(w, first) : w.pal);
    const vids = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target as HTMLVideoElement; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: 0.2 });
    grid.current?.querySelectorAll('video').forEach((v) => vids.observe(v));
    // the page header resets colours when it passes the middle; take them back once the brand is in front
    const pal = first ? piecePalette(w, first) : w.pal;
    const mid = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setPalette(pal); }), { rootMargin: '-48% 0px -48% 0px' });
    if (top.current) mid.observe(top.current);
    return () => { vids.disconnect(); mid.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const pick = (k: number) => {
    if (k === i) return;
    const reduce = reducedMotion();
    setPhase('out');
    setTimeout(() => {
      setI(k); setPhase('in');
      history.replaceState(null, '', `#${slug(groups[k].name)}`);
      const y = (top.current?.getBoundingClientRect().top ?? 0) + scrollY - 70;
      const l = lenis(); if (l) l.scrollTo(y, { immediate: reduce }); else scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }, reduce ? 0 : 260);
  };

  const others = groups.map((x, k) => ({ x, k })).filter((o) => o.k !== i);
  // a strong single image per brand for the cards, else its first still
  const COVER: Record<string, string> = { 'Esorae Home': 'eh-billboard', LonePay: 'lp-cards', eurban: 'eu-poster2', 'O5 Dynamix': 'o5-web-court', OJKonsult: 'ojk-cards' };
  const coverOf = (name: string) => w.pieces.find((p) => p.group === name && COVER[name] && p.src.includes('/' + COVER[name] + '.')) ?? w.pieces.find((p) => p.group === name && !p.video);
  let n = 0;

  return (
    <div className="bc" ref={top}>
      <nav className="bc-switch" aria-label="Brands">
        {groups.map((x, k) => (
          <button key={x.name} type="button" className={`bc-btn${k === i ? ' on' : ''}`} aria-pressed={k === i} onClick={() => pick(k)}>
            <span className="bc-n">{String(k + 1).padStart(2, '0')}</span>{x.name}
          </button>
        ))}
      </nav>

      <div className={`bc-case ${phase}`} key={g.name}>
        <header className="bc-head">
          <h2 className="bc-title">{g.name}</h2>
          <dl className="bc-facts">
            <div><dt>Brand</dt><dd>{String(i + 1).padStart(2, '0')} / {String(groups.length).padStart(2, '0')}</dd></div>
            <div><dt>Work</dt><dd>{items.length} pieces</dd></div>
            <div><dt>Discipline</dt><dd>{g.motion ? 'Identity, campaign, motion' : 'Identity'}</dd></div>
          </dl>
          <p className="bc-blurb">{g.blurb}</p>
        </header>

        <div className="bc-grid" ref={grid}>
          <div className="bc-mosaic" style={{ '--da': `1000 / ${dPlan.height}`, '--ma': `1000 / ${mPlan.height}` } as React.CSSProperties}>
            {items.map((it, k) => {
              const view = openFrom(open, { src: it.video ?? it.src, w: it.w, h: it.h, name: `${g.name}: ${it.name}`, video: !!it.video, poster: it.video ? it.src : undefined });
              return (
                <figure key={it.src + it.name} className="bc-item" style={{ ...pos(dPlan, k, 'd'), ...pos(mPlan, k, 'm'), animationDelay: `${Math.min(k, 12) * 40}ms` } as React.CSSProperties}
                  role="button" tabIndex={0} aria-label={`View ${it.name} full screen`} onClick={view} onKeyDown={view}>
                  <div className="shot">
                    {it.video
                      ? <video src={it.video} poster={it.src ? webpSmall(it.src, it.w) : undefined} muted loop playsInline preload="none" aria-label={it.name} />
                      // eslint-disable-next-line @next/next/no-img-element
                      : <img src={it.src} srcSet={srcSetFor(it.src, it.w)} sizes="(max-width: 760px) 100vw, 50vw" alt={`${g.name}: ${it.name}`} width={it.w} height={it.h} loading={k < 6 ? 'eager' : 'lazy'} decoding="async" />}
                  </div>
                  <figcaption>{it.name}</figcaption>
                </figure>
              );
            })}
          </div>
        </div>

        <div className="bc-next-row">
          <button type="button" className="bc-btn bc-big" onClick={() => pick((i + 1) % groups.length)}>
            Next brand: {groups[(i + 1) % groups.length].name} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <section className="bc-more" aria-label="More brands">
        <h3>Discover more brands</h3>
        <div className="bc-more-grid">
          {others.map(({ x, k }) => {
            const c = coverOf(x.name);
            return (
              <button key={x.name} type="button" className="bc-card" onClick={() => pick(k)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c && <img src={webpSmall(c.src, c.w)} alt="" loading="lazy" decoding="async" />}
                <span>{x.name}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function WorldView({ index }: { index: number }) {
  const w = WORLDS[index];
  const next = WORLDS[(index + 1) % WORLDS.length];
  const prev = WORLDS[(index - 1 + WORLDS.length) % WORLDS.length];
  const { go } = useShell();
  const root = useRef<HTMLDivElement>(null);
  const now = useRef<HTMLSpanElement>(null);
  const meter = useRef<HTMLSpanElement>(null);
  const prevBar = useRef<HTMLDivElement>(null);
  const [viewing, setViewing] = useState<Viewing | null>(null);
  const viewingRef = useRef(false);
  viewingRef.current = viewing !== null;
  const open = useCallback<Open>((v) => setViewing(v), []);
  const leaving = useRef(false);
  const toWorld = useCallback((t: World) => {
    if (leaving.current) return; leaving.current = true;
    go(`/work/${t.slug}`, t.pal.accent, innerWidth / 2, innerHeight / 2, root.current);
  }, [go]);

  // Keep scrolling past the bottom to go to the next project, or past the top to go back to the previous one.
  // A pixel meter fills as you push; the page then pixelates into the next one.
  useEffect(() => {
    const NEED = 650, CELLS = 16;
    let down = 0, up = 0, idle = 0 as unknown as ReturnType<typeof setTimeout>, touchY = 0;
    const atBottom = () => innerHeight + scrollY >= document.documentElement.scrollHeight - 3;
    const atTop = () => scrollY <= 1;
    const paint = () => {
      const lit = Math.min(CELLS, Math.floor((down / NEED) * CELLS));
      meter.current?.querySelectorAll('i').forEach((c, i) => c.classList.toggle('on', i < lit));
      if (prevBar.current) { prevBar.current.style.setProperty('--p', String(Math.min(1, up / NEED))); prevBar.current.classList.toggle('show', up > 40); }
    };
    const push = (dy: number) => {
      if (viewingRef.current || leaving.current) return;
      if (dy > 0 && atBottom()) { down += dy; up = 0; } else if (dy < 0 && atTop()) { up -= dy; down = 0; } else { down = Math.max(0, down - Math.abs(dy) * 2); up = Math.max(0, up - Math.abs(dy) * 2); }
      paint();
      if (down >= NEED) toWorld(next); else if (up >= NEED) toWorld(prev);
      clearTimeout(idle);
      idle = setTimeout(() => { const ease = () => { down *= 0.8; up *= 0.8; if (down < 1) down = 0; if (up < 1) up = 0; paint(); if (down || up) requestAnimationFrame(ease); }; ease(); }, 600);
    };
    const onWheel = (e: WheelEvent) => push(e.deltaY);
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => { const y = e.touches[0].clientY; push((touchY - y) * 1.6); touchY = y; };
    addEventListener('wheel', onWheel, { passive: true });
    addEventListener('touchstart', onTouchStart, { passive: true });
    addEventListener('touchmove', onTouchMove, { passive: true });
    return () => { removeEventListener('wheel', onWheel); removeEventListener('touchstart', onTouchStart); removeEventListener('touchmove', onTouchMove); clearTimeout(idle); };
  }, [next, prev, toWorld]);

  useEffect(() => {
    document.body.classList.add('in-world'); setPalette(w.pal);
    const el = root.current!;
    const cleanups: (() => void)[] = [];

    // Images de-pixelate as they come into view, including when scrolled sideways in a strip
    const io = new IntersectionObserver((es) => es.forEach(async (e) => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const box = e.target as HTMLElement, img = box.querySelector('img')!, c = box.querySelector('canvas')!;
      const r = box.getBoundingClientRect(); c.width = Math.max(1, Math.round(r.width)); c.height = Math.max(1, Math.round(r.height));
      try { await img.decode(); } catch { if (!img.complete) await new Promise((r2) => { img.onload = r2; }); }
      await depixel(c, img, { cover: true, top: box.classList.contains('top'), step: 58 }); box.classList.add('done');
    }), { rootMargin: '0px 0px -6% 0px' });
    el.querySelectorAll('.px').forEach((x) => io.observe(x));

    // Colours follow the piece that's in front: the first visible tile of the strip in the middle of the screen
    let active: HTMLElement | null = null;
    const applyFrom = (strip: HTMLElement) => {
      const t = strip.querySelector('.track') as HTMLElement;
      const tiles = Array.from(t.children) as HTMLElement[];
      const atEnd = t.scrollLeft >= t.scrollWidth - t.clientWidth - 4 && t.scrollLeft > 4;
      const i = atEnd ? tiles.length - 1 : Math.max(0, tiles.findIndex((x) => x.offsetLeft + x.offsetWidth / 2 > t.scrollLeft));
      const n = strip.querySelector('[data-n]'); if (n) n.textContent = `[${i + 1}/${tiles.length}]`;
      if (strip !== active) return;
      const k = tiles[i]?.dataset.k;
      const p = k !== undefined ? w.pieces[Number(k)] : undefined;
      setPalette(p ? piecePalette(w, p) : w.pal);
      if (now.current) now.current.textContent = p ? (p.group ? `${p.group}: ${p.name}` : p.name) : (tiles[i]?.dataset.motion !== undefined ? 'Motion' : '');
    };
    const strips = Array.from(el.querySelectorAll('[data-strip]')) as HTMLElement[];
    strips.forEach((s) => {
      const t = s.querySelector('.track') as HTMLElement;
      const on = () => applyFrom(s);
      t.addEventListener('scroll', on, { passive: true });
      cleanups.push(() => t.removeEventListener('scroll', on));
    });
    // Phones and tablets: each strip slides sideways on its own as you scroll the page past it,
    // from its first piece as it enters to its last as it leaves. Touching or using its arrows hands it back to you.
    const touchLike = matchMedia('(max-width: 760px), (pointer: coarse)').matches && !reducedMotion();
    if (touchLike) {
      const manual = new WeakSet<HTMLElement>();
      strips.forEach((s) => {
        const t = s.querySelector('.track') as HTMLElement;
        t.style.scrollSnapType = 'none';
        const takeOver = () => { manual.add(s); t.style.scrollSnapType = ''; };
        t.addEventListener('touchstart', takeOver, { passive: true });
        s.querySelectorAll('.strip-arrows button').forEach((b) => b.addEventListener('click', takeOver));
        cleanups.push(() => t.removeEventListener('touchstart', takeOver));
      });
      let raf = 0;
      const slide = () => {
        raf = 0;
        const vh = innerHeight;
        strips.forEach((s) => {
          if (manual.has(s)) return;
          const t = s.querySelector('.track') as HTMLElement;
          const r = s.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) return;
          const p = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (r.height + vh * 0.75)));
          t.scrollLeft = p * (t.scrollWidth - t.clientWidth);
        });
      };
      const onScroll = () => { if (!raf) raf = requestAnimationFrame(slide); };
      addEventListener('scroll', onScroll, { passive: true });
      slide();
      cleanups.push(() => { removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); });
    }

    const mid = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const s = e.target as HTMLElement;
      if (s.matches('[data-strip]')) { active = s; applyFrom(s); } else { active = null; setPalette(w.pal); if (now.current) now.current.textContent = ''; }
    }), { rootMargin: '-48% 0px -48% 0px' });
    strips.forEach((s) => mid.observe(s));
    el.querySelectorAll('.pj-intro, .pj-sec-head').forEach((x) => mid.observe(x));

    // Motion loops play only while on screen
    const vids = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target as HTMLVideoElement; if (e.isIntersecting) { v.play().catch(() => {}); } else v.pause(); }), { threshold: 0.25 });
    el.querySelectorAll('video[data-autoplay]').forEach((x) => vids.observe(x));

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !viewingRef.current) go('/#work', w.pal.bg); };
    addEventListener('keydown', onKey);
    return () => {
      io.disconnect(); mid.disconnect(); vids.disconnect(); cleanups.forEach((f) => f()); removeEventListener('keydown', onKey);
      document.body.classList.remove('in-world'); ['--w-bg', '--w-fg', '--w-accent', '--w-line'].forEach((k) => document.body.style.removeProperty(k)); document.body.style.colorScheme = '';
    };
  }, [w, go]);

  const cover = w.pieces[0];
  const meta: [string, string][] = [['Discipline', w.discipline], ['Year', w.year], ['Pieces', String(w.pieces.length)], ['Projects', w.projects]];
  let k = 0;
  const sections = w.groups
    ? w.groups.map((g) => ({ label: g.name, blurb: g.blurb, lead: g.lead, motion: g.motion, pieces: w.pieces.filter((p) => p.group === g.name) }))
    : [{ label: 'Selected pieces', blurb: '', lead: false, motion: false, pieces: w.pieces }];

  return (
    <div ref={root}>
      <div className="pj-prev" ref={prevBar} aria-hidden="true"><span>Previous project: {prev.name}</span><b /></div>
      <div className="wbar">
        <Link className="back" href="/#work" onClick={(e) => { e.preventDefault(); go('/#work', w.pal.bg); }}>← All work</Link>
        <span className="now" ref={now} />
        <span className="wbar-r">
          <a className="wmail" href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <span className="pos">{String(index + 1).padStart(2, '0')} / {String(WORLDS.length).padStart(2, '0')}</span>
        </span>
      </div>

      <main className="wrap">
        {/* left: name and facts · centre: the lead image · right: what it is and how to start one */}
        <header className="pj-intro">
          <div className="pj-left">
            <h1 className="pj-title">{w.name}<sup>[{w.kind}]</sup></h1>
            <dl className="pj-meta">{meta.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
          </div>
          <figure className="pj-cover">
            <div className="px" style={{ aspectRatio: `${cover.w}/${cover.h}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover.src} srcSet={srcSetFor(cover.src, cover.w)} sizes="100vw" alt={`${w.name}: ${cover.name}`} width={cover.w} height={cover.h} />
              <canvas />
            </div>
          </figure>
          <div className="pj-right">
            <p className="pj-blurb">{w.blurb}</p>
            <a className="pj-cta" href={`mailto:${SITE.email}`}>Start a project like this</a>
          </div>
        </header>

        {w.slug === 'branding' ? <BrandCase w={w} open={open} /> : sections.map((s) => {
          const start = k; k += s.pieces.length;
          return (
            <section className="pj-sec" key={s.label}>
              <div className="pj-sec-head">
                <div className="pj-label">{s.lead && <span className="lead">[Lead project]</span>}<h2>{s.label}</h2></div>
                {s.blurb && <p>{s.blurb}</p>}
              </div>
              <Strip pieces={s.pieces} start={start} world={w} motion={s.motion} open={open} />
            </section>
          );
        })}
      </main>

      {/* A quiet bar: keep scrolling (or click) and the page pixelates into the next project */}
      <section className="pj-next" style={{ backgroundColor: next.pal.bg, color: next.pal.fg }}>
        <div className="wrap">
          <Link href={`/work/${next.slug}`} className="pj-next-link"
            onClick={(e) => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); toWorld(next); }}>
            <span className="pj-next-k">Next project</span>
            <span className="pj-next-name">{next.name}</span>
            <span className="pj-next-meter" ref={meter} aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} />)}</span>
            <span className="pj-next-hint">Keep scrolling or click</span>
          </Link>
          <div className="pj-foot"><a href={`mailto:${SITE.email}`}>{SITE.email}</a><span>© 2026 {SITE.name}</span></div>
        </div>
      </section>

      {viewing && <Lightbox item={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
