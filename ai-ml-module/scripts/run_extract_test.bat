@echo off
title Step 4 - Extract TEST (5 PDFs per book)
cd /d "%~dp0\.."
echo Testing extraction on 5 PDFs per folder...
python scripts\extract_sections.py --book all --limit 5
echo.
echo Check: legal-data\extracted\ and legal-data\processed\all_legal_data.json
pause
