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
        const gap = clamp(vh * 0.1, 52, 90);
        // grid flows upward with the scroll, one continuous sheet
        stick.current.style.backgroundPosition = `0 ${(r.top * 0.6) % 120}px`;
        items.current.forEach((el, i) => {
          if (!el) return;
          const d = i - a; // < 0: above the band, > 0: below it
          const ad = Math.abs(d);
          const scale = d < 0 ? 1 - Math.min(ad, 2.5) * 0.26 : 1 - Math.min(ad, 3) * 0.17;
          const opacity = d < 0 ? 1 - ad * 0.75 : 1 - ad * 0.3;
          // spacing follows the shrinking size, so smaller lines sit closer together
          const y = Math.sign(d) * (Math.min(ad, 1) * gap * 1.4 + Math.max(0, ad - 1) * gap * 0.78);
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
