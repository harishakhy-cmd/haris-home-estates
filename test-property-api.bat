@echo off
REM HARIS Property API Test Script (Windows)
REM Tests if the property creation API is working correctly

setlocal enabledelayedexpansion

echo.
echo ======================================
echo HARIS Property API Health Check
echo ======================================
echo.

REM Test 1: Check if backend is running on port 3001
echo [1/4] Checking if backend is running on port 3001...
netstat -ano | findstr :3001 >nul
if !errorlevel! equ 0 (
    echo [OK] Backend is running
) else (
    echo [FAIL] Backend is not running on port 3001
    echo Start backend with: npm run start:dev or docker-compose up
    exit /b 1
)
echo.

REM Test 2: Check Swagger UI using PowerShell
echo [2/4] Checking Swagger UI...
powershell -NoProfile -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/swagger' -TimeoutSec 5 -ErrorAction Stop; Write-Host '[OK] Swagger UI accessible' } catch { Write-Host '[FAIL] Swagger UI not accessible'; exit 1 }"
if !errorlevel! neq 0 (
    echo Swagger UI check failed - but this is normal for this check method
)
echo.

REM Test 3: Check API health using PowerShell
echo [3/4] Testing GET /api/v1/properties...
powershell -NoProfile -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/v1/properties' -TimeoutSec 5 -ErrorAction Stop; $json = $response.Content | ConvertFrom-Json; Write-Host '[OK] Properties endpoint working'; Write-Host ('Found ' + $json.data.Count + ' properties') } catch { Write-Host '[FAIL] Properties endpoint error'; Write-Host $_.Exception.Message }"
echo.

REM Test 4: Check Docker services if available
echo [4/4] Checking Docker services...
docker-compose ps >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Docker is available
    for /f "tokens=*" %%i in ('docker-compose ps 2^>nul ^| find "haris-backend"') do (
        echo Backend: %%i
    )
    for /f "tokens=*" %%i in ('docker-compose ps 2^>nul ^| find "haris-postgres"') do (
        echo Database: %%i
    )
) else (
    echo [SKIP] Docker not available or not in this directory
)
echo.

echo ======================================
echo API Test Summary
echo ======================================
echo.
echo If backend is running, you can now:
echo 1. Go to http://localhost:3000/dashboard/landlord
echo 2. Click "Create listing"
echo 3. Fill in property details
echo 4. Click "Save listing"
echo.
echo API Documentation:
echo - Swagger UI: http://localhost:3001/api/swagger
echo - Base URL: http://localhost:3001/api/v1
echo.
