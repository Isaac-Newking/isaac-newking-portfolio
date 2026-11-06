import work from './work.json';

export type Mock = 'plain' | 'browser' | 'laptop' | 'phone' | 'x' | 'insta';

export type Piece = {
  src: string;
  name: string;
  w: number;
  h: number;
  group?: string;
  bg: string;
  fg: string;
  ac: string | null;
  mock: Mock;
  /** a looping screen recording to play inside the mockup instead of the still */
  video?: string;
};

export type Palette = { bg: string; fg: string; accent: string; line: string };

export type Group = { name: string; blurb: string; lead?: boolean; motion?: boolean };

export type World = {
  slug: string;
  name: string;
  kind: string;
  year: string;
  discipline: string;
  projects: string;
  blurb: string;
  cover: string;
  pal: Palette;
  groups?: Group[];
  pieces: Piece[];
};

type WorldDef = Omit<World, 'pieces'>;

const DEFS: WorldDef[] = [
  {
    slug: 'branding', name: 'Branding', kind: 'Major branding projects', year: '2026',
    discipline: 'Identity, campaign, motion', projects: '4 brands', cover: 'eh-billboard',
    blurb: 'Four identities built end to end, led by Esorae Home: strategy, logo, campaigns, packaging moments, merch, social and motion.',
    pal: { bg: '#1F1B16', fg: '#F3EEE4', accent: '#C9973F', line: 'rgba(201,151,63,.22)' },
    groups: [
      { name: 'Esorae Home', lead: true, motion: true, blurb: 'Identity for a home textile and fragrance brand. Brand personality, billboard and roll-up campaigns, product shoots, a social system in charcoal and gold, and motion.' },
      { name: 'Esorae Foundation', blurb: 'Identity for an education-focused foundation: logo, brand pattern, illustrative style and campaign flyers in green and orange.' },
      { name: 'eurban', blurb: 'Website and launch campaign for a residential developer: a calm, image-led site for its homes in Lagos and Benin, and teaser posters for a new way of living.' },
      { name: 'O5 Dynamix', blurb: 'Identity and website for a sports and fitness brand: the O5 runner mark, an orange and black palette, a booking site for four arenas, merch for tees, caps and bottles, and a launch social campaign.' },
    ],
  },
  {
    slug: 'fission', name: 'Fission', kind: 'Brand & campaign system', year: '2025',
    discipline: 'Brand, social, illustration', projects: 'Fission', cover: 'fission-jt-redo-2',
    blurb: 'Visual system for Fission, a protocol for fractional ownership of real-world assets. Feature graphics, tokenomics, partnership and community posts built from one isometric, lime-on-black language.',
    pal: { bg: '#050505', fg: '#F4F9F5', accent: '#96E323', line: 'rgba(150,227,35,.22)' },
  },
  {
    slug: 'uiux', name: 'UI/UX', kind: 'Product interfaces', year: '2025',
    discipline: 'UI, UX, web design', projects: '3 products', cover: 'new-pairs',
    blurb: 'Interface design for crypto products: the Sniper trading terminal on desktop and mobile, the DappBuilder no-code toolkit and an NFT marketplace.',
    pal: { bg: '#0D0D0D', fg: '#E9EDE8', accent: '#6BE38A', line: 'rgba(107,227,138,.18)' },
  },
  {
    slug: 'web3', name: 'Web3 Projects', kind: 'Launch visuals', year: '2026',
    discipline: 'Key visuals, launch graphics, UI', projects: '8 projects', cover: 'twitter-axis',
    blurb: 'Brand worlds and launch visuals for crypto projects, led by Axislink: X headers, announcements, dashboard and landing-page UI, plus Hashcake and a run of token launches.',
    pal: { bg: '#0B0A1A', fg: '#EEEAF8', accent: '#E7B771', line: 'rgba(231,183,113,.2)' },
    groups: [
      { name: 'Axislink', lead: true, blurb: 'A crypto community platform: X headers, the mascot, a KYC announcement with Assure DeFi, the AI Bot launch, and the dashboard and landing-page UI.' },
      { name: 'Hashcake', blurb: 'X headers for a meme token, in two directions: a pixel cake and a 3D cake.' },
      { name: 'Token launches', blurb: 'Countdown and launch visuals for Copy AI, Based Tax Inspector, Profit AI, DevKit, ANA and 0xShadow.' },
    ],
  },
  {
    slug: 'flyers', name: 'Flyers & Banners', kind: 'Social & print', year: '2026',
    discipline: 'Social, print, campaign', projects: '8 brands', cover: 'joji-goe-to-japan-3',
    blurb: 'Social banners and flyers for crypto communities and consumer brands: Sendor, Sheriff Rango, Smart Forge, Luna, Terra Scan, Joji Goes to Japan, Scentify and Hip & Happy.',
    pal: { bg: '#F3EAF9', fg: '#2A1438', accent: '#A954DD', line: 'rgba(42,20,56,.16)' },
  },
];

const W = work as Record<string, Piece[]>;

export const WORLDS: World[] = DEFS.map((d) => {
  const list = W[d.slug].slice();
  if (!d.groups) {
    const i = list.findIndex((p) => p.src.includes('/' + d.cover + '.'));
    if (i > 0) list.unshift(list.splice(i, 1)[0]);
  }
  return { ...d, pieces: list };
});

export const TOTAL_PIECES = WORLDS.reduce((n, w) => n + w.pieces.length, 0);

export function getWorld(slug: string) {
  return WORLDS.find((w) => w.slug === slug);
}

export function findPiece(slug: string, key: string) {
  return W[slug]?.find((p) => p.src.includes('/' + key + '.'));
}

export function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (n >> 16) * 0.2126 + ((n >> 8) & 255) * 0.7152 + (n & 255) * 0.0722 > 140;
}

export function piecePalette(world: World, p: Piece): Palette {
  if (!p.ac) return world.pal;
  return { bg: p.bg, fg: p.fg, accent: p.ac, line: isLight(p.bg) ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.16)' };
}
