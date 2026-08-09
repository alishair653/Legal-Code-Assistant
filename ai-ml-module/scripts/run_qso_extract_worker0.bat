@echo off
title QSO Extract Worker 0 of 3
cd /d "%~dp0\.."
python scripts\extract_sections.py --book qso --workers 3 --worker-id 0
pause
