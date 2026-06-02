#!/bin/bash

# Create NestJS backend directory structure

echo "Creating NestJS backend directory structure..."
echo ""

# Create all directories
mkdir -p "d:\LANDLORDS\backend\src"
mkdir -p "d:\LANDLORDS\backend\src\auth"
mkdir -p "d:\LANDLORDS\backend\src\users"
mkdir -p "d:\LANDLORDS\backend\src\properties"
mkdir -p "d:\LANDLORDS\backend\src\search"
mkdir -p "d:\LANDLORDS\backend\src\favorites"
mkdir -p "d:\LANDLORDS\backend\src\bookings"
mkdir -p "d:\LANDLORDS\backend\src\messaging"
mkdir -p "d:\LANDLORDS\backend\src\admin"
mkdir -p "d:\LANDLORDS\backend\src\common\decorators"
mkdir -p "d:\LANDLORDS\backend\src\common\guards"
mkdir -p "d:\LANDLORDS\backend\src\common\middleware"
mkdir -p "d:\LANDLORDS\backend\src\common\exceptions"
mkdir -p "d:\LANDLORDS\backend\src\database"
mkdir -p "d:\LANDLORDS\backend\prisma"
mkdir -p "d:\LANDLORDS\backend\test"

echo "✓ NestJS backend directory structure created successfully!"
echo ""
echo "Directory structure:"
tree "/d/LANDLORDS/backend/" 2>/dev/null || find "/d/LANDLORDS/backend/" -type d | sort

