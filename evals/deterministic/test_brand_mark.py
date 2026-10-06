"""The Prometheus mark is one drawing, shipped at the sizes the UI asks for.

This used to parse SVG path data out of three files and compare geometry: the
mark was a monochrome SVG painted through a CSS mask, so GitHub -- which gives
an <img> no way to read the page theme -- needed a second file stating the ink
outright. The mark is now a full-colour badge on a transparent ground, so one
file serves every surface and there is no ink to state. What still needs
holding true is that the shipped sizes all come from the same master, that the
copy the hosted login page serves is byte-identical, and that nothing anywhere
still points at the retired SVG.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATIC = ROOT / "prometheus" / "ops" / "static"
HOSTED_STATIC = ROOT / "hosted" / "gateway" / "static"
MASTER = STATIC / "prometheus-mark.png"
SIZES = ("prometheus-mark-192.png", "prometheus-mark-64.png", "prometheus-mark-32.png")
RETIRED = "waku-mark"


def test_the_master_and_every_shipped_size_are_present():
    for path in (MASTER, *(STATIC / s for s in SIZES)):
        assert path.is_file(), f"missing {path}"
        assert path.stat().st_size > 0, f"{path} is empty"


def _alpha(im, xy) -> int:
    """The alpha at one pixel, whatever mode the file opened in.

    getpixel() returns a bare number for a single-channel image and a tuple
    otherwise, so indexing it directly is only correct for RGBA.
    """
    px = im.getpixel(xy)
    if isinstance(px, (int, float)):
        return 255
    return int(px[3]) if len(px) == 4 else 255


def test_the_mark_carries_transparency():
    """It is dropped onto a matte-black rail. An opaque square would show its
    own edges there, which is the whole reason the source was cut on its ring."""
    from PIL import Image

    im = Image.open(MASTER)
    assert im.mode == "RGBA", f"{MASTER.name} is {im.mode}; a mask needs an alpha channel"
    corner = _alpha(im, (1, 1))
    centre = _alpha(im, (im.width // 2, im.height // 2))
    assert corner == 0, f"corner alpha is {corner}, not transparent"
    assert centre == 255, f"centre alpha is {centre}; the mark was cut away"


def test_the_hosted_copy_is_byte_identical():
    """hosted/ ships its own static/ and a mismatch would serve a stale mark."""
    assert (HOSTED_STATIC / "prometheus-mark.png").read_bytes() == MASTER.read_bytes()
    assert (HOSTED_STATIC / "prometheus-mark-32.png").read_bytes() == (
        STATIC / "prometheus-mark-32.png"
    ).read_bytes()


def test_nothing_still_references_the_retired_svg():
    """The mask, the favicons and the hosted login page all named it. A stale
    reference is a 404 on a surface nobody tests by clicking."""
    needles = (f"{RETIRED}.svg", f"{RETIRED}-on-light", f"{RETIRED}-on-dark")
    roots = (STATIC, HOSTED_STATIC, ROOT / "hosted" / "gateway")
    for base in roots:
        for path in base.rglob("*"):
            if not path.is_file() or path.suffix in {".png", ".woff2", ".sqlite3"}:
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue
            for needle in needles:
                assert needle not in text, f"{path} still names {needle}"
