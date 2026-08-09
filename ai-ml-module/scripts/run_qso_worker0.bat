@echo off
title QSO Worker 0 of 3
cd /d "%~dp0\.."
echo.
echo *** Qanun-e-Shahadat Order - WORKER 0 of 3 ***
echo.
python scripts\download_pakistan_code_pdfs.py --output "..\legal-data\raw-pdfs" --law-url "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2Npa5plaw%%3D%%3D-sg-jjjjjjjjjjjjj" --law-label Qanun_e_Shahadat_Order --min-year 1947 --workers 3 --worker-id 0 --page-timeout 150 --selenium-timeout 300 --until-complete
if errorlevel 1 pause
