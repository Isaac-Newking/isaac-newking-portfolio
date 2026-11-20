# Creative portfolio (v2): short and long

Each version comes in two formats:

| | Behance module set (motion plays) | PDF (still frames) |
| --- | --- | --- |
| Short, 18 pages | `short/behance/` or `short/behance-modules-short.zip` | `short/Isaac-Newking-Portfolio-short.pdf` |
| Long, 45 pages | `long/behance/` or `long/behance-modules-long.zip` | `long/Isaac-Newking-Portfolio-long.pdf` |

## Uploading the module set to Behance (keeps the motion)
1. New project, then upload the files from `behance/` in number order (01, 02, 03 …). Select them all at once; Behance keeps the file-name order.
2. `.gif` files are the animated pages (cover, about photo reveal, What I do, website and reel pages). JPGs are stills.
3. In project settings set the module spacing to 0 so pages run edge to edge.
4. Use `01.gif` (cover) as the project thumbnail.

## The PDFs
Flattened 4K pages, clickable Selected works page, ▶ marks where a piece moves in the Behance version. Best for email, LinkedIn and clients.

Rebuild: `python3 scripts/deck/build_data.py`, extract motion frames (see `scripts/deck/export_v2.js` header), then `node scripts/deck/export_v2.js <framesDir>`.
