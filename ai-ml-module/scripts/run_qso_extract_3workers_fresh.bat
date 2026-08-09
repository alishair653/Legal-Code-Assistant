@echo off
REM QSO extract — clean start (purani JSON/checkpoint delete ke baad)
cd /d "%~dp0\.."
echo.
echo === QSO extract FRESH: 3 workers ===
echo Purani extract CMD windows band karo (Ctrl+C) pehle.
echo.
python scripts\extract_sections.py --book qso --workers 3 --status-only
echo.
start "QSO Extract 0" cmd /k "%~dp0run_qso_extract_worker0_fresh.bat"
timeout /t 5 /nobreak >nul
start "QSO Extract 1" cmd /k "%~dp0run_qso_extract_worker1_fresh.bat"
timeout /t 5 /nobreak >nul
start "QSO Extract 2" cmd /k "%~dp0run_qso_extract_worker2_fresh.bat"
echo 3 CMD windows started (--fresh).
echo Jab sab khatam hon:
echo   python scripts\extract_sections.py --book qso --merge-workers
pause
