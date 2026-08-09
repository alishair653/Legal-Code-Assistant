@echo off
title Step 4 - Extract STATUS (kitna ho gaya / kitna baqi)
cd /d "%~dp0\.."
python scripts\extract_sections.py --status-only
pause
