#!/usr/bin/env python3
"""Link the homepage from existing allowed anchor text inside body content paragraphs."""

from __future__ import annotations

from pathlib import Path
import re

from bs4 import BeautifulSoup, NavigableString, Tag


ROOT = Path(__file__).resolve().parent.parent
HOMEPAGE_HREF = "/"
LINK_ATTR = "data-homepage-interlink"
LINK_CLASS = "homepage-inline-link"
ALLOWED_ANCHORS = [
    "Nepal Premier League 2026",
    "Nepal Premier League",
    "2026 NPL",
    "NPL 2026",
]
LINK_STYLE_BLOCK = f"""
. {LINK_CLASS} {{
    color: #10b981;
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: rgba(16, 185, 129, 0.65);
    text-underline-offset: 0.14em;
}}

. {LINK_CLASS}:visited {{
    color: #10b981;
}}

. {LINK_CLASS}:hover {{
    color: #34d399;
    text-decoration-color: rgba(52, 211, 153, 0.85);
}}
""".replace(". ", ".")

FORBIDDEN_TAGS = {
    "nav",
    "header",
    "footer",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "td",
    "th",
    "button",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
}

FORBIDDEN_CLASS_SNIPPETS = {
    "breadcrumb",
    "nav",
    "footer",
    "card",
    "cta",
    "button",
    "newsletter",
    "related-player-card",
    "social",
    "menu",
    "subtitle",
    "hero",
    "section-header",
    "description",
    "player-role",
    "team-region",
    "faq",
    "badge",
    "stat",
}

PREFERRED_CLASS_SNIPPETS = {
    "intro-text",
    "overview-text",
    "content-text",
    "article-text",
    "lead",
}


def eligible_files() -> list[Path]:
    files = []
    for path in sorted(ROOT.rglob("*.html")):
        if path.name == "index.html":
            continue
        files.append(path)
    return files


def is_redirect_page(soup: BeautifulSoup) -> bool:
    if soup.find("meta", attrs={"http-equiv": lambda v: v and v.lower() == "refresh"}):
        return True
    title = soup.title.get_text(" ", strip=True).lower() if soup.title else ""
    return "redirecting" in title


def has_forbidden_ancestor(tag: Tag) -> bool:
    for parent in tag.parents:
        if not isinstance(parent, Tag):
            continue
        if parent.name in FORBIDDEN_TAGS:
            return True

        values = " ".join(parent.get("class", []))
        values = f"{values} {parent.get('id', '')}".lower()
        if any(snippet in values for snippet in FORBIDDEN_CLASS_SNIPPETS):
            return True
    return False


def is_suitable_paragraph(paragraph: Tag) -> bool:
    text = " ".join(paragraph.get_text(" ", strip=True).split())
    if len(text) < 45:
        return False
    if has_forbidden_ancestor(paragraph):
        return False
    if paragraph.find_parent(["a", "button"]):
        return False

    values = " ".join(paragraph.get("class", []))
    values = f"{values} {paragraph.get('id', '')}".lower()
    if any(snippet in values for snippet in FORBIDDEN_CLASS_SNIPPETS):
        return False

    return True


def find_suitable_paragraph(soup: BeautifulSoup) -> Tag | None:
    scope = soup.find("main") or soup.body
    if scope is None:
        return None

    preferred: list[Tag] = []
    generic: list[Tag] = []

    for paragraph in scope.find_all("p"):
        if not is_suitable_paragraph(paragraph):
            continue
        if not paragraph_contains_allowed_anchor(paragraph):
            continue

        values = " ".join(paragraph.get("class", []))
        values = f"{values} {paragraph.get('id', '')}".lower()
        if any(snippet in values for snippet in PREFERRED_CLASS_SNIPPETS):
            preferred.append(paragraph)
        else:
            generic.append(paragraph)

    if preferred:
        return preferred[0]
    if generic:
        return generic[0]
    return None


def paragraph_contains_allowed_anchor(paragraph: Tag) -> bool:
    for text_node in paragraph.find_all(string=True):
        if not isinstance(text_node, NavigableString):
            continue
        if text_node.parent and text_node.parent.name == "a":
            continue
        text = str(text_node)
        if any(anchor in text for anchor in ALLOWED_ANCHORS):
            return True
    return False


def inject_link(paragraph: Tag, soup: BeautifulSoup) -> bool:
    for text_node in paragraph.find_all(string=True):
        if not isinstance(text_node, NavigableString):
            continue
        if text_node.parent and text_node.parent.name == "a":
            continue

        original = str(text_node)
        for anchor_text in ALLOWED_ANCHORS:
            index = original.find(anchor_text)
            if index == -1:
                continue

            before = original[:index]
            after = original[index + len(anchor_text):]

            if before:
                text_node.insert_before(NavigableString(before))

            link = soup.new_tag("a", href=HOMEPAGE_HREF)
            link[LINK_ATTR] = "true"
            link["class"] = [LINK_CLASS]
            link.string = anchor_text
            text_node.insert_before(link)

            if after:
                text_node.insert_before(NavigableString(after))

            text_node.extract()
            return True
    return False


def cleanup_existing_interlinks(soup: BeautifulSoup) -> None:
    for link in soup.find_all("a", attrs={LINK_ATTR: "true"}):
        previous = link.previous_sibling
        next_sibling = link.next_sibling
        link_text = link.get_text()
        removed_prefix = False

        if isinstance(previous, NavigableString):
            cleaned = re.sub(r"\s*For full tournament coverage, visit\s*$", "", str(previous))
            removed_prefix = cleaned != str(previous)
            if cleaned:
                previous.replace_with(cleaned)
            else:
                previous.extract()
                removed_prefix = True

        if removed_prefix:
            link.extract()
        else:
            link.replace_with(NavigableString(link_text))

        if removed_prefix and isinstance(next_sibling, NavigableString):
            cleaned = re.sub(r"^\s*\.\s*", "", str(next_sibling), count=1)
            if cleaned:
                next_sibling.replace_with(cleaned)
            else:
                next_sibling.extract()
        parent = link.parent
        if isinstance(parent, Tag):
            parent_text = " ".join(parent.get_text(" ", strip=True).split())
            if not parent_text and parent.name == "p":
                parent.decompose()

    for paragraph in soup.find_all("p", class_="homepage-interlink-note"):
        paragraph.decompose()


def ensure_link_styles(soup: BeautifulSoup) -> None:
    if not soup.find("a", attrs={LINK_ATTR: "true"}):
        return

    for link in soup.find_all("a", attrs={LINK_ATTR: "true"}):
        classes = list(link.get("class", []))
        if LINK_CLASS not in classes:
            classes.append(LINK_CLASS)
        link["class"] = classes

    for style_tag in soup.find_all("style"):
        css = style_tag.string or style_tag.get_text()
        if LINK_CLASS in css:
            return

    new_style = soup.new_tag("style")
    new_style.string = LINK_STYLE_BLOCK

    if soup.head:
        soup.head.append(new_style)
    elif soup.html:
        soup.html.insert(0, new_style)


def process_file(path: Path) -> str:
    original_html = path.read_text(encoding="utf-8", errors="ignore")
    soup = BeautifulSoup(original_html, "html.parser")

    if is_redirect_page(soup):
        return "skipped_redirect"

    cleanup_existing_interlinks(soup)

    paragraph = find_suitable_paragraph(soup)
    if paragraph is None:
        cleaned_html = str(soup)
        if cleaned_html != original_html:
            path.write_text(cleaned_html, encoding="utf-8")
        return "skipped_no_paragraph"

    if not paragraph.find("a", attrs={LINK_ATTR: "true"}):
        if not inject_link(paragraph, soup):
            cleaned_html = str(soup)
            if cleaned_html != original_html:
                path.write_text(cleaned_html, encoding="utf-8")
            return "skipped_no_paragraph"

    ensure_link_styles(soup)
    path.write_text(str(soup), encoding="utf-8")
    return "updated"


def main() -> None:
    counts = {
        "updated": 0,
        "skipped_redirect": 0,
        "skipped_no_paragraph": 0,
    }

    for path in eligible_files():
        result = process_file(path)
        counts[result] += 1

    for key, value in counts.items():
        print(f"{key}={value}")


if __name__ == "__main__":
    main()
