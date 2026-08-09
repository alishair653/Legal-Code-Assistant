@echo off
REM Qanun-e-Shahadat Order (QSO 1984) — 3 workers, --until-complete.
setlocal
cd /d "%~dp0\.."
echo.
echo === QSO: 3 workers (0, 1, 2) ===
echo Output: ..\legal-data\raw-pdfs
echo Pehle PPC workers band karo (Ctrl+C) agar chal rahe hon.
echo.
start "QSO Worker 0 of 3" cmd /k "%~dp0run_qso_worker0.bat"
timeout /t 10 /nobreak >nul
start "QSO Worker 1 of 3" cmd /k "%~dp0run_qso_worker1.bat"
timeout /t 10 /nobreak >nul
start "QSO Worker 2 of 3" cmd /k "%~dp0run_qso_worker2.bat"
echo Teen CMD windows khul gayi.
endlocal
