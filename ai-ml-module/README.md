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

## Pakistan Code PDFs (Selenium)

Install Chrome (browser), then:

```bash
cd ai-ml-module
pip install -r requirements-selenium.txt
# (includes requests — used if PDF opens in viewer instead of downloading to disk)
copy config\pakistan_code_selectors.example.json config\pakistan_code_selectors.json
python scripts\download_pakistan_code_pdfs.py --output ..\legal-data\raw-pdfs
```

First run **without** `--headless` so you can see hovers and “View”. If clicks miss, edit `config/pakistan_code_selectors.json` using DevTools (selectors for cards, Search, Print/Download).

Use slow, respectful delays; confirm you are allowed to bulk-download under site terms.

**Homepage tiles:** the script reads each tile’s **View `href`** in one browser `executeScript` pass (then `driver.get(href)`), so navigation never leaves stale `WebElement`s behind. After each PDF attempt it reloads the same law URL before the next Category/Year pair.

**pip warning `~vicorn`:** a broken install folder under `Python311\\Lib\\site-packages`; remove the folder named `~vicorn` or reinstall `uvicorn` — it does not affect Selenium.

**Resume after power loss / laptop off:** run the **same** command again. The script skips pairs that already have a complete PDF (default ≥ 512 bytes) and saves progress in `<output>/.pakistan_code_scraper_state.json` after each good download. To ignore checkpoint: `--reset-progress` (does not delete PDFs).

**“Download incomplete”:** the script now waits for `.crdownload` to finish and only renames PDFs **newer than the click time** (so old files in the folder are not mistaken for the new download). Increase `download_wait_timeout_sec` in `config/pakistan_code_selectors.json` if large PDFs are slow. Run **without** `--headless` once to confirm Chrome is saving into the printed output folder.
