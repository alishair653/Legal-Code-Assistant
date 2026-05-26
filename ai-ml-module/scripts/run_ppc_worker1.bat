@echo off
title PPC Worker 1 of 3
cd /d "%~dp0\.."
echo.
echo *** Pakistan Penal Code - WORKER 1 of 3 ***
echo.
python scripts\download_pakistan_code_pdfs.py --output "..\legal-data\raw-pdfs" --law-url "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2Npa5lo-sg-jjjjjjjjjjjjj" --law-label Pakistan_Penal_Code --min-year 1947 --workers 3 --worker-id 1 --page-timeout 150 --selenium-timeout 300 --until-complete
if errorlevel 1 pause
