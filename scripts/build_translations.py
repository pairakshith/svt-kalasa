"""Build translations for SVT Kalasa markdown content.

Usage:
    pip install deep-translator
    python scripts/build_translations.py [--force]
"""

import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
import time
from typing import Dict, List, Tuple

try:
    from deep_translator import GoogleTranslator
except ImportError:
    print("Error: deep-translator not installed. Run: pip install deep-translator", file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------
# Backend Selection & Robust Fallback
# ---------------------------------------------------------------------------

_orig_google_translate = GoogleTranslator.translate


def _fallback_translate(self, text: str, **kwargs) -> str:
    """Fallback using translate.googleapis.com if translate.google.com/m returns 429."""
    try:
        return _orig_google_translate(self, text, **kwargs)
    except Exception as e:
        import requests
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": self._source,
            "tl": self._target,
            "dt": "t",
            "q": text,
        }
        r = requests.get(url, params=params, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        r.raise_for_status()
        data = r.json()
        parts = [p[0] for p in data[0] if p and p[0]]
        return "".join(parts)


GoogleTranslator.translate = _fallback_translate


def get_translator():
    """Return configured translator instance. Easily swap backends here."""
    api_key = os.environ.get("TRANSLATE_API_KEY")
    if api_key:
        pass
    return GoogleTranslator(source="kn", target="en")


# ---------------------------------------------------------------------------
# Translation with Exponential Backoff
# ---------------------------------------------------------------------------

def translate_text_with_retry(translator, text: str, max_retries: int = 3) -> str:
    """Translate text with up to 3 retries and exponential backoff (1s, 2s, 4s)."""
    if not text.strip():
        return text

    delays = [1, 2, 4]
    for attempt in range(max_retries):
        try:
            return translator.translate(text)
        except Exception as e:
            if attempt < max_retries - 1:
                delay = delays[attempt]
                print(f"    [Retry {attempt+1}/{max_retries}] Translation error: {e}. Backing off {delay}s...", file=sys.stderr)
                time.sleep(delay)
            else:
                print(f"    [Error] All {max_retries} attempts failed: {e}", file=sys.stderr)
                raise


# ---------------------------------------------------------------------------
# Glossary Pre/Post Processing
# ---------------------------------------------------------------------------

def load_glossary(glossary_path: str) -> List[Tuple[str, str]]:
    """Load glossary from JSON sorted by Kannada term length descending."""
    if not os.path.exists(glossary_path):
        return []
    with open(glossary_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    items = sorted(data.items(), key=lambda x: len(x[0]), reverse=True)
    return items


def apply_glossary_placeholders(text: str, glossary: List[Tuple[str, str]], terms_used_set: set) -> Tuple[str, Dict[int, str]]:
    """Replace glossary Kannada terms with [[PN#]] tokens, matching longest first."""
    placeholder_map: Dict[int, str] = {}
    for idx, (kn_term, en_term) in enumerate(glossary):
        if kn_term in text:
            terms_used_set.add(kn_term)
            placeholder = f"[[PN{idx}]]"
            placeholder_map[idx] = en_term
            text = text.replace(kn_term, placeholder)
    return text, placeholder_map


def restore_glossary_placeholders(
    translated_text: str,
    placeholder_map: Dict[int, str],
    filename: str,
    warnings_counter: List[int]
) -> str:
    """Replace [[PN#]] tokens back to English glossary terms. Handle whitespace in tokens."""
    for idx, en_term in placeholder_map.items():
        pattern = re.compile(rf"\[\[\s*PN\s*{idx}\s*\]\]", re.IGNORECASE)
        if pattern.search(translated_text):
            translated_text = pattern.sub(en_term, translated_text)
        else:
            print(f"    [Warning] Missing placeholder [[PN{idx}]] ({en_term}) in {filename}. Appending to paragraph.", file=sys.stderr)
            warnings_counter[0] += 1
            translated_text = translated_text.rstrip() + f" ({en_term})"
    return translated_text


# ---------------------------------------------------------------------------
# Paragraph & Markdown Structure Handling
# ---------------------------------------------------------------------------

LINK_RE = re.compile(r"(\[[^\]]*\])(\([^)]*\))")


def protect_links(text: str) -> Tuple[str, List[str]]:
    """Extract markdown link target URLs so they are not translated."""
    urls = []
    def repl(m):
        urls.append(m.group(2))
        return f"{m.group(1)}(__URL_{len(urls)-1}__)"
    protected = LINK_RE.sub(repl, text)
    return protected, urls


def restore_links(text: str, urls: List[str]) -> str:
    """Restore markdown link target URLs."""
    for i, url in enumerate(urls):
        text = text.replace(f"(__URL_{i}__)", url)
        text = re.sub(rf"\(\s*__URL_{i}__\s*\)", url, text)
    return text


def split_large_paragraph(text: str, max_chars: int = 3500) -> List[str]:
    """Split a very large paragraph at sentence boundaries (. ? ! or Kannada danda ।)."""
    if len(text) <= max_chars:
        return [text]

    sentences = re.split(r"([.?!।]\s*)", text)
    parts = []
    current = ""
    for i in range(0, len(sentences), 2):
        s = sentences[i]
        sep = sentences[i+1] if i+1 < len(sentences) else ""
        sentence = s + sep
        if len(current) + len(sentence) <= max_chars:
            current += sentence
        else:
            if current:
                parts.append(current)
            current = sentence
    if current:
        parts.append(current)
    return parts if parts else [text]


def translate_paragraph(
    translator,
    para: str,
    glossary: List[Tuple[str, str]],
    filename: str,
    terms_used_set: set,
    warnings_counter: List[int]
) -> str:
    """Translate a single markdown paragraph preserving leading syntax and glossary terms."""
    if not para.strip():
        return para

    match = re.match(r"^(\s*(?:#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s*)*)(.*)$", para, re.DOTALL)
    prefix = match.group(1) if match else ""
    body = match.group(2) if match else para

    if not body.strip():
        return para

    body, urls = protect_links(body)
    body, placeholder_map = apply_glossary_placeholders(body, glossary, terms_used_set)

    chunks = split_large_paragraph(body, max_chars=3500)
    translated_chunks = []
    for chunk in chunks:
        trans = translate_text_with_retry(translator, chunk)
        translated_chunks.append(trans)
    translated_body = " ".join(translated_chunks)

    translated_body = restore_glossary_placeholders(translated_body, placeholder_map, filename, warnings_counter)
    translated_body = restore_links(translated_body, urls)

    return prefix + translated_body


def translate_block_content(
    translator,
    content: str,
    glossary: List[Tuple[str, str]],
    filename: str,
    terms_used_set: set,
    warnings_counter: List[int]
) -> str:
    """Translate block body split on blank lines (paragraphs)."""
    paragraphs = re.split(r"(\n\s*\n)", content)
    translated_parts = []
    for part in paragraphs:
        if re.match(r"^\n\s*\n$", part):
            translated_parts.append(part)
        else:
            trans = translate_paragraph(translator, part, glossary, filename, terms_used_set, warnings_counter)
            translated_parts.append(trans)
    return "".join(translated_parts)


# ---------------------------------------------------------------------------
# File Processing & Cache
# ---------------------------------------------------------------------------

def compute_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def load_cache(cache_path: str) -> dict:
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_cache(cache_path: str, data: dict):
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def process_markdown_file(
    translator,
    src_path: str,
    dest_path: str,
    glossary: List[Tuple[str, str]],
    terms_used_set: set,
    warnings_counter: List[int]
):
    """Process a single markdown file with atomic write."""
    filename = os.path.basename(src_path)
    with open(src_path, "r", encoding="utf-8") as f:
        text = f.read()

    blocks = re.split(r"^\s*---\s*$", text, flags=re.MULTILINE)
    translated_blocks = []

    for block in blocks:
        block_stripped = block.strip()
        if not block_stripped:
            continue

        cat_match = re.search(r"^#\s*CATEGORY:\s*([\w-]+)\s*$", block, re.MULTILINE)
        if cat_match:
            category_line = cat_match.group(0).strip()
            content_without_cat = re.sub(r"^#\s*CATEGORY:\s*[\w-]+\s*\n?", "", block, flags=re.MULTILINE)
            trans_content = translate_block_content(
                translator, content_without_cat.strip(), glossary, filename, terms_used_set, warnings_counter
            )
            final_block = f"{category_line}\n{trans_content}"
        else:
            final_block = translate_block_content(
                translator, block_stripped, glossary, filename, terms_used_set, warnings_counter
            )
        translated_blocks.append(final_block.strip())

    result_text = "\n\n---\n\n".join(translated_blocks) + "\n"

    dest_dir = os.path.dirname(dest_path)
    os.makedirs(dest_dir, exist_ok=True)
    temp_fd, temp_path = tempfile.mkstemp(dir=dest_dir, prefix="trans_", suffix=".tmp")
    with os.fdopen(temp_fd, "w", encoding="utf-8") as f:
        f.write(result_text)

    if os.path.exists(dest_path):
        os.remove(dest_path)
    os.rename(temp_path, dest_path)


# ---------------------------------------------------------------------------
# Main Routine
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Build English translations for SVT Kalasa markdown files.")
    parser.add_argument("--force", action="store_true", help="Force rebuild even if cache matches.")
    args = parser.parse_args()

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    glossary_path = os.path.join(repo_root, "data", "glossary.json")
    cache_path = os.path.join(repo_root, "scripts", ".translate_cache.json")

    files_to_process = [
        (os.path.join(repo_root, "data", "temple_background.md"), os.path.join(repo_root, "data", "en", "temple_background.md")),
        (os.path.join(repo_root, "data", "traditions.md"), os.path.join(repo_root, "data", "en", "traditions.md")),
    ]

    glossary = load_glossary(glossary_path)
    cache = load_cache(cache_path)

    translator = get_translator()

    files_translated = 0
    files_skipped = 0
    terms_used_set = set()
    warnings_counter = [0]

    for src, dest in files_to_process:
        fname = os.path.basename(src)
        src_hash = compute_sha256(src)
        dest_exists = os.path.exists(dest)

        if not args.force and dest_exists and cache.get(fname) == src_hash:
            print(f"Skipping {fname} (unchanged).")
            files_skipped += 1
            continue

        print(f"Translating {fname}...")
        process_markdown_file(translator, src, dest, glossary, terms_used_set, warnings_counter)
        cache[fname] = src_hash
        files_translated += 1

    save_cache(cache_path, cache)

    print("\n" + "=" * 40)
    print("Translation Build Summary:")
    print(f"  Files translated : {files_translated}")
    print(f"  Files skipped    : {files_skipped}")
    print(f"  Glossary terms used : {len(terms_used_set)}")
    print(f"  Warnings count   : {warnings_counter[0]}")
    print("=" * 40)


if __name__ == "__main__":
    main()
