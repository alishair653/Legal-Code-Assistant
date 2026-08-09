"""
Step 4: Extract text from scraped Pakistan Code PDFs -> JSON for RAG.
Resume-safe + optional parallel workers (disjoint PDF shards).
Dedupes per PDF+section; long articles split into parts (no text cut-off).

Usage:
  cd ai-ml-module
  python scripts/extract_sections.py --book qso --status-only
  python scripts/extract_sections.py --book qso --workers 3 --worker-id 0
  python scripts/extract_sections.py --book qso --merge-workers
  python scripts/extract_sections.py --book qso --dedupe-json
  python scripts/extract_sections.py --book qso --fresh --workers 3 --worker-id 0
"""

from __future__ import annotations

import argparse
import json
import re
import time
import zlib
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import pdfplumber
from tqdm import tqdm

AI_ML_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = AI_ML_ROOT.parent
RAW_PDFS = REPO_ROOT / "legal-data" / "raw-pdfs"
EXTRACTED = REPO_ROOT / "legal-data" / "extracted"
PROCESSED = REPO_ROOT / "legal-data" / "processed"
SAVE_EVERY_N_PDFS = 3

BOOK_FOLDERS: Dict[str, Tuple[str, str]] = {
    "Pannel Code": ("ppc_sections", "PPC"),
    "criminal-procedure": ("crpc_sections", "CrPC"),
    "QSO": ("qso_sections", "QSO"),
    "Fedral-laws": ("federal_laws_sections", "FED"),
}

BOOK_MAP = {
    "ppc": ("Pannel Code",),
    "crpc": ("criminal-procedure",),
    "qso": ("QSO",),
    "federal": ("Fedral-laws",),
}

SECTION_HEADING_RE = re.compile(
    r"(?im)^\s*(?:SECTION|Section|Sec\.?)\s+(\d+[A-Za-z]?)\s*[\.\:\-–—]\s*(.{12,}?)\s*$"
)
ARTICLE_HEADING_RE = re.compile(
    r"(?im)^\s*(?:ARTICLE|Article)\s+(\d+[A-Za-z]?)\s*[\.\:\-–—]\s*(.{12,}?)\s*$"
)
NUMBERED_HEADING_RE = re.compile(
    r"(?im)^\s*(\d{1,3}[A-Za-z]?)\s*[\.\)]\s+([A-Z][^\n]{12,}?)(?:\s*[\.\-–—]|$)"
)
PAGE_NUM_RE = re.compile(r"^\s*\d+\s*$")
PAGE_FOOTER_RE = re.compile(r"^Page\s+\d+\s+of\s+\d+\s*$", re.I)

# Per record max before splitting into part-2, part-3 (no silent cut-off)
MAX_SECTION_CHARS = 12000
CHUNK_SIZE = 4000
MIN_SECTION_CHARS = 40
MIN_TITLE_LEN = 12


def checkpoint_path(workers: int, worker_id: int) -> Path:
    if workers <= 1:
        return EXTRACTED / ".extract_sections_progress.json"
    return EXTRACTED / f".extract_sections_progress.worker-{worker_id}.json"


def output_stem_for_worker(out_stem: str, workers: int, worker_id: int) -> str:
    if workers <= 1:
        return out_stem
    return f"{out_stem}.worker-{worker_id}"


def worker_owns_pdf(folder_name: str, pdf_name: str, worker_id: int, workers: int) -> bool:
    if workers <= 1:
        return True
    token = f"{folder_name}\0{pdf_name}"
    h = zlib.crc32(token.encode("utf-8")) & 0xFFFFFFFF
    return h % workers == worker_id


def clean_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = []
    for line in text.split("\n"):
        line = re.sub(r"\s+", " ", line).strip()
        if not line or PAGE_NUM_RE.match(line) or PAGE_FOOTER_RE.match(line):
            continue
        lines.append(line)
    return "\n".join(lines).strip()


def title_declared_number(title: str) -> Optional[str]:
    """e.g. '22. Facts necessary...' -> '22'"""
    m = re.match(r"^\s*(\d+[A-Za-z]?)\s*[\.\:\-–—]", (title or "").strip())
    return m.group(1) if m else None


def is_valid_heading(title: str, number: str) -> bool:
    """Skip illustration cross-refs and in-body 'Article X paragraph' noise."""
    t = (title or "").strip()
    n = (number or "").strip()
    if len(t) < MIN_TITLE_LEN or not n:
        return False
    if re.match(r"^\([a-z]\)\s", t, re.I):
        return False
    if re.match(r"^\([a-z]\)\s*The question is,", t, re.I):
        return False
    if re.match(r"^The question is,", t, re.I):
        return False
    if re.match(r"^under (Article|Section)\s", t, re.I):
        return False
    if re.match(r"^or\s+\d+\.", t, re.I):
        return False
    if "paragraph (" in t.lower() and len(t) < 80:
        return False
    if re.match(r"^and is not less than", t, re.I):
        return False
    if re.match(r"^\d+\s+of\s+\d+", t):
        return False
    if re.match(r"^Illustrations?\b", t, re.I):
        return False
    declared = title_declared_number(t)
    if declared and declared != n:
        return False
    return True


def find_heading_matches(full_text: str, use_articles: bool) -> List[re.Match]:
    """Line-start headings only (reduces duplicate false Article/Section hits)."""
    # QSO PDFs use "22. Title" lines; "Article 153" in illustrations is NOT a heading.
    if use_articles:
        patterns = [NUMBERED_HEADING_RE]
    else:
        patterns = [SECTION_HEADING_RE, NUMBERED_HEADING_RE]
    seen_starts: Set[int] = set()
    matches: List[re.Match] = []
    for pat in patterns:
        for m in pat.finditer(full_text):
            num = m.group(1).strip()
            title = (m.group(2) or "").strip()
            if not is_valid_heading(title, num):
                continue
            if m.start() in seen_starts:
                continue
            seen_starts.add(m.start())
            matches.append(m)
    matches.sort(key=lambda x: x.start())
    return matches


def merge_same_number_sections(parsed: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """One entry per section/article number per PDF — merge text, keep best title."""
    by_num: Dict[str, Dict[str, str]] = {}
    for sec in parsed:
        num = sec["section_number"]
        if num not in by_num:
            by_num[num] = dict(sec)
            continue
        existing = by_num[num]
        if len(sec.get("title", "")) > len(existing.get("title", "")) and "." in sec.get("title", ""):
            existing["title"] = sec["title"]
        extra = sec.get("text", "")
        if extra and extra not in existing.get("text", ""):
            existing["text"] = (existing.get("text", "") + "\n\n" + extra).strip()
    return list(by_num.values())


def split_long_text(text: str, max_chars: int, chunk_size: int) -> List[str]:
    if len(text) <= max_chars:
        return [text]
    chunks: List[str] = []
    start = 0
    while start < len(text):
        chunks.append(text[start : start + chunk_size])
        start += chunk_size
    return chunks


def record_dedupe_key(rec: Dict[str, Any]) -> Tuple[str, ...]:
    if rec.get("chunk_type") == "full_document":
        return ("doc", rec.get("source_file", ""), rec.get("statute", ""))
    return (
        rec.get("source_file", ""),
        rec.get("statute", ""),
        str(rec.get("section_number", "")),
        str(rec.get("part", 1)),
    )


def dedupe_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Keep longest text per unique section (no duplicate Article 153 x3)."""
    best: Dict[Tuple[str, ...], Dict[str, Any]] = {}
    errors: List[Dict[str, Any]] = []
    for rec in records:
        if rec.get("error"):
            errors.append(rec)
            continue
        key = record_dedupe_key(rec)
        prev = best.get(key)
        if prev is None or len(rec.get("text", "")) > len(prev.get("text", "")):
            best[key] = rec
    out = errors + list(best.values())
    out.sort(key=lambda r: (r.get("source_file", ""), str(r.get("section_number", ""))))
    return out


def parse_filename(pdf_path: Path) -> Tuple[str, str, str]:
    stem = pdf_path.stem
    parts = stem.split("__")
    if len(parts) >= 3:
        return parts[0], parts[1], parts[2]
    if len(parts) == 2:
        return parts[0], parts[1], ""
    return stem, "", ""


def split_sections(
    full_text: str,
    statute: str,
    use_articles: bool,
    max_chars: int = MAX_SECTION_CHARS,
    chunk_size: int = CHUNK_SIZE,
) -> List[Dict[str, str]]:
    kind = "Article" if use_articles else "Section"
    matches = find_heading_matches(full_text, use_articles)
    if len(matches) < 2:
        return []

    raw_sections: List[Dict[str, str]] = []
    for i, m in enumerate(matches):
        num = m.group(1).strip()
        title = (m.group(2) or "").strip()[:300]
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(full_text)
        body = clean_text(full_text[start:end])
        if len(body) < MIN_SECTION_CHARS:
            continue
        raw_sections.append(
            {
                "section_number": num,
                "title": title or f"{kind} {num}",
                "text": body,
                "full_reference": f"{kind} {num} {statute}",
            }
        )

    merged = merge_same_number_sections(raw_sections)
    for i, sec in enumerate(merged):
        declared = title_declared_number(sec.get("title", ""))
        if declared and declared != sec["section_number"]:
            kind = "Article" if use_articles else "Section"
            sec["section_number"] = declared
            sec["full_reference"] = f"{kind} {declared} {statute}"
            merged[i] = sec
    merged = merge_same_number_sections(merged)
    sections: List[Dict[str, str]] = []
    for sec in merged:
        for part_i, chunk in enumerate(split_long_text(sec["text"], max_chars, chunk_size)):
            entry = dict(sec)
            entry["text"] = chunk
            if part_i > 0:
                entry["part"] = part_i + 1
                entry["full_reference"] = f"{sec['full_reference']} (part {part_i + 1})"
            sections.append(entry)
    return sections


def extract_pdf_text(pdf_path: Path) -> Tuple[str, int]:
    pages_text: List[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        page_count = len(pdf.pages)
        for page in pdf.pages:
            t = page.extract_text() or ""
            if t.strip():
                pages_text.append(t)
    return clean_text("\n\n".join(pages_text)), page_count


def records_from_pdf(
    pdf_path: Path,
    folder_name: str,
    statute: str,
    source_id: int,
    max_chars: int = MAX_SECTION_CHARS,
    chunk_size: int = CHUNK_SIZE,
) -> Tuple[List[Dict[str, Any]], bool, Optional[str]]:
    book_label, category, year = parse_filename(pdf_path)
    use_articles = statute == "QSO" or "Shahadat" in book_label

    try:
        full_text, page_count = extract_pdf_text(pdf_path)
    except Exception as e:
        return (
            [
                {
                    "id": f"ERR-{folder_name}-{source_id}",
                    "error": str(e),
                    "source_file": pdf_path.name,
                    "statute": statute,
                    "folder": folder_name,
                }
            ],
            False,
            str(e),
        )

    if not full_text or len(full_text) < MIN_SECTION_CHARS:
        return [], True, None

    parsed = split_sections(full_text, statute, use_articles, max_chars, chunk_size)
    records: List[Dict[str, Any]] = []

    if parsed:
        for idx, sec in enumerate(parsed):
            part = sec.get("part", 1)
            sid = (
                f"{statute}-{book_label}-{category}-{year}-{sec['section_number']}-p{part}"
            ).replace(" ", "_")
            records.append(
                {
                    "id": sid[:120],
                    "section_number": sec["section_number"],
                    "title": sec["title"],
                    "text": sec["text"],
                    "statute": statute,
                    "full_reference": sec["full_reference"],
                    "book_label": book_label,
                    "category": category,
                    "year": year,
                    "source_file": pdf_path.name,
                    "folder": folder_name,
                    "page_count": page_count,
                    "part": part,
                    "text_length": len(sec["text"]),
                }
            )
    else:
        for part_i, chunk in enumerate(split_long_text(full_text, max_chars, chunk_size)):
            chunk_id = f"{statute}-{book_label}-{category}-{year}-DOC-p{part_i + 1}".replace(" ", "_")
            records.append(
                {
                    "id": chunk_id[:120],
                    "section_number": "",
                    "title": f"{book_label} / {category} / {year}".strip(" /"),
                    "text": chunk,
                    "statute": statute,
                    "full_reference": f"{book_label} {category} {year}".strip(),
                    "book_label": book_label,
                    "category": category,
                    "year": year,
                    "source_file": pdf_path.name,
                    "folder": folder_name,
                    "page_count": page_count,
                    "chunk_type": "full_document",
                    "part": part_i + 1,
                    "text_length": len(chunk),
                }
            )

    return dedupe_records(records), True, None


def load_checkpoint(workers: int, worker_id: int) -> Dict[str, Any]:
    path = checkpoint_path(workers, worker_id)
    if not path.is_file():
        return {"version": 1, "workers": workers, "worker_id": worker_id, "folders": {}}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"version": 1, "workers": workers, "worker_id": worker_id, "folders": {}}


def save_checkpoint(state: Dict[str, Any], workers: int, worker_id: int) -> None:
    EXTRACTED.mkdir(parents=True, exist_ok=True)
    path = checkpoint_path(workers, worker_id)
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.replace(path)


def load_book_json(out_stem: str) -> Tuple[List[Dict[str, Any]], int]:
    path = EXTRACTED / f"{out_stem}.json"
    if not path.is_file():
        return [], 0
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data.get("sections") or [], int(data.get("errors") or 0)
    except (json.JSONDecodeError, OSError):
        return [], 0


def global_done_pdf_names(folder_name: str, base_stem: str, workers: int) -> Set[str]:
    """All PDFs done by any worker (or legacy single-file run)."""
    done: Set[str] = set()

    stems = [base_stem]
    if workers > 1:
        stems.extend([f"{base_stem}.worker-{i}" for i in range(workers)])
    for stem in stems:
        ck_path = EXTRACTED / ".extract_sections_progress.json"
        if stem == base_stem and ck_path.is_file():
            try:
                ck = json.loads(ck_path.read_text(encoding="utf-8"))
                folder_ck = ck.get("folders", {}).get(folder_name, {})
                done.update(folder_ck.get("processed_pdfs", []))
                done.update(folder_ck.get("empty_pdfs", []))
                done.update(folder_ck.get("failed_pdfs", {}).keys())
            except (json.JSONDecodeError, OSError):
                pass
        if workers > 1:
            wid = int(stem.split(".worker-")[-1]) if ".worker-" in stem else -1
            if wid >= 0:
                ck = load_checkpoint(workers, wid)
                folder_ck = ck.get("folders", {}).get(folder_name, {})
                done.update(folder_ck.get("processed_pdfs", []))
                done.update(folder_ck.get("empty_pdfs", []))
                done.update(folder_ck.get("failed_pdfs", {}).keys())
        for rec in load_book_json(stem)[0]:
            sf = rec.get("source_file")
            if sf:
                done.add(sf)
    return done


def save_book_json(
    folder_name: str,
    out_stem: str,
    statute: str,
    shard_total: int,
    sections: List[Dict[str, Any]],
    errors: int,
    processed_count: int,
    workers: int,
    worker_id: int,
) -> None:
    EXTRACTED.mkdir(parents=True, exist_ok=True)
    sections = dedupe_records(sections)
    path = EXTRACTED / f"{out_stem}.json"
    payload = {
        "folder": folder_name,
        "statute": statute,
        "workers": workers,
        "worker_id": worker_id,
        "pdf_count_shard": shard_total,
        "pdf_count_processed": processed_count,
        "record_count": len(sections),
        "unique_sections": len(
            {
                (r.get("source_file"), r.get("section_number"), r.get("part", 1))
                for r in sections
                if not r.get("error")
            }
        ),
        "errors": errors,
        "sections": sections,
        "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def shard_status(
    folder_name: str,
    base_stem: str,
    workers: int,
    worker_id: int,
    limit: Optional[int] = None,
) -> Dict[str, Any]:
    folder = RAW_PDFS / folder_name
    if not folder.is_dir():
        return {"folder": folder_name, "missing": True}

    all_pdfs = sorted(folder.glob("*.pdf"))
    if limit is not None:
        all_pdfs = all_pdfs[:limit]

    global_done = global_done_pdf_names(folder_name, base_stem, workers)
    owned = [p for p in all_pdfs if worker_owns_pdf(folder_name, p.name, worker_id, workers)]
    done = sum(1 for p in owned if p.name in global_done)
    total_shard = len(owned)
    remaining = total_shard - done

    out_stem = output_stem_for_worker(base_stem, workers, worker_id)
    sections, errs = load_book_json(out_stem)

    return {
        "folder": folder_name,
        "statute": BOOK_FOLDERS[folder_name][1],
        "workers": workers,
        "worker_id": worker_id,
        "shard_pdfs": total_shard,
        "done_pdfs": done,
        "remaining_pdfs": remaining,
        "pct": round(100.0 * done / total_shard, 1) if total_shard else 0.0,
        "json_records": len(sections),
        "json_errors": errs,
        "out_file": str(EXTRACTED / f"{out_stem}.json"),
        "all_pdfs_in_folder": len(all_pdfs),
    }


def print_status_report(
    folders: List[str],
    workers: int,
    worker_id: int,
    limit: Optional[int] = None,
) -> None:
    print("=" * 62)
    if workers > 1:
        print(f"EXTRACT PROGRESS — worker {worker_id} of {workers - 1}")
        print(f"Checkpoint: {checkpoint_path(workers, worker_id)}")
    else:
        print("EXTRACT PROGRESS (single worker)")
        print(f"Checkpoint: {checkpoint_path(1, 0)}")
    print("=" * 62)

    if workers > 1:
        for wid in range(workers):
            print(f"\n--- Worker {wid} shard ---")
            for folder_name in folders:
                if folder_name not in BOOK_FOLDERS:
                    continue
                base_stem, _ = BOOK_FOLDERS[folder_name]
                st = shard_status(folder_name, base_stem, workers, wid, limit)
                if st.get("missing"):
                    continue
                print(
                    f"  [{folder_name}] {st['done_pdfs']}/{st['shard_pdfs']} done "
                    f"({st['pct']}%) | remaining {st['remaining_pdfs']} | records {st['json_records']}"
                )

    grand_total = grand_done = grand_remaining = 0
    for folder_name in folders:
        if folder_name not in BOOK_FOLDERS:
            continue
        base_stem, _ = BOOK_FOLDERS[folder_name]
        st = shard_status(folder_name, base_stem, workers, worker_id, limit)
        if st.get("missing"):
            print(f"\n[{folder_name}] folder not found")
            continue
        print(f"\n[{folder_name}] YOUR worker ({worker_id})")
        print(f"  Shard PDFs:  {st['done_pdfs']} / {st['shard_pdfs']} done ({st['pct']}%)")
        print(f"  Remaining:   {st['remaining_pdfs']}")
        print(f"  Records:     {st['json_records']} in {st['out_file']}")
        grand_total += st["shard_pdfs"]
        grand_done += st["done_pdfs"]
        grand_remaining += st["remaining_pdfs"]

    print("\n" + "=" * 62)
    print(f"This worker: {grand_done} / {grand_total} shard PDFs done")
    print(f"Remaining (this worker): {grand_remaining}")
    print("=" * 62)


def mark_pdf_done(
    checkpoint: Dict[str, Any],
    folder_name: str,
    pdf_name: str,
    *,
    empty: bool = False,
    failed: bool = False,
    error_msg: Optional[str] = None,
) -> None:
    folders = checkpoint.setdefault("folders", {})
    entry = folders.setdefault(
        folder_name,
        {"processed_pdfs": [], "empty_pdfs": [], "failed_pdfs": {}},
    )
    if failed and error_msg:
        entry.setdefault("failed_pdfs", {})[pdf_name] = error_msg[:500]
        return
    if empty:
        lst = entry.setdefault("empty_pdfs", [])
        if pdf_name not in lst:
            lst.append(pdf_name)
        return
    lst = entry.setdefault("processed_pdfs", [])
    if pdf_name not in lst:
        lst.append(pdf_name)


def process_folder(
    folder_name: str,
    base_stem: str,
    statute: str,
    checkpoint: Dict[str, Any],
    workers: int,
    worker_id: int,
    limit: Optional[int] = None,
    fresh: bool = False,
    max_chars: int = MAX_SECTION_CHARS,
    chunk_size: int = CHUNK_SIZE,
) -> List[Dict[str, Any]]:
    folder = RAW_PDFS / folder_name
    out_stem = output_stem_for_worker(base_stem, workers, worker_id)

    if not folder.is_dir():
        print(f"[!] Missing folder: {folder}")
        return []

    all_pdfs = sorted(folder.glob("*.pdf"))
    if limit is not None:
        all_pdfs = all_pdfs[:limit]

    owned = [p for p in all_pdfs if worker_owns_pdf(folder_name, p.name, worker_id, workers)]
    global_done = global_done_pdf_names(folder_name, base_stem, workers)

    if fresh:
        sections: List[Dict[str, Any]] = []
        errors = 0
        if folder_name in checkpoint.get("folders", {}):
            checkpoint["folders"].pop(folder_name, None)
    else:
        sections, errors = load_book_json(out_stem)

    pending = [
        p for p in owned if p.name not in global_done
    ]
    shard_total = len(owned)
    already = shard_total - len(pending)

    label = f"{folder_name} w{worker_id}" if workers > 1 else folder_name
    print(f"\n[{label}] resume scan:")
    print(f"  Shard PDFs (this worker): {shard_total}")
    print(f"  Already done (global):   {already}")
    print(f"  Remaining (this worker): {len(pending)}")
    if workers > 1:
        print(f"  Output file: {out_stem}.json")

    if not pending:
        print(f"  Nothing to do — {len(sections)} records in this worker file.")
        save_book_json(
            folder_name, out_stem, statute, shard_total, sections, errors, already, workers, worker_id
        )
        return sections

    processed_this_run = 0
    for i, pdf_path in enumerate(
        tqdm(pending, desc=f"{label}", unit="pdf", total=len(pending))
    ):
        batch, ok, err_msg = records_from_pdf(
            pdf_path, folder_name, statute, already + i, max_chars, chunk_size
        )
        if not ok and err_msg:
            errors += 1
            mark_pdf_done(checkpoint, folder_name, pdf_path.name, failed=True, error_msg=err_msg)
            for r in batch:
                if "error" in r:
                    sections.append(r)
        elif not batch:
            mark_pdf_done(checkpoint, folder_name, pdf_path.name, empty=True)
        else:
            sections.extend(batch)
            mark_pdf_done(checkpoint, folder_name, pdf_path.name)

        processed_this_run += 1
        done_count = already + processed_this_run

        if processed_this_run % SAVE_EVERY_N_PDFS == 0 or processed_this_run == len(pending):
            save_checkpoint(checkpoint, workers, worker_id)
            save_book_json(
                folder_name,
                out_stem,
                statute,
                shard_total,
                sections,
                errors,
                done_count,
                workers,
                worker_id,
            )

    save_checkpoint(checkpoint, workers, worker_id)
    save_book_json(
        folder_name,
        out_stem,
        statute,
        shard_total,
        sections,
        errors,
        already + processed_this_run,
        workers,
        worker_id,
    )
    print(f"[+] Saved {len(sections)} records -> {EXTRACTED / f'{out_stem}.json'}")
    return sections


def merge_worker_outputs(base_stem: str, workers: int) -> Path:
    """Merge worker JSON files; dedupe by source_file + section_number (longest text wins)."""
    combined: List[Dict[str, Any]] = []
    paths: List[Path] = []
    if workers > 1:
        paths = [EXTRACTED / f"{base_stem}.worker-{i}.json" for i in range(workers)]
    legacy = EXTRACTED / f"{base_stem}.json"
    if legacy.is_file():
        paths.append(legacy)

    for path in paths:
        if not path.is_file():
            continue
        sections, _ = load_book_json(path.stem)
        combined.extend(sections)

    combined = dedupe_records(combined)
    unique_pdfs = len({r.get("source_file") for r in combined if r.get("source_file")})

    out = EXTRACTED / f"{base_stem}.json"
    payload = {
        "merged_from_workers": workers,
        "record_count": len(combined),
        "unique_pdfs": unique_pdfs,
        "deduped": True,
        "sections": combined,
        "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    tmp = out.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(out)
    print(f"[+] Merged {len(combined)} records -> {out}")
    return out


def rebuild_combined(folders: List[str], workers: int) -> Path:
    combined: List[Dict[str, Any]] = []
    for folder_name in folders:
        if folder_name not in BOOK_FOLDERS:
            continue
        base_stem, _ = BOOK_FOLDERS[folder_name]
        if workers > 1:
            merge_worker_outputs(base_stem, workers)
        sections, _ = load_book_json(base_stem)
        combined.extend(sections)

    PROCESSED.mkdir(parents=True, exist_ok=True)
    combined_path = PROCESSED / "all_legal_data.json"
    tmp = combined_path.with_suffix(".json.tmp")
    tmp.write_text(
        json.dumps({"total": len(combined), "sections": combined}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    tmp.replace(combined_path)
    print(f"[+] Combined {len(combined)} records -> {combined_path}")
    return combined_path


def print_worker_banner(worker_id: int, workers: int) -> None:
    print("=" * 62)
    print(f"  EXTRACT WORKER  {worker_id}  of  {workers - 1}   (--worker-id {worker_id}  --workers {workers})")
    if workers > 1:
        others = [str(i) for i in range(workers) if i != worker_id]
        print(f"  Other CMD tabs: --worker-id {', '.join(others)} (same --workers {workers})")
    print("=" * 62)


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract legal text from PDFs (Step 4)")
    parser.add_argument("--book", choices=["ppc", "crpc", "qso", "federal", "all"], default="all")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--status-only", action="store_true")
    parser.add_argument("--fresh", action="store_true")
    parser.add_argument("--rebuild-only", action="store_true")
    parser.add_argument("--merge-workers", action="store_true", help="Merge worker JSON into main book file")
    parser.add_argument("--workers", type=int, default=1, metavar="N")
    parser.add_argument("--worker-id", type=int, default=0, metavar="I")
    parser.add_argument(
        "--max-chars",
        type=int,
        default=MAX_SECTION_CHARS,
        help=f"Max chars per chunk before split (default {MAX_SECTION_CHARS}, full text kept in parts)",
    )
    parser.add_argument(
        "--dedupe-json",
        action="store_true",
        help="Dedupe existing extracted JSON only (fix duplicates without re-reading PDFs)",
    )
    args = parser.parse_args()

    if args.workers < 1:
        print("--workers must be >= 1")
        return 2
    if args.worker_id < 0 or args.worker_id >= args.workers:
        print("--worker-id must be 0 .. workers-1")
        return 2
    if args.workers == 1 and args.worker_id != 0:
        args.worker_id = 0

    folders = list(BOOK_FOLDERS.keys()) if args.book == "all" else list(BOOK_MAP[args.book])

    if args.dedupe_json:
        for folder_name in folders:
            if folder_name not in BOOK_FOLDERS:
                continue
            base_stem, _ = BOOK_FOLDERS[folder_name]
            for stem in [base_stem] + (
                [f"{base_stem}.worker-{i}" for i in range(args.workers)] if args.workers > 1 else []
            ):
                path = EXTRACTED / f"{stem}.json"
                if not path.is_file():
                    continue
                sections, errs = load_book_json(stem)
                before = len(sections)
                sections = dedupe_records(sections)
                path.write_text(
                    json.dumps(
                        {
                            "deduped": True,
                            "record_count": len(sections),
                            "errors": errs,
                            "sections": sections,
                        },
                        ensure_ascii=False,
                        indent=2,
                    ),
                    encoding="utf-8",
                )
                print(f"[+] Deduped {stem}: {before} -> {len(sections)} records")
        if args.book == "qso" or args.book == "all":
            merge_worker_outputs("qso_sections", args.workers)
        rebuild_combined(folders, args.workers)
        return 0

    if not RAW_PDFS.is_dir():
        print(f"[!] raw-pdfs not found: {RAW_PDFS}")
        return 1

    print_worker_banner(args.worker_id, args.workers)
    print(f"Text: up to {args.max_chars} chars/chunk, split into {CHUNK_SIZE}-char parts if longer (no cut-off)")
    print(f"Input:  {RAW_PDFS}")
    print(f"Output: {EXTRACTED}")

    if args.merge_workers:
        for folder_name in folders:
            if folder_name in BOOK_FOLDERS:
                merge_worker_outputs(BOOK_FOLDERS[folder_name][0], args.workers)
        rebuild_combined(folders, 1)
        return 0

    if args.status_only or args.rebuild_only:
        print_status_report(folders, args.workers, args.worker_id, args.limit)
        if args.rebuild_only:
            if args.workers > 1:
                for folder_name in folders:
                    if folder_name in BOOK_FOLDERS:
                        merge_worker_outputs(BOOK_FOLDERS[folder_name][0], args.workers)
            rebuild_combined(folders, args.workers)
        return 0

    if args.fresh:
        print("[!] --fresh: re-extract this worker shard from scratch.\n")

    print_status_report(folders, args.workers, args.worker_id, args.limit)
    print("\nStarting extraction...\n")

    checkpoint = load_checkpoint(args.workers, args.worker_id)
    for folder_name in folders:
        if folder_name not in BOOK_FOLDERS:
            continue
        base_stem, statute = BOOK_FOLDERS[folder_name]
        process_folder(
            folder_name,
            base_stem,
            statute,
            checkpoint,
            args.workers,
            args.worker_id,
            args.limit,
            fresh=args.fresh,
            max_chars=args.max_chars,
            chunk_size=CHUNK_SIZE,
        )

    if args.workers > 1:
        print("\nTip: when ALL 3 workers finish, run:")
        print("  python scripts/extract_sections.py --book qso --merge-workers")
    else:
        rebuild_combined(folders, args.workers)

    print("\n--- Final status ---")
    print_status_report(folders, args.workers, args.worker_id, args.limit)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
