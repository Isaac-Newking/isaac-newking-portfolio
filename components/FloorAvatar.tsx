'use client';

import { useEffect, useRef } from 'react';
import { clamp, reducedMotion } from '@/lib/pixel';

// Full-body version of the 8-bit avatar: the same head as the bust in the About section,
// then an orange hoodie, hands, dark trousers and white trainers.
// w = white, o = orange, p = darker orange (pocket and seams), d = trousers.
const HEAD = [
  '......########......', '....############....', '...##############...', '..################..', '..####........####..', '..###..........###..',
  '..##............##..', '..##..##....##..##..', '..##..##....##..##..', '..##............##..', '..##.....##.....##..', '...##..........##...',
  '...##...####...##...', '....##........##....', '.....##########.....', '.......######.......', '.......##..##.......',
].map((r) => '..' + r.replace(/#/g, 'w') + '..');
const BODY = [
  '.......oooowwoooo.......',
  '.....oooooowwoooooo.....',
  '....oooooooowwoooooo....',
  '...oooooooowwoooooooo...',
  '..oooooooooooooooooooo..',
  '..oooooooooooooooooooo..',
  '..ooo.oooooooooooo.ooo..',
  '..ooo.oooooooooooo.ooo..',
  '..ooo.oooooooooooo.ooo..',
  '..ooo.oooppppppooo.ooo..',
  '..ooo.ooopoooopooo.ooo..',
  '..ooo.ooopoooopooo.ooo..',
  '..ooo.oooppppppooo.ooo..',
  '..ooo.oooooooooooo.ooo..',
  '..www.oooooooooooo.www..',
  '..www.pppppppppppp.www..',
  '......dddddddddddd......',
  '......dddddddddddd......',
  '......ddddd..ddddd......',
  '......ddddd..ddddd......',
  '......ddddd..ddddd......',
  '......ddddd..ddddd......',
  '......ddddd..ddddd......',
  '......ddddd..ddddd......',
  '......ddddd..ddddd......',
  '......ddddd..ddddd......',
  '.....wwwwww..wwwwww.....',
  '.....wwwwww..wwwwww.....',
];
const ART = [...HEAD, ...BODY];
const W = 24, H = ART.length;
const COL: Record<string, string> = { w: '#F2F2F2', o: '#FF9600', p: '#C46F00', d: '#4A4A4E' };
const DEPTH = '#262628';

// He rises out of the floor and builds himself cell by cell over the last stretch of the page,
// feet first, and comes apart the same way when you scroll back up.
export default function FloorAvatar() {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current, c = cv.current;
    if (!el || !c) return;
    const ctx = c.getContext('2d')!;
    const cells: [number, number, string][] = [];
    ART.forEach((row, y) => [...row].forEach((ch, x) => { if (COL[ch]) cells.push([x, y, COL[ch]]); }));
    // mostly bottom-up, with some scatter so it reads as pixels arriving, not a wipe
    const score = cells.map(([, y]) => (H - y) / H + Math.random() * 0.45);
    const order = cells.map((_, i) => i).sort((a, b) => score[a] - score[b]);

    let shown = -1;
    const draw = (n: number) => {
      if (n === shown) return;
      shown = n;
      ctx.clearRect(0, 0, W + 1, H + 1);
      ctx.fillStyle = DEPTH;
      for (let k = 0; k < n; k++) { const [x, y] = cells[order[k]]; ctx.fillRect(x + 1, y + 1, 1, 1); }
      for (let k = 0; k < n; k++) { const [x, y, col] = cells[order[k]]; ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
    };

    if (reducedMotion()) { draw(cells.length); el.style.transform = 'none'; return; }

    let raf = 0, live = false;
    const frame = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = clamp(1 - (max - scrollY) / (innerHeight * 0.85), 0, 1);
      draw(Math.round(clamp(p * 1.15, 0, 1) * cells.length));
      const e = 1 - Math.pow(1 - p, 3);
      el.style.transform = `translate3d(-50%, ${(1 - e) * 22}%, 0)`;
    };
    const onScroll = () => { if (live && !raf) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([en]) => { live = en.isIntersecting; if (live) onScroll(); }, { rootMargin: '200px 0px' });
    io.observe(el);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    frame();
    return () => { io.disconnect(); removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="floor-avatar" ref={wrap} aria-hidden="true">
      <canvas ref={cv} width={W + 1} height={H + 1} />
    </div>
  );
}
