# Isaac Newking portfolio: project guide for Claude

Read this first. It is the full handoff for continuing this project in a new session or another account.

- **Live site:** https://isaac-rose.vercel.app (Vercel project "isaac")
- **Repo:** https://github.com/Isaac-Newking/isaac-newking-portfolio. Every push to `main` deploys automatically.
- **Commit identity:** `Isaac Newking` with the account email Isaac gives you. Push straight to `main` only when Isaac asks.
- **Owner:** Isaac Newking, brand designer. Contact on the site: newkingisaac@outlook.com. Behance: https://www.behance.net/isaacnewking

## How Isaac works

- Sends screenshots with arrows or drawn lines and short voice-typed notes. Read the intent, not the literal words. For example, "the role" means "the reel", and "OJ Consult" means OJKonsult.
- Wants bold, "award-style", pixel-concept design that stays fast on phones. Checks everything on mobile.
- Expects each change to be built, checked in screenshots (desktop 1440 and Pixel 7), pushed and live. Then a short plain report.
- Images sent mid-message often don't arrive. If one is referenced but missing, ask him to resend it (a zip works best).

## Design rules (keep these)

- **Fonts:** Funnel Display (headings), Instrument Sans (body), Silkscreen (pixel labels).
- **Colours:** accent orange `#FF9600` (`--signal`), black void, white. Selection blue `#2F6BFF` for the avatar frame and handles.
- **Grid:** a 132px grid on surfaces. Square corners everywhere (no rounded edges) except phone and laptop mockups.
- **Pixel marker:** a single orange square between words in marquees.
- **Names:** project names only (Isaac removed the notable-clients row). About says "50+ brands worked with" and shows a brand wall of project names.
- **Worlds:** each project is a "world" with per-piece colour shifts.
- **Accessibility:** respect `prefers-reduced-motion` in every animation.

## Site map

| Part | File | Notes |
| --- | --- | --- |
| Loader | `components/Loader.tsx` | SVG/CSS tea cup, "LOADING…", fades into the hero. First visit per session only (head script in `app/layout.tsx` adds `no-loader`). |
| Hero tunnel | `components/HeroRoom.tsx` | 3D grid corridor. Pixel-art wall panels (`public/img/pixel/*.png`) appear on first scroll. The title breaks into pixels as you zoom and rebuilds on the way back. About grows out of the tunnel end via a copy inside the sticky stage (no shake). |
| About / facts | `app/page.tsx`, `components/MePhoto.tsx`, `components/Avatar.tsx`, `components/PixelLogo.tsx` | Isaac's photo (`public/img/ui/isaac.webp`, pixel-dissolve edges) depixelates once About is visible; 8-bit avatar badge; why/background/hobbies; brand wall; pixel software logos. |
| Services | `components/Services.tsx` | Orange warped "lens" band; words inside show black and magnified. |
| Mascot "Tea" | `components/Buddy.tsx` | Walking cup, bottom-left, home page only. |
| Contact floor | `app/page.tsx`, `components/FloorAvatar.tsx` | Perspective floor, endless "NEWKING ISAAC" loop. The full-body avatar builds pixel by pixel behind the name row and waves at the bottom. |
| Project pages | `components/WorldView.tsx` | Strips with arrows, lightbox, auto-slide on phones, pixelate into the next or previous world. |
| **Branding page** | `BrandCase` + `planMosaic` in `components/WorldView.tsx` | One brand at a time, chosen with press buttons, with a hash per brand (`#lonepay`). The **creative mosaic** is solved from each image's shape so pieces show in full: a feature piece beside a stack of two, justified rows and full-width wides. Separate phone plan (rows of at most 2). "Next brand" button and "Discover more brands" cards. |
| Page transitions | `components/SiteShell.tsx` | Lenis smooth scroll, pixel wipe, SVG pixelate filter. |
| Styles | `app/globals.css` | All tokens, both themes, all breakpoints. Branding styles are under `.bc-*`. |

## Content

- **Worlds and brand groups (order, blurbs):** `content/worlds.ts`. Branding order: Esorae Home, The Stewards' Table, LonePay, Esorae Foundation, eurban, O5 Dynamix, OJKonsult.
- **Pieces:** `content/work.json`. Each piece has `src`, `name`, `w`, `h`, `group`, palette, `mock` (`plain`, `browser`, `laptop`, `phone`, `x`, `insta`) and an optional `video` (a looping clip that plays in the frame; the still is its poster).
- **Images:** `public/img/work/<world>/`. Every JPG/PNG needs a `.webp` copy beside it, plus a `.w1200.webp` copy if it is wider than 1300px. The site loads these through `webp()`, `webpSmall()` and `srcSetFor()` in `lib/pixel.ts`. Make them with Pillow at quality 80, or 78 for the 1200px copy.
- **Motion reels:** `MOTION` in `content/site.ts` and `public/motion/`. Website recordings are `*-site.mp4` (1280×800 H.264, CRF about 25, faststart).

## Helper scripts (`scripts/`)

- `collage.py OUT.jpg LAYOUT BG imgs…`: 2–4 image collages (`big-left`, `2x2`, `pair`, `big-top`). Append `:contain` to a path to fit it whole. Isaac now prefers single pieces in the mosaic over collages.
- `pixelart.py OUTDIR`: draws the hero wall pixel panels at 1 px per cell.
- `deck/deck.html`: the Behance/Dribbble slide deck (exports live in `showcase/`). It shows every piece: run `python3 scripts/deck/build_data.py` first to regenerate `deck/data.js` from `content/`, and slides paginate themselves. Render each `.slide` at 1920×1080 with Playwright for PNGs; `page.pdf` at 1920×1080 for the PDF; call `setSvc(n)` to animate the What I do slide for the GIF.
- `deck/v2.html?v=short|long` + `deck/export_v2.js <framesDir>`: the creative Behance deck (brand-colour dividers with huge numbers, index columns, motion pages). Exports to `showcase/v2/<version>/` as a Behance module set (JPG + GIF) and a flattened PDF. Motion frames: `ffmpeg -ss <s> -t 4 -i clip.mp4 -vf fps=9,scale=900:-2 <framesDir>/<name>/%03d.jpg` for ehsite, eusite, diffuser, pillows, profitreel, profitmotion, ojkmotion.
- `mockup-scene.html?scene=court|tennis|stone|linen&shot=file.png`: CSS 3D laptop scenes. Screenshot it at 2400×1800 with Playwright.
- Website recordings: Playwright `recordVideo` while wheel-scrolling, then trim and encode with ffmpeg. Close any pop-ups first.

## Testing

```bash
npm install
npm run build
npx next start -p 3100   # then screenshot with Playwright at 1440×900 and devices['Pixel 7']
pkill -f next-server      # always stop it afterwards, or later runs serve stale chunks
```

Skip the loader in tests with `sessionStorage.setItem('in-intro','1')` in an init script.

## Open ideas and questions

- If Isaac likes the branding mosaic, roll the same case-study layout out to the other world pages.
- Testimonials section is hidden until quotes exist. "Book a call" needs a link.
- LonePay strategy pages (mission, vision, values) were left out; offer them as one piece if he wants the story.
- Fonts are bundled in `app/fonts` (next/font/local), so builds never call Google. Animation loops (hero, services, work preview) sleep until scroll or pointer movement; keep new effects event-driven too.
- Images could move to a CMS (Sanity was the earlier plan).
