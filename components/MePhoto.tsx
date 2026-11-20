'use client';

import { useEffect, useRef } from 'react';
import { depixel, loadImage } from '@/lib/pixel';

// Isaac's photo starts as big pixels and sharpens when it scrolls into view, like the work images.
const SRC = '/img/ui/isaac.webp';

export default function MePhoto() {
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    let started = false, inView = false, retry = 0 as unknown as ReturnType<typeof setTimeout>;
    // start only once the real About section is on screen (during the tunnel fly-in a copy covers it)
    const tryStart = async () => {
      if (started || !inView) return;
      const sec = c.closest('section');
      if (sec && getComputedStyle(sec).visibility === 'hidden') { clearTimeout(retry); retry = setTimeout(tryStart, 120); return; }
      started = true; removeEventListener('scroll', tryStart); io.disconnect();
      const r = c.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
      const im = await loadImage(SRC);
      if (im) depixel(c, im, { cover: true, step: 70 });
    };
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; tryStart(); }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(c);
    addEventListener('scroll', tryStart, { passive: true });
    return () => { clearTimeout(retry); io.disconnect(); removeEventListener('scroll', tryStart); };
  }, []);
  return <canvas ref={cv} className="me" role="img" aria-label="Isaac Newking, brand designer" />;
}
