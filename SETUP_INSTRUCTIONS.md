# HARIS Project Setup Instructions

This document provides instructions for setting up the HARIS project infrastructure.

## Quick Start (Recommended)

### Option 1: Automatic Setup (Node.js)

If you have Node.js installed, run the automated setup script:

```bash
cd d:\LANDLORDS
node setup.js
```

This will create:
- All required directories (backend, frontend, shared/types)
- All TypeScript type definition files
- Environment configuration files (.env.example)
- Docker Compose configuration

### Option 2: Automatic Setup (Batch File - Windows)

On Windows, you can also use:

```bash
cd d:\LANDLORDS
setup.bat
```

### Option 3: Automatic Setup (Python)

If you prefer Python:

```bash
cd d:\LANDLORDS
python setup_dirs.py
```

Then manually create the files using the instructions below.

### Option 4: Manual Setup

#### 1. Create Directories

```bash
cd d:\LANDLORDS
mkdir backend
mkdir frontend
mkdir shared\types
```

#### 2. File Structure After Setup

```
d:\LANDLORDS\
├── backend/
│   └── .env.example
├── frontend/
│   └── .env.example
├── shared/
│   ├── types/
│   │   ├── user.ts
│   │   ├── property.ts
│   │   ├── booking.ts
│   │   ├── message.ts
│   │   ├── common.ts
│   │   └── index.ts
│   └── package.json
└── docker-compose.yml
```

## Project Structure Overview

### Backend (`backend/`)
- NestJS-based backend application
- Runs on port 3001
- Connects to PostgreSQL and Redis

### Frontend (`frontend/`)
- Next.js-based frontend application
- Runs on port 3000
- Connects to the backend API

### Shared Types (`shared/`)
- TypeScript type definitions shared between backend and frontend
- Includes:
  - **user.ts**: User roles, authentication DTOs, token payloads
  - **property.ts**: Property types, status enums, filtering DTOs
  - **booking.ts**: Booking and inquiry related types
  - **message.ts**: Messaging and conversation types
  - **common.ts**: Common API response types and pagination

## Docker Compose Services

The `docker-compose.yml` includes:

- **PostgreSQL 15**: Database service (port 5432)
  - Database: haris_db
  - User: haris_user
  - Password: haris_password

- **Redis 7**: Cache service (port 6379)

- **Backend Service**: NestJS application (port 3001)
  - Auto-starts with `npm run start:dev`
  - Connects to PostgreSQL and Redis

- **Frontend Service**: Next.js application (port 3000)
  - Auto-starts with `npm run dev`
  - Connects to backend API

## Environment Configuration

### Backend (.env.example)
Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT signing
- `SMTP_HOST/PORT/USER`: Email configuration
- `AWS_ACCESS_KEY_ID/SECRET`: AWS S3 access

### Frontend (.env.example)
Key variables:
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API key

## Shared Package Configuration

The `shared/package.json` provides:
- TypeScript compilation support
- Build scripts: `npm run build`, `npm run watch`
- Cleanup script: `npm run clean`

## Next Steps

1. **Run the setup**: Execute one of the setup options above
2. **Copy environment files**: 
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`
3. **Update secrets**: Update JWT_SECRET and API keys in the `.env` files
4. **Start Docker services**: `docker-compose up` (optional for development)
5. **Install dependencies**: 
   - `npm install` in backend
   - `npm install` in frontend
   - `npm install` in shared

## Troubleshooting

### PowerShell not available
If you see errors about PowerShell not being available, try using Command Prompt (cmd.exe) instead:
```cmd
cd /d d:\LANDLORDS
node setup.js
```

### Node.js not found
If Node.js is not installed, download it from https://nodejs.org/

### Python script not found
If Python is not installed, download it from https://www.python.org/

## Support

For issues with the setup process, ensure you have:
- Node.js 16+ (for npm and Node scripts)
- Python 3.6+ (for Python setup script)
- Git for version control
