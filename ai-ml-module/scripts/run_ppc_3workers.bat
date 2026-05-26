@echo off
REM Pakistan Penal Code — 3 parallel workers, same folder as CRPC, --until-complete.
REM Pehle purani CRPC workers band karo (Ctrl+C). Phir sirf is file ko double-click karo.

setlocal
cd /d "%~dp0\.."

echo.
echo === Pakistan Penal Code: 3 workers (0, 1, 2) ===
echo Output: ..\legal-data\raw-pdfs
echo Har worker apna shard; --until-complete = jab tak shard khatam na ho.
echo.

start "PPC Worker 0 of 3" cmd /k "%~dp0run_ppc_worker0.bat"
timeout /t 10 /nobreak >nul
start "PPC Worker 1 of 3" cmd /k "%~dp0run_ppc_worker1.bat"
timeout /t 10 /nobreak >nul
start "PPC Worker 2 of 3" cmd /k "%~dp0run_ppc_worker2.bat"

echo Teen CMD windows khul gayi.
endlocal
