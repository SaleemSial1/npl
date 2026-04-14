#!/usr/bin/env python3
"""Replace placeholder player card images with available local player photos."""

from __future__ import annotations

import re
from pathlib import Path

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = ROOT / "images"
PLAYER_IMAGES_DIR = IMAGES_DIR / "players"
HTML_FILES = [
    ROOT / "players.html",
    *sorted((ROOT / "teams").glob("*.html")),
]

KNOWN_ROOT_IMAGES = {
    "adam-rossington": "/images/adam-rossington.webp",
    "george-munsey": "/images/george-munsey.webp",
    "james-neesham": "/images/james-neesham.webp",
    "martin-guptill": "/images/martin-guptill.webp",
    "rohit-paudel": "/images/rohit-paudel.jpg",
}


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value)
    return value.strip("-")


def build_image_index() -> dict[str, str]:
    index: dict[str, str] = dict(KNOWN_ROOT_IMAGES)
    for path in PLAYER_IMAGES_DIR.glob("*"):
        if not path.is_file():
            continue
        stem = path.stem
        if stem.endswith("-bg"):
            continue
        index[slugify(stem)] = f"/images/players/{path.name}"
    return index


def is_placeholder(src: str) -> bool:
    return "default-player.jpg" in src or src.endswith("/Player.png")


def refresh_file(path: Path, image_index: dict[str, str]) -> int:
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    updates = 0

    for image in soup.select("img.player-image"):
        src = image.get("src", "")
        if not is_placeholder(src):
            continue

        name = image.get("alt", "").strip()
        if not name:
            continue

        replacement = image_index.get(slugify(name))
        if not replacement:
            continue

        image["src"] = replacement
        updates += 1

    if updates:
        path.write_text(str(soup), encoding="utf-8")
    return updates


def main() -> None:
    image_index = build_image_index()
    total_updates = 0
    touched_files = 0

    for path in HTML_FILES:
        updates = refresh_file(path, image_index)
        if updates:
            touched_files += 1
            total_updates += updates
            print(f"updated {path.relative_to(ROOT)} -> {updates}")

    print(f"summary touched_files={touched_files} updated_images={total_updates}")


if __name__ == "__main__":
    main()
