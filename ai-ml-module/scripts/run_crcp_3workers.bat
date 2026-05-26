@echo off
REM Code of Criminal Procedure — 3 parallel workers (disjoint category x year shards).
REM Same output folder; each worker skips PDFs/checkpoints from the others.
REM Stop any old single-worker CMD first, then run this once.

setlocal
cd /d "%~dp0\.."

set OUTPUT=..\legal-data\raw-pdfs
set LAW_URL=https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2Npa5lp-sg-jjjjjjjjjjjjj
set LABEL=Code_of_Criminal_Procedure
set PY=python

echo.
echo === CRPC: 3 workers (0, 1, 2) — no overlapping work ===
echo Output: %OUTPUT%
echo Staggered Chrome start (8s) to reduce RAM spike.
echo.

start "CRPC Worker 0 of 3" cmd /k "%~dp0run_crcp_worker0.bat"
timeout /t 10 /nobreak >nul
start "CRPC Worker 1 of 3" cmd /k "%~dp0run_crcp_worker1.bat"
timeout /t 10 /nobreak >nul
start "CRPC Worker 2 of 3" cmd /k "%~dp0run_crcp_worker2.bat"

echo All 3 CMD windows launched.
endlocal
