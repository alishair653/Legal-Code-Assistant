@echo off
title QSO Embeddings -> Qdrant
cd /d "%~dp0\.."
echo.
echo Step 5: Upload embeddings to Qdrant
echo Input: legal-data\processed\all_legal_data.json
echo.
echo First time: copy scripts\.env.example to scripts\.env and add Qdrant keys
echo   OR put QDRANT_URL / QDRANT_API_KEY in frontend\.env.local
echo.
pip install -r requirements-embeddings.txt
echo.
python scripts\create_embeddings.py %*
pause
