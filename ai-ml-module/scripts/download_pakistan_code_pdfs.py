"""
Pakistan Code (pakistancode.gov.pk) — Selenium helper for English index PDF workflow.

Site shape (static HTML):
  - Homepage tiles live under `section.all__laws` as `div.col-lg-3`.
  - Each tile has `div.c-inner` + green `a.btn.btn-sm.btn-block` (or `<a><label>View</label></a>`)
    with a real `href` — we collect those URLs once via JavaScript (no stored WebElements).
  - Inner law pages expose two `<select>` filters + Search; PDF opens in viewer / download.

This script: collect (href, label) on index → `driver.get(href)` per tile → loop category×year
strings only, and reload the law page URL after each attempt so Selenium never hits
`StaleElementReferenceException` from cached DOM nodes.

Resume: progress is saved to `<output>/.pakistan_code_scraper_state.json` after each OK download.
If laptop shuts down or net drops, run the same command again — finished pairs are skipped
(also skipped if the expected PDF already exists and is large enough). Use `--reset-progress`
to start from scratch (does not delete PDFs).

Parallel CMD/tabs (same `--output`, disjoint category×year work): use `--workers 10` and
`--worker-id 0` … `--worker-id 9`. Each process only handles pairs whose stable CRC maps to
that shard; existing PDFs still skip work. With `--workers` > 1, each tab gets its own checkpoint
file so concurrent runs do not corrupt one JSON.

Progress report: run with `--status-only` to count possible category×year pairs from the site and
compare them with PDFs/checkpoints in the output folder. It does not download anything.

Usage:
  cd ai-ml-module
  pip install -r requirements-selenium.txt
  python scripts/download_pakistan_code_pdfs.py --output ../legal-data/raw-pdfs

Optimizations (see scripts/scraper_runtime.py):
  --power-save          battery-friendly slower mode
  --selenium-timeout 180  fix ChromeDriver Read timed out (120)
  --restart-browser-every 25  reduce hangs
  --gc-every 5          memory cleanup
  Optional GPU: pip install -r requirements-selenium-gpu.txt  (helpers only, not Chrome)

Respect the site: polite delays; confirm bulk download is allowed under MoLJ terms.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
import time
import zlib
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse

import requests
from selenium import webdriver
from selenium.common.exceptions import (
    StaleElementReferenceException,
    TimeoutException,
    WebDriverException,
)
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

from scraper_progress import (
    BookStatsTracker,
    ConsoleUI,
    book_plan_cache_path,
    count_pdfs_for_book,
    load_book_plan_cache,
    save_book_plan_cache,
)
from scraper_runtime import (
    BrowserSession,
    RuntimeOptions,
    apply_power_save_delays,
    gpu_status_message,
    setup_logging,
)

SCRIPT_STARTED_AT = time.time()


class ShardIncompleteError(Exception):
    """Raised when the worker exits the category loop but its shard still has pending PDFs."""

    def __init__(self, remaining: int, worker_id: int, pairs_done: int, pairs_total: int) -> None:
        self.remaining = remaining
        self.worker_id = worker_id
        self.pairs_done = pairs_done
        self.pairs_total = pairs_total
        super().__init__(
            f"worker {worker_id}: {remaining} of {pairs_total} shard PDFs still pending "
            f"({pairs_done} done)"
        )


def _load_config(ai_ml_root: Path) -> Dict[str, Any]:
    cfg_path = ai_ml_root / "config" / "pakistan_code_selectors.json"
    example = ai_ml_root / "config" / "pakistan_code_selectors.example.json"
    path = cfg_path if cfg_path.is_file() else example
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def _slug(s: str, max_len: int = 80) -> str:
    s = re.sub(r"[^\w\-]+", "_", s.strip(), flags=re.UNICODE)
    s = re.sub(r"_+", "_", s).strip("_")
    return (s or "item")[:max_len]


def _extract_year(text: str) -> Optional[int]:
    match = re.search(r"\b(1[6-9]\d{2}|20\d{2})\b", text)
    if not match:
        return None
    return int(match.group(1))


def _year_in_range(text: str, min_year: Optional[int], max_year: Optional[int]) -> bool:
    year = _extract_year(text)
    if year is None:
        return True
    if min_year is not None and year < min_year:
        return False
    if max_year is not None and year > max_year:
        return False
    return True


def _filtered_year_texts(year_select: Select, min_year: Optional[int], max_year: Optional[int]) -> List[str]:
    return [
        o.text.strip()
        for o in year_select.options
        if o.text.strip()
        and "select" not in o.text.strip().lower()
        and _year_in_range(o.text.strip(), min_year, max_year)
    ]


def _year_range_note(min_year: Optional[int], max_year: Optional[int]) -> str:
    if min_year is not None and max_year is not None:
        return f"years {min_year}-{max_year}"
    if min_year is not None:
        return f"years {min_year}+"
    if max_year is not None:
        return f"years <= {max_year}"
    return "all years"


DEFAULT_HOME_CARDS_CSS = "section.all__laws div.col-lg-3"
STATE_FILE_NAME = ".pakistan_code_scraper_state.json"
DEFAULT_TILE_LABELS_BY_INDEX = {
    0: "List_of_Federal_Laws",
    1: "The_Constitution_of_Pakistan",
    2: "Rules_of_Business",
    3: "Estacode",
}


def _card_label(raw_label: str, index: int) -> str:
    label = _slug(raw_label or "")
    if not label or label == "card" or label == f"tile_{index}":
        return DEFAULT_TILE_LABELS_BY_INDEX.get(index, f"tile_{index}")
    return label


def _normalize_tile_href(href: str, index_url: str) -> str:
    """Same URL string for plan cache + CRC shard (must match across all workers)."""
    h = (href or "").strip()
    if not h:
        return h
    return urljoin(index_url, h).rstrip("/")


def _print_worker_banner(worker_id: int, workers: int, state_path: Path) -> None:
    line = "=" * 62
    print(line)
    print(f"  PARALLEL WORKER  {worker_id}  of  {workers - 1}   (--worker-id {worker_id}  --workers {workers})")
    print(f"  Checkpoint: {state_path.name}")
    if workers > 1:
        others = [str(i) for i in range(workers) if i != worker_id]
        print(f"  Other tabs must run worker-id: {', '.join(others)} with the SAME --workers {workers}")
    print(line)


def _state_path_for_worker(out_dir: Path, worker_id: int, workers: int) -> Path:
    """Single shared checkpoint when workers==1; per-worker file when parallel to avoid races."""
    if workers <= 1:
        return out_dir / STATE_FILE_NAME
    return out_dir / f".pakistan_code_scraper_state.worker-{worker_id}.json"


def _worker_owns_pair(tile_href: str, ctext: str, ytext: str, worker_id: int, workers: int) -> bool:
    if workers <= 1:
        return True
    token = f"{tile_href}\0{ctext}\0{ytext}"
    h = zlib.crc32(token.encode("utf-8")) & 0xFFFFFFFF
    return h % workers == worker_id


def _print_worker_shard_summary(
    out_dir: Path,
    tile_href: str,
    card_label: str,
    workers: int,
    worker_id: int,
    min_year: Optional[int],
    max_year: Optional[int],
) -> None:
    """Show how many category×year pairs each worker owns (from plan cache, no browser)."""
    pairs = load_book_plan_cache(out_dir, _slug(card_label), tile_href, min_year, max_year)
    if not pairs:
        print(
            "Shard plan: no .book_plan_cache yet — first run may scan the site once; "
            "then this summary appears on restart."
        )
        return
    counts = [0] * workers
    for ctext, ytext in pairs:
        for wid in range(workers):
            if _worker_owns_pair(tile_href, ctext, ytext, wid, workers):
                counts[wid] += 1
                break
    total = sum(counts)
    mine = counts[worker_id]
    parts = " | ".join(f"worker {i}: {counts[i]}" for i in range(workers))
    print(f"Shard plan ({total} pairs total, no overlap): {parts}")
    print(
        f"This tab (worker {worker_id}): {mine} pairs (~{_pct(mine, total)}). "
        "Other tabs must use the same --workers with different --worker-id."
    )


def _progress_key(card_label: str, ctext: str, ytext: str) -> str:
    return f"{_slug(card_label)}||{_slug(ctext)}||{_slug(ytext)}"


def _expected_pdf_path(out_dir: Path, card_label: str, ctext: str, ytext: str) -> Path:
    return out_dir / f"{_slug(card_label)}__{_slug(ctext)}__{_slug(ytext)}.pdf"


def _load_progress(state_path: Path) -> set[str]:
    if not state_path.is_file():
        return set()
    try:
        data = json.loads(state_path.read_text(encoding="utf-8"))
        return set(data.get("completed_keys", []))
    except (json.JSONDecodeError, OSError):
        return set()


def _load_all_progress(out_dir: Path) -> set[str]:
    completed: set[str] = set()
    paths = [out_dir / STATE_FILE_NAME, *sorted(out_dir.glob(".pakistan_code_scraper_state.worker-*.json"))]
    for state_path in paths:
        completed.update(_load_progress(state_path))
    return completed


def _save_progress_atomic(state_path: Path, completed: set[str]) -> None:
    state_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"version": 1, "completed_keys": sorted(completed)}
    tmp = state_path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.replace(state_path)


def _pdf_looks_complete(path: Path, min_bytes: int) -> bool:
    try:
        return path.is_file() and path.stat().st_size >= min_bytes
    except OSError:
        return False


def _should_skip_combo(
    out_dir: Path,
    card_label: str,
    ctext: str,
    ytext: str,
    min_bytes: int,
) -> Tuple[bool, Path]:
    """Skip if the expected PDF already exists and looks complete (survives laptop/net cut)."""
    fname = _expected_pdf_path(out_dir, card_label, ctext, ytext)
    if _pdf_looks_complete(fname, min_bytes):
        return True, fname
    return False, fname


def _count_complete_pdfs(out_dir: Path, min_pdf_bytes: int) -> Tuple[int, int]:
    count = 0
    total_bytes = 0
    for path in out_dir.glob("*.pdf"):
        try:
            size = path.stat().st_size
        except OSError:
            continue
        if size >= min_pdf_bytes:
            count += 1
            total_bytes += size
    return count, total_bytes


def _pair_done(
    out_dir: Path,
    card_label: str,
    ctext: str,
    ytext: str,
    completed_keys: set[str],
    min_pdf_bytes: int,
) -> bool:
    pkey = _progress_key(card_label, ctext, ytext)
    if pkey in completed_keys:
        return True
    return _pdf_looks_complete(_expected_pdf_path(out_dir, card_label, ctext, ytext), min_pdf_bytes)


def _print_live_progress(card_label: str, done: int, total: int, current: str = "") -> None:
    remaining = max(total - done, 0)
    suffix = f" | now: {current}" if current else ""
    print(f"  [progress] {card_label}: {done}/{total} done ({_pct(done, total)}), {remaining} remaining{suffix}")


def _plan_book_progress(
    driver: webdriver.Chrome,
    wait: WebDriverWait,
    cfg: Dict[str, Any],
    out_dir: Path,
    card_label: str,
    tile_href: str,
    worker_id: int,
    workers: int,
    min_year: Optional[int],
    max_year: Optional[int],
    all_completed_cache: set[str],
    min_pdf_bytes: int,
    ui: ConsoleUI,
    *,
    verbose_scan: bool = False,
    fast_plan: bool = True,
    force_book_scan: bool = False,
) -> BookStatsTracker:
    """
    Total PDFs = category×year pairs for this worker.
    Fast path: reuse .book_plan_cache_* (no full site re-scan) — important for CRPC 600+ skips.
    """
    slug_label = _slug(card_label)
    pairs: Optional[List[Tuple[str, str]]] = None
    if fast_plan and not verbose_scan and not force_book_scan:
        pairs = load_book_plan_cache(out_dir, slug_label, tile_href, min_year, max_year)
        if pairs:
            ui.info(f"Fast plan: {len(pairs)} pairs from cache ({book_plan_cache_path(out_dir, slug_label).name})")

    pdf_on_disk = count_pdfs_for_book(out_dir, slug_label, min_pdf_bytes)

    if pairs is None:
        ui.warn(
            "Scanning book on site for total PDF count (pehli dafa ~5–15 min; "
            "agli run cache se turant start hogi)..."
        )
        if pdf_on_disk > 0:
            ui.info(f"{pdf_on_disk} PDF(s) already on disk for this book — in scan ke baad skip ho jayengi.")
        sys.stdout.flush()
        pairs = _collect_category_year_pairs_for_status(
            driver,
            wait,
            cfg,
            out_dir,
            min_year,
            max_year,
            quiet=True,
            plan_progress=True,
        )
        ui.success(f"Plan scan done: {len(pairs)} category×year pairs found.")
        save_book_plan_cache(out_dir, slug_label, tile_href, min_year, max_year, pairs)

    owned = {(c, y) for c, y in pairs if _worker_owns_pair(tile_href, c, y, worker_id, workers)}
    done_keys = {
        _progress_key(card_label, c, y)
        for c, y in owned
        if _pair_done(out_dir, card_label, c, y, all_completed_cache, min_pdf_bytes)
    }
    ck_done = sum(1 for k in all_completed_cache if k.startswith(f"{slug_label}||"))

    return BookStatsTracker(
        book_label=card_label,
        tile_index=0,
        tiles_total=1,
        pairs_total=len(owned),
        pairs_done=len(done_keys),
        categories_total=len({c for c, _ in owned}),
        workers=workers,
        worker_id=worker_id,
        pdf_on_disk=pdf_on_disk,
        checkpoint_done=ck_done,
        done_keys=done_keys,
        owned_pairs=owned,
        ui=ui,
    )


def _collect_index_tiles_js(driver: webdriver.Chrome, wait: WebDriverWait, cfg: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Read all homepage tiles in one JS pass (returns href + label).
    Avoids StaleElementReference: we never store WebElements across navigation.
    """
    css = (cfg.get("card_container_css") or "").strip() or DEFAULT_HOME_CARDS_CSS
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "section.all__laws")))
    driver.execute_script(
        "const s=document.querySelector('section.all__laws'); if(s) s.scrollIntoView({block:'start'});"
    )
    time.sleep(0.6)
    for y in range(0, 1400, 250):
        driver.execute_script("window.scrollTo(0, arguments[0]);", y)
        time.sleep(0.12)
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(0.4)

    script = r"""
        const sel = arguments[0];
        const cols = document.querySelectorAll(sel);
        const out = [];
        const seen = Object.create(null);
        cols.forEach((col) => {
          const links = col.querySelectorAll('a.btn.btn-sm.btn-block, a.btn.btn-block');
          let a = null;
          for (let i = 0; i < links.length; i++) {
            const el = links[i];
            const txt = (el.textContent || '').trim().toLowerCase();
            const lab = el.querySelector('label');
            const lt = lab ? (lab.textContent || '').trim().toLowerCase() : '';
            if (txt.includes('view') || lt.includes('view')) { a = el; break; }
          }
          if (!a || !a.href || a.href === '#') return;
          if (seen[a.href]) return;
          seen[a.href] = true;
          const h3 = col.querySelector('div.c-inner h3, h3, h4, .c-inner');
          let label = h3 ? h3.innerText.replace(/\s+/g, ' ').trim() : '';
          if (!label || label.toLowerCase() === 'view') {
            label = (col.innerText || '').replace(/\bview\b/ig, ' ').replace(/\s+/g, ' ').trim();
          }
          if (!label) label = 'card';
          out.push({ href: a.href, label: label });
        });
        return out;
    """
    raw = driver.execute_script(script, css)
    if not raw:
        return []
    return [dict(x) for x in raw]


def _selects_on_page(driver: webdriver.Chrome) -> List[Any]:
    return driver.find_elements(By.CSS_SELECTOR, "select")


def _get_two_selects(
    driver: webdriver.Chrome,
    wait: WebDriverWait,
    cfg: Dict[str, Any],
) -> Optional[Tuple[Select, Select]]:
    cat_css = cfg.get("category_select_css")
    year_css = cfg.get("year_select_css")
    cat_idx = int(cfg.get("category_select_index") or 0)
    year_idx = int(cfg.get("year_select_index") or 1)

    if cat_css:
        cat_el = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, cat_css)))
        category_select = Select(cat_el)
    else:
        selects = _selects_on_page(driver)
        if len(selects) <= max(cat_idx, year_idx):
            return None
        category_select = Select(selects[cat_idx])

    if year_css:
        year_el = driver.find_element(By.CSS_SELECTOR, year_css)
        year_select = Select(year_el)
    else:
        selects = _selects_on_page(driver)
        if len(selects) <= max(cat_idx, year_idx):
            return None
        year_select = Select(selects[year_idx])

    return category_select, year_select


def _sync_driver_wait(
    browser: Optional[BrowserSession],
    driver: webdriver.Chrome,
    wait: WebDriverWait,
    timeout: int = 25,
) -> Tuple[webdriver.Chrome, WebDriverWait]:
    """After browser restart, refresh driver + wait handles."""
    if browser is not None:
        driver = browser.get_driver()
        wait = WebDriverWait(driver, timeout)
    return driver, wait


def _safe_page_get(
    driver: webdriver.Chrome,
    url: str,
    wait: WebDriverWait,
    out_dir: Optional[Path],
    log: Optional[logging.Logger],
    *,
    retries: int = 3,
) -> None:
    """Load law page with retries; stops hung renderer loads (common with 3 Chromes open)."""
    last_err: Optional[BaseException] = None
    for attempt in range(1, retries + 1):
        try:
            driver.get(url)
            if out_dir is not None:
                _set_chrome_download_path_cdp(driver, out_dir)
            time.sleep(0.5)
            try:
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "select")))
            except Exception:
                pass
            return
        except (TimeoutException, WebDriverException) as e:
            last_err = e
            if log:
                log.warning("Page load attempt %s/%s failed: %s", attempt, retries, e)
            try:
                driver.execute_script("window.stop();")
            except Exception:
                pass
            time.sleep(2.0 * attempt)
    if last_err is not None:
        raise last_err


def _reload_law_search_form(
    driver: webdriver.Chrome,
    wait: WebDriverWait,
    law_page_url: str,
    out_dir: Optional[Path] = None,
    *,
    fast: bool = False,
    log: Optional[logging.Logger] = None,
) -> None:
    """After PDF / viewer navigation, reopen the law search page so <select>s are fresh."""
    if fast:
        try:
            driver.get(law_page_url)
            if out_dir is not None:
                _set_chrome_download_path_cdp(driver, out_dir)
            time.sleep(0.35)
        except (TimeoutException, WebDriverException):
            _safe_page_get(driver, law_page_url, wait, out_dir, log, retries=2)
        return
    _safe_page_get(driver, law_page_url, wait, out_dir, log)


def _recover_driver(
    browser: Optional[BrowserSession],
    driver: webdriver.Chrome,
    wait: WebDriverWait,
    law_page_url: str,
    out_dir: Path,
    log: Optional[logging.Logger],
    reason: str,
) -> Tuple[webdriver.Chrome, WebDriverWait]:
    if browser is not None:
        browser.on_error()
        driver = browser.maybe_restart(reason, force=True)
        driver, wait = _sync_driver_wait(browser, driver, wait)
    _reload_law_search_form(driver, wait, law_page_url, out_dir, log=log)
    return driver, wait


def _category_shard_complete(
    out_dir: Path,
    card_label: str,
    ctext: str,
    all_completed_cache: set[str],
    min_pdf_bytes: int,
    owned_pair_keys: Set[Tuple[str, str]],
) -> bool:
    """True if this worker has no pending years left in the category (skip slow reload)."""
    years = [y for c, y in owned_pair_keys if c == ctext]
    if not years:
        return True
    return all(
        _pair_done(out_dir, card_label, ctext, y, all_completed_cache, min_pdf_bytes) for y in years
    )


def _iterate_category_year(
    driver: webdriver.Chrome,
    wait: WebDriverWait,
    cfg: Dict[str, Any],
    out_dir: Path,
    card_label: str,
    tile_href: str,
    completed: set[str],
    state_path: Path,
    min_pdf_bytes: int,
    worker_id: int,
    workers: int,
    min_year: Optional[int],
    max_year: Optional[int],
    scan_progress: bool,
    browser: Optional[BrowserSession] = None,
    log: Optional[logging.Logger] = None,
    download_poll_sec: float = 0.25,
    tile_index: int = 0,
    tiles_total: int = 1,
    year_note: str = "",
    detailed_book_progress: bool = True,
    ui: Optional[ConsoleUI] = None,
    fast_plan: bool = True,
    force_book_scan: bool = False,
    use_progress_bar: bool = True,
) -> int:
    """
    On a law page: loop Category × Year using only visible text strings (no cached WebElements).
    Reloads the law page URL after each PDF attempt so the next iteration never hits stale DOM.
    """
    between_base = float(cfg.get("between_requests_seconds") or 2.0)
    post_base = float(cfg.get("post_search_wait_seconds") or 6.0)
    power_save = bool(cfg.get("_power_save"))
    between_sec, post_wait = apply_power_save_delays(between_base, post_base, power_save)
    saved = 0
    law_page_url = driver.current_url
    # Cache once per tile — avoids re-reading all checkpoint JSON every category (major speedup on resume)
    all_completed_cache = _load_all_progress(out_dir) | completed

    pair = _get_two_selects(driver, wait, cfg)
    if not pair:
        print("  [!] No category/year <select> on this tile — skipping (list pages have no filters).")
        return 0

    category_select, year_select = pair
    cat_texts = [
        o.text.strip()
        for o in category_select.options
        if o.text.strip() and "choose" not in o.text.strip().lower()
    ]

    console = ui or ConsoleUI()
    yr_note = year_note or _year_range_note(min_year, max_year)
    tracker: Optional[BookStatsTracker] = None
    owned_pair_keys: Set[Tuple[str, str]] = set()
    if detailed_book_progress:
        tracker = _plan_book_progress(
            driver,
            wait,
            cfg,
            out_dir,
            card_label,
            tile_href,
            worker_id,
            workers,
            min_year,
            max_year,
            all_completed_cache,
            min_pdf_bytes,
            console,
            verbose_scan=scan_progress,
            fast_plan=fast_plan,
            force_book_scan=force_book_scan,
        )
        tracker.tile_index = tile_index
        tracker.tiles_total = tiles_total
        tracker.use_live_bar = use_progress_bar
        tracker.started_at = SCRIPT_STARTED_AT
        tracker.render(yr_note, force=True)
        tracker.start_tqdm()
        owned_pair_keys = tracker.owned_pairs
        remaining_shard = tracker.remaining
        console.info(
            f"[worker {worker_id}] shard: {tracker.pairs_total} pairs assigned | "
            f"{tracker.pairs_done} already done | {remaining_shard} left to process"
        )
        if tracker.pairs_total == 0:
            console.warn(
                f"Worker {worker_id} owns 0 pairs — check --workers {workers} and --worker-id {worker_id} "
                "(sab tabs par --workers same hona chahiye)."
            )
        elif remaining_shard == 0:
            console.success(
                f"Worker {worker_id}: is shard ki saari PDFs pehle se maujood hain — is tab ko band kar "
                f"sakte ho; downloads worker {', '.join(str(i) for i in range(workers) if i != worker_id)} par hongi."
            )
            tracker.print_final_summary(yr_note)
            return saved
    elif scan_progress:
        tile_pairs = _collect_category_year_pairs_for_status(
            driver, wait, cfg, out_dir, min_year, max_year, quiet=False
        )
        owned_pair_keys = {
            (c, y)
            for c, y in tile_pairs
            if _worker_owns_pair(tile_href, c, y, worker_id, workers)
        }

    search_xpath = cfg.get("search_button_xpath") or "//button[contains(., 'Search')]"
    pdf_xpath = cfg.get("print_download_link_xpath") or ""

    seen_pairs: set[Tuple[str, str]] = set()
    cat_list = [
        c
        for c in cat_texts
        if not owned_pair_keys or any(cc == c for cc, _ in owned_pair_keys)
    ]
    if tracker is not None:
        tracker.categories_total = max(len(cat_list), 1)

    for cat_idx, ctext in enumerate(cat_list, start=1):
        if owned_pair_keys and _category_shard_complete(
            out_dir, card_label, ctext, all_completed_cache, min_pdf_bytes, owned_pair_keys
        ):
            if tracker is not None:
                tracker.current_category = ctext
                tracker.category_index = cat_idx
                shard_years = [y for c, y in owned_pair_keys if c == ctext]
                tracker.category_total = len(shard_years)
                tracker.category_done = len(shard_years)
                console.info(
                    f"[skip category] '{ctext}' — shard complete ({len(shard_years)} year(s), fast)"
                )
                tracker.render(yr_note)
            continue

        try:
            _reload_law_search_form(driver, wait, law_page_url, out_dir, log=log)
        except Exception as e:
            console.warn(f"Category reload failed '{ctext}': {e}")
            try:
                driver, wait = _recover_driver(
                    browser, driver, wait, law_page_url, out_dir, log, f"category: {e}"
                )
            except Exception as e2:
                console.warn(f"Recovery failed after category error: {e2}")
            continue

        pair = _get_two_selects(driver, wait, cfg)
        if not pair:
            console.warn(f"No <select> on page for category '{ctext}' — reload & skip category")
            try:
                driver, wait = _recover_driver(
                    browser, driver, wait, law_page_url, out_dir, log, "missing selects"
                )
            except Exception:
                pass
            continue
        category_select, year_select = pair
        try:
            category_select.select_by_visible_text(ctext)
        except (StaleElementReferenceException, Exception):
            continue
        time.sleep(0.5)

        pair = _get_two_selects(driver, wait, cfg)
        if not pair:
            console.warn(f"Year dropdown missing for '{ctext}' — reload & skip category")
            try:
                driver, wait = _recover_driver(
                    browser, driver, wait, law_page_url, out_dir, log, "missing year select"
                )
            except Exception:
                pass
            continue
        _, year_select = pair
        year_texts = _filtered_year_texts(year_select, min_year, max_year)
        category_owned_years = [
            y
            for y in year_texts
            if _worker_owns_pair(tile_href, ctext, y, worker_id, workers)
        ]
        category_total = len(category_owned_years)
        category_done_keys: set[str] = {
            _progress_key(card_label, ctext, y)
            for y in category_owned_years
            if _pair_done(out_dir, card_label, ctext, y, all_completed_cache, min_pdf_bytes)
        }
        if tracker is not None:
            tracker.current_category = ctext
            tracker.category_index = cat_idx
            tracker.category_total = category_total
            tracker.category_done = len(category_done_keys)
            tracker.current_pair = ctext
            if category_total > 0 and len(category_done_keys) >= category_total:
                console.info(f"[skip category] '{ctext}' — all {category_total} year(s) already downloaded")
                tracker.render(yr_note, force=True)
                continue
            console.info(f"[work] Category '{ctext}' — {category_total} year(s) for this worker")
            tracker.render(yr_note, force=True)
        else:
            print(f"  [work] {card_label}: category '{ctext}' has {len(year_texts)} eligible year(s)")
            _print_live_progress(f"{card_label} / {ctext}", len(category_done_keys), category_total)

        for ytext in year_texts:
            driver, wait = _sync_driver_wait(browser, driver, wait)
            key = (ctext, ytext)
            if key in seen_pairs:
                continue
            seen_pairs.add(key)

            if not _worker_owns_pair(tile_href, ctext, ytext, worker_id, workers):
                continue
            if owned_pair_keys and key not in owned_pair_keys:
                continue
            pkey = _progress_key(card_label, ctext, ytext)
            if tracker is not None and pkey in tracker.done_keys:
                continue

            skip, fname = _should_skip_combo(out_dir, card_label, ctext, ytext, min_pdf_bytes)
            if skip:
                if pkey not in completed:
                    completed.add(pkey)
                    _save_progress_atomic(state_path, completed)
                category_done_keys.add(pkey)
                if tracker is not None:
                    tracker.record_skip(pkey)
                    tracker.category_done = len(category_done_keys)
                    tracker.current_pair = f"{ctext} / {ytext}"
                    if tracker.skipped_this_run <= 3 or tracker.skipped_this_run % 25 == 0:
                        console.info(
                            f"[worker {worker_id} skip] {fname.name} "
                            f"({tracker.pairs_done}/{tracker.pairs_total})"
                        )
                    tracker.render(yr_note)
                    tracker.tqdm_update(1)
                else:
                    print(f"  [skip] already saved: {fname.name}")
                    _print_live_progress(
                        f"{card_label} / {ctext}", len(category_done_keys), category_total, ytext
                    )
                if browser:
                    browser.on_pair_processed()
                continue

            try:
                _reload_law_search_form(driver, wait, law_page_url, out_dir, log=log)
                pair = _get_two_selects(driver, wait, cfg)
                if not pair:
                    break
                category_select, year_select = pair
                try:
                    category_select.select_by_visible_text(ctext)
                except (StaleElementReferenceException, Exception):
                    continue
                time.sleep(0.35)
                try:
                    year_select.select_by_visible_text(ytext)
                except (StaleElementReferenceException, Exception):
                    continue
                time.sleep(0.4)

                try:
                    btn = driver.find_element(By.XPATH, search_xpath)
                    btn.click()
                except (StaleElementReferenceException, Exception):
                    console.warn(f"Search click failed for {ctext} / {ytext}")
                    if tracker is not None:
                        tracker.record_fail()
                        tracker.current_pair = f"{ctext} / {ytext}"
                        tracker.render(yr_note, force=True)
                    continue

                time.sleep(post_wait)

                since_ts = time.time()
                clicked = False
                if pdf_xpath:
                    try:
                        link = WebDriverWait(driver, 8).until(
                            EC.element_to_be_clickable((By.XPATH, pdf_xpath))
                        )
                        link.click()
                        clicked = True
                    except Exception:
                        pass
                if not clicked:
                    for partial in ("Print/Download", "Download", "PDF", "Print"):
                        try:
                            el = driver.find_element(
                                By.XPATH,
                                f"//*[self::a or self::button or self::span][contains(., '{partial}')]",
                            )
                            el.click()
                            clicked = True
                            break
                        except Exception:
                            continue

                if not clicked:
                    console.warn(f"No PDF trigger for {ctext} / {ytext}")
                    if tracker is not None:
                        tracker.record_fail()
                        tracker.current_pair = f"{ctext} / {ytext}"
                        tracker.render(yr_note, force=True)
                    _reload_law_search_form(driver, wait, law_page_url, out_dir, log=log)
                    continue

                wait_dl = float(cfg.get("download_wait_timeout_sec") or 180.0)
                _wait_download_idle(out_dir, timeout_sec=wait_dl, poll_sec=download_poll_sec)
                time.sleep(1.2)
                fname = _expected_pdf_path(out_dir, card_label, ctext, ytext)
                ok = _rename_downloaded_pdf_since(out_dir, fname, since_ts, min_pdf_bytes)
                if not ok:
                    if _try_save_pdf_via_http(driver, fname, min_pdf_bytes):
                        ok = True
                        print(f"  [i] Saved via HTTP (viewer URL): {fname.name}")
                pair_elapsed = time.time() - since_ts
                if ok:
                    pkey = _progress_key(card_label, ctext, ytext)
                    completed.add(pkey)
                    _save_progress_atomic(state_path, completed)
                    saved += 1
                    category_done_keys.add(pkey)
                    if tracker is not None:
                        tracker.record_save(pkey, pair_elapsed)
                        tracker.category_done = len(category_done_keys)
                        tracker.current_pair = f"{ctext} / {ytext}"
                        console.success(f"[worker {worker_id} +] Saved: {fname.name}")
                        tracker.render(yr_note)
                        tracker.tqdm_update(1)
                        tracker.persist_stats(out_dir)
                    else:
                        print(f"  [+] Saved: {fname.name}")
                        _print_live_progress(
                            f"{card_label} / {ctext}", len(category_done_keys), category_total, ytext
                        )
                    if browser:
                        browser.on_pair_processed()
                else:
                    console.warn(
                        f"Download incomplete for {ctext} / {ytext} "
                        f"(no new PDF ≥{min_pdf_bytes}b after {wait_dl:.0f}s)"
                    )
                    if tracker is not None:
                        tracker.record_fail()
                        tracker.current_pair = f"{ctext} / {ytext}"
                        tracker.render(yr_note, force=True)
                        tracker.persist_stats(out_dir)
                    if browser:
                        browser.on_error()

                time.sleep(between_sec)
                _reload_law_search_form(driver, wait, law_page_url, out_dir, log=log)
                if browser:
                    driver = browser.maybe_restart("after pair")
                    driver, wait = _sync_driver_wait(browser, driver, wait)
            except Exception as e:
                if log:
                    log.exception("Pair %s / %s error: %s", ctext, ytext, e)
                console.warn(
                    f"[worker {worker_id}] timeout/error on {ctext} / {ytext} — "
                    f"Chrome restart, phir agla PDF (ye pair baad mein dubara try ho sakta hai)"
                )
                if tracker is not None:
                    tracker.record_fail()
                    tracker.persist_stats(out_dir)
                try:
                    driver, wait = _recover_driver(
                        browser, driver, wait, law_page_url, out_dir, log, str(e)[:160]
                    )
                except Exception as e2:
                    console.warn(f"Recovery failed: {e2}")
                    if log:
                        log.exception("Recovery failed")
                continue

    if tracker is not None:
        tracker.persist_stats(out_dir)
        if tracker.remaining > 0:
            pending_labels: List[str] = []
            for c, y in sorted(tracker.owned_pairs):
                if _progress_key(card_label, c, y) not in tracker.done_keys:
                    pending_labels.append(f"{c} / {y}")
                if len(pending_labels) >= 5:
                    break
            if pending_labels:
                msg = f"Pending PDF(s) ({tracker.remaining}): " + "; ".join(pending_labels)
                if log:
                    log.warning("Worker %s — %s", worker_id, msg)
                console.warn(msg)
            raise ShardIncompleteError(
                tracker.remaining, worker_id, tracker.pairs_done, tracker.pairs_total
            )
        tracker.print_final_summary(yr_note)

    return saved


def _collect_category_year_pairs_for_status(
    driver: webdriver.Chrome,
    wait: WebDriverWait,
    cfg: Dict[str, Any],
    out_dir: Path,
    min_year: Optional[int],
    max_year: Optional[int],
    quiet: bool = False,
    plan_progress: bool = False,
) -> List[Tuple[str, str]]:
    """Enumerate category/year options on the current law page without downloading anything."""
    law_page_url = driver.current_url
    pair = _get_two_selects(driver, wait, cfg)
    if not pair:
        return []

    category_select, _ = pair
    cat_texts = [
        o.text.strip()
        for o in category_select.options
        if o.text.strip() and "choose" not in o.text.strip().lower()
    ]

    pairs: List[Tuple[str, str]] = []
    seen_pairs: set[Tuple[str, str]] = set()
    for ctext in cat_texts:
        _reload_law_search_form(driver, wait, law_page_url, out_dir, fast=quiet)
        pair = _get_two_selects(driver, wait, cfg)
        if not pair:
            break
        category_select, _ = pair
        try:
            category_select.select_by_visible_text(ctext)
        except (StaleElementReferenceException, Exception):
            continue
        time.sleep(0.25 if quiet else 0.5)

        pair = _get_two_selects(driver, wait, cfg)
        if not pair:
            break
        _, year_select = pair
        year_texts = _filtered_year_texts(year_select, min_year, max_year)
        if not quiet:
            print(f"  [scan] category '{ctext}' has {len(year_texts)} year option(s)")
        for ytext in year_texts:
            key = (ctext, ytext)
            if key in seen_pairs:
                continue
            seen_pairs.add(key)
            pairs.append(key)

    return pairs


def _pct(done: int, total: int) -> str:
    if total <= 0:
        return "0.0%"
    return f"{(done / total) * 100:.1f}%"


def _print_status_report(
    driver: webdriver.Chrome,
    wait: WebDriverWait,
    cfg: Dict[str, Any],
    out_dir: Path,
    tiles: List[Dict[str, str]],
    index_url: str,
    max_cards: int,
    min_pdf_bytes: int,
    worker_id: int,
    workers: int,
    min_year: Optional[int],
    max_year: Optional[int],
) -> int:
    all_completed = _load_all_progress(out_dir)
    pdf_count, pdf_bytes = _count_complete_pdfs(out_dir, min_pdf_bytes)

    total_pairs = 0
    total_done = 0
    shard_pairs = 0
    shard_done = 0

    year_note = _year_range_note(min_year, max_year)
    print(f"\nStatus scan: enumerating category/year pairs from Pakistan Code ({year_note})...")
    for i, tile in enumerate(tiles[:max_cards]):
        href = (tile.get("href") or "").strip()
        raw_label = (tile.get("label") or f"tile_{i}").strip()
        label = _card_label(raw_label, i)
        if not href:
            continue

        tile_href = urljoin(index_url, href)
        try:
            driver.get(tile_href)
            _set_chrome_download_path_cdp(driver, out_dir)
            time.sleep(2.0)
            pairs = _collect_category_year_pairs_for_status(driver, wait, cfg, out_dir, min_year, max_year)
        except Exception as e:
            print(f"  [!] Tile {i} ({label}) status error: {e}")
            pairs = []

        tile_total = len(pairs)
        tile_done = 0
        for ctext, ytext in pairs:
            pkey = _progress_key(label, ctext, ytext)
            pdf_path = _expected_pdf_path(out_dir, label, ctext, ytext)
            done = pkey in all_completed or _pdf_looks_complete(pdf_path, min_pdf_bytes)
            if done:
                tile_done += 1
                total_done += 1
            if _worker_owns_pair(tile_href, ctext, ytext, worker_id, workers):
                shard_pairs += 1
                if done:
                    shard_done += 1
        total_pairs += tile_total
        print(f"  - {label}: {tile_done}/{tile_total} done ({_pct(tile_done, tile_total)})")

    print("\n=== Scraper Status ===")
    print(f"Output folder: {out_dir}")
    print(f"Complete PDFs on disk: {pdf_count} ({pdf_bytes / (1024 * 1024):.1f} MB)")
    print(f"Checkpoint completed keys: {len(all_completed)}")
    print(f"Expected category/year pairs scanned: {total_pairs}")
    print(f"Done pairs: {total_done}/{total_pairs} ({_pct(total_done, total_pairs)})")
    print(f"Remaining pairs: {max(total_pairs - total_done, 0)}")
    if workers > 1:
        print(
            f"Current shard worker {worker_id}/{workers - 1}: "
            f"{shard_done}/{shard_pairs} done ({_pct(shard_done, shard_pairs)}), "
            f"{max(shard_pairs - shard_done, 0)} remaining"
        )
    if total_pairs == 0:
        print("[!] No pairs found. Site layout may have changed, or only tiles without filters were scanned.")
    return 0


def _set_chrome_download_path_cdp(driver: webdriver.Chrome, folder: Path) -> None:
    """Force Chrome to allow downloads into `folder` (prefs alone often fail for PDF viewer)."""
    path = str(folder.resolve()).replace("\\", "/")
    for cmd, params in (
        ("Browser.setDownloadBehavior", {"behavior": "allow", "downloadPath": path, "eventsEnabled": True}),
        ("Page.setDownloadBehavior", {"behavior": "allow", "downloadPath": path}),
    ):
        try:
            driver.execute_cdp_cmd(cmd, params)
            return
        except Exception:
            continue


def _collect_pdf_urls_from_driver(driver: webdriver.Chrome) -> List[str]:
    """Gather likely PDF URLs from current tab + any extra tabs (viewer / iframe)."""
    seen: Dict[str, None] = {}
    handles = list(driver.window_handles)
    cur = driver.current_window_handle
    for h in handles:
        try:
            driver.switch_to.window(h)
            base = driver.current_url
            if ".pdf" in urlparse(base).path.lower():
                seen[base.split("#")[0]] = None
            extra = driver.execute_script(
                r"""
                const urls = [];
                for (const t of ['iframe', 'embed', 'object']) {
                  document.querySelectorAll(t).forEach((e) => {
                    const u = e.src || e.getAttribute('data') || e.getAttribute('data-src');
                    if (u && /pdf/i.test(u)) urls.push(u);
                  });
                }
                document.querySelectorAll('a[href]').forEach((a) => {
                  const u = a.href;
                  if (u && /\.pdf/i.test(u)) urls.push(u);
                });
                return urls;
                """
            )
            if extra:
                for u in extra:
                    if u:
                        seen[urljoin(base, u)] = None
        except Exception:
            continue
    try:
        driver.switch_to.window(cur)
    except Exception:
        pass
    return list(seen.keys())


def _try_save_pdf_via_http(
    driver: webdriver.Chrome, target: Path, min_bytes: int
) -> bool:
    """
    If Chrome never wrote a file, fetch PDF bytes with the same session cookies (viewer/blob URLs won't work).
    """
    urls = _collect_pdf_urls_from_driver(driver)
    if not urls:
        return False
    cookies = {c["name"]: c["value"] for c in driver.get_cookies()}
    try:
        ua = driver.execute_script("return navigator.userAgent") or ""
    except Exception:
        ua = ""
    try:
        ref = driver.current_url or ""
    except Exception:
        ref = ""
    headers = {"User-Agent": str(ua), "Referer": ref}
    for url in sorted(urls, key=len, reverse=True):
        if not url or url.startswith("blob:"):
            continue
        try:
            r = requests.get(url, cookies=cookies, headers=headers, timeout=180)
            if r.status_code != 200:
                continue
            data = r.content
            if len(data) < min_bytes:
                continue
            ct = (r.headers.get("content-type") or "").lower()
            if b"%PDF" not in data[:2048] and "pdf" not in ct:
                continue
            target.write_bytes(data)
            return _pdf_looks_complete(target, min_bytes)
        except Exception:
            continue
    return False


def _wait_download_idle(out_dir: Path, timeout_sec: float, poll_sec: float = 0.25) -> None:
    """Wait until Chrome finishes .crdownload partial files (or timeout)."""
    deadline = time.time() + timeout_sec
    stable = 0
    poll = max(0.15, poll_sec)
    while time.time() < deadline:
        partial = list(out_dir.glob("*.crdownload"))
        if partial:
            stable = 0
            time.sleep(poll)
            continue
        time.sleep(poll)
        partial2 = list(out_dir.glob("*.crdownload"))
        if not partial2:
            stable += 1
            if stable >= 2:
                return
    print(f"  [!] Download wait timeout ({timeout_sec}s) — partial .crdownload may remain.")


def _rename_downloaded_pdf_since(
    out_dir: Path, target: Path, since_ts: float, min_bytes: int
) -> bool:
    """
    Pick the newest PDF in out_dir written *after* since_ts (avoids grabbing an old file).
    Rename to target. Return True if target exists and meets min_bytes.
    """
    skew = 2.0  # clock / FS jitter
    candidates: List[Tuple[float, Path]] = []
    for p in out_dir.glob("*.pdf"):
        try:
            st = p.stat()
        except OSError:
            continue
        if st.st_size < min_bytes:
            continue
        if st.st_mtime + skew < since_ts:
            continue
        candidates.append((st.st_mtime, p))
    if not candidates:
        return _pdf_looks_complete(target, min_bytes)
    candidates.sort(key=lambda x: x[0], reverse=True)
    latest = candidates[0][1]
    if latest.resolve() == target.resolve():
        return _pdf_looks_complete(target, min_bytes)
    try:
        if target.exists() and target.stat().st_size < min_bytes:
            try:
                target.unlink()
            except OSError:
                pass
        if not target.exists():
            latest.rename(target)
    except OSError:
        return _pdf_looks_complete(target, min_bytes)
    return _pdf_looks_complete(target, min_bytes)


def build_driver(out_dir: Path, headless: bool, runtime: Optional[RuntimeOptions] = None) -> webdriver.Chrome:
    """Backward-compatible wrapper; prefer BrowserSession in main()."""
    from scraper_runtime import build_chrome_driver

    ro = runtime or RuntimeOptions(headless=headless)
    ro.headless = headless
    return build_chrome_driver(out_dir, ro)


def main() -> int:
    parser = argparse.ArgumentParser(description="Pakistan Code PDF downloader (Selenium)")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "legal-data" / "raw-pdfs",
        help="Directory for Chrome downloads / PDFs (default: repo legal-data/raw-pdfs)",
    )
    parser.add_argument("--headless", action="store_true", help="Run Chrome headless (tiles use direct URLs)")
    parser.add_argument("--max-cards", type=int, default=12, help="Max homepage tiles to open (site has ~8)")
    parser.add_argument(
        "--law-url",
        default=None,
        help="Scrape only this direct law/book URL instead of scanning the Pakistan Code homepage tiles",
    )
    parser.add_argument(
        "--law-label",
        default="Code_of_Criminal_Procedure",
        help="Stable label used in output PDF filenames/checkpoints when --law-url is used",
    )
    parser.add_argument(
        "--status-only",
        action="store_true",
        help="Only report local/download progress against site category×year pairs; do not download PDFs",
    )
    parser.add_argument(
        "--scan-progress",
        action="store_true",
        help="Before downloading each tile, scan all category/year pairs to print exact percent (slower)",
    )
    parser.add_argument(
        "--min-pdf-bytes",
        type=int,
        default=512,
        help="Treat PDF as complete only if at least this many bytes (avoid half downloads)",
    )
    parser.add_argument(
        "--min-year",
        type=int,
        default=1947,
        help="Only process years >= this value (default: 1947; use 0 to include very old laws)",
    )
    parser.add_argument(
        "--max-year",
        type=int,
        default=None,
        help="Only process years <= this value (default: no upper limit)",
    )
    parser.add_argument(
        "--reset-progress",
        action="store_true",
        help="Delete resume state file in output folder and start fresh (does not delete PDFs)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=1,
        metavar="N",
        help="Parallel CMD tabs (optional). Default 1 = single worker, saves battery/RAM. "
        "Use 4-6 with --worker-id 0..N-1 only if you need speed.",
    )
    parser.add_argument(
        "--no-book-progress",
        action="store_true",
        help="Skip slow book plan scan — start downloading immediately (category-level % only)",
    )
    parser.add_argument(
        "--force-book-scan",
        action="store_true",
        help="Re-scan site for category×year totals (ignore plan cache)",
    )
    parser.add_argument(
        "--no-fast-plan",
        action="store_true",
        help="Disable cached book plan (always scan site before download)",
    )
    parser.add_argument(
        "--no-color",
        action="store_true",
        help="Disable colorama colored console output",
    )
    parser.add_argument(
        "--no-progress-bar",
        action="store_true",
        help="Disable tqdm progress bar",
    )
    parser.add_argument(
        "--worker-id",
        type=int,
        default=0,
        metavar="I",
        help="This process handles shard I of N (0 .. N-1); must match --workers across tabs",
    )
    parser.add_argument(
        "--power-save",
        action="store_true",
        help="Longer delays + lighter Chrome (better battery, slower scrape)",
    )
    parser.add_argument(
        "--restart-browser-every",
        type=int,
        default=80,
        help="Restart Chrome after this many processed pairs (default 80; lower if hangs)",
    )
    parser.add_argument(
        "--restart-on-ram",
        action="store_true",
        help="Also restart Chrome when system RAM is high (off by default; was causing restarts every PDF)",
    )
    parser.add_argument(
        "--memory-limit",
        type=float,
        default=95.0,
        metavar="PCT",
        help="With --restart-on-ram: restart when RAM use exceeds PCT (default 95)",
    )
    parser.add_argument(
        "--gc-every",
        type=int,
        default=5,
        help="Run garbage collection every N processed pairs",
    )
    parser.add_argument(
        "--page-timeout",
        type=int,
        default=120,
        help="Selenium page load timeout seconds (raise to 150-180 if renderer timeouts)",
    )
    parser.add_argument(
        "--selenium-timeout",
        type=int,
        default=240,
        help="WebDriver HTTP command timeout seconds (fixes Read timed out 180)",
    )
    parser.add_argument(
        "--tile-retries",
        type=int,
        default=50,
        help="Re-run book loop after crash/timeout/incomplete shard (checkpoint skips finished PDFs)",
    )
    parser.add_argument(
        "--until-complete",
        action="store_true",
        help="Keep resuming this worker's shard until 0 remaining (for CMD workers)",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Console/file log level",
    )
    parser.add_argument(
        "--no-disable-images",
        action="store_true",
        help="Load images in Chrome (slower, more battery)",
    )
    args = parser.parse_args()

    if args.workers < 1:
        print("--workers must be >= 1")
        return 2
    if args.worker_id < 0 or args.worker_id >= args.workers:
        print("ERROR: --worker-id must satisfy 0 <= worker-id < workers")
        print(f"  You used --worker-id {args.worker_id} with --workers {args.workers}")
        print("  Fix: har CMD mein SAME --workers 3 aur alag --worker-id 0, 1, 2")
        return 2
    if args.workers == 1:
        if args.worker_id != 0:
            print("Note: single-worker mode — using --worker-id 0")
        args.worker_id = 0
    if args.min_year is not None and args.min_year <= 0:
        args.min_year = None
    if args.max_year is not None and args.max_year <= 0:
        args.max_year = None
    if args.min_year is not None and args.max_year is not None and args.min_year > args.max_year:
        print("--min-year cannot be greater than --max-year")
        return 2

    ai_ml_root = Path(__file__).resolve().parents[1]
    cfg = _load_config(ai_ml_root)
    cfg.setdefault("between_requests_seconds", 2.0)
    cfg["_power_save"] = args.power_save

    out_dir: Path = args.output.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    runtime = RuntimeOptions(
        headless=args.headless,
        power_save=args.power_save,
        disable_images=not args.no_disable_images,
        page_load_timeout_sec=args.page_timeout,
        selenium_command_timeout_sec=args.selenium_timeout,
        gc_every_downloads=max(1, args.gc_every),
        restart_browser_every=max(5, args.restart_browser_every),
        restart_on_ram=args.restart_on_ram,
        memory_limit_percent=max(50.0, min(99.0, args.memory_limit)),
        download_poll_sec=0.45 if args.power_save else 0.25,
        log_level=args.log_level,
    )
    log = setup_logging(out_dir, args.worker_id, args.workers, args.log_level)
    log.info("GPU/helpers: %s", gpu_status_message())
    if args.workers > 6:
        log.warning("More than 6 workers can hang laptops — prefer 4-6 workers.")

    state_path = _state_path_for_worker(out_dir, args.worker_id, args.workers)
    _print_worker_banner(args.worker_id, args.workers, state_path)
    print(f"Output folder: {out_dir}")
    print(f"Checkpoint:    {state_path}")
    if args.reset_progress and state_path.is_file():
        state_path.unlink()
        print(f"Cleared progress file: {state_path}")

    completed = _load_progress(state_path)
    global_skip = _load_all_progress(out_dir)
    if args.workers == 1:
        print("Mode: SINGLE WORKER (default) — one Chrome, lower battery/RAM use.")
        print("Tip: for 3 parallel tabs run scripts\\run_crcp_3workers.bat (or --workers 3 --worker-id 0..2).")
    else:
        print(
            f"Mode: PARALLEL worker {args.worker_id + 1}/{args.workers} "
            f"(same --workers in every CMD; unique --worker-id per tab)."
        )
    print(
        f"Resume: {len(completed)} key(s) in this tab's checkpoint; "
        f"{len(global_skip)} total across all checkpoints; "
        f"existing PDFs ≥ {args.min_pdf_bytes} bytes are also skipped."
    )
    year_note = _year_range_note(args.min_year, args.max_year)
    print(f"Year filter: {year_note}")

    index_url = cfg.get("index_url") or "https://pakistancode.gov.pk/english/index.php"
    tiles_for_run: Optional[List[Dict[str, str]]] = None

    browser = BrowserSession(out_dir, runtime, log, _set_chrome_download_path_cdp)
    driver = browser.get_driver()
    wait = WebDriverWait(driver, 25)
    console = ConsoleUI(use_color=not args.no_color)

    total_saved = 0
    try:
        if args.law_url:
            law_href = _normalize_tile_href(args.law_url, index_url)
            tiles = [{"href": law_href, "label": args.law_label}]
            tiles_for_run = tiles
            print(f"Direct law/book URL mode: {law_href}")
            print(f"Law label: {_slug(args.law_label)}")
            if args.workers > 1:
                _print_worker_shard_summary(
                    out_dir,
                    law_href,
                    args.law_label,
                    args.workers,
                    args.worker_id,
                    args.min_year,
                    args.max_year,
                )
        else:
            print(f"Opening {index_url} …")
            driver.get(index_url)
            _set_chrome_download_path_cdp(driver, out_dir)
            time.sleep(2.0)

            tiles = _collect_index_tiles_js(driver, wait, cfg)
            if not tiles:
                print(
                    "[!] No tiles from JS. Open DevTools on section.all__laws — "
                    "set card_container_css in config if layout changed."
                )

            print(f"Found {len(tiles)} law tiles on index (cap {args.max_cards}).")
        tiles_for_run = tiles[: args.max_cards]
        if args.status_only:
            return _print_status_report(
                driver,
                wait,
                cfg,
                out_dir,
                tiles,
                index_url,
                args.max_cards,
                args.min_pdf_bytes,
                args.worker_id,
                args.workers,
                args.min_year,
                args.max_year,
            )

        run_tiles = tiles_for_run if tiles_for_run is not None else tiles[: args.max_cards]
        n_tiles = len(run_tiles)
        for i, tile in enumerate(run_tiles):
            href = (tile.get("href") or "").strip()
            raw_label = (tile.get("label") or f"tile_{i}").strip()
            label = _card_label(raw_label, i)
            if not href:
                print(f"  [-] Tile {i} has no href; skip.")
                continue
            print(f"  -> Tile {i}: {label}")
            tile_href = _normalize_tile_href(href, index_url)
            try:
                tile_attempts = 0
                max_tile_attempts = max(1, args.tile_retries)
                while tile_attempts < max_tile_attempts:
                    tile_attempts += 1
                    try:
                        if tile_attempts > 1:
                            console.warn(
                                f"Resuming tile {label} (attempt {tile_attempts}/{max_tile_attempts}) "
                                "— checkpoint/PDF skip se jahan chhoda wahan se"
                            )
                        _safe_page_get(driver, tile_href, wait, out_dir, log)
                        time.sleep(1.5)
                        driver = browser.get_driver()
                        wait = WebDriverWait(driver, 25)
                        total_saved += _iterate_category_year(
                            driver,
                            wait,
                            cfg,
                            out_dir,
                            label,
                            tile_href,
                            completed,
                            state_path,
                            args.min_pdf_bytes,
                            args.worker_id,
                            args.workers,
                            args.min_year,
                            args.max_year,
                            args.scan_progress,
                            browser,
                            log,
                            runtime.download_poll_sec,
                            tile_index=i,
                            tiles_total=n_tiles,
                            year_note=year_note,
                            detailed_book_progress=not args.no_book_progress,
                            ui=console,
                            fast_plan=not args.no_fast_plan,
                            force_book_scan=args.force_book_scan or args.scan_progress,
                            use_progress_bar=not args.no_progress_bar,
                        )
                        break
                    except ShardIncompleteError as e:
                        log.warning("Shard incomplete (attempt %s): %s", tile_attempts, e)
                        console.warn(
                            f"[worker {args.worker_id}] {e.remaining} PDF(s) baqi — "
                            f"auto-resume attempt {tile_attempts}/{max_tile_attempts}"
                        )
                        if not args.until_complete and tile_attempts >= max_tile_attempts:
                            console.warn(
                                f"Stopped after {max_tile_attempts} rounds — "
                                "dubara same command chalao ya --until-complete use karo."
                            )
                            break
                        try:
                            driver, wait = _recover_driver(
                                browser,
                                driver,
                                wait,
                                tile_href,
                                out_dir,
                                log,
                                "shard incomplete",
                            )
                        except Exception as e2:
                            console.warn(f"Recovery failed: {e2}")
                        time.sleep(5.0)
                        continue
                    except Exception as e:
                        log.exception(
                            "Tile %s (%s) error (attempt %s): %s", i, label, tile_attempts, e
                        )
                        print(f"  [!] Tile {i} ({label}) error: {e}")
                        if tile_attempts >= max_tile_attempts and not args.until_complete:
                            console.warn(
                                f"Tile stopped after {max_tile_attempts} attempts — "
                                "same command dubara chalao; resume ho jayega."
                            )
                            break
                        try:
                            driver, wait = _recover_driver(
                                browser,
                                driver,
                                wait,
                                tile_href,
                                out_dir,
                                log,
                                f"tile error: {e}",
                            )
                        except Exception as e2:
                            console.warn(f"Tile recovery failed: {e2}")
            finally:
                if not args.law_url:
                    try:
                        driver.get(index_url)
                        time.sleep(1.5)
                    except Exception:
                        pass

    finally:
        browser.close()

    elapsed = time.time() - SCRIPT_STARTED_AT
    log.info(
        "Done. saved=%s browser_restarts=%s gc_runs=%s elapsed=%.0fs",
        total_saved,
        browser.stats.browser_restarts,
        browser.stats.gc_runs,
        elapsed,
    )
    console.info(f"Done. Files in: {out_dir}")
    console.info(f"New PDFs saved this run: {total_saved}")
    console.info(f"Total script time: {elapsed:.0f}s | Stats file: {out_dir / '.book_stats.json'}")
    print(
        f"Runtime: browser restarts={browser.stats.browser_restarts}, "
        f"GC runs={browser.stats.gc_runs}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
