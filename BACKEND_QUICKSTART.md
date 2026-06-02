# NestJS Backend Setup - Quick Reference

## 🚀 Quick Start (Choose One)

### Option 1: Windows (Fastest)
```bash
create_backend_structure.bat
```
Just double-click the file!

### Option 2: Node.js (Any OS)
```bash
node create_backend_dirs.js
```

### Option 3: Python (Any OS)
```bash
python create_backend_dirs.py
```

### Option 4: Bash/WSL/Git Bash
```bash
bash create_backend_structure.sh
```

---

## 📁 Directory Structure Being Created

```
d:\LANDLORDS\backend/
├── src/                                 # Source code
│   ├── admin/                          # Admin functionality
│   ├── auth/                           # Authentication & authorization
│   ├── bookings/                       # Property booking system
│   ├── common/                         # Shared utilities
│   │   ├── decorators/                # Custom decorators
│   │   ├── exceptions/                # Custom exceptions
│   │   ├── guards/                    # Authentication/authorization guards
│   │   └── middleware/                # Request/response middleware
│   ├── database/                      # Database utilities
│   ├── favorites/                     # Favorites/wishlist
│   ├── messaging/                     # Messaging system
│   ├── properties/                    # Property listings
│   ├── search/                        # Search functionality
│   └── users/                         # User management
├── prisma/                            # ORM configuration
└── test/                              # Test files
```

---

## 📚 Setup Files Included

| File | Purpose | How to Use |
|------|---------|-----------|
| `create_backend_structure.bat` | Windows batch file | Double-click or run in cmd.exe |
| `create_backend_dirs.js` | Node.js script | `node create_backend_dirs.js` |
| `create_backend_dirs.py` | Python script | `python create_backend_dirs.py` |
| `create_backend_structure.sh` | Bash script | `bash create_backend_structure.sh` |
| `BACKEND_SETUP_INSTRUCTIONS.md` | Step-by-step guide | Read for detailed steps |
| `BACKEND_DIRECTORY_SETUP_GUIDE.md` | Complete reference | Read for full documentation |
| `BACKEND_SETUP_SUMMARY.md` | Quick reference | Read for overview |

---

## 🎯 What Each Module Should Contain

### Auth Module
- JWT strategy implementation
- Login/Register endpoints
- Token refresh logic
- Role-based access control

### Users Module
- User CRUD operations
- Profile management
- User preferences

### Properties Module
- Property CRUD operations
- Property images/gallery
- Property search filters
- Availability management

### Bookings Module
- Create/manage viewings
- Booking confirmations
- Inquiry management

### Messaging Module
- Real-time messaging
- Conversation management
- Message notifications

### Search Module
- Advanced property search
- Filter/sorting logic
- Search analytics

### Favorites Module
- Add/remove favorites
- Favorites list management

### Admin Module
- Admin dashboard logic
- User management
- Property moderation
- Analytics

### Common Module
- Shared decorators (@CurrentUser, @Roles, @Public)
- Auth guards (JwtAuthGuard, RolesGuard)
- Error handling middleware
- Custom exceptions

### Database Module
- Prisma migrations
- Seeders
- Database utilities

---

## ✅ Verification

After running a setup script, verify the directories were created:

**Windows CMD:**
```cmd
dir d:\LANDLORDS\backend /s
```

**PowerShell:**
```powershell
Get-ChildItem -Path 'D:\LANDLORDS\backend' -Recurse
```

**Bash/Git Bash:**
```bash
find /d/LANDLORDS/backend -type d | sort
```

---

## 📦 Next: Install Dependencies

After creating directories, run:

```bash
cd d:\LANDLORDS\backend

# Initialize Node project
npm init -y

# Install NestJS core
npm install @nestjs/core @nestjs/common @nestjs/platform-express

# Install auth/security
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local

# Install ORM
npm install @nestjs/typeorm typeorm @prisma/client prisma

# Install validation
npm install class-validator class-transformer

# Install security
npm install bcryptjs helmet cors

# Install development dependencies
npm install --save-dev @types/node @types/express typescript ts-node ts-loader
npm install --save-dev @nestjs/cli
```

---

## 🔧 Initialize Prisma

```bash
cd backend
npx prisma init
```

Edit `prisma/schema.prisma` with your database connection string and models.

---

## 📝 Environment Variables

Create `backend/.env.local`:

```env
# Application
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/landlords_db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=15m

# Other configs
ALLOW_ORIGINS=http://localhost:3000
```

---

## 📖 Architecture Pattern

Each NestJS module follows this structure:

```
src/
└── feature/
    ├── feature.module.ts           # Module decorator
    ├── feature.controller.ts       # Routes
    ├── feature.service.ts          # Business logic
    ├── dto/                        # Data Transfer Objects
    │   ├── create-feature.dto.ts
    │   └── update-feature.dto.ts
    ├── entities/                   # Database entities
    │   └── feature.entity.ts
    ├── guards/                     # Auth guards
    └── decorators/                 # Custom decorators
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| PowerShell not found | Use Node.js or batch file method |
| Python not installed | Use Node.js or batch file method |
| Permission denied (bash) | Run: `chmod +x create_backend_structure.sh` |
| Directories already exist | Scripts will skip existing directories safely |
| Database connection fails | Check DATABASE_URL in .env.local |

---

## 📞 Support

For NestJS documentation: https://docs.nestjs.com
For Prisma documentation: https://www.prisma.io/docs

---

**Created:** 2024  
**Project:** LANDLORDS - Property Rental Platform  
**Backend Framework:** NestJS  
**Database ORM:** Prisma  
**Database:** PostgreSQL (recommended)
