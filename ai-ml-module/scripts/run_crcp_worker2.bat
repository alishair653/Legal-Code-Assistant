@echo off
title CRPC Worker 2 of 3
cd /d "%~dp0\.."
echo.
echo *** WORKER 2 - window title must say "Worker 2 of 3" ***
echo *** Har worker ki ALAG CMD - teen windows chahiye ***
echo.
python scripts\download_pakistan_code_pdfs.py --output "..\legal-data\raw-pdfs" --law-url "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2Npa5lp-sg-jjjjjjjjjjjjj" --law-label Code_of_Criminal_Procedure --min-year 1947 --workers 3 --worker-id 2 --page-timeout 150 --selenium-timeout 300 --until-complete
if errorlevel 1 pause
