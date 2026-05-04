# ai-ml-module

Python tooling for ingestion, parsing, embeddings, and vector upload (see `plan.md` Steps 4–5).

Suggested layout as you implement:

```
ai-ml-module/
  requirements.txt
  .env                 # QDRANT_URL, etc. (never commit secrets)
  scripts/
    extract_sections.py
    create_embeddings.py
```

**Data paths:** read PDFs from `../legal-data/raw-pdfs/` and write JSON to `../legal-data/extracted/` or `../legal-data/processed/` so everything stays in one repo tree.
