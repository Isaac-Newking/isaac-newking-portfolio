"""Draws the hero wall panels as true pixel art at native size (1 px = 1 cell); the site scales them up crisply."""
import math, sys, os
from PIL import Image

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
P = dict(K=(11, 11, 12), F=(42, 42, 46), W=(242, 242, 242), O=(255, 150, 0), D=(196, 111, 0), C=(255, 230, 191),
         G=(74, 74, 78), g=(30, 30, 33), B=(47, 107, 255), L=(127, 166, 255), R=(255, 90, 90), Y=(255, 214, 102))

# 3x5 font for small labels
F3 = {
 'A': ['010', '101', '111', '101', '101'], 'C': ['011', '100', '100', '100', '011'], 'D': ['110', '101', '101', '101', '110'],
 'E': ['111', '100', '110', '100', '111'], 'H': ['101', '101', '111', '101', '101'], 'I': ['111', '010', '010', '010', '111'],
 'K': ['101', '110', '100', '110', '101'], 'L': ['100', '100', '100', '100', '111'], 'N': ['101', '111', '111', '111', '101'],
 'O': ['111', '101', '101', '101', '111'], 'P': ['110', '101', '110', '100', '100'], 'R': ['110', '101', '110', '101', '101'],
 'S': ['011', '100', '010', '001', '110'], 'T': ['111', '010', '010', '010', '010'], 'U': ['101', '101', '101', '101', '111'],
 'V': ['101', '101', '101', '101', '010'], 'Y': ['101', '101', '010', '010', '010'], 'G': ['011', '100', '101', '101', '011'],
 'M': ['101', '111', '111', '101', '101'], '+': ['000', '010', '111', '010', '000'], '1': ['010', '110', '010', '010', '111'],
 '0': ['111', '101', '101', '101', '111'], 'X': ['101', '101', '010', '101', '101'], '2': ['110', '001', '010', '100', '111'], '6': ['011', '100', '111', '101', '111'],
 ' ': ['000', '000', '000', '000', '000'], '!': ['010', '010', '010', '000', '010'], '.': ['000', '000', '000', '000', '010'],
}
# 5x7 for the window headline
F5 = {
 'H': ['10001', '10001', '10001', '11111', '10001', '10001', '10001'], 'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
 'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'], 'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
 'I': ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
}


class Art:
    def __init__(s, w, h, bg='K'):
        s.im = Image.new('RGB', (w, h), P[bg]); s.w, s.h = w, h

    def px(s, x, y, c):
        if 0 <= x < s.w and 0 <= y < s.h: s.im.putpixel((int(x), int(y)), P[c])

    def rect(s, x, y, w, h, c):
        for j in range(h):
            for i in range(w): s.px(x + i, y + j, c)

    def box(s, x, y, w, h, c):
        for i in range(w): s.px(x + i, y, c); s.px(x + i, y + h - 1, c)
        for j in range(h): s.px(x, y + j, c); s.px(x + w - 1, y + j, c)

    def line(s, x0, y0, x1, y1, c):
        n = max(abs(x1 - x0), abs(y1 - y0), 1)
        for k in range(n + 1): s.px(round(x0 + (x1 - x0) * k / n), round(y0 + (y1 - y0) * k / n), c)

    def text(s, x, y, t, c, font=F3, gap=1):
        for ch in t:
            g = font[ch]
            for j, row in enumerate(g):
                for i, b in enumerate(row):
                    if b == '1': s.px(x + i, y + j, c)
            x += len(g[0]) + gap

    def frame(s, title=None, bar='F'):
        s.box(0, 0, s.w, s.h, 'F')
        if title:
            s.rect(1, 1, s.w - 2, 7, bar)
            s.text(3, 2, title, 'W')
            for k, c in enumerate('ROY' if False else 'OGG'):
                s.rect(s.w - 5 - k * 4, 3, 2, 2, c)

    def dots(s, step=4, c='g', top=9):
        for y in range(top, s.h - 1, step):
            for x in range(2, s.w - 1, step): s.px(x, y, c)

    def save(s, name):
        s.im.save(os.path.join(OUT, name + '.png'), optimize=True)
        print(name, s.w, s.h)


def pen():
    a = Art(48, 36); a.frame('PEN'); a.dots()
    p0, c0, c1, p1 = (6, 28), (13, 11), (33, 33), (42, 14)
    pts = [(round((1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * c0[0] + 3 * (1 - t) * t * t * c1[0] + t ** 3 * p1[0]),
            round((1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * c0[1] + 3 * (1 - t) * t * t * c1[1] + t ** 3 * p1[1])) for t in [k / 120 for k in range(121)]]
    a.line(*p0, *c0, 'G'); a.line(*p1, *c1, 'G')
    for x, y in pts: a.px(x, y, 'O'); a.px(x, y + 1, 'D')
    for x, y in (p0, p1): a.rect(x - 1, y - 1, 3, 3, 'W'); a.px(x, y, 'K')
    for x, y in (c0, c1): a.rect(x - 1, y - 1, 3, 3, 'B')
    # pen nib cursor near the end point
    nib = ['00100', '01110', '01010', '11011', '11111', '01110', '00100']
    for j, r in enumerate(nib):
        for i, b in enumerate(r):
            if b == '1': a.px(38 + i, 20 + j, 'W')
    a.px(40, 23, 'K')
    a.save('px-pen')


def palette():
    a = Art(48, 36); a.frame('COLOUR')
    for k, c in enumerate('ODCWBL'):
        x, y = 4 + (k % 3) * 11, 11 + (k // 3) * 11
        a.rect(x, y, 9, 9, c); a.box(x - 1, y - 1, 11, 11, 'F')
    a.box(3, 10, 11, 11, 'W')  # selected swatch
    # eyedropper
    a.line(44, 11, 38, 17, 'W'); a.line(45, 12, 39, 18, 'W'); a.rect(43, 10, 3, 3, 'G')
    a.line(38, 17, 36, 26, 'C'); a.px(36, 27, 'O'); a.px(36, 28, 'O')
    a.save('px-palette')


def cup():
    a = Art(48, 36); a.frame(); a.dots(step=5, top=2)
    ox, oy = 14, 12
    for y in range(oy + 5, oy + 12):
        for x in range(ox + 1, ox + 15): a.px(x, y, 'O' if y > oy + 5 else 'Y')
    for x in range(ox + 1, ox + 15): a.px(x, oy + 11, 'D'); a.px(x, oy + 10, 'D')
    a.box(ox, oy, 16, 13, 'W'); a.rect(ox + 1, oy + 12, 14, 1, 'W')
    for x, y in [(16, 2), (17, 2), (18, 3), (18, 4), (18, 5), (17, 6), (16, 6)]: a.px(ox + x, oy + y, 'W')
    a.rect(ox - 4, oy + 14, 24, 1, 'W'); a.rect(ox + 21, oy + 14, 3, 1, 'W')
    for x, y in [(5, -2), (6, -3), (5, -4), (6, -5), (10, -2), (9, -3), (10, -4), (9, -5)]: a.px(ox + x, oy + y, 'C')
    a.text(17, 31, 'TEA', 'G')
    a.save('px-cup')


def window():
    a = Art(48, 36); a.frame('HELLO.TXT'); a.dots()
    a.text(6, 14, 'HELLO', 'O', F5, 2)
    a.rect(41, 14, 3, 7, 'W')  # cursor
    a.rect(6, 25, 22, 1, 'G'); a.rect(6, 28, 30, 1, 'G'); a.rect(6, 31, 14, 1, 'G')
    a.save('px-window')


def avatar():
    AV = ['......########......', '....############....', '...##############...', '..################..', '..####........####..', '..###..........###..',
          '..##............##..', '..##..##....##..##..', '..##..##....##..##..', '..##............##..', '..##.....##.....##..', '...##..........##...',
          '...##...####...##...', '....##........##....', '.....##########.....', '.......######.......', '.......##..##.......', '....############....',
          '..################..', '.##################.', '.##################.', '####################', '####################', '####################']
    a = Art(36, 48, 'K'); a.box(0, 0, 36, 48, 'F')
    for y, r in enumerate(AV):
        for x, ch in enumerate(r):
            if ch == '#': a.px(8 + x, 12 + y, 'O' if y >= 17 else 'W')
    a.box(5, 8, 26, 31, 'B')
    for x, y in [(5, 8), (17, 8), (30, 8), (5, 23), (30, 23), (5, 38), (17, 38), (30, 38)]: a.rect(x - 1, y - 1, 3, 3, 'B'); a.px(x, y, 'K')
    a.text(8, 42, 'ISAAC', 'W')
    a.save('px-avatar')


def gamepad():
    a = Art(48, 36); a.frame(); a.dots(step=5, top=2)
    a.rect(8, 12, 32, 14, 'G'); a.rect(6, 14, 36, 12, 'G'); a.rect(5, 20, 10, 9, 'G'); a.rect(33, 20, 10, 9, 'G')
    a.rect(6, 13, 36, 1, 'F'); a.rect(5, 28, 10, 1, 'F'); a.rect(33, 28, 10, 1, 'F')
    a.rect(11, 16, 2, 7, 'W'); a.rect(9, 18, 6, 3, 'W')
    for x, y, c in [(34, 15, 'O'), (37, 18, 'O'), (31, 18, 'B'), (34, 21, 'B')]: a.rect(x, y, 2, 2, c)
    a.rect(20, 19, 3, 1, 'K'); a.rect(25, 19, 3, 1, 'K')
    a.text(13, 31, 'PLAY', 'O')
    a.save('px-gamepad')


def heart():
    a = Art(36, 48); a.box(0, 0, 36, 48, 'F'); a.dots(step=4, top=2)
    H = ['0011100011100', '0111110111110', '1111111111111', '1111111111111', '1111111111111', '0111111111110', '0011111111100', '0001111111000', '0000111110000', '0000011100000', '0000001000000']
    for j, r in enumerate(H):
        for i, b in enumerate(r):
            if b == '1':
                for dy in range(2):
                    for dx in range(2): a.px(5 + i * 2 + dx, 9 + j * 2 + dy, 'D' if (j > 7 or i in (0, 12)) and r.count('1') > 0 and (i == r.index('1') or i == r.rindex('1')) else 'O')
    a.rect(9, 11, 2, 2, 'W'); a.px(11, 13, 'W')
    a.rect(6, 35, 24, 8, 'W'); a.text(9, 37, '+12K', 'K')
    a.save('px-heart')


def sunset():
    a = Art(48, 36); a.box(0, 0, 48, 36, 'F')
    for y in range(1, 20):
        for x in range(1, 47): a.px(x, y, 'K')
    for x in range(1, 47, 6): a.px(x + (x // 6) % 3, 3 + (x * 7) % 9, 'W')
    cx, cy, r = 24, 15, 10
    for y in range(cy - r, cy + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r and not (y > cy - 6 and (cy - y) % 3 == 1): a.px(x, y, 'O' if y > cy - 6 else 'Y')
    for x in range(1, 47):  # mountains
        h = int(3 + 3 * abs(math.sin(x / 6.5)) + 1.2 * math.sin(x / 2.3))
        for y in range(19 - h, 20): a.px(x, y, 'G' if y > 19 - h + 1 else 'W')
    for y in range(20, 35):  # grid floor
        for x in range(1, 47): a.px(x, y, 'K')
    for k, y in enumerate([20, 22, 25, 29, 34]): a.rect(1, y, 46, 1, 'D' if k else 'O')
    for i in range(-6, 7): a.line(24 + i * 3, 20, 24 + i * 12, 35, 'D')
    a.save('px-sunset')


def rocket():
    a = Art(36, 48); a.box(0, 0, 36, 48, 'F')
    for k in range(18): a.px(2 + (k * 13) % 32, 2 + (k * 7) % 44, 'W' if k % 3 else 'L')
    R = ['000010000', '000111000', '001111100', '001111100', '011101110', '011010110', '011101110', '011111110', '011111110', '011111110', '111111111', '110111011', '100111001']
    for j, r in enumerate(R):
        for i, b in enumerate(r):
            if b == '1':
                for dy in range(2):
                    for dx in range(2): a.px(9 + i * 2 + dx, 6 + j * 2 + dy, 'W')
    a.rect(15, 14, 6, 4, 'B'); a.rect(16, 15, 2, 1, 'L')
    for j in range(9):
        w = max(1, 6 - j // 2)
        a.rect(18 - w, 32 + j, w * 2, 1, 'Y' if j < 2 else 'O' if j < 6 else 'D')
    a.text(7, 42, 'LIVE', 'O')
    a.save('px-rocket')


def layers():
    a = Art(48, 36); a.frame('LAYERS'); a.dots()

    def diamond(cy, c, e):
        for j in range(-6, 7):
            w = 12 - abs(j) * 2
            a.rect(24 - w, cy + j, w * 2, 1, c)
        for j in range(-6, 7):
            w = 12 - abs(j) * 2
            a.px(24 - w, cy + j, e); a.px(23 + w, cy + j, e)
    diamond(26, 'G', 'F'); diamond(21, 'B', 'L'); diamond(16, 'O', 'Y')
    C = ['1000', '1100', '1110', '1111', '1110', '0110', '0011']
    for j, r in enumerate(C):
        for i, b in enumerate(r):
            if b == '1': a.px(37 + i, 22 + j, 'W')
    a.save('px-layers')


for f in (pen, palette, cup, window, avatar, gamepad, heart, sunset, rocket, layers): f()
