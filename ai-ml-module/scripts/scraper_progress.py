"""
Book-level progress, timing, live display, and .book_stats.json for Pakistan Code scraper.

Urdu/Hindi note:
  - Selenium scraping GPU se tez nahi hoti; fast resume = purani PDF/checkpoint skip + plan cache.
  - Total PDFs pehli dafa site scan se (ya cache se); dubara run par scan skip ho sakta hai.
"""

from __future__ import annotations

import json
import sys
import time
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Deque, Dict, List, Optional, Set, Tuple

try:
    from colorama import Fore, Style, init as colorama_init

    colorama_init(autoreset=True)
    COLORAMA_OK = True
except ImportError:
    COLORAMA_OK = False
    Fore = Style = None  # type: ignore

try:
    from tqdm import tqdm

    TQDM_OK = True
except ImportError:
    tqdm = None  # type: ignore
    TQDM_OK = False

BOOK_STATS_FILE = ".book_stats.json"
BOOK_PLAN_CACHE_PREFIX = ".book_plan_cache_"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _pct(done: int, total: int) -> str:
    if total <= 0:
        return "0.0%"
    return f"{(done / total) * 100:.1f}%"


def _fmt_duration(seconds: float) -> str:
    if seconds < 0 or seconds != seconds:
        return "?"
    s = int(seconds)
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    if h:
        return f"{h}h {m}m {sec}s"
    if m:
        return f"{m}m {sec}s"
    return f"{sec}s"


def _ansi(code: str, text: str, enabled: bool) -> str:
    if not enabled or not COLORAMA_OK or code is None:
        return text
    return f"{code}{text}{Style.RESET_ALL}"


class ConsoleUI:
    """Colored console lines (optional colorama)."""

    def __init__(self, use_color: bool = True) -> None:
        self.use_color = use_color and COLORAMA_OK

    def success(self, msg: str) -> None:
        print(_ansi(Fore.GREEN, msg, self.use_color))

    def error(self, msg: str) -> None:
        print(_ansi(Fore.RED, msg, self.use_color))

    def warn(self, msg: str) -> None:
        print(_ansi(Fore.YELLOW, msg, self.use_color))

    def info(self, msg: str) -> None:
        print(_ansi(Fore.CYAN, msg, self.use_color))


def load_book_stats(out_dir: Path) -> Dict[str, Any]:
    path = out_dir / BOOK_STATS_FILE
    if not path.is_file():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def save_book_stats(out_dir: Path, stats: Dict[str, Any]) -> None:
    path = out_dir / BOOK_STATS_FILE
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(stats, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.replace(path)


def book_plan_cache_path(out_dir: Path, book_label: str) -> Path:
    safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in book_label)[:80]
    return out_dir / f"{BOOK_PLAN_CACHE_PREFIX}{safe}.json"


def load_book_plan_cache(
    out_dir: Path,
    book_label: str,
    tile_href: str,
    min_year: Optional[int],
    max_year: Optional[int],
) -> Optional[List[Tuple[str, str]]]:
    path = book_plan_cache_path(out_dir, book_label)
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("tile_href") != tile_href:
            return None
        if data.get("min_year") != min_year or data.get("max_year") != max_year:
            return None
        pairs = data.get("pairs") or []
        return [(p[0], p[1]) for p in pairs if len(p) >= 2]
    except (json.JSONDecodeError, OSError, TypeError):
        return None


def save_book_plan_cache(
    out_dir: Path,
    book_label: str,
    tile_href: str,
    min_year: Optional[int],
    max_year: Optional[int],
    pairs: List[Tuple[str, str]],
) -> None:
    path = book_plan_cache_path(out_dir, book_label)
    payload = {
        "book_label": book_label,
        "tile_href": tile_href,
        "min_year": min_year,
        "max_year": max_year,
        "pairs": [[c, y] for c, y in pairs],
        "cached_at": _utc_now_iso(),
    }
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.replace(path)


def count_pdfs_for_book(out_dir: Path, book_label: str, min_pdf_bytes: int) -> int:
    n = 0
    prefix = book_label + "__"
    for p in out_dir.glob(f"{prefix}*.pdf"):
        try:
            if p.stat().st_size >= min_pdf_bytes:
                n += 1
        except OSError:
            pass
    return n


@dataclass
class BookStatsTracker:
    """Rolling timing + totals for one book/tile (per worker shard)."""

    book_label: str
    tile_index: int
    tiles_total: int
    pairs_total: int
    pairs_done: int
    workers: int = 1
    worker_id: int = 0
    pdf_on_disk: int = 0
    checkpoint_done: int = 0
    failed: int = 0
    saved_this_run: int = 0
    skipped_this_run: int = 0
    started_at: float = field(default_factory=time.time)
    book_started_at: float = field(default_factory=time.time)
    recent_download_times: Deque[float] = field(default_factory=lambda: deque(maxlen=10))
    done_keys: Set[str] = field(default_factory=set)
    owned_pairs: Set[Tuple[str, str]] = field(default_factory=set)
    categories_total: int = 0
    category_index: int = 0
    current_category: str = ""
    current_pair: str = ""
    category_done: int = 0
    category_total: int = 0
    status: str = "in_progress"
    ui: ConsoleUI = field(default_factory=ConsoleUI)
    use_live_bar: bool = True
    _tqdm_bar: Any = field(default=None, repr=False)
    _last_render: float = 0.0

    @property
    def remaining(self) -> int:
        return max(self.pairs_total - self.pairs_done, 0)

    @property
    def elapsed_script(self) -> float:
        return time.time() - self.started_at

    @property
    def elapsed_book(self) -> float:
        return time.time() - self.book_started_at

    @property
    def avg_time_per_pdf(self) -> Optional[float]:
        if not self.recent_download_times:
            return None
        return sum(self.recent_download_times) / len(self.recent_download_times)

    @property
    def eta_seconds(self) -> Optional[float]:
        avg = self.avg_time_per_pdf
        if avg is None or self.remaining <= 0:
            return None
        return avg * self.remaining

    def mode_label(self) -> str:
        if self.workers <= 1:
            return "single worker (default)"
        return f"parallel worker {self.worker_id + 1} of {self.workers}"

    def mark_done(self, pkey: str) -> None:
        if pkey not in self.done_keys:
            self.done_keys.add(pkey)
        self.pairs_done = len(self.done_keys)

    def record_skip(self, pkey: str) -> None:
        self.mark_done(pkey)
        self.skipped_this_run += 1

    def record_save(self, pkey: str, duration_sec: float) -> None:
        self.mark_done(pkey)
        self.saved_this_run += 1
        if duration_sec > 0:
            self.recent_download_times.append(duration_sec)

    def record_fail(self) -> None:
        self.failed += 1

    def progress_bar(self, width: int = 36) -> str:
        if self.pairs_total <= 0:
            return "[" + " " * width + "]"
        frac = min(1.0, self.pairs_done / self.pairs_total)
        filled = int(width * frac)
        return "[" + "#" * filled + "-" * (width - filled) + "]"

    def lines(self, year_note: str) -> List[str]:
        avg = self.avg_time_per_pdf
        eta = self.eta_seconds
        lines = [
            "=" * 62,
            f"BOOK: {self.book_label}  ({self.tile_index + 1}/{self.tiles_total})  [{self.mode_label()}]",
            f"Years: {year_note}  |  PDFs on disk: {self.pdf_on_disk}  |  Checkpoint keys: {self.checkpoint_done}",
            self.progress_bar()
            + f"  {self.pairs_done}/{self.pairs_total} ({_pct(self.pairs_done, self.pairs_total)})"
            + f"  |  remaining: {self.remaining}",
        ]
        if self.current_category:
            lines.append(
                f"Category ({self.category_index}/{self.categories_total}): {self.current_category} "
                f"— {self.category_done}/{self.category_total} ({_pct(self.category_done, max(self.category_total, 1))})"
            )
        if self.current_pair:
            lines.append(f"Current: {self.current_pair}")
        timing = (
            f"Elapsed: {_fmt_duration(self.elapsed_book)} (book) / {_fmt_duration(self.elapsed_script)} (script)"
        )
        if avg is not None:
            timing += f"  |  avg last {len(self.recent_download_times)} PDFs: {avg:.1f}s"
        if eta is not None:
            timing += f"  |  ETA: ~{_fmt_duration(eta)}"
        lines.append(timing)
        lines.append(
            f"This run: saved={self.saved_this_run} skipped={self.skipped_this_run} failed={self.failed}"
        )
        lines.append("=" * 62)
        return lines

    def tqdm_refresh(self, year_note: str) -> None:
        """Update tqdm bar only (no multi-line block — avoids RAM/scroll churn)."""
        if not self.use_live_bar or not TQDM_OK or self._tqdm_bar is None:
            return
        desc = f"{self.book_label} {self.pairs_done}/{self.pairs_total}"
        if self.current_category:
            desc += f" | {self.current_category[:28]}"
        self._tqdm_bar.set_description_str(desc[:72], refresh=False)
        post_parts = [f"saved={self.saved_this_run}", f"fail={self.failed}"]
        if self.current_pair:
            post_parts.append(self.current_pair[:40])
        eta = self.eta_seconds
        if eta is not None:
            post_parts.append(f"ETA~{_fmt_duration(eta)}")
        self._tqdm_bar.set_postfix_str(" | ".join(post_parts), refresh=True)

    def render(self, year_note: str, force: bool = False, min_interval: float = 0.8) -> None:
        now = time.time()
        if not force and (now - self._last_render) < min_interval:
            return
        self._last_render = now
        if self.use_live_bar and TQDM_OK and self._tqdm_bar is not None:
            self.tqdm_refresh(year_note)
            return
        block = "\n".join(self.lines(year_note))
        if sys.stdout.isatty():
            # Move up and overwrite previous block (approx 10 lines)
            sys.stdout.write("\033[10A\033[J")
            sys.stdout.write(block + "\n")
            sys.stdout.flush()
        else:
            print(block)

    def start_tqdm(self) -> None:
        if not self.use_live_bar or not TQDM_OK or self.pairs_total <= 0:
            return
        self._tqdm_bar = tqdm(
            total=self.pairs_total,
            initial=self.pairs_done,
            desc=self.book_label[:40],
            unit="pdf",
            dynamic_ncols=True,
        )

    def tqdm_update(self, n: int = 1) -> None:
        if self._tqdm_bar is not None:
            self._tqdm_bar.update(n)

    def close_tqdm(self) -> None:
        if self._tqdm_bar is not None:
            self._tqdm_bar.close()
            self._tqdm_bar = None

    def to_stats_entry(self) -> Dict[str, Any]:
        avg = self.avg_time_per_pdf
        return {
            "total_pdfs": self.pairs_total,
            "downloaded": self.pairs_done,
            "failed": self.failed,
            "pdfs_on_disk": self.pdf_on_disk,
            "total_time_seconds": round(self.elapsed_book, 1),
            "average_time_per_pdf": round(avg, 2) if avg is not None else None,
            "last_updated": _utc_now_iso(),
            "status": self.status,
            "worker_id": self.worker_id,
            "workers": self.workers,
        }

    def persist_stats(self, out_dir: Path) -> None:
        all_stats = load_book_stats(out_dir)
        key = self.book_label
        if self.workers > 1:
            key = f"{self.book_label}__worker_{self.worker_id}"
        all_stats[key] = self.to_stats_entry()
        save_book_stats(out_dir, all_stats)

    def print_final_summary(self, year_note: str) -> None:
        self.close_tqdm()
        if self.pairs_total > 0 and self.pairs_done >= self.pairs_total:
            self.status = "complete"
            self.ui.success(f"BOOK COMPLETE: {self.book_label}")
        else:
            self.status = "stopped"
            self.ui.warn(f"BOOK STOPPED (resume possible): {self.book_label}")
        print("\n" + "\n".join(self.lines(year_note)))
        print(
            f"Summary: total={self.pairs_total} done={self.pairs_done} remaining={self.remaining} "
            f"failed={self.failed} | run saved={self.saved_this_run} skipped={self.skipped_this_run}"
        )
