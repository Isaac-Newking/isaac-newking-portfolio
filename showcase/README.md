# Behance / Dribbble showcase

- `Isaac-Newking-Portfolio-2026-upload.pdf`: **use this one to upload** (Behance PDF import, email, LinkedIn). Every page is a flattened 3840×2160 image, so it looks the same everywhere and needs no fonts; 42 pages, 18.6 MB.
- `Isaac-Newking-Portfolio-2026.pdf`: the same deck with live text (selectable), for printing or editing.
- `slides/01.png` … `42.png`: each slide at 1920×1080, ready to upload as Behance project modules or Dribbble shots.
- `what-i-do.gif` (1200 wide, loops) and `what-i-do.mp4` (1920×1080): the animated services slide.

Source: `scripts/deck/deck.html`. Pieces and copy are in the `P` list near the bottom. To re-export, render each `.slide` with Playwright at 1920×1080 and print the page to PDF (see the commands in the session notes in `CLAUDE.md`).

The deck includes every piece on the site (142). To refresh it after adding work: `python3 scripts/deck/build_data.py`, then re-render `scripts/deck/deck.html`. Sections split across slides automatically so each slide stays well filled and no piece is cropped.
