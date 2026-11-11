# Isaac Newking — portfolio

Next.js 15 (App Router) + React 19 + TypeScript. Smooth scroll with Lenis, pixel effects on canvas, Vercel Web Analytics.

- `/` home: tea-cup loader, 3D grid room hero with pixel-art panels on the walls, Hello, services on a warped band, work index, FAQ, contact
- `/work/[slug]` one page per world: `branding`, `fission`, `uiux`, `web3`, `flyers`. Colours shift per piece as you scroll.
- Page changes use a pixel wipe in the next world's colour (`components/SiteShell.tsx`).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Edit content

| What | Where |
| --- | --- |
| Bio, email, skills, software, services, socials, booking link | `content/site.ts` |
| FAQ | `FAQ` in `content/site.ts` |
| Testimonials (section is hidden while the list is empty) | `TESTIMONIALS` in `content/site.ts` |
| Esorae Home motion (muted loops, play only on screen) | put files in `public/motion/`, list them in `MOTION` in `content/site.ts` |
| Worlds: names, years, blurbs, base palettes, brand groups | `content/worlds.ts` |
| Pieces: images, captions, per-piece palette, mockup frame | `content/work.json` + `public/img/work/<world>/` |

Mockup frames per piece (`mock` in `work.json`): `plain`, `browser` (desktop UI), `phone` (mobile UI), `x` (3:1 banner shown as an X profile header).

Planned: move all of the above into a Sanity dashboard so it can be edited without code.

## Deploy and domain

1. Push this repo to GitHub, then import it at vercel.com/new (framework: Next.js, no settings to change).
2. In the Vercel project, open Analytics and enable Web Analytics.
3. Set `NEXT_PUBLIC_SITE_URL` to the live URL (used for share images).
4. When you buy a domain: Vercel project → Settings → Domains → add it, then set the DNS records Vercel shows at your registrar.

Full handoff notes for continuing the project (design rules, file map, scripts, testing): see `CLAUDE.md`.
