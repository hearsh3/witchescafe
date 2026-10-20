#!/usr/bin/env python3
"""
Cut the portraits, then knock them down to pixels.

Every character art file in the corpus folder is a full-body illustration at
several megabytes and a few thousand pixels across. The cafe wants faces, and
it wants them to look like they belong in a room drawn at 320x200:

    python3 "Maqhaa Alsaahirat/sprites.py"

Two stages.

1. FRAME. CROPS maps a source PNG to (left, top, right, bottom) as *percentages
   of the alpha-trimmed bounding box*, not of the raw file — the trim is what
   makes the numbers stable when a source has a lot of empty margin. Set by eye,
   one character at a time, aiming to put the face at roughly (50%, 42%) of the
   frame; automatic face-finding kept picking thighs and hat brims.

2. PIXELATE. Downsample to SIZE, hard-threshold the alpha so the silhouette has
   no soft fringe, quantize to NCOLOURS with dithering off — dithering at this
   resolution reads as dirt rather than shading — and lay a one-pixel keyline
   around the outside so the sprite holds its shape against a dark violet room
   or a sunlit one. Output is indexed PNG: lossy formats smear exactly the hard
   edges this is trying to make.

   The page renders these with `image-rendering: pixelated`, so they upscale to
   whole chunky pixels instead of going soft.

To add a character: drop the PNG in the corpus folder, add a line to CROPS with
a rough guess, run this, look at the result, adjust. Then add an entry to
GUESTS in data.js so it appears in the sprite picker.
"""

from PIL import Image, ImageEnhance
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.abspath(os.path.join(HERE, os.pardir))
OUT = os.path.join(HERE, "assets", "sprites")

SIZE = 144            # displayed 180–260px, so it upscales ~1.5x into fat pixels
NCOLOURS = 48
ALPHA_CUT = 120       # below this the pixel is simply not there
KEYLINE = (20, 16, 28, 255)

# Grading, and why there is any.
#
# This art is mostly pale: skin, white hair, white cloth. Quantizing it raw
# spends almost no palette on the top end and snaps the whole upper range to
# one entry — which the quantizer picks as pure white. Measured on the first
# pass: Phrolova's 90th-percentile luminance went 235 in the source to 255 in
# the sprite, and a tenth of her pixels came out at maximum. Faces arrived as
# flat white blobs with eyes on them.
#
# So: roll the highlights off before quantizing, to leave the pale tones room
# to stay distinct from each other, then put back the saturation that
# quantizing drains. MEDIANCUT rather than MAXCOVERAGE, because it allocates by
# population in colour space instead of by area coverage, which is the same
# argument in a different accent.
KNEE = 165            # below this, tone is untouched
CEILING = 232         # 255 lands here; the shoulder between is an ease-out
SATURATION = 1.14
CONTRAST = 1.05


def shoulder():
    """Tone curve: linear to KNEE, then eased into CEILING."""
    curve = []
    for v in range(256):
        if v <= KNEE:
            curve.append(v)
        else:
            t = (v - KNEE) / (255 - KNEE)
            curve.append(int(round(KNEE + (CEILING - KNEE) * (1 - (1 - t) ** 2))))
    return curve * 3      # the same curve on R, G and B — a tone move, not a tint

CROPS = {
    # the Banat al-Rih, who take the counter
    "herta.png":      (26, 4, 50, 39),
    "Viviane.png":    (41, 3, 69, 31),
    "black_swan.png": (24, 0, 44, 27),
    "elaina.png":     (11, 14, 63, 68),
    "Phrolova.png":   (36, 0, 66, 22),
    "Mina.png":       (19, 0, 85, 58),
    # Wednesdays, as is proper
    "Agrat.png":      (38, 11, 68, 38),
    # everyone else with a face on file
    "aemeath.png":    (48.4, 3.8, 77.6, 51.8),
    "Augusta.png":    (32, 0, 68, 26),
    "bridget.png":    (0.9, 0.9, 48.9, 38.7),
    "cantarella.png": (39, 15, 65, 43.6),
    "cartethyia.png": (5, 12.8, 35, 64.8),
    "chisa.png":      (29, 2.1, 59, 39.8),
    "ciaccona.png":   (32, 2, 72, 28),
    "ciaccona2.png":  (60.9, 8, 87.9, 44.9),
    "denia.png":      (56.25, 4.4, 83.75, 48.6),
    "hiyuki.png":     (13.5, 15, 83.5, 65.5),
    "Iuno.png":       (57, 0, 97, 31),
    "Kit.png":        (33, 0, 53, 30),
    "Leva.png":       (26, 1.3, 92, 40.4),
    "lupA.png":       (32.5, 10.3, 56, 43.8),
    "Mei.png":        (44.5, 6.6, 68.8, 32),
    "Mornye.png":     (38, 1.8, 76, 28.5),
    "Nuwa.png":       (32.2, 7.1, 62.4, 25.7),
    "Soppo.png":      (43.6, 10.4, 78.6, 38.9),
    "Teddy.png":      (41, 0.8, 69, 27.5),
    "The Grand Architect.png": (44.8, 0.7, 57.8, 27.3),
}

# Left out on purpose, so nobody re-derives the finding: Lilith.png is a moon
# glyph and asdf.png is a photograph of a room. Neither is character art.


def frame(name, box):
    im = Image.open(os.path.join(SRC, name)).convert("RGBA")
    bb = im.getbbox()
    if not bb:
        raise ValueError("image is entirely transparent")
    im = im.crop(bb)
    W, H = im.size
    l, t, r, b = box
    im = im.crop((int(W * l / 100), int(H * t / 100),
                  int(W * r / 100), int(H * b / 100)))
    # square it by padding, never by squashing
    w, h = im.size
    s = max(w, h)
    sq = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    sq.alpha_composite(im, ((s - w) // 2, (s - h) // 2))
    return sq


def keyline(alpha, size):
    """One-pixel ring hugging the outside of the silhouette."""
    ap = alpha.load()
    ring = Image.new("L", (size, size), 0)
    rp = ring.load()
    for y in range(size):
        for x in range(size):
            if ap[x, y]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < size and 0 <= ny < size and ap[nx, ny]:
                    rp[x, y] = 255
                    break
    return ring


def pixelate(im):
    im = im.resize((SIZE, SIZE), Image.LANCZOS)
    alpha = im.split()[3].point(lambda v: 255 if v > ALPHA_CUT else 0)

    rgb = im.convert("RGB").point(shoulder())
    rgb = ImageEnhance.Color(rgb).enhance(SATURATION)
    rgb = ImageEnhance.Contrast(rgb).enhance(CONTRAST)

    flat = rgb.quantize(colors=NCOLOURS, method=Image.MEDIANCUT,
                        dither=Image.NONE).convert("RGBA")
    flat.putalpha(alpha)
    line = Image.new("RGBA", (SIZE, SIZE), KEYLINE)
    line.putalpha(keyline(alpha, SIZE))
    return Image.alpha_composite(line, flat)


def main():
    os.makedirs(OUT, exist_ok=True)
    for stale in os.listdir(OUT):
        if stale.endswith(".webp"):
            os.remove(os.path.join(OUT, stale))

    total = 0
    for name, box in CROPS.items():
        try:
            art = pixelate(frame(name, box))
        except (FileNotFoundError, ValueError) as e:
            print(f"  {name}: {e}", file=sys.stderr)
            continue
        out = os.path.join(OUT, os.path.splitext(name)[0].lower().replace(" ", "_") + ".png")
        art.save(out, optimize=True)
        size = os.path.getsize(out)
        total += size
        print(f"{os.path.basename(out):28s} {size // 1024:4d} KB")
    print(f"\n{len(CROPS)} portraits · {SIZE}px · {NCOLOURS} colours · {total // 1024} KB total")


if __name__ == "__main__":
    main()
