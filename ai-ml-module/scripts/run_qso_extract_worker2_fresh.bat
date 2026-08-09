@echo off
title QSO Extract Worker 2 of 3 [FRESH]
cd /d "%~dp0\.."
python scripts\extract_sections.py --book qso --workers 3 --worker-id 2 --fresh
pause
