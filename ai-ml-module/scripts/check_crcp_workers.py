"""Show how much each CRPC parallel worker still has left."""
import json
import sys
import zlib
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from download_pakistan_code_pdfs import _load_all_progress, _pair_done  # noqa: E402

out = Path(__file__).resolve().parents[2] / "legal-data" / "raw-pdfs"
cache = json.loads(
    (out / ".book_plan_cache_Code_of_Criminal_Procedure.json").read_text(encoding="utf-8")
)
url = (cache.get("tile_href") or "").rstrip("/")
pairs = [(p[0], p[1]) for p in cache["pairs"]]
label = "Code_of_Criminal_Procedure"
done_all = _load_all_progress(out)
workers = 3


def owns(wid: int, c: str, y: str) -> bool:
    token = f"{url}\0{c}\0{y}"
    return (zlib.crc32(token.encode()) & 0xFFFFFFFF) % workers == wid


print(f"Total plan pairs: {len(pairs)}")
print(f"PDFs on disk (CRPC): {len(list(out.glob('Code_of_Criminal_Procedure__*.pdf')))}")
print(f"All checkpoint keys: {len(done_all)}")
print()
total_remaining = 0
for wid in range(workers):
    owned = [(c, y) for c, y in pairs if owns(wid, c, y)]
    done = sum(1 for c, y in owned if _pair_done(out, label, c, y, done_all, 512))
    rem = len(owned) - done
    total_remaining += rem
    ck = out / f".pakistan_code_scraper_state.worker-{wid}.json"
    ck_n = (
        len(json.loads(ck.read_text(encoding="utf-8")).get("completed_keys", []))
        if ck.is_file()
        else 0
    )
    print(
        f"Worker {wid}: shard={len(owned)} done={done} remaining={rem} "
        f"(checkpoint keys in worker file: {ck_n})"
    )
print(f"\nAll workers combined remaining: ~{total_remaining} PDFs")
