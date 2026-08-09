@echo off
REM QSO text extract — 3 parallel workers (disjoint PDF shards)
cd /d "%~dp0\.."
echo.
echo === QSO extract: 3 workers ===
echo Pehle purani single CMD band karo (Ctrl+C)
echo.
python scripts\extract_sections.py --book qso --workers 3 --status-only
echo.
start "QSO Extract 0" cmd /k "%~dp0run_qso_extract_worker0.bat"
timeout /t 5 /nobreak >nul
start "QSO Extract 1" cmd /k "%~dp0run_qso_extract_worker1.bat"
timeout /t 5 /nobreak >nul
start "QSO Extract 2" cmd /k "%~dp0run_qso_extract_worker2.bat"
echo 3 CMD windows started.
echo Jab sab khatam hon: python scripts\extract_sections.py --book qso --merge-workers --workers 3
pause
