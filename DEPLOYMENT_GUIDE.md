# HARIS MVP - Deployment & Production Guide

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended for Development)

```bash
# Navigate to project root
cd d:\LANDLORDS

# Create environment files
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env

# Update .env files with your actual values
# - DATABASE_URL
# - JWT_SECRET (use a strong random string)
# - CLOUDINARY credentials (if using image uploads)

# Start all services
docker-compose up -d

# Initialize database
docker-compose exec backend npx prisma migrate deploy

# Seed database with sample data
docker-compose exec backend npm run prisma:seed

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3001
# - API Docs: http://localhost:3001/api
# - Adminer (Database UI): http://localhost:8080
```

### Option 2: Traditional Node.js Deployment

**Prerequisites:**
- Node.js 18+
- PostgreSQL 15
- Redis (optional)

**Backend Setup:**
```bash
cd backend

# Install dependencies
npm install

# Create environment file
copy .env.example .env

# Edit .env with your database URL
# DATABASE_URL=postgresql://user:password@host:5432/haris_db

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npm run prisma:seed

# Build
npm run build

# Start
npm run start
```

**Frontend Setup:**
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env

# Update NEXT_PUBLIC_API_URL in .env

# Build
npm run build

# Start
npm run start
```

### Option 3: Cloud Deployment (Vercel, Railway, Heroku)

#### Deploy Frontend to Vercel

```bash
# Connect your repository to Vercel
# https://vercel.com/new

# Environment variables to set in Vercel:
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api/v1
```

#### Deploy Backend to Railway/Heroku

1. Connect repository
2. Select `backend` directory as root
3. Set environment variables:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<Railway/Heroku PostgreSQL URL>
   JWT_SECRET=<strong-random-string>
   CORS_ORIGIN=https://your-frontend-domain.com
   ```
4. Add PostgreSQL add-on
5. Deploy

## 📋 Pre-Deployment Checklist

### Security
- [ ] Change all default secrets (JWT_SECRET, DB passwords)
- [ ] Set CORS_ORIGIN to only your frontend domain
- [ ] Enable HTTPS everywhere
- [ ] Use strong database passwords
- [ ] Rotate JWT secrets regularly
- [ ] Set up SSL/TLS certificates
- [ ] Enable rate limiting
- [ ] Implement request validation

### Database
- [ ] Run all migrations: `npx prisma migrate deploy`
- [ ] Verify database backups are configured
- [ ] Test backup restoration process
- [ ] Create database indexes for performance
- [ ] Set up connection pooling (for production)

### Performance
- [ ] Enable Redis caching
- [ ] Configure CDN for static assets
- [ ] Set up image optimization (Cloudinary)
- [ ] Enable gzip compression
- [ ] Implement pagination (already done)
- [ ] Set up database query monitoring

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Create alerts for critical errors
- [ ] Monitor API response times
- [ ] Track user activity

### API Documentation
- [ ] Verify Swagger docs are accessible
- [ ] Document all endpoints
- [ ] Create API changelog
- [ ] Document authentication requirements

## 🔧 Environment Variables Guide

### Backend (.env)

```bash
# Application Settings
NODE_ENV=production                          # development, production
PORT=3001                                    # Port to run backend on
APP_NAME=HARIS Backend

# Database Configuration (CRITICAL)
DATABASE_URL=postgresql://user:pass@host:5432/db_name
DATABASE_HOST=postgres.example.com
DATABASE_PORT=5432
DATABASE_USER=haris_user
DATABASE_PASSWORD=<strong-password>
DATABASE_NAME=haris_db

# Redis (for caching and sessions)
REDIS_URL=redis://redis:6379

# JWT Configuration (CRITICAL - use strong random string)
JWT_SECRET=<generate-with: openssl rand -base64 32>
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Email Service (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<app-password>
SMTP_FROM=noreply@haris.com

# Search Service (Typesense)
TYPESENSE_HOST=http://localhost:8108
TYPESENSE_API_KEY=xyz

# Payment Providers
DGATEWAY_MODE=mock                           # mock, live
DGATEWAY_BASE_URL=https://api.dgateway.com
DGATEWAY_API_KEY=<your-api-key>
DGATEWAY_MERCHANT_ID=<your-merchant-id>
DGATEWAY_CALLBACK_URL=https://yourdomain.com/api/v1/payments/dgateway/webhook
DGATEWAY_RETURN_URL=https://yourdomain.com/profile

# Pagination
DEFAULT_PAGE=1
DEFAULT_LIMIT=20
MAX_LIMIT=100
```

### Frontend (.env.local or .env.production)

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=HARIS
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# API Configuration (CRITICAL)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_API_TIMEOUT=30000

# Authentication
NEXT_PUBLIC_AUTH_STORAGE_KEY=haris_auth_token

# Google Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-key>
NEXT_PUBLIC_GA_ID=<your-google-analytics-id>

# Firebase (optional)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```

## 📊 Performance Optimization

### Database Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_property_status ON "Property"(status);
CREATE INDEX idx_property_city ON "Property"(city);
CREATE INDEX idx_property_landlord ON "Property"("landlordId");
CREATE INDEX idx_booking_tenant ON "Booking"("tenantId");
CREATE INDEX idx_message_recipient ON "Message"("recipientId");

-- Enable connection pooling in docker-compose
# Add to PostgreSQL service:
# command: -c max_connections=200
# command: -c shared_buffers=256MB
```

### Frontend Optimization
```bash
# Enable static optimization
npm run build

# Use image optimization
# Already configured in next.config.ts
```

## 🔐 Security Hardening

### Secrets Management
```bash
# Generate secure secrets
# JWT_SECRET
openssl rand -base64 32

# Database password
openssl rand -base64 24

# Cloudinary API secret
# (Get from Cloudinary dashboard)
```

### Rate Limiting Configuration
```typescript
// Already configured in backend
// See src/app.module.ts
ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }])

// Adjust as needed:
// - ttl: time window in milliseconds
// - limit: number of requests allowed per window
```

### CORS Configuration
```bash
# Production
CORS_ORIGIN=https://yourdomain.com

# Multiple domains (comma-separated)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

## 📈 Scaling Considerations

### Horizontal Scaling
1. **Load Balancer**: Place Nginx or AWS ALB in front
2. **Multiple Backend Instances**: Run multiple instances with Docker Compose replicas
3. **Database**: Use managed PostgreSQL (RDS, Heroku Postgres)
4. **Redis**: Use managed Redis (ElastiCache, Heroku Redis)
5. **File Storage**: Use Cloudinary or AWS S3

### Vertical Scaling
1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Enable Redis caching
4. Use CDN for static files

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Error**
```bash
# Check DATABASE_URL format
# Should be: postgresql://user:password@host:port/dbname

# Verify database is running
docker-compose ps

# Test connection
docker-compose exec postgres pg_isready -U haris_user
```

**Port Already in Use**
```bash
# Change PORT in .env
PORT=3002

# Or kill process using port 3001
lsof -ti:3001 | xargs kill -9
```

**Prisma Migration Issues**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status

# Create new migration
npx prisma migrate dev --name migration_name
```

### Frontend Issues

**API Connection Error**
```bash
# Verify NEXT_PUBLIC_API_URL in .env
# Should be: http://localhost:3001/api/v1 (dev)
#        or: https://api.yourdomain.com/api/v1 (prod)

# Check browser Network tab for failed requests
# Check CORS headers in backend response
```

**Build Error**
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check TypeScript errors
npx tsc --noEmit
```

## 📞 Support Resources

- **Backend Logs**: `docker-compose logs backend`
- **Frontend Logs**: Browser DevTools Console
- **Database Studio**: `npx prisma studio`
- **API Docs**: http://localhost:3001/api

## 🎯 Next Steps

1. Set up monitoring and error tracking
2. Configure automated backups
3. Set up CI/CD pipeline
4. Create runbooks for common issues
5. Document runbooks
6. Set up team access and permissions
7. Create admin user account
8. Test backup restoration
9. Load test the application
10. Set up status page

---

**Ready to Deploy? Let's Go! 🚀**
