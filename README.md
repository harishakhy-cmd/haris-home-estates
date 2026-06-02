# HARIS - Housing And Rental Intelligent System

HARIS is a production-minded MVP rental marketplace for landlords, tenants, property managers, admins, and rental seekers. It includes a NestJS API, PostgreSQL/Prisma data model, JWT role-based auth, marketplace listings, dashboards, moderation, payment intent scaffolding, and a Next.js frontend.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, ShadCN-style primitives, Framer Motion, Axios, TanStack Query, Zustand
- Backend: NestJS, TypeScript, PostgreSQL, Prisma, JWT, Helmet, CORS, throttling, Swagger
- Infrastructure: Docker Compose, Redis, Typesense, Cloudinary-ready environment variables

## Apps

```text
backend/   NestJS REST API and Prisma schema
frontend/  Next.js marketplace UI and dashboards
shared/    Shared TypeScript contracts
```

## Quick Start

```bash
npm install
npm run prisma:generate -w backend
docker compose up -d postgres redis typesense
npm run prisma:migrate -w backend
npm run prisma:seed -w backend
npm run dev
```

Frontend: http://localhost:3000  
Backend API: http://localhost:3001/api/v1  
Swagger docs: http://localhost:3001/api

Seeded accounts use password `Password123!`:

- `tenant@haris.test`
- `landlord@haris.test`
- `admin@haris.test`

## Features Implemented

- JWT registration/login with hashed passwords
- Roles: `TENANT`, `LANDLORD`, `ADMIN`
- Property listing CRUD with images, amenities, units, availability, moderation statuses
- Search/filter API by keyword, city, type, price, bedrooms, and bathrooms
- Property detail pages with gallery, amenities, landlord profile, inquiry and viewing UI
- Favorites, bookings, inquiries, messages, reviews
- Admin analytics and listing moderation endpoints
- Payment intent structure for MTN MoMo, Airtel Money, Flutterwave, and Stripe
- Responsive marketplace homepage, tenant dashboard, landlord dashboard, admin panel
- Docker Compose for PostgreSQL, Redis, Typesense, backend, and frontend

## Verification

```bash
npm run build -w shared
npm run prisma:generate -w backend
npm run build -w backend
npm run build -w frontend
```

## Environment

Copy and customize:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Set a strong `JWT_SECRET` before production. Cloudinary and provider payment credentials are intentionally environment-driven so integrations can be activated without changing domain code.
