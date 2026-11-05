'use client';

import { useEffect, useRef } from 'react';
import { SITE } from '@/content/site';
import { clamp } from '@/lib/pixel';

// The warped band from the PDF sits still in the middle. As you scroll, each service grows as it
// comes up into the band (largest inside it), then shrinks and fades as it moves out above.
// Plain background, no loop.
export default function Services() {
  const sec = useRef<HTMLElement>(null);
  const idx = useRef<HTMLDivElement>(null);
  const stick = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const frame = () => {
      if (!sec.current || !idx.current || !stick.current) return;
      const r = sec.current.getBoundingClientRect(), vh = innerHeight;
      if (r.top < vh && r.bottom > 0) {
        const n = SITE.services.length;
        const a = clamp(-r.top / (r.height - vh), 0, 1) * (n - 1);
        const gap = clamp(vh * 0.105, 56, 96);
        // the grid is pinned to the page, so it flows up with the scroll and lines up with the section above
        stick.current.style.backgroundPosition = `-1px ${((r.top % 132) + 132) % 132}px`;
        items.current.forEach((el, i) => {
          if (!el) return;
          const d = i - a; // < 0: above the band, > 0: below it
          const ad = Math.abs(d);
          // the same on both sides: two lines above and two below, each smaller and fainter, gone past the second
          const scale = 1 - Math.min(ad, 2.5) * 0.17;
          const opacity = ad <= 2 ? 1 - ad * 0.36 : Math.max(0, 0.28 - (ad - 2) * 0.56);
          const y = Math.sign(d) * (Math.min(ad, 1) * gap * 1.25 + Math.max(0, ad - 1) * gap * 0.92);
          el.style.transform = `translateY(calc(-50% + ${y}px)) scale(${clamp(scale, 0.3, 1)})`;
          el.style.opacity = String(clamp(opacity, 0, 1));
          el.classList.toggle('on', ad < 0.5);
        });
        idx.current.textContent = `${String(Math.round(a) + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="wheel" id="services" ref={sec} aria-label="Services">
      <div className="stick" ref={stick}>
        <svg className="lens" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0 Q50 20 100 0 L100 100 Q50 80 0 100 Z" />
        </svg>
        <h2 className="bubble lab">What I do</h2>
        <ul className="items">
          {SITE.services.map((s, i) => <li key={s}><div className="item" ref={(el) => { items.current[i] = el; }}>{s}</div></li>)}
        </ul>
        <div className="idx" ref={idx}>01 / {String(SITE.services.length).padStart(2, '0')}</div>
      </div>
    </section>
  );
}
