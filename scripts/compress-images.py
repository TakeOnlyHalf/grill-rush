"""
원본 고해상도 PNG가 있을 때 WebP로 재압축하는 유틸.
현재 public/images 는 WebP 배포본만 포함하므로, 새 원본을 넣을 때 사용한다.
"""
from pathlib import Path

from PIL import Image

out_specs = [
    ('public/images/title_day.png', 1400, 800, False),
    ('public/images/day_street.png', 1400, 800, False),
    ('public/images/ready_phase/ready_background.png', 1400, 800, False),
    ('public/images/ready_phase/menu_background.png', 1400, 800, False),
    ('public/images/ready_phase/mart_background.png', 1400, 800, False),
    ('public/images/ready_phase/foodtruck.png', 512, 512, True),
]


def resize_contain(im, max_w, max_h):
    w, h = im.size
    scale = min(max_w / w, max_h / h, 1.0)
    if scale < 1:
        nw, nh = int(w * scale), int(h * scale)
        return im.resize((nw, nh), Image.Resampling.LANCZOS)
    return im


for src, mw, mh, alpha in out_specs:
    p = Path(src)
    if not p.exists():
        print(f'skip (missing): {p}')
        continue
    im = Image.open(p)
    if not alpha and im.mode in ('RGBA', 'P'):
        bg = Image.new('RGB', im.size, (255, 255, 255))
        if im.mode == 'P':
            im = im.convert('RGBA')
        bg.paste(im, mask=im.split()[-1] if im.mode == 'RGBA' else None)
        im = bg
    elif alpha and im.mode != 'RGBA':
        im = im.convert('RGBA')
    elif not alpha and im.mode != 'RGB':
        im = im.convert('RGB')
    im = resize_contain(im, mw, mh)
    dest = p.with_suffix('.webp')
    im.save(dest, 'WEBP', quality=78, method=6)
    print(f'{dest}: {im.size} {dest.stat().st_size // 1024}KB (was {p.stat().st_size // 1024}KB)')
