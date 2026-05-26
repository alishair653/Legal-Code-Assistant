@echo off
REM One CRPC worker tab. Usage: run_crcp_worker.bat 0   (requires --workers 3 on all tabs)
if "%~1"=="" (
  echo Usage: run_crcp_worker.bat WORKER_ID
  echo Example: run_crcp_worker.bat 1   for worker 1 of 3
  exit /b 1
)

setlocal
cd /d "%~dp0\.."

set WORKER_ID=%~1
set OUTPUT=..\legal-data\raw-pdfs
set LAW_URL=https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2Npa5lp-sg-jjjjjjjjjjjjj
set LABEL=Code_of_Criminal_Procedure

title CRPC Worker %WORKER_ID%/3
python scripts\download_pakistan_code_pdfs.py --output "%OUTPUT%" --law-url "%LAW_URL%" --law-label %LABEL% --min-year 1947 --workers 3 --worker-id %WORKER_ID%

endlocal
