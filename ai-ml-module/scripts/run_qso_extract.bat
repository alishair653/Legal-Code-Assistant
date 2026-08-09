@echo off
title QSO Extract - use 3 workers
cd /d "%~dp0\.."
echo Run: run_qso_extract_3workers.bat  (3 parallel CMD tabs)
python scripts\extract_sections.py --book qso --workers 3 --status-only
pause
