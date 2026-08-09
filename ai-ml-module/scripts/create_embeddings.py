"""
Step 5: Embed legal sections and upload to Qdrant Cloud.

Usage:
  cd ai-ml-module
  pip install -r requirements-embeddings.txt
  copy scripts\\.env.example scripts\\.env   # add QDRANT_URL + QDRANT_API_KEY

  python scripts/create_embeddings.py --status-only
  python scripts/create_embeddings.py --limit 50          # smoke test
  python scripts/create_embeddings.py                     # full upload (resume)
  python scripts/create_embeddings.py --recreate          # drop collection, start over
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models as qm
from qdrant_client.http.exceptions import UnexpectedResponse
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

AI_ML_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = AI_ML_ROOT.parent
DEFAULT_INPUT = REPO_ROOT / "legal-data" / "processed" / "all_legal_data.json"
CHECKPOINT_PATH = REPO_ROOT / "legal-data" / "processed" / ".embeddings_progress.json"

COLLECTION_NAME = "legal_sections"
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
VECTOR_SIZE = 384
DEFAULT_BATCH_SIZE = 100
MAX_EMBED_CHARS = 8000
MAX_PAYLOAD_TEXT = 12000
MAX_RETRIES = 3


def load_env() -> Optional[str]:
    """Load Qdrant credentials from scripts/.env, ai-ml-module/.env, or frontend/.env.local."""
    candidates = [
        Path(__file__).resolve().parent / ".env",
        AI_ML_ROOT / ".env",
        REPO_ROOT / "frontend" / ".env.local",
        REPO_ROOT / ".env",
    ]
    loaded_from: Optional[str] = None
    for path in candidates:
        if path.is_file():
            load_dotenv(path, override=False)
            if loaded_from is None:
                loaded_from = str(path)
    return loaded_from


def normalize_qdrant_url(url: str) -> str:
    """Fix common copy-paste mistakes from Qdrant Cloud dashboard."""
    url = url.strip().strip('"').strip("'")
    if not url:
        return url
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    # Browser / console URLs are not API endpoints
    for marker in ("/dashboard", "/clusters/", "/cluster/", "/login"):
        if marker in url:
            url = url.split(marker)[0]
    return url.rstrip("/")


def _url_has_port(url: str) -> bool:
    """True if URL already specifies a port (e.g. :6333)."""
    rest = url.split("://", 1)[-1]
    host_part = rest.split("/")[0]
    return ":" in host_part


def qdrant_url_candidates(url: str) -> List[str]:
    """
    Qdrant Cloud REST API usually needs :6333 (PyPI docs).
    Try with and without port.
    """
    url = normalize_qdrant_url(url)
    custom_port = (os.getenv("QDRANT_PORT") or "").strip()
    candidates: List[str] = []

    if custom_port:
        base = url if _url_has_port(url) else f"{url}:{custom_port}"
        candidates.append(base)

    if _url_has_port(url):
        candidates.append(url)
    else:
        candidates.append(url)
        if "cloud.qdrant.io" in url.lower():
            candidates.append(f"{url}:6333")

    # de-dupe, preserve order
    seen: set[str] = set()
    out: List[str] = []
    for u in candidates:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def print_qdrant_url_help(url: str, tried: List[str], err: Optional[BaseException] = None) -> None:
    lines = [
        "",
        "=" * 60,
        "QDRANT CONNECTION FAILED",
        "=" * 60,
    ]
    if err:
        lines.append(f"Error: {err}")
    lines.append(f"\nBase URL: {url or '(empty)'}")
    if tried:
        lines.append("Tried:")
        for u in tried:
            lines.append(f"  - {u}")
    lines.extend(
        [
            "",
            "Fix in frontend/.env.local (Cluster -> Access tab):",
            "  QDRANT_URL=https://17a625ae-3f23-4624-8b06-7ee7d76a3be0.us-east4-0.gcp.cloud.qdrant.io:6333",
            "  QDRANT_API_KEY=<full API key, no quotes>",
            "",
            "Check:",
            "  - cloud.qdrant.io -> cluster shows Running (not Creating/Paused)",
            "  - Access tab -> COPY buttons for URL + NEW API key (not browser JWT)",
            "  - Hostname must match dashboard exactly (region e.g. us-east4-0)",
            "  - Run: python scripts/test_qdrant_connection.py",
            "  - Optional: QDRANT_PORT=6333",
            "=" * 60,
            "",
        ]
    )
    print("\n".join(lines))


def create_qdrant_client(url: str, key: str) -> QdrantClient:
    if not key or key.lower() in ("your_qdrant_api_key_here", "paste_api_key_here"):
        print("[!] QDRANT_API_KEY is missing or still a placeholder.")
        sys.exit(2)

    if "cloud.qdrant.io" in url.lower() and "clusters" in url.lower():
        print_qdrant_url_help(url, [])
        sys.exit(2)

    tried: List[str] = []
    last_err: Optional[BaseException] = None

    for candidate in qdrant_url_candidates(url):
        tried.append(candidate)
        try:
            print(f"[*] Trying {candidate} ...")
            client = QdrantClient(
                url=candidate,
                api_key=key,
                timeout=120,
                prefer_grpc=False,
                check_compatibility=False,
            )
            client.get_collections()
            print(f"[+] Connected via {candidate}")
            return client
        except UnexpectedResponse as e:
            last_err = e
            code = getattr(e, "status_code", None)
            if code == 401:
                print("[!] API key rejected (401). Create a new key in Qdrant Cloud -> Access.")
                sys.exit(2)
            if code == 403:
                print("[!] Forbidden (403). Check API key permissions.")
                sys.exit(2)
            continue
        except Exception as e:
            last_err = e
            continue

    print_qdrant_url_help(url, tried, last_err)
    sys.exit(2)


def require_env() -> Tuple[str, str]:
    url = (os.getenv("QDRANT_URL") or "").strip()
    key = (os.getenv("QDRANT_API_KEY") or "").strip()
    if not url or not key:
        print(
            "[!] Set QDRANT_URL and QDRANT_API_KEY in one of:\n"
            "    ai-ml-module/scripts/.env\n"
            "    ai-ml-module/.env\n"
            "    frontend/.env.local"
        )
        sys.exit(2)
    return normalize_qdrant_url(url), key


def load_sections(path: Path) -> List[Dict[str, Any]]:
    if not path.is_file():
        print(f"[!] Input not found: {path}")
        sys.exit(1)
    print(f"[*] Loading {path} ...")
    data = json.loads(path.read_text(encoding="utf-8"))
    sections = data.get("sections") or []
    if not sections:
        print("[!] No sections in JSON.")
        sys.exit(1)
    valid: List[Dict[str, Any]] = []
    for i, sec in enumerate(sections):
        if sec.get("error"):
            continue
        text = (sec.get("text") or "").strip()
        title = (sec.get("title") or "").strip()
        if not text and not title:
            continue
        valid.append(sec)
    print(f"[+] Loaded {len(sections)} rows, {len(valid)} valid for embedding")
    return valid


def load_checkpoint() -> Dict[str, Any]:
    if not CHECKPOINT_PATH.is_file():
        return {"version": 1, "uploaded_count": 0, "collection": COLLECTION_NAME}
    try:
        return json.loads(CHECKPOINT_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"version": 1, "uploaded_count": 0, "collection": COLLECTION_NAME}


def save_checkpoint(state: Dict[str, Any]) -> None:
    CHECKPOINT_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = CHECKPOINT_PATH.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.replace(CHECKPOINT_PATH)


def embed_text(sec: Dict[str, Any]) -> str:
    title = (sec.get("title") or "").strip()
    body = (sec.get("text") or "").strip()
    combined = f"{title}\n\n{body}".strip() if title else body
    if len(combined) > MAX_EMBED_CHARS:
        combined = combined[:MAX_EMBED_CHARS]
    return combined


def build_payload(sec: Dict[str, Any], point_index: int) -> Dict[str, Any]:
    text = (sec.get("text") or "").strip()
    if len(text) > MAX_PAYLOAD_TEXT:
        text = text[:MAX_PAYLOAD_TEXT]
    return {
        "point_index": point_index,
        "id": sec.get("id") or f"sec-{point_index}",
        "section_number": sec.get("section_number") or "",
        "title": (sec.get("title") or "")[:500],
        "text": text,
        "statute": sec.get("statute") or "",
        "full_reference": sec.get("full_reference") or "",
        "book_label": sec.get("book_label") or "",
        "category": sec.get("category") or "",
        "year": sec.get("year") or "",
        "source_file": sec.get("source_file") or "",
        "folder": sec.get("folder") or "",
        "part": sec.get("part", 1),
    }


def ensure_collection(client: QdrantClient, recreate: bool) -> None:
    exists = client.collection_exists(COLLECTION_NAME)
    if recreate and exists:
        print(f"[*] Deleting collection '{COLLECTION_NAME}' ...")
        client.delete_collection(COLLECTION_NAME)
        exists = False

    if not exists:
        print(f"[*] Creating collection '{COLLECTION_NAME}' (size={VECTOR_SIZE}, cosine) ...")
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=qm.VectorParams(size=VECTOR_SIZE, distance=qm.Distance.COSINE),
        )
    else:
        info = client.get_collection(COLLECTION_NAME)
        print(f"[+] Collection exists — points: {info.points_count}")


def resolve_start_index(
    client: QdrantClient,
    checkpoint: Dict[str, Any],
    total: int,
    recreate: bool,
) -> int:
    if recreate:
        return 0
    ck = int(checkpoint.get("uploaded_count") or 0)
    if client.collection_exists(COLLECTION_NAME):
        try:
            info = client.get_collection(COLLECTION_NAME)
            remote = int(info.points_count or 0)
            start = min(max(ck, remote), total)
            if start > 0:
                print(f"[+] Resume from index {start} (checkpoint={ck}, qdrant={remote})")
            return start
        except Exception:
            pass
    return ck


def upload_batch(
    client: QdrantClient,
    model: SentenceTransformer,
    sections: List[Dict[str, Any]],
    start_idx: int,
    batch_size: int,
) -> int:
    end_idx = min(start_idx + batch_size, len(sections))
    batch = sections[start_idx:end_idx]
    if not batch:
        return start_idx

    texts = [embed_text(s) for s in batch]
    vectors = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)

    points: List[qm.PointStruct] = []
    for i, (sec, vec) in enumerate(zip(batch, vectors)):
        point_id = start_idx + i
        points.append(
            qm.PointStruct(
                id=point_id,
                vector=vec.tolist(),
                payload=build_payload(sec, point_id),
            )
        )

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            client.upsert(collection_name=COLLECTION_NAME, points=points, wait=True)
            return end_idx
        except Exception as e:
            if attempt >= MAX_RETRIES:
                raise
            wait = 2**attempt
            print(f"[!] Batch upload failed ({e}), retry in {wait}s ...")
            time.sleep(wait)
    return end_idx


def run_test_search(client: QdrantClient, model: SentenceTransformer, query: str) -> None:
    print(f"\n[*] Test search: {query!r}")
    vec = model.encode(query).tolist()
    result = client.query_points(
        collection_name=COLLECTION_NAME,
        query=vec,
        limit=3,
        with_payload=True,
    )
    hits = result.points or []
    if not hits:
        print("    (no results)")
        return
    for i, hit in enumerate(hits, 1):
        p = hit.payload or {}
        ref = p.get("full_reference") or p.get("id")
        title = (p.get("title") or "")[:80]
        print(f"    {i}. score={hit.score:.3f}  {ref}")
        print(f"       {title}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Upload legal embeddings to Qdrant (Step 5)")
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT,
        help=f"JSON path (default: {DEFAULT_INPUT.name})",
    )
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--limit", type=int, default=None, help="Only process first N sections (test)")
    parser.add_argument("--recreate", action="store_true", help="Delete and recreate collection")
    parser.add_argument("--fresh", action="store_true", help="Reset checkpoint and start from 0")
    parser.add_argument("--status-only", action="store_true")
    parser.add_argument("--test-query", type=str, default="relevancy of evidence")
    parser.add_argument("--no-test", action="store_true", help="Skip test search at end")
    args = parser.parse_args()

    env_file = load_env()

    if args.status_only:
        url, key = require_env()
        if env_file:
            print(f"[*] Env loaded from: {env_file}")
        print(f"[*] Qdrant host: {url[:60]}{'...' if len(url) > 60 else ''}")
        client = create_qdrant_client(url, key)
        ck = load_checkpoint()
        exists = client.collection_exists(COLLECTION_NAME)
        points = 0
        if exists:
            points = client.get_collection(COLLECTION_NAME).points_count or 0
        sections = load_sections(args.input)
        total = len(sections) if args.limit is None else min(args.limit, len(sections))
        uploaded = int(ck.get("uploaded_count") or 0)
        print("=" * 60)
        print(f"Collection: {COLLECTION_NAME}  exists={exists}  points={points}")
        print(f"Input:      {args.input}")
        print(f"Sections:   {total} (valid, after --limit)")
        print(f"Checkpoint: {uploaded} uploaded  ->  {CHECKPOINT_PATH}")
        print(f"Remaining:  {max(0, total - uploaded)}")
        print("=" * 60)
        return 0

    url, key = require_env()
    if env_file:
        print(f"[*] Env loaded from: {env_file}")
    sections = load_sections(args.input)
    if args.limit is not None:
        sections = sections[: args.limit]

    print(f"[*] Loading model {MODEL_NAME} ...")
    model = SentenceTransformer(MODEL_NAME)

    print(f"[*] Connecting to Qdrant ({url[:50]}...) ...")
    client = create_qdrant_client(url, key)
    print("[+] Connected")

    ensure_collection(client, recreate=args.recreate or args.fresh)

    checkpoint = load_checkpoint()
    if args.fresh or args.recreate:
        checkpoint = {
            "version": 1,
            "uploaded_count": 0,
            "collection": COLLECTION_NAME,
            "input": str(args.input),
        }
        save_checkpoint(checkpoint)

    start = resolve_start_index(client, checkpoint, len(sections), args.recreate or args.fresh)
    total = len(sections)
    batch_size = max(1, args.batch_size)

    if start >= total:
        print(f"[+] Already complete ({start}/{total} points).")
        if not args.no_test:
            run_test_search(client, model, args.test_query)
        return 0

    print(f"[*] Uploading {total - start} sections in batches of {batch_size} ...\n")

    idx = start
    batch_num = start // batch_size
    total_batches = (total + batch_size - 1) // batch_size

    with tqdm(total=total - start, desc="Upload", unit="sec") as pbar:
        while idx < total:
            batch_num += 1
            prev = idx
            idx = upload_batch(client, model, sections, idx, batch_size)
            uploaded = idx
            checkpoint["uploaded_count"] = uploaded
            checkpoint["last_batch"] = batch_num
            checkpoint["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            save_checkpoint(checkpoint)
            pbar.update(idx - prev)
            if batch_num % 10 == 0 or idx >= total:
                tqdm.write(f"    Batch {batch_num}/{total_batches} — {uploaded}/{total} points")

    info = client.get_collection(COLLECTION_NAME)
    print("\n" + "=" * 60)
    print("COMPLETE")
    print(f"  Collection:  {COLLECTION_NAME}")
    print(f"  Points:      {info.points_count}")
    print(f"  Vector size: {VECTOR_SIZE}")
    print(f"  Model:       {MODEL_NAME}")
    print(f"  Checkpoint:  {CHECKPOINT_PATH}")
    print("=" * 60)

    if not args.no_test:
        run_test_search(client, model, args.test_query)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
