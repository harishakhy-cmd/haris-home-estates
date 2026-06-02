# HARIS Project Setup - Complete Guide

## ✅ What Has Been Created

All the necessary setup files have been prepared in the `d:\LANDLORDS` directory:

### Setup Scripts (Choose One)
1. **setup.js** - Node.js automation script (Recommended)
2. **setup.bat** - Windows batch file
3. **setup_dirs.py** - Python automation script
4. **setup_dirs.sh** - Linux/Mac shell script

### Configuration Files
- **docker-compose.yml** - Complete Docker infrastructure with PostgreSQL, Redis, Backend, and Frontend services
- **SETUP_INSTRUCTIONS.md** - Detailed step-by-step instructions

## 🚀 Next Steps (Choose Your Method)

### Method 1: Node.js Setup (Recommended)

**Requirements**: Node.js 16+ installed

```bash
cd d:\LANDLORDS
node setup.js
```

This will automatically:
- ✅ Create all directories (backend, frontend, shared/types)
- ✅ Create all TypeScript type files
- ✅ Create environment configuration files
- ✅ Set up the complete project structure

**Success message**: "✅ All files and directories created successfully!"

### Method 2: Windows Batch Setup

```bash
cd d:\LANDLORDS
setup.bat
```

This will call setup.js automatically.

### Method 3: Python Setup

**Requirements**: Python 3.6+ installed

```bash
cd d:\LANDLORDS
python setup_dirs.py
```

This creates only directories. You'll need to manually create the TypeScript and config files.

### Method 4: Manual Setup via Git Bash / WSL

```bash
cd /d/LANDLORDS
bash setup_dirs.sh
```

## 📂 Final Project Structure

After running any setup script, you'll have:

```
d:\LANDLORDS\
│
├── backend/
│   └── .env.example          # Backend environment configuration
│
├── frontend/
│   └── .env.example          # Frontend environment configuration
│
├── shared/
│   ├── package.json          # Shared types package
│   └── types/
│       ├── user.ts           # User roles and auth types
│       ├── property.ts       # Property types and filters
│       ├── booking.ts        # Booking and inquiry types
│       ├── message.ts        # Message and conversation types
│       ├── common.ts         # Common API response types
│       └── index.ts          # Re-export all types
│
├── docker-compose.yml        # Docker services configuration
│
├── README.md                 # Main project documentation
├── SETUP_INSTRUCTIONS.md     # Detailed setup help
├── SETUP_COMPLETE.md         # This file
│
└── [Setup Scripts]
    ├── setup.js              # Node.js automation
    ├── setup.bat             # Windows batch automation
    ├── setup_dirs.py         # Python directory creation
    └── setup_dirs.sh         # Bash directory creation
```

## 🔧 What Each Setup File Does

### setup.js (Node.js)
- Creates all required directories recursively
- Creates all TypeScript type definition files with full content
- Creates both environment configuration files (.env.example)
- Creates shared/package.json
- Provides console output showing each file created

### setup.bat (Windows Batch)
- Wrapper that executes setup.js
- Requires Node.js to be in PATH
- Shows output and pauses for review

### setup_dirs.py (Python)
- Creates only the directory structure
- Does NOT create the files
- Useful if you want to set up directories manually

### setup_dirs.sh (Bash)
- Creates only the directory structure
- For Linux, Mac, or Windows with WSL/Git Bash
- Does NOT create the files

## 🐳 Docker Services

Once setup is complete, you can start all services with:

```bash
docker-compose up
```

This includes:
- **PostgreSQL 15** (port 5432)
  - Database: haris_db
  - User: haris_user
  - Password: haris_password

- **Redis 7** (port 6379)
  - Cache service

- **Backend** (port 3001)
  - NestJS application
  - Auto-runs `npm run start:dev`

- **Frontend** (port 3000)
  - Next.js application
  - Auto-runs `npm run dev`

## 🔑 Key Configuration Files

### backend/.env.example
Contains all backend configuration:
- Database connection (PostgreSQL)
- Redis connection
- JWT secrets and expiration
- Email SMTP configuration
- AWS S3 credentials
- Google Maps API key
- Pagination settings

### frontend/.env.example
Contains frontend configuration:
- Application name and URL
- Backend API URL
- Authentication storage key
- Google Maps API key
- Analytics ID

## 📝 Environment Setup

After running the setup script:

1. **Backend Setup**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and update:
   # - JWT_SECRET (change from default)
   # - Database credentials (if not using Docker)
   # - Email configuration
   # - AWS S3 credentials
   # - Google Maps API key
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env and update:
   # - NEXT_PUBLIC_API_URL (if backend runs on different host)
   # - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   ```

3. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   
   cd ../frontend
   npm install
   
   cd ../shared
   npm install
   ```

## 🚨 Troubleshooting

### "setup.js not found"
- Ensure you're in the `d:\LANDLORDS` directory
- Run: `dir setup.js` to verify the file exists

### "Node.js is not recognized"
- Install Node.js from https://nodejs.org/
- Add Node.js to your system PATH
- Restart your terminal

### "Parent directory does not exist"
- The setup.js script will handle directory creation automatically
- If running manually, create directories first:
  ```bash
  mkdir backend
  mkdir frontend
  mkdir shared\types
  ```

### PowerShell Error
- If using PowerShell, try Command Prompt (cmd.exe) instead
- Or use Windows Subsystem for Linux (WSL)

## 📚 Documentation Files

- **README.md** - Main project overview and tech stack
- **SETUP_INSTRUCTIONS.md** - Detailed setup procedures
- **SETUP_COMPLETE.md** - This completion guide

## ✨ What's Included in Each Type File

### user.ts
- UserRole enum (TENANT, LANDLORD, ADMIN)
- User interface
- UserRegisterDto
- UserLoginDto
- AuthResponse
- TokenPayload

### property.ts
- PropertyType enum (8 types)
- PropertyStatus enum (5 statuses)
- AvailabilityStatus enum
- Property interface with full details
- PropertyImage interface
- Amenity interface
- CreatePropertyDto
- UpdatePropertyDto
- PropertyFilterDto

### booking.ts
- BookingStatus enum
- Booking interface
- CreateBookingDto
- Inquiry interface
- CreateInquiryDto

### message.ts
- Message interface
- Conversation interface
- CreateMessageDto

### common.ts
- PaginationDto
- PaginatedResponse<T> (generic)
- ApiResponse<T> (generic)
- ApiError

## 🎉 You're All Set!

Your HARIS project infrastructure is ready. Run the appropriate setup script for your system and you'll have:

✅ Complete folder structure
✅ All TypeScript type definitions
✅ Environment configuration templates
✅ Docker Compose setup
✅ Ready for development

**Choose your setup method above and get started!**

---

For more information, see:
- SETUP_INSTRUCTIONS.md for detailed help
- README.md for project overview
- docker-compose.yml for Docker configuration
