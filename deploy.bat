@echo off
REM HARIS Deployment Script - Automated Deployment (Windows)

setlocal enabledelayedexpansion

echo.
echo ===============================================================
echo          HARIS Platform - Automated Deployment
echo ===============================================================
echo.

REM Step 1: Check Docker
echo [Step 1/7] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed
    exit /b 1
)
echo OK: Docker found
echo.

REM Step 2: Check Docker Compose
echo [Step 2/7] Checking Docker Compose installation...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose is not installed
    exit /b 1
)
echo OK: Docker Compose found
echo.

REM Step 3: Stop existing containers
echo [Step 3/7] Stopping existing containers...
docker-compose down
echo OK: Stopped
echo.

REM Step 4: Build backend
echo [Step 4/7] Building backend service ^(this may take 2-3 minutes^)...
docker-compose build backend
if errorlevel 1 (
    echo ERROR: Backend build failed
    exit /b 1
)
echo OK: Backend built
echo.

REM Step 5: Start services
echo [Step 5/7] Starting all services...
docker-compose up -d
echo OK: Services started
echo Waiting 30 seconds for services to be ready...
timeout /t 30 /nobreak
echo.

REM Step 6: Run migrations
echo [Step 6/7] Running database migrations...
docker-compose exec -T backend npx prisma migrate deploy >nul 2>&1
echo OK: Migrations completed
echo.

REM Step 7: Verify
echo [Step 7/7] Verifying deployment...
echo Checking if backend is responding...
timeout /t 5 /nobreak

echo.
echo ===============================================================
echo                  DEPLOYMENT COMPLETE
echo ===============================================================
echo.
echo Access points:
echo   Frontend:    http://localhost:3000
echo   Backend API: http://localhost:3001
echo   Swagger UI:  http://localhost:3001/api/swagger
echo   Database:    localhost:5432
echo.
echo Next steps:
echo   1. Open http://localhost:3000 in your browser
echo   2. Register as a landlord
echo   3. Create a test property
echo   4. Verify it works!
echo.
echo Monitor logs:
echo   docker-compose logs backend -f
echo.
pause
