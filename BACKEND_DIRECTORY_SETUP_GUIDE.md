# NestJS Backend Directory Structure Setup

## Status
✅ Setup scripts have been created but require manual execution due to tool limitations in this environment.

## Quick Start

Choose one of the following methods based on your system:

### Method 1: Windows Command Prompt (Recommended for Windows)
```cmd
cd d:\LANDLORDS
create_backend_structure.bat
```

Or double-click: `create_backend_structure.bat`

### Method 2: Node.js (Cross-platform)
```bash
cd d:\LANDLORDS
node create_backend_dirs.js
```

### Method 3: Python (Cross-platform)
```bash
cd d:\LANDLORDS
python create_backend_dirs.py
```

Or if Python is aliased as python3:
```bash
python3 create_backend_dirs.py
```

### Method 4: Bash/WSL/Git Bash
```bash
cd d:\LANDLORDS
bash create_backend_structure.sh
```

Or if on Windows with WSL:
```bash
bash /mnt/d/LANDLORDS/create_backend_structure.sh
```

## Expected Directory Structure

After running one of the setup scripts, you'll have:

```
d:\LANDLORDS\backend\
├── src\
│   ├── admin\
│   ├── auth\
│   ├── bookings\
│   ├── common\
│   │   ├── decorators\
│   │   ├── exceptions\
│   │   ├── guards\
│   │   └── middleware\
│   ├── database\
│   ├── favorites\
│   ├── messaging\
│   ├── properties\
│   ├── search\
│   └── users\
├── prisma\
└── test\
```

## Module Structure Guidelines

For each feature module in `src/`, create the following files:

```
src/auth/
├── auth.module.ts           # Module definition
├── auth.controller.ts        # HTTP endpoints
├── auth.service.ts          # Business logic
├── dto/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   └── token.dto.ts
├── strategies/              # Passport strategies
│   ├── jwt.strategy.ts
│   ├── local.strategy.ts
│   └── refresh-token.strategy.ts
├── guards/                  # Custom auth guards
│   ├── jwt.guard.ts
│   └── roles.guard.ts
└── decorators/              # Custom decorators
    ├── public.decorator.ts
    └── current-user.decorator.ts
```

## Common Directory Usage

**src/common/decorators/** - Custom NestJS decorators
- `@CurrentUser()` - Get current authenticated user
- `@Roles()` - Define role-based access control
- `@Public()` - Mark routes as public

**src/common/guards/** - Authentication/authorization guards
- `JwtAuthGuard` - Validates JWT tokens
- `RolesGuard` - Validates user roles
- `OwnershipGuard` - Validates resource ownership

**src/common/middleware/** - Request/response middleware
- `RequestLogger` - Log all requests
- `ErrorHandler` - Global error handling
- `RateLimiter` - Rate limiting

**src/common/exceptions/** - Custom exception classes
- `NotFoundException`
- `ValidationException`
- `UnauthorizedException`
- `ForbiddenException`

## Prisma Setup

In `prisma/`:
- `schema.prisma` - Database schema definition
- `migrations/` - Database migration history (auto-created)

## Testing

In `test/`:
- `unit/` - Unit tests for services
- `integration/` - Integration tests
- `e2e/` - End-to-end tests

## Environment Setup

After creating directories, create:
- `backend/.env.local` - Local environment variables
- `backend/.env.example` - Example environment file (template)

Example variables:
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/landlords_db
JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m
```

## Next Steps

1. **Initialize NestJS Project**
   ```bash
   cd d:\LANDLORDS\backend
   npm init -y
   npm install @nestjs/core @nestjs/common @nestjs/platform-express
   ```

2. **Install Additional Dependencies**
   ```bash
   npm install @nestjs/jwt @nestjs/passport @nestjs/typeorm
   npm install passport passport-jwt passport-local
   npm install @prisma/client prisma
   npm install class-validator class-transformer
   npm install bcryptjs
   npm install --save-dev @types/node ts-loader typescript
   ```

3. **Initialize Prisma**
   ```bash
   cd backend
   npx prisma init
   ```

4. **Create Main Application Files**
   ```bash
   # Create main.ts
   # Create app.module.ts
   # Create .eslintrc.js
   # Create tsconfig.json
   ```

## Troubleshooting

**PowerShell not found?**
Use Command Prompt (cmd.exe) or Node.js method instead.

**Python not installed?**
Use Node.js method or batch file method.

**Permission denied (bash)?**
Ensure the script has execute permissions: `chmod +x create_backend_structure.sh`

**Directories already exist?**
The scripts use `mkdir -p` / `mkdir /force` which will skip existing directories safely.

## Files Included

- `create_backend_structure.bat` - Windows batch file
- `create_backend_dirs.js` - Node.js script
- `create_backend_dirs.py` - Python script
- `create_backend_structure.sh` - Bash/shell script
- `BACKEND_SETUP_INSTRUCTIONS.md` - Additional details
- `BACKEND_DIRECTORY_SETUP_GUIDE.md` - This file

## Architecture Overview

```
                          ┌─────────────────────┐
                          │   API Gateway       │
                          │  (Port 3001)        │
                          └──────────┬──────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
    ┌───▼────┐          ┌───────────▼──────────┐        ┌────────▼────┐
    │  Auth   │          │   Feature Modules   │        │  Admin      │
    │ Module  │          │  - Users            │        │  Module     │
    └────┬────┘          │  - Properties       │        └─────┬───────┘
         │               │  - Bookings         │              │
         │               │  - Messaging        │              │
         │               │  - Search           │              │
         │               │  - Favorites        │              │
         │               └───────────┬──────────┘              │
         │                           │                        │
         └───────────────┬───────────┴────────────────────────┘
                         │
                    ┌────▼───────────┐
                    │  Common Layer   │
                    │ - Decorators    │
                    │ - Guards        │
                    │ - Middleware    │
                    │ - Exceptions    │
                    └────┬───────────┘
                         │
                    ┌────▼──────────┐
                    │  Database     │
                    │  - Prisma ORM │
                    │  - Migrations │
                    └───────────────┘
```

---

**Created:** 2024
**Project:** LANDLORDS - Property Rental Management Platform
**Backend:** NestJS
**Database:** PostgreSQL (via Prisma)
