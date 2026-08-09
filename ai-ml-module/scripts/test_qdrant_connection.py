"""
Quick Qdrant Cloud connectivity test (no embeddings).

  cd ai-ml-module
  python scripts/test_qdrant_connection.py
"""

from __future__ import annotations

import os
import socket
import sys
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[2]
for p in (
    Path(__file__).resolve().parent / ".env",
    REPO_ROOT / "frontend" / ".env.local",
):
    if p.is_file():
        load_dotenv(p, override=False)

try:
    import httpx
except ImportError:
    print("[!] pip install httpx")
    sys.exit(1)

url = (os.getenv("QDRANT_URL") or "").strip().rstrip("/")
key = (os.getenv("QDRANT_API_KEY") or "").strip()

if not url or not key:
    print("[!] Set QDRANT_URL and QDRANT_API_KEY in frontend/.env.local")
    sys.exit(2)

host = url.replace("https://", "").replace("http://", "").split("/")[0].split(":")[0]
print(f"Host: {host}")
print(f"API key length: {len(key)} (starts with {key[:6]}...)")

try:
    ip = socket.gethostbyname(host)
    print(f"DNS OK -> {ip}")
except socket.gaierror as e:
    print(f"DNS FAILED: {e}")
    print("  -> Wrong hostname. Copy Cluster URL from Qdrant Cloud -> Access.")
    sys.exit(2)

bases = [url]
if ":6333" not in url:
    bases.append(f"{url}:6333")

ok = False
for base in bases:
    for path in ("", "/collections"):
        test_url = f"{base.rstrip('/')}{path}"
        for hdr_name, hdr_val in (
            ("api-key", key),
            ("Authorization", f"Bearer {key}"),
        ):
            try:
                r = httpx.get(test_url, headers={hdr_name: hdr_val}, timeout=20)
                print(f"  {test_url} [{hdr_name}] -> {r.status_code}")
                if r.status_code == 200:
                    ok = True
                    print("  Response:", r.text[:200])
            except Exception as e:
                print(f"  {test_url} -> ERROR {e}")

if ok:
    print("\n[+] Qdrant reachable. Run: python scripts/create_embeddings.py --status-only")
else:
    print("\n" + "=" * 60)
    print("All requests returned 404 or failed.")
    print("This usually means:")
    print("  1) Cluster deleted, paused, or still provisioning")
    print("  2) QDRANT_URL is NOT the exact URL from Access tab (do not guess UUID)")
    print("  3) Wrong region in hostname (must match dashboard)")
    print("\nFix:")
    print("  - cloud.qdrant.io -> your cluster -> must show Running")
    print("  - Access tab -> copy Cluster URL + create new API key")
    print("  - Paste into frontend/.env.local and retry")
    print("=" * 60)
    sys.exit(2)
