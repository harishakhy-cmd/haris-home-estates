@echo off
REM Create backend directory structure
echo Creating backend directory structure...

mkdir "d:\LANDLORDS\backend\src" 2>nul
mkdir "d:\LANDLORDS\backend\src\auth" 2>nul
mkdir "d:\LANDLORDS\backend\src\users" 2>nul
mkdir "d:\LANDLORDS\backend\src\properties" 2>nul
mkdir "d:\LANDLORDS\backend\src\search" 2>nul
mkdir "d:\LANDLORDS\backend\src\favorites" 2>nul
mkdir "d:\LANDLORDS\backend\src\bookings" 2>nul
mkdir "d:\LANDLORDS\backend\src\messaging" 2>nul
mkdir "d:\LANDLORDS\backend\src\admin" 2>nul
mkdir "d:\LANDLORDS\backend\src\common" 2>nul
mkdir "d:\LANDLORDS\backend\src\common\decorators" 2>nul
mkdir "d:\LANDLORDS\backend\src\common\guards" 2>nul
mkdir "d:\LANDLORDS\backend\src\common\middleware" 2>nul
mkdir "d:\LANDLORDS\backend\src\common\exceptions" 2>nul
mkdir "d:\LANDLORDS\backend\src\database" 2>nul
mkdir "d:\LANDLORDS\backend\prisma" 2>nul
mkdir "d:\LANDLORDS\backend\test" 2>nul

echo.
echo Creating backend files...
echo.

REM Copy this script's directory content to backend
cd /d d:\LANDLORDS\backend

echo Creating Prisma schema...
cd d:\LANDLORDS\backend\prisma

echo.
echo Backend directory structure created successfully!
echo Next steps:
echo 1. Copy the configuration files to d:\LANDLORDS\backend\
echo 2. Run: npm install
echo 3. Run: npm run prisma:generate
echo 4. Run: npm run db:push
echo.
pause
