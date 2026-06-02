@echo off
REM Create NestJS backend directory structure

echo Creating NestJS backend directory structure...
echo.

REM Create src subdirectories
mkdir d:\LANDLORDS\backend\src
mkdir d:\LANDLORDS\backend\src\auth
mkdir d:\LANDLORDS\backend\src\users
mkdir d:\LANDLORDS\backend\src\properties
mkdir d:\LANDLORDS\backend\src\search
mkdir d:\LANDLORDS\backend\src\favorites
mkdir d:\LANDLORDS\backend\src\bookings
mkdir d:\LANDLORDS\backend\src\messaging
mkdir d:\LANDLORDS\backend\src\admin

REM Create common subdirectories
mkdir d:\LANDLORDS\backend\src\common
mkdir d:\LANDLORDS\backend\src\common\decorators
mkdir d:\LANDLORDS\backend\src\common\guards
mkdir d:\LANDLORDS\backend\src\common\middleware
mkdir d:\LANDLORDS\backend\src\common\exceptions

REM Create database directory
mkdir d:\LANDLORDS\backend\src\database

REM Create prisma directory
mkdir d:\LANDLORDS\backend\prisma

REM Create test directory
mkdir d:\LANDLORDS\backend\test

echo.
echo ✓ NestJS backend directory structure created successfully!
echo.
echo Directory structure:
echo d:\LANDLORDS\backend\
echo ├── src\
echo │   ├── auth\
echo │   ├── users\
echo │   ├── properties\
echo │   ├── search\
echo │   ├── favorites\
echo │   ├── bookings\
echo │   ├── messaging\
echo │   ├── admin\
echo │   ├── common\
echo │   │   ├── decorators\
echo │   │   ├── guards\
echo │   │   ├── middleware\
echo │   │   └── exceptions\
echo │   └── database\
echo ├── prisma\
echo └── test\
echo.
pause
