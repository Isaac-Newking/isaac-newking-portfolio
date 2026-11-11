"""Compose 2–4 images into one collage tile.
usage: python3 collage.py OUT.jpg LAYOUT BG A.jpg B.jpg [C.jpg [D.jpg]]
layouts: big-left (A tall on the left, B and C stacked right), 2x2, pair (A and B side by side), big-top (A wide on top, B C D below)
"""
import sys
from PIL import Image, ImageDraw

import os
W, H, G, R = 2400, int(os.environ.get("COLLAGE_H", 1500)), 20, 22  # canvas, gutter, corner radius


def fit(path, w, h):
    contain = path.endswith(':contain')
    if contain: path = path[:-8]
    im = Image.open(path).convert('RGB')
    if contain:  # whole image, centred on its own edge colour
        s = min(w / im.width, h / im.height)
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        out = Image.new('RGB', (w, h), im.getpixel((2, 2)))
        out.paste(im, ((w - im.width) // 2, (h - im.height) // 2))
        return out
    s = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def paste(canvas, path, box):
    x, y, w, h = box
    tile = fit(path, w, h)
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), R, fill=255)
    canvas.paste(tile, (x, y), mask)


def boxes(layout):
    iw, ih = W - 2 * G, H - 2 * G
    if layout == 'big-left':
        lw = round((iw - G) * 0.6); rw = iw - G - lw; rh = (ih - G) // 2
        return [(G, G, lw, ih), (G + lw + G, G, rw, rh), (G + lw + G, G + rh + G, rw, ih - G - rh)]
    if layout == '2x2':
        cw = (iw - G) // 2; ch = (ih - G) // 2
        return [(G, G, cw, ch), (G + cw + G, G, iw - G - cw, ch), (G, G + ch + G, cw, ih - G - ch), (G + cw + G, G + ch + G, iw - G - cw, ih - G - ch)]
    if layout == 'pair':
        cw = (iw - G) // 2
        return [(G, G, cw, ih), (G + cw + G, G, iw - G - cw, ih)]
    if layout == 'big-top':
        th = round((ih - G) * 0.58); bh = ih - G - th; cw = (iw - 2 * G) // 3
        return [(G, G, iw, th)] + [(G + i * (cw + G), G + th + G, cw if i < 2 else iw - 2 * (cw + G), bh) for i in range(3)]
    raise SystemExit('unknown layout ' + layout)


out, layout, bg, *imgs = sys.argv[1:]
canvas = Image.new('RGB', (W, H), bg)
for path, box in zip(imgs, boxes(layout)):
    paste(canvas, path, box)
canvas.save(out, quality=88, optimize=True, progressive=True)
print(out, layout, len(imgs))
