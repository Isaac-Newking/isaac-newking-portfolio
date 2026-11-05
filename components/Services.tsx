'use client';

import { useEffect, useRef } from 'react';
import { SITE } from '@/content/site';
import { clamp } from '@/lib/pixel';

// The warped orange band sits still in the middle and works like a lens: the list scrolls under it,
// and whatever part of a word is inside the band shows in black, slightly magnified, while the rest
// stays outside it. Two lines above and two below, each smaller and fainter.
export default function Services() {
  const sec = useRef<HTMLElement>(null);
  const idx = useRef<HTMLDivElement>(null);
  const stick = useRef<HTMLDivElement>(null);
  const lens = useRef<SVGSVGElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const lensItems = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let raf = 0, clipKey = '';
    const frame = () => {
      if (!sec.current || !idx.current || !stick.current || !lens.current || !inner.current) return;
      const r = sec.current.getBoundingClientRect(), vh = innerHeight;
      if (r.top < vh && r.bottom > 0) {
        const n = SITE.services.length;
        const a = clamp(-r.top / (r.height - vh), 0, 1) * (n - 1);
        const gap = innerWidth < 760 ? clamp(innerWidth * 0.15, 48, 64) : clamp(vh * 0.105, 56, 96);
        stick.current.style.backgroundPosition = `-1px ${((r.top % 132) + 132) % 132}px`;

        // the inside layer is cut to the band's exact shape
        const W = stick.current.clientWidth, H = stick.current.clientHeight, lh = lens.current.getBoundingClientRect().height;
        const key = `${W}x${H}x${lh}`;
        if (key !== clipKey) {
          clipKey = key;
          const t = H / 2 - lh / 2, b = H / 2 + lh / 2, s = lh * 0.2;
          inner.current.style.clipPath = `path('M0 ${t} Q${W / 2} ${t + s} ${W} ${t} L${W} ${b} Q${W / 2} ${b - s} 0 ${b} Z')`;
        }

        items.current.forEach((el, i) => {
          if (!el) return;
          const d = i - a, ad = Math.abs(d);
          const scale = clamp(1 - Math.min(ad, 2.5) * 0.17, 0.3, 1);
          const opacity = ad <= 2 ? 1 - ad * 0.36 : Math.max(0, 0.28 - (ad - 2) * 0.56);
          const y = Math.sign(d) * (Math.min(ad, 1) * gap * 1.25 + Math.max(0, ad - 1) * gap * 0.92);
          el.style.transform = `translateY(calc(-50% + ${y}px)) scale(${scale})`;
          el.style.opacity = String(clamp(opacity, 0, 1));
          const li = lensItems.current[i];
          if (li) li.style.transform = `translateY(calc(-50% + ${y * 1.06}px)) scale(${scale * 1.06})`;
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
        <h2 className="bubble lab">What I do</h2>
        <ul className="items">
          {SITE.services.map((s, i) => <li key={s}><div className="item" ref={(el) => { items.current[i] = el; }}>{s}</div></li>)}
        </ul>
        <svg className="lens" ref={lens} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0 Q50 20 100 0 L100 100 Q50 80 0 100 Z" />
        </svg>
        <div className="lens-in" ref={inner} aria-hidden="true">
          {SITE.services.map((s, i) => <div key={s} className="item" ref={(el) => { lensItems.current[i] = el; }}>{s}</div>)}
          <i className="lens-mk l" /><i className="lens-mk r" />
        </div>
        <div className="idx" ref={idx}>01 / {String(SITE.services.length).padStart(2, '0')}</div>
      </div>
    </section>
  );
}
