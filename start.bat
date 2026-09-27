@echo off
echo ============================================
echo CareBridge - Docker Quick Start
echo ============================================
echo.

echo Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not found. Please install Docker Desktop first.
    echo Download: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo Docker found. Checking docker-compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: docker-compose not found. It comes with Docker Desktop.
    pause
    exit /b 1
)

echo.
echo Checking .env files...
if not exist ".env" (
    echo Creating .env from .env.example...
    copy .env.example .env >nul
    echo Please edit .env and add your Algolia keys.
    echo.
)

if not exist "server\.env" (
    echo Creating server\.env from server\.env.example...
    copy server\.env.example server\.env >nul
    echo Please edit server\.env and add your JWT_SECRET and Algolia keys.
    echo.
)

echo.
echo Starting containers...
echo This will start: PostgreSQL (5432), Backend API (5000), Frontend (5173)
echo.

docker-compose up --build

echo.
echo Containers stopped.
pause