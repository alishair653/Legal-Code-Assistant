# legal-data

Pakistani law source material and processed outputs for the assistant.

| Path | Purpose |
|------|---------|
| `raw-pdfs/` | Original PPC, CrPC, QSO PDFs from official sources |
| `extracted/` | JSON per statute after PDF parsing (Step 4 in `plan.md`) |
| `processed/` | Combined / normalized datasets (e.g. `all_legal_data.json`) |
| `scripts/` | One-off data prep scripts (optional; main Python tooling lives in `../ai-ml-module`) |

**Note:** Large PDFs are usually not committed. Keep `.gitkeep` in empty folders so Git tracks the layout.
