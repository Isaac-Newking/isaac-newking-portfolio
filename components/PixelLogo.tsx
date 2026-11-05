// The tools Isaac uses, drawn as 16×16 pixel logos in their real brand colours.
// Each logo is a list of [x, y, colour] cells, built once at module load.

type Cell = [number, number, string];

// 3×5 pixel letters for the Adobe-style tiles, drawn two pixels per cell
const GLYPH: Record<string, string[]> = {
  A: ['010', '101', '111', '101', '101'],
  e: ['000', '111', '111', '100', '111'],
  P: ['110', '101', '110', '100', '100'],
  s: ['000', '011', '110', '011', '110'],
  i: ['010', '000', '010', '010', '010'],
  I: ['111', '010', '010', '010', '111'],
  d: ['001', '001', '111', '101', '111'],
};

// Adobe app icon: a rounded square in the app's dark colour with its two letters in the accent
function adobe(letters: string, bg: string, fg: string): Cell[] {
  const out: Cell[] = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const corner = (x === 0 || x === 15) && (y === 0 || y === 15);
    if (!corner) out.push([x, y, bg]);
  }
  [...letters].forEach((ch, li) => {
    const g = GLYPH[ch], x0 = 1 + li * 8;
    g.forEach((row, gy) => [...row].forEach((b, gx) => {
      if (b !== '1') return;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) out.push([x0 + gx * 2 + dx, 3 + gy * 2 + dy, fg]);
    }));
  });
  return out;
}

function disc(cx: number, cy: number, r: number, colour: string, into: Map<string, string>) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    if (x < 0 || y < 0 || x > 15 || y > 15) continue;
    if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) into.set(`${x},${y}`, colour);
  }
}
const cells = (m: Map<string, string>): Cell[] => [...m].map(([k, c]) => { const [x, y] = k.split(',').map(Number); return [x, y, c]; });

// Figma: two columns of rounded blocks (red, orange / purple, blue circle / green)
function figma(): Cell[] {
  const m = new Map<string, string>();
  const block = (x0: number, y0: number, colour: string, cut: ('tl' | 'tr' | 'bl' | 'br')[]) => {
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      const tl = x + y < 2, tr = (4 - x) + y < 2, bl = x + (4 - y) < 2, br = (4 - x) + (4 - y) < 2;
      if ((cut.includes('tl') && tl) || (cut.includes('tr') && tr) || (cut.includes('bl') && bl) || (cut.includes('br') && br)) continue;
      m.set(`${x0 + x},${y0 + y}`, colour);
    }
  };
  block(3, 0, '#F24E1E', ['tl', 'bl']);
  block(8, 0, '#FF7262', ['tr', 'br']);
  block(3, 5, '#A259FF', ['tl', 'bl']);
  disc(10.5, 7.5, 2.6, '#1ABCFE', m);
  block(3, 10, '#0ACF83', ['tl', 'bl', 'br']);
  return cells(m);
}

// CorelDRAW: a green balloon with a light swirl
function corel(): Cell[] {
  const m = new Map<string, string>();
  disc(8, 7.5, 7, '#2E9E44', m);
  disc(8, 7.5, 5, '#46C35C', m);
  disc(9.5, 6, 3, '#2E9E44', m);
  disc(10.5, 5, 1.6, '#C8F2CF', m);
  m.set('7,15', '#2E9E44'); m.set('8,15', '#2E9E44');
  return cells(m);
}

// DaVinci Resolve: three overlapping petals on a dark tile
function davinci(): Cell[] {
  const m = new Map<string, string>();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const corner = (x === 0 || x === 15) && (y === 0 || y === 15);
    if (!corner) m.set(`${x},${y}`, '#1E1E24');
  }
  disc(8, 5.2, 3.4, '#F04A3C', m);
  disc(5.2, 10.2, 3.4, '#3DA9F5', m);
  disc(10.8, 10.2, 3.4, '#5FD068', m);
  disc(8, 8.6, 1.3, '#FFFFFF', m);
  return cells(m);
}

const LOGOS: Record<string, Cell[]> = {
  Ae: adobe('Ae', '#00005B', '#9999FF'),
  Ps: adobe('Ps', '#001E36', '#31A8FF'),
  Ai: adobe('Ai', '#330000', '#FF9A00'),
  Id: adobe('Id', '#49021F', '#FF3366'),
  Fg: figma(),
  Cd: corel(),
  Dv: davinci(),
};

export default function PixelLogo({ id }: { id: string }) {
  const c = LOGOS[id];
  if (!c) return null;
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {c.map(([x, y, colour], i) => <rect key={i} x={x} y={y} width={1.02} height={1.02} fill={colour} />)}
    </svg>
  );
}
