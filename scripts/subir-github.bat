@echo off
title H MED DISTRIBUIDORA - Subir para GitHub
color 0B

echo.
echo ============================================================
echo   H MED DISTRIBUIDORA - Upload para GitHub
echo ============================================================
echo.

cd /d "C:\Users\gabri\OneDrive\Documentos\Claude\Projects\H MED\hmed-saas"

echo [1/5] Iniciando repositorio Git...
git init 2>nul || echo Git ja iniciado

echo.
echo [2/5] Adicionando arquivos...
git add .

echo.
echo [3/5] Criando commit...
git commit -m "H MED DISTRIBUIDORA - Sistema SaaS Premium v1.0"

echo.
set /p GITHUB_USER=Digite seu usuario do GitHub:
set /p REPO_NAME=Nome do repositorio (ex: hmed-saas):

echo.
echo [4/5] Conectando ao GitHub...
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git

echo.
echo [5/5] Enviando para GitHub...
git push -u origin main

echo.
echo ============================================================
echo   SUCESSO! Codigo enviado para:
echo   https://github.com/%GITHUB_USER%/%REPO_NAME%
echo ============================================================
echo.
pause
