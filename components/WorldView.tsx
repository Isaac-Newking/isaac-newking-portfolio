'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { MOTION, SITE } from '@/content/site';
import { WORLDS, isLight, piecePalette, type Palette, type Piece, type World } from '@/content/worlds';
import { depixel, reducedMotion } from '@/lib/pixel';
import { useShell } from './SiteShell';

function setPalette(p: Palette) {
  const s = document.body.style;
  s.setProperty('--w-bg', p.bg); s.setProperty('--w-fg', p.fg); s.setProperty('--w-accent', p.accent); s.setProperty('--w-line', p.line);
  document.body.style.colorScheme = isLight(p.bg) ? 'light' : 'dark';
}

// One image at the strip's shared height. The frame decides the width from the image's shape.
function Tile({ p, k, world }: { p: Piece; k: number; world: World }) {
  const tall = (p.mock === 'browser' || p.mock === 'laptop') && p.h / p.w > 1.4;
  const ratio = tall ? 1.6 : p.w / p.h;
  const img = (fit: 'cover' | 'top') => (
    <div className={`px${fit === 'top' ? ' top' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.src} alt={`${world.name}: ${p.name}`} width={p.w} height={p.h} loading={k < 4 ? 'eager' : 'lazy'} decoding="async" />
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
  } else {
    width = `calc(var(--sh) * ${ratio})`;
    body = <div className="shot" style={{ height: 'var(--sh)' }}>{img('cover')}</div>;
  }
  return <figure className="tile" data-k={k} style={{ width }}>{body}<figcaption>{p.name}</figcaption></figure>;
}

function MotionTile() {
  if (MOTION.length === 0) return null;
  return <>{MOTION.map((m) => (
    <figure className="tile" key={m.src} data-motion style={{ width: `calc(var(--sh) * ${m.w / m.h})` }}>
      <div className="shot" style={{ height: 'var(--sh)' }}>
        <video src={m.src} poster={m.poster} width={m.w} height={m.h} muted loop playsInline preload="none" data-autoplay aria-label={m.title} />
      </div>
      <figcaption>Motion: {m.title}</figcaption>
    </figure>
  ))}</>;
}

// A row of same-height images with a counter and arrows, like the Adrián reference.
function Strip({ pieces, start, world, motion }: { pieces: Piece[]; start: number; world: World; motion?: boolean }) {
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
        {motion && <MotionTile />}
        {pieces.map((p, i) => <Tile key={p.src} p={p} k={start + i} world={world} />)}
      </div>
    </div>
  );
}

export default function WorldView({ index }: { index: number }) {
  const w = WORLDS[index];
  const next = WORLDS[(index + 1) % WORLDS.length];
  const { go, glide } = useShell();
  const root = useRef<HTMLDivElement>(null);
  const now = useRef<HTMLSpanElement>(null);
  const nextTitle = useRef<HTMLHeadingElement>(null);

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

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') go('/#work', w.pal.bg); };
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
              <img src={cover.src} alt={`${w.name}: ${cover.name}`} width={cover.w} height={cover.h} />
              <canvas />
            </div>
          </figure>
          <div className="pj-right">
            <p className="pj-blurb">{w.blurb}</p>
            <a className="pj-cta" href={`mailto:${SITE.email}`}>Start a project like this</a>
          </div>
        </header>

        {sections.map((s) => {
          const start = k; k += s.pieces.length;
          return (
            <section className="pj-sec" key={s.label}>
              <div className="pj-sec-head">
                <div className="pj-label">{s.lead && <span className="lead">[Lead project]</span>}<h2>{s.label}</h2></div>
                {s.blurb && <p>{s.blurb}</p>}
              </div>
              <Strip pieces={s.pieces} start={start} world={w} motion={s.motion} />
            </section>
          );
        })}
      </main>

      {/* The next project waits in its own colour; clicking lifts its title into the next page */}
      <section className="pj-next" style={{ backgroundColor: next.pal.bg, color: next.pal.fg }}>
        <div className="wrap">
          <span className="pj-next-k">Next project</span>
          <Link href={`/work/${next.slug}`} className="pj-next-link"
            onClick={(e) => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); glide(`/work/${next.slug}`, nextTitle.current!, next.pal.bg, next.pal.fg); }}>
            <h2 className="pj-title" ref={nextTitle}>{next.name}<sup>[{next.kind}]</sup></h2>
            <span className="pj-next-arrow" aria-hidden="true">→</span>
          </Link>
          <div className="pj-foot"><a href={`mailto:${SITE.email}`}>{SITE.email}</a><span>© 2026 {SITE.name}</span></div>
        </div>
      </section>
    </div>
  );
}
