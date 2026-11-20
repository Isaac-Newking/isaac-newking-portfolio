# Behance / Dribbble showcase

Two versions, each in two formats, all in the original deck style:

| | Behance module set (motion plays) | PDF (still frames) |
| --- | --- | --- |
| **Short**, 18 pages | `short/behance/` or `short/behance-modules-short.zip` | `short/Isaac-Newking-Portfolio-short.pdf` |
| **Long**, 41 pages, every piece | `long/behance/` or `long/behance-modules-long.zip` | `long/Isaac-Newking-Portfolio-long.pdf` |

Short: Esorae Home, The Stewards' Table and LonePay get three slides each; Fission, UI/UX, Web3 (Axislink + Profit AI) and Flyers one each. Esorae Foundation, eurban, O5 Dynamix and OJKonsult are long-only.

Animated modules (`.gif`): cover (pixel reveal), about (photo depixelates), What I do (services lens), and every slide with a website recording or reel (marked ▶ MOTION).

## Upload to Behance
1. Unzip the module set and select all files at once; they upload in number order.
2. Set module spacing to 0.
3. Use `01.gif` as the thumbnail.

The PDFs are flattened 4K pages with a clickable Selected works page. `what-i-do.gif` / `.mp4` are the standalone services animation.

Rebuild: `python3 scripts/deck/build_data.py`, extract motion frames (see CLAUDE.md), then `node scripts/deck/export.js <framesDir> [short|long]`.
