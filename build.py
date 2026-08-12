#!/usr/bin/env python3
"""
Stock the library.

Walks the corpus folder one level up, copies every fable into ./fables/ and
writes fables.js — the menu the cafe reads from. Re-run it whenever you add or
edit a story:

    python3 "Maqhaa Alsaahirat/build.py"

The copy is deliberate. The service worker can only cache things inside its own
scope, so a reader that fetched '../Some Story.md' would work online and go
blank on a train.
"""

import json
import os
import re
import shutil
import sys
import unicodedata
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
CORPUS = os.path.abspath(os.path.join(HERE, os.pardir))
OUT = os.path.join(HERE, "fables")

# Subfolders that are software, not stories. Their READMEs are documentation.
SKIP_DIRS = {
    "Maqhaa Alsaahirat", "Radio Nobody", "Waver", "WavesLine",
    "Seven Grounds VN", "Black Swan Tarot", ".claude", ".git",
    "__pycache__", "node_modules",
}

# Prose kept as .txt. The corpus doesn't distinguish; the extension is an
# accident of which editor was open that week.
EXTRA_TXT = {"Uncalled.txt"}

WPM = 235  # unhurried. This is a cafe.


def is_cjk(ch):
    return any(r in unicodedata.name(ch, "") for r in ("CJK", "HIRAGANA", "KATAKANA", "HANGUL"))


def count_words(text):
    """Latin words plus CJK characters at two-per-word — close enough that the
    minute estimate on a bilingual page isn't a lie."""
    latin = len(re.findall(r"[A-Za-z0-9''’-]+", text))
    cjk = sum(1 for ch in text if is_cjk(ch))
    return latin + cjk // 2


def slugify(name):
    s = os.path.splitext(name)[0]
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower()
    return s or "untitled"


def strip_inline(s):
    s = re.sub(r"[*_`]+", "", s)
    return s.strip()


def read_meta(text, fallback):
    """Pull a title and a subtitle off the top of the file.

    House style is '# Title', then optionally '### being a longer gloss' and/or
    an italic line naming the cycle it belongs to.
    """
    title, subtitle = None, None
    lines = text.split("\n")
    for i, raw in enumerate(lines[:40]):
        line = raw.strip()
        if not line:
            continue
        m = re.match(r"^#\s+(.*)$", line)
        if m and title is None:
            title = strip_inline(m.group(1))
            # the gloss sits in the next few non-empty lines
            for nxt in lines[i + 1:i + 6]:
                n = nxt.strip()
                if not n:
                    continue
                if n.startswith("---") or n.startswith("#####"):
                    break
                m2 = re.match(r"^#{2,4}\s+(.*)$", n)
                if m2:
                    subtitle = strip_inline(m2.group(1))
                    break
                if re.match(r"^[*_].+[*_]$", n):
                    subtitle = strip_inline(n)
                    break
                break
            break
        if title is None and not line.startswith("#"):
            break  # no leading heading; fall back to the filename
    if not title:
        title = os.path.splitext(fallback)[0].replace("_", " ").strip()
        title = re.sub(r"\s+", " ", title)
    if subtitle and len(subtitle) > 190:
        subtitle = subtitle[:187].rstrip() + "…"
    return title, subtitle


def cup(minutes):
    """Menu section. A cafe sorts by how long you're staying."""
    if minutes < 10:
        return "demitasse"
    if minutes < 25:
        return "cup"
    if minutes < 60:
        return "pot"
    return "carafe"


def gather():
    found = []
    for root, dirs, files in os.walk(CORPUS):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        rel_dir = os.path.relpath(root, CORPUS)
        rel_dir = "" if rel_dir == "." else rel_dir
        for f in sorted(files):
            if f.startswith("."):
                continue
            if f.endswith(".md") or f in EXTRA_TXT:
                found.append((os.path.join(root, f), rel_dir, f))
    return found


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)

    entries, slugs, titles = [], {}, {}

    for path, rel_dir, name in gather():
        try:
            text = open(path, encoding="utf-8").read()
        except (UnicodeDecodeError, OSError) as e:
            print(f"  skipped {name}: {e}", file=sys.stderr)
            continue
        if not text.strip():
            continue

        slug = slugify(name)
        while slug in slugs:                       # same name, different folder
            slug += "-2"
        slugs[slug] = True

        title, subtitle = read_meta(text, name)
        # 'A Ledger of Light.md' and 'a_ledger_of_light.md' are different drafts
        # of the same hour. Keep both, but say which is which on the menu.
        key = title.lower()
        titles.setdefault(key, []).append(slug)

        words = count_words(text)
        minutes = max(1, round(words / WPM))
        shutil.copyfile(path, os.path.join(OUT, slug + ".md"))

        entries.append({
            "id": slug,
            "file": "fables/" + slug + ".md",
            "title": title,
            "subtitle": subtitle or "",
            "shelf": rel_dir or "",
            "source": name,
            "words": words,
            "minutes": minutes,
            "cup": cup(minutes),
            "mtime": int(os.path.getmtime(path)),
        })

    for key, group in titles.items():
        if len(group) < 2:
            continue
        for slug in group:
            e = next(x for x in entries if x["id"] == slug)
            e["variant"] = e["source"]

    entries.sort(key=lambda e: e["title"].lower())

    banner = (
        "/* THE MENU — written up by hand, wiped down nightly.\n"
        "   Generated by build.py on %s. Do not edit; edit the stories. */\n"
        % datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    )
    with open(os.path.join(HERE, "fables.js"), "w", encoding="utf-8") as fh:
        fh.write(banner)
        fh.write("const FABLES = ")
        json.dump(entries, fh, ensure_ascii=False, indent=1)
        fh.write(";\n")

    total_min = sum(e["minutes"] for e in entries)
    print(f"shelved {len(entries)} fables · {sum(e['words'] for e in entries):,} words "
          f"· {total_min // 60}h {total_min % 60}m of reading")


if __name__ == "__main__":
    main()
