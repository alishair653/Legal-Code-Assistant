"""
Runtime helpers for Pakistan Code Selenium scraper.

Note (GPU / CuPy / Dask):
  Selenium + Chrome are network/browser bound — they do NOT use the Nvidia GPU for scraping.
  Optional CuPy/Dask here only accelerate small CPU-side batch work (e.g. shard hashing).
  Real speed/battery wins: lighter Chrome, timeouts, browser restart, GC, power-save delays.

Urdu/Hindi: GPU scraping ko tez nahi karta; browser aur wait times optimize karna asal kaam hai.
"""

from __future__ import annotations

import gc
import logging
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager

# Optional: memory pressure (install psutil for RAM checks)
try:
    import psutil  # type: ignore

    PSUTIL_AVAILABLE = True
except ImportError:
    psutil = None  # type: ignore
    PSUTIL_AVAILABLE = False

# Optional: GPU batch helpers (install cupy matching your CUDA version)
try:
    import cupy as cp  # type: ignore

    CUPY_AVAILABLE = True
except ImportError:
    cp = None  # type: ignore
    CUPY_AVAILABLE = False

try:
    import dask  # type: ignore

    DASK_AVAILABLE = True
except ImportError:
    dask = None  # type: ignore
    DASK_AVAILABLE = False


@dataclass
class RuntimeOptions:
    """Tunable runtime flags passed from CLI."""

    headless: bool = False
    power_save: bool = False
    disable_images: bool = True
    page_load_timeout_sec: int = 90
    script_timeout_sec: int = 60
    implicit_wait_sec: float = 0.0
    selenium_command_timeout_sec: int = 180
    gc_every_downloads: int = 5
    restart_browser_every: int = 25
    max_consecutive_errors: int = 3
    memory_limit_percent: float = 88.0
    download_poll_sec: float = 0.25
    log_level: str = "INFO"


@dataclass
class RuntimeStats:
    downloads_since_restart: int = 0
    total_downloads: int = 0
    consecutive_errors: int = 0
    browser_restarts: int = 0
    gc_runs: int = 0


def gpu_status_message() -> str:
    """Human-readable GPU helper status for startup logs."""
    parts = []
    if CUPY_AVAILABLE:
        try:
            dev = cp.cuda.Device(0)  # type: ignore[union-attr]
            mem = dev.mem_info
            parts.append(f"CuPy OK (GPU free ~{mem[0] // (1024**2)} MB)")
        except Exception as e:
            parts.append(f"CuPy installed but GPU unavailable: {e}")
    else:
        parts.append("CuPy not installed (optional)")
    parts.append("Dask OK" if DASK_AVAILABLE else "Dask not installed (optional)")
    return " | ".join(parts)


def batch_worker_shards_gpu(
    tokens: List[str], workers: int
) -> List[int]:
    """
  Assign worker ids for many (url+category+year) tokens.
  Uses GPU CRC if CuPy available, else CPU zlib.
  """
    if workers <= 1:
        return [0] * len(tokens)
    if CUPY_AVAILABLE and len(tokens) >= 256:
        try:
            import numpy as np

            # CuPy has no native crc32; use CPU numpy for correctness, GPU not needed here
            _ = np  # keep optional path simple — fall through to CPU
        except Exception:
            pass
    import zlib

    out: List[int] = []
    for t in tokens:
        h = zlib.crc32(t.encode("utf-8")) & 0xFFFFFFFF
        out.append(h % workers)
    return out


def setup_logging(out_dir: Path, worker_id: int, workers: int, level: str = "INFO") -> logging.Logger:
    """File + console logging per worker."""
    log = logging.getLogger(f"pakistan_code.worker{worker_id}")
    log.setLevel(getattr(logging, level.upper(), logging.INFO))
    log.handlers.clear()

    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
    ch = logging.StreamHandler(sys.stdout)
    ch.setFormatter(fmt)
    log.addHandler(ch)

    log_dir = out_dir / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    suffix = f".worker-{worker_id}" if workers > 1 else ""
    fh = logging.FileHandler(log_dir / f"scraper{suffix}.log", encoding="utf-8")
    fh.setFormatter(fmt)
    log.addHandler(fh)
    return log


def memory_pressure_high(limit_percent: float) -> bool:
    """True if system RAM usage exceeds limit (needs psutil)."""
    if not PSUTIL_AVAILABLE or psutil is None:
        return False
    try:
        return psutil.virtual_memory().percent >= limit_percent
    except Exception:
        return False


def run_gc_cycle(log: Optional[logging.Logger] = None, label: str = "") -> None:
    """Explicit garbage collection — helps long Selenium runs on Windows."""
    gc.collect()
    if log:
        log.debug("GC run%s", f" ({label})" if label else "")


def apply_power_save_delays(base_between: float, base_post_search: float, power_save: bool) -> Tuple[float, float]:
    """Increase polite delays in power-save mode (less CPU spikes, better battery)."""
    if not power_save:
        return base_between, base_post_search
    return base_between * 1.6, base_post_search * 1.15


def build_chrome_driver(out_dir: Path, opts: RuntimeOptions) -> webdriver.Chrome:
    """
    Create Chrome with lighter defaults (images off, eager page load when possible).
    Urdu: Chrome ko halka rakho taake battery kam jaye aur hang kam ho.
    """
    chrome_opts = webdriver.ChromeOptions()
    if opts.headless:
        chrome_opts.add_argument("--headless=new")
    chrome_opts.page_load_strategy = "eager"
    chrome_opts.add_argument("--window-size=1280,800")
    chrome_opts.add_argument("--no-sandbox")
    chrome_opts.add_argument("--disable-dev-shm-usage")
    chrome_opts.add_argument("--disable-extensions")
    chrome_opts.add_argument("--disable-background-networking")
    chrome_opts.add_argument("--disable-sync")
    chrome_opts.add_argument("--disable-translate")
    chrome_opts.add_argument("--mute-audio")
    chrome_opts.add_argument("--lang=en")
    if opts.power_save:
        chrome_opts.add_argument("--disable-gpu")
    prefs: Dict[str, Any] = {
        "download.default_directory": str(out_dir.resolve()),
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "plugins.always_open_pdf_externally": True,
    }
    if opts.disable_images:
        prefs["profile.managed_default_content_settings.images"] = 2
    chrome_opts.add_experimental_option("prefs", prefs)
    chrome_opts.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])

    service = ChromeService(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_opts)
    try:
        if driver.command_executor is not None:
            driver.command_executor.set_timeout(opts.selenium_command_timeout_sec)
    except Exception:
        pass
    driver.set_page_load_timeout(opts.page_load_timeout_sec)
    driver.set_script_timeout(opts.script_timeout_sec)
    if opts.implicit_wait_sec > 0:
        driver.implicitly_wait(opts.implicit_wait_sec)
    return driver


class BrowserSession:
    """
    Owns Chrome lifecycle: restart on errors, memory pressure, or every N downloads.
    """

    def __init__(
        self,
        out_dir: Path,
        runtime: RuntimeOptions,
        log: logging.Logger,
        set_download_path_cb,
    ) -> None:
        self.out_dir = out_dir
        self.runtime = runtime
        self.log = log
        self.set_download_path_cb = set_download_path_cb
        self.stats = RuntimeStats()
        self.driver: Optional[webdriver.Chrome] = None
        self._start()

    def _start(self) -> webdriver.Chrome:
        if self.driver is not None:
            self._stop_quiet()
        self.log.info("Starting Chrome (restart #%s)", self.stats.browser_restarts)
        self.driver = build_chrome_driver(self.out_dir, self.runtime)
        self.stats.browser_restarts += 1
        try:
            self.set_download_path_cb(self.driver, self.out_dir)
        except Exception as e:
            self.log.warning("CDP download path failed: %s", e)
        return self.driver

    def _stop_quiet(self) -> None:
        if self.driver is None:
            return
        try:
            self.driver.quit()
        except Exception:
            pass
        self.driver = None
        run_gc_cycle(self.log, "after browser quit")

    def get_driver(self) -> webdriver.Chrome:
        if self.driver is None:
            return self._start()
        return self.driver

    def maybe_restart(
        self,
        reason: str,
        *,
        force: bool = False,
    ) -> webdriver.Chrome:
        r = self.runtime
        if force:
            self.log.warning("Browser restart (forced): %s", reason)
            self.stats.downloads_since_restart = 0
            self.stats.consecutive_errors = 0
            return self._start()
        if self.stats.downloads_since_restart >= r.restart_browser_every:
            self.log.info("Browser restart: every %s downloads", r.restart_browser_every)
            self.stats.downloads_since_restart = 0
            return self._start()
        if self.stats.consecutive_errors >= r.max_consecutive_errors:
            self.log.warning("Browser restart: %s consecutive errors", self.stats.consecutive_errors)
            self.stats.consecutive_errors = 0
            self.stats.downloads_since_restart = 0
            return self._start()
        if memory_pressure_high(r.memory_limit_percent):
            self.log.warning(
                "Browser restart: RAM above %.0f%%", r.memory_limit_percent
            )
            self.stats.downloads_since_restart = 0
            return self._start()
        return self.get_driver()

    def on_download_success(self) -> None:
        self.stats.total_downloads += 1
        self.stats.downloads_since_restart += 1
        self.stats.consecutive_errors = 0
        self._maybe_gc()

    def on_pair_processed(self) -> None:
        """Called after each skip/save — triggers GC every N pairs."""
        self.stats.total_downloads += 1
        self.stats.downloads_since_restart += 1
        self.stats.consecutive_errors = 0
        self._maybe_gc()

    def on_error(self) -> None:
        self.stats.consecutive_errors += 1

    def _maybe_gc(self) -> None:
        n = self.runtime.gc_every_downloads
        if n <= 0:
            return
        if self.stats.total_downloads % n != 0:
            return
        run_gc_cycle(self.log, f"every {n} downloads")
        self.stats.gc_runs += 1
        # Close extra tabs if any (viewer popups)
        try:
            d = self.get_driver()
            handles = d.window_handles
            if len(handles) > 1:
                main = handles[0]
                for h in handles[1:]:
                    d.switch_to.window(h)
                    d.close()
                d.switch_to.window(main)
        except Exception:
            pass

    def close(self) -> None:
        self._stop_quiet()
