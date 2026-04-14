#!/usr/bin/env python3
"""Best-effort fetcher for missing player profile images from Wikimedia/Wikipedia."""

from __future__ import annotations

import json
import re
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parent.parent
PLAYERS_DIR = ROOT / "players"
IMAGES_DIR = ROOT / "images" / "players"
USER_AGENT = "npl-image-fetcher/1.0 (local maintenance script)"
REQUEST_PAUSE_SECONDS = 1.5
RETRY_DELAYS = (5, 15, 30)

API_SEARCH = "https://en.wikipedia.org/w/api.php"
API_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/"

# Hand-tuned mappings for players who are likely to exist on Wikipedia/Commons.
MANUAL_TITLES = {
    "lokesh-bam": ["Lokesh Bam"],
    "kushal-malla": ["Kushal Malla"],
    "dipendra-singh-airee": ["Dipendra Singh Airee"],
    "lalit-rajbanshi": ["Lalit Rajbanshi"],
    "binod-bhandari": ["Binod Bhandari"],
    "kamal-singh-airee": ["Kamal Singh Airee"],
    "gulbadin-naib": ["Gulbadin Naib"],
    "gerhard-erasmus": ["Gerhard Erasmus"],
    "hussain-talat": ["Hussain Talat"],
    "chris-lynn": ["Chris Lynn"],
    "dawid-malan": ["Dawid Malan"],
    "ben-cutting": ["Ben Cutting"],
    "john-simpson": ["John Simpson (cricketer)"],
    "james-neesham": ["James Neesham"],
    "martin-guptill": ["Martin Guptill"],
    "faf-du-plessis": ["Faf du Plessis"],
    "adam-rossington": ["Adam Rossington"],
    "stephen-eskinazi": ["Stephen Eskinazi"],
    "darcy-short": ["D'Arcy Short"],
    "wayne-parnell": ["Wayne Parnell"],
    "najibullah-zadran": ["Najibullah Zadran"],
    "mark-watt": ["Mark Watt"],
    "max-odowd": ["Max O'Dowd"],
    "zeeshan-maqsood": ["Zeeshan Maqsood"],
    "will-bosisto": ["Will Bosisto"],
    "sohail-tanvir": ["Sohail Tanvir"],
    "raymon-reifer": ["Raymon Reifer"],
    "marchant-de-lange": ["Marchant de Lange"],
    "lahiru-milantha": ["Lahiru Milantha"],
}


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value)
    return value.strip("-")


def normalize_name(value: str) -> str:
    value = value.lower()
    value = re.sub(r"\([^)]*\)", "", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


def existing_local_stems() -> set[str]:
    stems = set()
    for path in IMAGES_DIR.glob("*"):
        if path.is_file():
            stem = path.stem
            if stem.endswith("-bg"):
                stem = stem[:-3]
            stems.add(slugify(stem))
    return stems


def player_slugs() -> list[tuple[str, str]]:
    players: list[tuple[str, str]] = []
    for path in sorted(PLAYERS_DIR.glob("*.html")):
        soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="ignore"), "html.parser")
        title = soup.select_one(".player-title")
        if not title:
            continue
        players.append((path.stem, " ".join(title.get_text(" ", strip=True).split())))
    return players


def request_json(url: str, params: dict[str, str] | None = None) -> dict:
    full_url = url
    if params:
        full_url = f"{url}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(full_url, headers={"User-Agent": USER_AGENT})
    for attempt, delay in enumerate((0, *RETRY_DELAYS), start=1):
        if delay:
            time.sleep(delay)
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt <= len(RETRY_DELAYS):
                continue
            raise


def search_titles(name: str) -> list[str]:
    params = {
        "action": "query",
        "format": "json",
        "list": "search",
        "srsearch": f'"{name}" cricketer',
        "srlimit": "5",
    }
    data = request_json(API_SEARCH, params)
    return [item["title"] for item in data.get("query", {}).get("search", []) if item.get("title")]


def summary_data(title: str) -> dict:
    encoded = urllib.parse.quote(title, safe="")
    return request_json(f"{API_SUMMARY}{encoded}")


def extension_from_url(url: str, content_type: str | None = None) -> str:
    path = urllib.parse.urlparse(url).path.lower()
    for ext in [".webp", ".jpg", ".jpeg", ".png"]:
        if path.endswith(ext):
            return ".jpg" if ext == ".jpeg" else ext
    if content_type:
        if "png" in content_type:
            return ".png"
        if "webp" in content_type:
            return ".webp"
    return ".jpg"


def download_image(url: str, target_stem: str) -> Path:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt, delay in enumerate((0, *RETRY_DELAYS), start=1):
        if delay:
            time.sleep(delay)
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                data = response.read()
                ext = extension_from_url(url, response.headers.get_content_type())
            break
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt <= len(RETRY_DELAYS):
                continue
            raise
    target = IMAGES_DIR / f"{target_stem}{ext}"
    target.write_bytes(data)

    hero_target = IMAGES_DIR / f"{target_stem}-bg{ext}"
    if not hero_target.exists():
        shutil.copyfile(target, hero_target)
    return target


def candidate_titles(slug: str, name: str) -> list[str]:
    titles = []
    titles.extend(MANUAL_TITLES.get(slug, []))
    titles.extend(search_titles(name))

    deduped: list[str] = []
    seen = set()
    for title in titles:
        key = title.strip().lower()
        if key and key not in seen:
            deduped.append(title)
            seen.add(key)
    return deduped


def title_confident_for_player(title: str, name: str) -> bool:
    return normalize_name(title) == normalize_name(name)


def summary_looks_like_player(data: dict) -> bool:
    haystack = " ".join(
        str(data.get(key, "")).lower()
        for key in ["description", "extract"]
    )
    return "cricketer" in haystack or "cricket" in haystack


def main() -> int:
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    existing = existing_local_stems()
    players = [(slug, name) for slug, name in player_slugs() if slug not in existing]

    fetched = 0
    skipped = 0
    failed: list[str] = []

    for slug, name in players:
        titles = candidate_titles(slug, name)
        image_url = None
        chosen_title = None
        for title in titles:
            if title not in MANUAL_TITLES.get(slug, []) and not title_confident_for_player(title, name):
                continue
            try:
                data = summary_data(title)
            except urllib.error.URLError:
                raise
            except Exception:
                continue
            if not summary_looks_like_player(data):
                continue
            image = data.get("thumbnail") or data.get("originalimage")
            image_url = image.get("source") if image and image.get("source") else None
            if image_url:
                chosen_title = title
                break

        if not image_url:
            failed.append(f"{slug} :: {name}")
            continue

        try:
            saved = download_image(image_url, slug)
        except urllib.error.URLError:
            raise
        except Exception:
            failed.append(f"{slug} :: {name}")
            continue

        fetched += 1
        print(f"fetched {slug} -> {saved.name} via {chosen_title}", flush=True)
        time.sleep(REQUEST_PAUSE_SECONDS)

    skipped = len(existing)
    print(f"summary fetched={fetched} skipped_existing={skipped} failed={len(failed)}")
    if failed:
        report = ROOT / "scripts" / "player_image_failures.txt"
        report.write_text("\n".join(failed) + "\n", encoding="utf-8")
        print(f"failure_report={report}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except urllib.error.URLError as exc:
        print(f"network_error={exc}", file=sys.stderr)
        raise
