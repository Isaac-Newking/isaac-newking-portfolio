'use client';

import Lenis from 'lenis';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { reducedMotion } from '@/lib/pixel';

type Go = (href: string, color: string, x?: number, y?: number, pixelEl?: HTMLElement | null) => void;
type Glide = (href: string, from: HTMLElement, bg: string, fg: string) => void;
type Shell = { go: Go; glide: Glide; lenis: () => Lenis | null };

const ShellCtx = createContext<Shell>({ go: () => {}, glide: () => {}, lenis: () => null });
export const useShell = () => useContext(ShellCtx);

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const pending = useRef<{ href: string; cells: HTMLElement[]; layer?: HTMLElement } | null>(null);

  // Smooth scroll for the whole site
  useEffect(() => {
    if (reducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    lenisRef.current = lenis;
    let id = 0;
    const raf = (t: number) => { lenis.raf(t); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!a) return;
      const t = document.querySelector(a.getAttribute('href')!);
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t as HTMLElement);
    };
    document.addEventListener('click', onClick);
    return () => { cancelAnimationFrame(id); document.removeEventListener('click', onClick); lenis.destroy(); lenisRef.current = null; };
  }, []);

  // Real pixelation of the page you're leaving: an SVG filter samples one pixel per block and
  // grows each sample into a square; stepping the block size up breaks the page into pixels.
  const pxComp = useRef<SVGFECompositeElement>(null);
  const pxDilate = useRef<SVGFEMorphologyElement>(null);
  const pixelateOut = useCallback((el: HTMLElement) => {
    const sizes = [2, 4, 6, 9, 13, 18, 24, 32, 42];
    sizes.forEach((b, i) => setTimeout(() => {
      pxComp.current?.setAttribute('width', String(b)); pxComp.current?.setAttribute('height', String(b));
      pxDilate.current?.setAttribute('radius', String(b / 2));
      el.style.filter = 'url(#px-f)';
    }, i * 42));
  }, []);

  // Pixel wipe: squares flood out from the click point in the next page's colour.
  // With `pixelEl`, that element first pixelates, so the page itself breaks apart before the colour takes over.
  const go = useCallback<Go>((href, color, ox = innerWidth / 2, oy = innerHeight / 2, pixelEl) => {
    const wipe = wipeRef.current;
    if (!wipe || reducedMotion()) { router.push(href); return; }
    if (pixelEl) pixelateOut(pixelEl);
    const size = innerWidth < 700 ? 48 : 72;
    const cols = Math.ceil(innerWidth / size), rows = Math.ceil(innerHeight / size);
    wipe.style.gridTemplateColumns = `repeat(${cols},1fr)`;
    wipe.style.gridTemplateRows = `repeat(${rows},1fr)`;
    wipe.style.setProperty('--wipe', color);
    wipe.innerHTML = '<b></b>'.repeat(cols * rows);
    const cells = Array.from(wipe.children) as HTMLElement[];
    const dist = cells.map((_, n) => Math.hypot((n % cols) * size - ox, ((n / cols) | 0) * size - oy) + Math.random() * size * 2.2);
    const max = Math.max(...dist);
    const lead = pixelEl ? 170 : 0; // let the pixelation read before the colour arrives
    cells.forEach((el, n) => setTimeout(() => el.classList.add('on'), lead + (dist[n] / max) * 380));
    router.prefetch(href);
    setTimeout(() => { pending.current = { href, cells }; router.push(href, { scroll: false }); }, lead + 470);
  }, [router, pixelateOut]);

  // Next-project glide: the clicked title lifts into the new page's heading position while the
  // next project's colour fills the screen; the new page then appears underneath without a jump.
  const glide = useCallback<Glide>((href, from, bg, fg) => {
    if (reducedMotion()) { router.push(href); return; }
    router.prefetch(href);
    const r = from.getBoundingClientRect();
    const layer = document.createElement('div');
    layer.className = 'glide';
    layer.style.setProperty('--glide-bg', bg);
    layer.style.color = fg;
    const clone = from.cloneNode(true) as HTMLElement;
    clone.classList.add('glide-title');
    Object.assign(clone.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px' });
    layer.appendChild(clone);
    document.body.appendChild(layer);
    // Every project page puts its heading in the same spot, so aim at this page's heading (at scroll 0).
    const head = document.querySelector('.pj-intro .pj-title') as HTMLElement | null;
    const hr = head?.getBoundingClientRect();
    const tx = hr ? hr.left : 16, ty = hr ? hr.top + window.scrollY : 120;
    requestAnimationFrame(() => {
      layer.classList.add('on');
      clone.style.transform = `translate(${tx - r.left}px, ${ty - r.top}px)`;
    });
    setTimeout(() => { pending.current = { href, cells: [], layer }; router.push(href, { scroll: false }); }, 720);
  }, [router]);

  // When the new page is in, jump to its top (or its hash) and clear the squares
  useEffect(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    const hash = p.href.includes('#') ? p.href.slice(p.href.indexOf('#')) : '';
    requestAnimationFrame(() => {
      const target = hash ? document.querySelector(hash) as HTMLElement | null : null;
      const l = lenisRef.current;
      if (l) { l.resize(); l.scrollTo(target ?? 0, { immediate: true, force: true }); } else { target ? target.scrollIntoView() : window.scrollTo(0, 0); }
      p.cells.forEach((el) => setTimeout(() => el.classList.remove('on'), 60 + Math.random() * 360));
      if (p.layer) { const layer = p.layer; setTimeout(() => { layer.classList.add('out'); setTimeout(() => layer.remove(), 420); }, 120); }
      setTimeout(() => { if (wipeRef.current) wipeRef.current.innerHTML = ''; }, 520);
    });
  }, [pathname]);

  return (
    <ShellCtx.Provider value={{ go, glide, lenis: () => lenisRef.current }}>
      {children}
      <div className="wipe" ref={wipeRef} aria-hidden="true" />
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <filter id="px-f" x="0" y="0" width="100%" height="100%">
          <feFlood x="0" y="0" width="1" height="1" result="dot" />
          <feComposite ref={pxComp} in="dot" width="2" height="2" result="cell" />
          <feTile in="cell" result="grid" />
          <feComposite in="SourceGraphic" in2="grid" operator="in" result="sampled" />
          <feMorphology ref={pxDilate} in="sampled" operator="dilate" radius="1" />
        </filter>
      </svg>
    </ShellCtx.Provider>
  );
}
