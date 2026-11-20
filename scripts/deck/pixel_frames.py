"""Builds pixel-reveal frames from still.png: big blocks sharpening to the image, then a hold.
usage: python3 pixel_frames.py DIR cover|photo"""
import sys
from PIL import Image
d, kind = sys.argv[1], sys.argv[2]
im = Image.open(f'{d}/still.png').convert('RGB')
box = (0, 0, im.width, im.height) if kind == 'pixel' else (144, 174, 696, 876)  # the photo on the about page
steps = [96, 72, 54, 40, 30, 22, 16, 11, 8, 5, 3]
frames = []
for s in steps:
    f = im.copy(); reg = im.crop(box)
    small = reg.resize((max(1, reg.width // s), max(1, reg.height // s)), Image.BILINEAR)
    f.paste(small.resize(reg.size, Image.NEAREST), box[:2]); frames.append(f)
frames += [im] * 22
for i, f in enumerate(frames): f.save(f'{d}/{i:03d}.png')
