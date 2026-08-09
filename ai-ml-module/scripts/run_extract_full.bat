@echo off
title Step 4 - Extract FULL (resume-safe)
cd /d "%~dp0\.."
echo Resume: pehle scan, phir sirf baqi PDFs. Laptop charge par rakho.
python scripts\extract_sections.py --status-only
echo.
python scripts\extract_sections.py --book all
echo.
echo Done. Next: Step 5 embeddings to Qdrant
pause
