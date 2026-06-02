# 🚀 HARIS MVP - Quick Start Guide

Get HARIS running in minutes!

## 📋 Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org)
- **Docker & Docker Compose** - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com)

## ⚡ Start in 60 Seconds (Docker)

```bash
# 1. Navigate to project
cd d:\LANDLORDS

# 2. Setup environment files
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env

# 3. Start services (Windows)
docker-compose up

# 4. In a new terminal - setup database
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run prisma:seed
```

### ✅ You're Done! Access Here:

| Service | URL | Notes |
|---------|-----|-------|
| 🌐 Frontend | http://localhost:3000 | Marketplace UI |
| 🔌 Backend | http://localhost:3001 | API server |
| 📖 API Docs | http://localhost:3001/api | Interactive Swagger |
| 🗄️ Database | http://localhost:8080 | Adminer (Dbuser/pass in docker-compose.yml) |

---

## 👤 Test Accounts (After Seeding)

All use password: `Password123!`

| Role | Email |
|------|-------|
| Tenant | `tenant@haris.test` |
| Landlord | `landlord@haris.test` |
| Admin | `admin@haris.test` |

---

## 🛠️ Manual Setup (Non-Docker)

### Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Setup environment
copy .env.example .env

# 3. Start database (ensure PostgreSQL is running)
# Edit .env with your PostgreSQL connection string

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations
npx prisma migrate dev

# 6. Seed database (optional)
npm run prisma:seed

# 7. Start development server
npm run start:dev
# Runs on: http://localhost:3001
```

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Setup environment
copy .env.example .env.local

# 3. Start development server
npm run dev
# Runs on: http://localhost:3000
```

---

## 📂 Project Structure

```
d:\LANDLORDS/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── auth/        # Authentication
│   │   ├── users/       # User management
│   │   ├── properties/  # Property listings
│   │   ├── bookings/    # Viewing requests
│   │   ├── messages/    # Messaging
│   │   ├── admin/       # Admin panel
│   │   └── ...other modules
│   ├── prisma/          # Database schema
│   └── package.json
│
├── frontend/             # Next.js App
│   ├── src/
│   │   ├── app/         # Pages
│   │   ├── components/  # React components
│   │   └── lib/         # Utilities
│   └── package.json
│
├── shared/              # Shared TypeScript types
│   └── types/
│
└── docker-compose.yml   # Services definition
```

---

## 🎯 What Can You Do?

### As a Tenant:
- ✅ Search and browse properties
- ✅ Filter by location, price, bedrooms
- ✅ Save favorite properties
- ✅ Request property viewings
- ✅ Send inquiries to landlords
- ✅ Message landlords
- ✅ View booking history

### As a Landlord:
- ✅ Create and publish properties
- ✅ Edit/delete properties
- ✅ View inquiries and booking requests
- ✅ Confirm or reject requests
- ✅ Message tenants
- ✅ Manage property amenities
- ✅ Track property availability

### As an Admin:
- ✅ View all users and properties
- ✅ Approve/reject property listings
- ✅ Ban users
- ✅ Flag inappropriate content
- ✅ View system analytics
- ✅ Moderation dashboard

---

## 🔑 Key Features

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | ✅ Complete | JWT with refresh tokens |
| Property Listings | ✅ Complete | CRUD operations |
| Search & Filtering | ✅ Complete | By location, price, type |
| Favorites | ✅ Complete | Save/unsave properties |
| Bookings | ✅ Complete | Viewing requests |
| Messaging | ✅ Complete | User-to-user messages |
| Admin Panel | ✅ Complete | Moderation & management |
| Real-time Updates | 🔄 In Progress | Socket.io integration |
| Image Uploads | 🔄 In Progress | Cloudinary integration |
| Email Verification | ⏳ Planned | Email service setup |
| Payments | ⏳ Planned | Dgateway, Stripe, etc. |

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Windows - Find and kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### Database Connection Error

```bash
# Check PostgreSQL is running in Docker
docker-compose ps

# Check database logs
docker-compose logs postgres

# Reset database (WARNING: deletes all data)
docker-compose exec backend npx prisma migrate reset
```

### Can't Access Frontend

```bash
# Make sure frontend is running
docker-compose logs frontend

# Check if port 3000 is available
netstat -ano | findstr :3000

# Manually start if stopped
docker-compose up frontend
```

### API Requests Failing

```bash
# Check backend is running
docker-compose logs backend

# Check API docs to verify endpoints
# http://localhost:3001/api

# Verify CORS is configured
# Check backend .env CORS_ORIGIN setting
```

---

## 📚 Documentation

- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Complete feature list and API endpoints
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)** - Feature roadmap and development checklist
- **[API Documentation](http://localhost:3001/api)** - Interactive Swagger UI (when running)

---

## 🚀 Common Commands

### Docker Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Enter backend container
docker-compose exec backend bash

# Run commands in container
docker-compose exec backend npm run test
docker-compose exec backend npx prisma studio
```

### Development Commands

```bash
# Backend
npm run build          # Build for production
npm run start          # Run production build
npm run start:dev      # Development with hot reload
npm run test           # Run tests
npm run lint           # Check code style

# Frontend
npm run build          # Build for production
npm run start          # Run production build
npm run dev            # Development with hot reload
npm run lint           # Check code style

# Database
npm run prisma:studio  # Open Prisma Studio (GUI)
npm run prisma:seed    # Seed database
npm run prisma:migrate # Create migration
```

---

## 💡 Pro Tips

### 1. Use Prisma Studio to View Data
```bash
docker-compose exec backend npx prisma studio
# Opens GUI at http://localhost:5555
```

### 2. Check API Endpoints in Swagger
```
http://localhost:3001/api
```

### 3. View Real-time Logs
```bash
docker-compose logs -f
```

### 4. Debug in VS Code
- Set breakpoints in backend code
- Add to .vscode/launch.json for Node debugging
- Check browser DevTools for frontend issues

### 5. Reset Everything
```bash
# Complete reset (careful!)
docker-compose down -v  # Remove volumes
docker-compose up
docker-compose exec backend npx prisma migrate reset
```

---

## 📞 Need Help?

1. **Check the logs**: `docker-compose logs`
2. **View API docs**: http://localhost:3001/api
3. **Browse database**: http://localhost:8080 (Adminer)
4. **Check database schema**: `npx prisma studio`
5. **Read documentation**: Check IMPLEMENTATION_GUIDE.md

---

## 🎓 Next Steps

1. ✅ Get the app running (you are here!)
2. 📖 Read [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
3. 🔨 Read [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)
4. 🚀 Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
5. 💻 Start developing!

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   HARIS MVP                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐         ┌─────────────────┐ │
│  │   Next.js App    │         │   NestJS API    │ │
│  │  (Port 3000)     │◄───────►│  (Port 3001)    │ │
│  │  - Pages         │  HTTP   │  - Auth         │ │
│  │  - Components    │         │  - Properties   │ │
│  │  - State (Zustand)        │  - Bookings     │ │
│  └──────────────────┘         │  - Messages     │ │
│                               │  - Admin        │ │
│                               └─────────────────┘ │
│                                      ▲            │
│                                      │            │
│                                      ▼            │
│                               ┌─────────────────┐ │
│                               │   PostgreSQL    │ │
│                               │   Database      │ │
│                               │  (Port 5432)    │ │
│                               └─────────────────┘ │
│                                      ▲            │
│                              ┌─ ─ ─ ─┘            │
│                              │                   │
│                        ┌─────────────────┐       │
│                        │  Redis Cache    │       │
│                        │  (Port 6379)    │       │
│                        └─────────────────┘       │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## ✨ Features at a Glance

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 + React 19 | Modern, fast, SEO-friendly UI |
| **Backend** | NestJS 10 | Scalable, modular API |
| **Database** | PostgreSQL 15 | Reliable, ACID-compliant |
| **ORM** | Prisma 5 | Type-safe database access |
| **Auth** | JWT + Passport | Secure authentication |
| **Cache** | Redis 7 | Fast data access |
| **Search** | Typesense | Full-text search (optional) |
| **Files** | Cloudinary | Image hosting (optional) |
| **Container** | Docker | Easy deployment |

---

**Ready to Build? Let's Go! 🚀**

For detailed guides, see the documentation links above.
