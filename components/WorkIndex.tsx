'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { WORLDS } from '@/content/worlds';
import { clamp, depixel, loadImage, webpSmall } from '@/lib/pixel';
import { useShell } from './SiteShell';

export default function WorkIndex() {
  const { go } = useShell();
  const peek = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ on: -1, timer: 0 as unknown as ReturnType<typeof setInterval>, px: 0, py: 0, ppx: 0, ppy: 0 });

  useEffect(() => {
    let raf = 0; const s = state.current;
    const follow = () => {
      const vx = s.px - s.ppx; s.ppx += vx * 0.14; s.ppy += (s.py - s.ppy) * 0.14;
      if (peek.current) peek.current.style.transform = `translate(${s.ppx + 28}px, ${s.ppy - 120}px) rotate(${clamp(vx * 0.05, -8, 8)}deg)`;
      raf = requestAnimationFrame(follow);
    };
    raf = requestAnimationFrame(follow);
    return () => { cancelAnimationFrame(raf); clearInterval(s.timer); };
  }, []);

  const start = (i: number) => {
    const s = state.current; if (s.on === i) return;
    s.on = i; clearInterval(s.timer);
    const w = WORLDS[i], c = canvas.current!, r = peek.current!.getBoundingClientRect();
    c.width = Math.round(r.width * 1.5); c.height = Math.round(r.height * 1.5);
    let k = 0;
    const show = async () => { const pc = w.pieces[k % w.pieces.length]; const im = await loadImage(webpSmall(pc.src, pc.w)); if (im && s.on === i) depixel(c, im, { cover: true, step: 34 }); k++; };
    show(); s.timer = setInterval(show, 1100);
    peek.current!.style.opacity = '1';
  };
  const stop = () => { const s = state.current; s.on = -1; clearInterval(s.timer); if (peek.current) peek.current.style.opacity = '0'; };

  return (
    <section className="work paper wrap" id="work">
      <div className="head">
        <h2>Selected<br />work</h2>
        <p>Five bodies of work. Each one opens in its own world, and the colours shift with every piece.</p>
      </div>
      <ul className="rows" onPointerLeave={stop}>
        {WORLDS.map((w, i) => (
          <li className="row" key={w.slug}>
            <Link href={`/work/${w.slug}`}
              onPointerMove={(e) => { state.current.px = e.clientX; state.current.py = e.clientY; start(i); }}
              onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); stop(); go(`/work/${w.slug}`, w.pal.accent, e.clientX, e.clientY); }}>
              <span className="sw" aria-hidden="true">
                <b style={{ background: w.pal.bg }} /><b style={{ background: w.pal.accent }} /><b style={{ background: w.pal.fg }} /><b style={{ background: w.pal.accent, opacity: 0.5 }} />
              </span>
              <span className="nm">{w.name}</span>
              <span className="mt"><span>{String(w.pieces.length).padStart(2, '0')} pieces, {w.year}</span><br />{w.kind}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="peek" ref={peek} aria-hidden="true"><canvas ref={canvas} /></div>
    </section>
  );
}
