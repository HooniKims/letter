import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw


PALETTES = [
    ("#fff0f3", "#ffd9dd", "#a8334e"),
    ("#fff8e8", "#ffc9b8", "#b83256"),
    ("#f7fbff", "#ffd3df", "#8f2f4e"),
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--width", type=int, required=True)
    parser.add_argument("--height", type=int, required=True)
    parser.add_argument("--variant", type=int, default=0)
    args = parser.parse_args()

    base, accent, deep = PALETTES[args.variant % len(PALETTES)]
    image = Image.new("RGB", (args.width, args.height), base)
    draw = ImageDraw.Draw(image, "RGBA")

    for y in range(args.height):
        ratio = y / max(1, args.height - 1)
        color = blend(hex_to_rgb(base), hex_to_rgb(accent), ratio * 0.75)
        draw.line((0, y, args.width, y), fill=(*color, 255))

    draw_sticker_panel(draw, args.width, args.height)

    draw_bouquet(draw, int(args.width * 0.14), int(args.height * 0.56), deep, accent, flip=False)
    draw_bouquet(draw, int(args.width * 0.86), int(args.height * 0.55), deep, accent, flip=True)

    for i in range(10):
        x = int((i * 113 + args.variant * 47) % args.width)
        y = int(62 + ((i * 41 + args.variant * 29) % max(1, args.height - 130)))
        if 260 < x < args.width - 260:
            draw_heart(draw, x, y, 12 + i % 4, deep)

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    image.save(args.output, "JPEG", quality=88)


def draw_sticker_panel(draw, width, height):
    shadow = (70, 45, 45, 34)
    outline = (168, 51, 78, 46)
    cream = (255, 250, 238, 238)
    x0, y0 = 26, 34
    x1, y1 = width - 26, height - 34

    for offset, alpha in [(12, 28), (6, 20)]:
        draw.rounded_rectangle((x0 + offset, y0 + offset, x1 + offset, y1 + offset), radius=58, fill=(70, 45, 45, alpha))

    draw.rounded_rectangle((x0, y0, x1, y1), radius=58, fill=(255, 255, 255, 245), outline=(255, 255, 255, 255), width=16)
    draw.rounded_rectangle((x0 + 16, y0 + 14, x1 - 16, y1 - 14), radius=48, fill=cream, outline=outline, width=2)

    scallops = 16
    for i in range(scallops):
        cx = x0 + 44 + i * ((x1 - x0 - 88) / max(1, scallops - 1))
        draw.ellipse((cx - 24, y0 - 8, cx + 24, y0 + 38), fill=(255, 255, 255, 235))
        draw.ellipse((cx - 24, y1 - 38, cx + 24, y1 + 8), fill=(255, 255, 255, 235))


def draw_bouquet(draw, x, y, deep, accent, flip=False):
    stem = (70, 117, 64, 190)
    direction = -1 if flip else 1
    for i, (dx, dy, size) in enumerate([(-60, -82, 56), (0, -112, 68), (58, -68, 54), (-22, -34, 44)]):
        px = x + direction * dx
        py = y + dy
        draw.line((x, y + 90, px, py + size // 2), fill=stem, width=5)
        draw_carnation(draw, px, py, size, deep, accent)
    for i in range(8):
        lx = x + direction * (-72 + i * 22)
        ly = y - 18 + int(math.sin(i) * 18)
        draw.ellipse((lx - 14, ly - 7, lx + 14, ly + 7), fill=(96, 137, 86, 125))


def draw_carnation(draw, x, y, radius, deep, accent):
    deep_rgb = hex_to_rgb(deep)
    accent_rgb = blend(hex_to_rgb(accent), deep_rgb, 0.22)
    for angle in range(0, 360, 45):
        dx = math.cos(math.radians(angle)) * radius * 0.48
        dy = math.sin(math.radians(angle)) * radius * 0.34
        draw.ellipse(
            (x + dx - radius * 0.45, y + dy - radius * 0.35, x + dx + radius * 0.45, y + dy + radius * 0.35),
            fill=(*accent_rgb, 205),
            outline=(*deep_rgb, 82),
        )
    draw.ellipse((x - radius * 0.38, y - radius * 0.32, x + radius * 0.38, y + radius * 0.32), fill=(*deep_rgb, 160))


def draw_heart(draw, x, y, size, color):
    rgb = hex_to_rgb(color)
    draw.ellipse((x - size, y - size // 2, x, y + size // 2), fill=(*rgb, 112))
    draw.ellipse((x, y - size // 2, x + size, y + size // 2), fill=(*rgb, 112))
    draw.polygon([(x - size, y), (x + size, y), (x, y + size * 1.25)], fill=(*rgb, 112))


def hex_to_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def blend(a, b, amount):
    return tuple(int(a[i] + (b[i] - a[i]) * amount) for i in range(3))


if __name__ == "__main__":
    main()
