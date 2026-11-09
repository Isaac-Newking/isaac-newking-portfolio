'use client';

import { useEffect, useRef, useState } from 'react';

// A small pixel cup that fills with tea, with LOADING ticking underneath, then the screen fades into the hero.
// It is plain SVG and CSS, so it is in the very first paint (before any JavaScript runs) and keeps animating
// smoothly even while the page is busy starting up. First visit per session only (see the head script in layout).
const W = 16;
const cells: [number, number][] = [];
for (let x = 0; x < W; x++) cells.push([x, 0]);
for (let y = 1; y <= 11; y++) cells.push([0, y], [W - 1, y]);
for (let x = 1; x < W - 1; x++) cells.push([x, 12]);
cells.push([16, 2], [17, 2], [18, 3], [18, 4], [18, 5], [17, 6], [16, 6]); // handle
for (let x = -3; x <= 15; x++) cells.push([x, 14]); // saucer
for (let x = 17; x <= 19; x++) cells.push([x, 14]);

const px = (x: number, y: number, fill: string, k?: string | number) => <rect key={k ?? `${x}.${y}`} x={x + 0.07} y={y + 0.07} width={0.86} height={0.86} fill={fill} />;
const tea: React.ReactNode[] = [];
for (let y = 1; y <= 11; y++) for (let x = 1; x < W - 1; x++) tea.push(px(x, y, y === 1 ? '#FFC266' : y >= 9 ? '#E07A00' : '#FF9600'));

const MIN = 900, OUT = 520;

export default function Loader({ onDone }: { onDone: () => void }) {
  const [gone, setGone] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  const leave = useRef<() => void>(() => {});

  useEffect(() => {
    if (document.documentElement.classList.contains('no-loader')) { setGone(true); onDone(); return; }
    let done = false;
    const t: ReturnType<typeof setTimeout>[] = [];
    const finish = () => {
      if (done) return; done = true;
      try { sessionStorage.setItem('in-intro', '1'); } catch { /* storage blocked */ }
      el.current?.classList.add('out');
      onDone();
      t.push(setTimeout(() => setGone(true), OUT));
    };
    leave.current = finish;
    // the cup starts filling at first paint; leave once it is full, counted from the start of the page load
    t.push(setTimeout(finish, Math.max(0, MIN - performance.now())));
    return () => t.forEach(clearTimeout);
  }, [onDone]);

  if (gone) return null;
  return (
    <div className="loader" ref={el} role="status" aria-label="Loading">
      <div className="ld-cup">
        <svg viewBox="-4 -6 25 21" shapeRendering="crispEdges" aria-hidden="true">
          <defs><clipPath id="ld-in"><rect x="1" y="1" width="14" height="11" /></clipPath></defs>
          <g clipPath="url(#ld-in)"><g className="ld-tea">{tea}</g></g>
          {cells.map(([x, y]) => px(x, y, '#FFFFFF'))}
          <g className="ld-steam">{[[5, -2], [6, -3], [5, -4], [10, -2], [9, -3], [10, -4]].map(([x, y]) => px(x, y, 'rgba(255,255,255,.55)'))}</g>
        </svg>
        <p className="ld-label">LOADING<span className="ld-dots" /></p>
      </div>
      <button className="skip" type="button" onClick={() => leave.current()}>Skip</button>
    </div>
  );
}
