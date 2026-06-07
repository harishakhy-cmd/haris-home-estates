# Phase 10: Deployment & Migration Guide

## Overview
**Status**: READY TO START  
**Estimated Duration**: 4-6 hours  
**Priority**: HIGH - Final phase before production

---

## Prerequisites Checklist

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] npm 9+ or yarn
- [ ] PostgreSQL 14+ running
- [ ] Git configured
- [ ] Firebase project created
- [ ] Render account active
- [ ] Environment variables prepared

### Code Quality
- [x] TypeScript strict mode passes (verified)
- [x] ESLint passes (verified)
- [x] All tests passing (verified)
- [x] No console errors in build (verified)
- [x] Frontend: 13.3s compile, exports successfully
- [x] Backend: NestJS build successful

### Database
- [ ] PostgreSQL running locally
- [ ] DATABASE_URL environment variable set
- [ ] Prisma migrations up to date
- [ ] Backup strategy in place

---

## Phase 10 Task Breakdown

### Stage 1: Environment Configuration (30 minutes)

#### 1.1 Backend Environment Variables

Create `.env.production` in `backend/`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/landlords_prod

# JWT
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# Firebase
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_PRIVATE_KEY=<private-key>
FIREBASE_CLIENT_EMAIL=<client-email>

# Socket.IO
SOCKET_IO_CORS_ORIGIN=https://landlords.example.com
SOCKET_IO_PORT=3001

# Frontend
FRONTEND_URL=https://landlords.example.com

# API
API_PORT=3000
API_HOST=0.0.0.0

# Render
RENDER_SERVICE_ID=<service-id>

# Security
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# Logging
LOG_LEVEL=info
NODE_ENV=production
```

#### 1.2 Frontend Environment Variables

Create `.env.production` in `frontend/`:

```env
# API
NEXT_PUBLIC_API_URL=https://api.landlords.example.com
NEXT_PUBLIC_SOCKET_URL=https://landlords.example.com

# Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<auth-domain>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<storage-bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>

# Features
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Environment
NEXT_PUBLIC_ENV=production
```

#### 1.3 Generate Secrets

```bash
# Generate JWT secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key
openssl rand -base64 32
```

### Stage 2: Database Setup (1 hour)

#### 2.1 Database Migration

```bash
# In backend directory
cd backend

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Verify schema
npx prisma db push
```

#### 2.2 Verify Database Connection

```bash
# Test connection
npx prisma studio

# You should see all models loaded
```

#### 2.3 Seed Initial Data (Optional)

```bash
# Create seed file: prisma/seed.ts
npx prisma db seed
```

### Stage 3: Backend Deployment to Render (1.5 hours)

#### 3.1 Prepare Backend for Render

```bash
# In backend directory
cd backend

# Create render.yaml for Render deployment
# (Already present in repo)

# Build locally to verify
npm run build

# Check dist/ directory created
ls -la dist/
```

#### 3.2 Deploy Backend to Render

```bash
# Login to Render dashboard
# https://dashboard.render.com

# Click "New +" → "Web Service"
# Select "Deploy an existing service from a repository"

# Configure:
- Repository: your-github-repo
- Branch: main
- Build Command: npm run build
- Start Command: npm run start:prod
- Environment: Node
- Plan: Starter ($7/month) or higher
- Environment Variables: Add all from .env.production
```

#### 3.3 Verify Backend Deployment

```bash
# Once deployed, test health endpoint
curl https://backend-service.onrender.com/health

# Should respond with 200 OK

# Check logs in Render dashboard
# Logs → Service logs
```

#### 3.4 Enable HTTPS

```
Render automatically provides HTTPS with free SSL certificate
No additional configuration needed
```

### Stage 4: Database Backup & Migration (30 minutes)

#### 4.1 Create Production Database

```bash
# Option 1: Use Render PostgreSQL
# In Render dashboard: Create new PostgreSQL instance
# Instance details:
  - Database: landlords_prod
  - User: landlords_admin
  - Copy connection string to DATABASE_URL

# Option 2: Use external PostgreSQL (AWS RDS, DigitalOcean, etc.)
```

#### 4.2 Run Production Migrations

```bash
# Set DATABASE_URL to production database
export DATABASE_URL="postgresql://user:password@host:5432/landlords_prod"

# Run migrations
npx prisma migrate deploy

# Verify migrations applied
npx prisma db push --force-reset (ONLY in fresh database)
```

### Stage 5: Frontend Deployment to Firebase (1 hour)

#### 5.1 Build Frontend for Production

```bash
cd frontend

# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not done)
firebase init hosting

# Build Next.js
npm run build

# This creates:
# - frontend/.next/
# - frontend/out/
```

#### 5.2 Deploy to Firebase Hosting

```bash
# Deploy
firebase deploy --only hosting

# Deployment will show:
- Hosting URL
- Deployment ID
- Deployment time

# Example: https://landlords-xxxx.web.app
```

#### 5.3 Configure Custom Domain (Optional)

```
Firebase Hosting → Settings → Custom Domains
Add your custom domain: landlords.example.com

Follow DNS instructions from Firebase
```

#### 5.4 Enable HTTPS

```
Firebase Hosting automatically provides HTTPS
Free Google-managed SSL certificate
Auto-renews every 90 days
```

### Stage 6: Service Worker & PWA Deployment (30 minutes)

#### 6.1 Verify Service Worker

```bash
# In production site, open DevTools
# Application → Service Workers

# Should show: ServiceWorker (active)
Status: running

# Check Cache Storage
Application → Cache Storage → should see multiple caches
```

#### 6.2 Verify PWA Installation

**On Chrome/Edge**:
```
1. Open DevTools
2. Application → Manifest
3. Check: Start URL, Display, Icons
4. Should see "Install" button in address bar
```

**On iOS Safari**:
```
1. Open site in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. App should appear on home screen
```

#### 6.3 Test Offline Functionality

```bash
# Open DevTools
# Network → Offline (check the checkbox)
# Refresh page
# Should see offline.html from service worker
# Navigation should work with cached data
```

### Stage 7: Environment Configuration (30 minutes)

#### 7.1 API CORS Setup

```typescript
// In backend/src/main.ts
app.enableCors({
  origin: [
    'https://landlords.example.com',
    'https://www.landlords.example.com',
    'https://landlords-xxxx.web.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

#### 7.2 Socket.IO CORS Setup

```typescript
// In backend/src/gateways
@WebSocketGateway({
  cors: {
    origin: 'https://landlords.example.com',
    credentials: true,
  },
  namespace: '/'
})
```

#### 7.3 Update Frontend API URLs

```typescript
// frontend/.env.production
NEXT_PUBLIC_API_URL=https://backend-service.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://landlords.example.com
```

### Stage 8: Testing & Validation (1 hour)

#### 8.1 Smoke Tests

```bash
# Test health endpoint
curl https://backend-service.onrender.com/health

# Test API endpoints
curl https://backend-service.onrender.com/api/users/me \
  -H "Authorization: Bearer <token>"

# Test WebSocket connection
# Open frontend → DevTools → Network → WS
# Should see Socket.IO connection established
```

#### 8.2 Functionality Tests

```
User Registration:
1. Visit https://landlords.example.com
2. Create account with email/password
3. Verify account created in database

User Login:
1. Login with credentials
2. Verify JWT token received
3. Check token in localStorage

Real-Time Features:
1. Open chat with another user
2. Send message → should appear instantly
3. Check message in database

Socket.IO Connection:
1. Check DevTools → Network → WS
2. Should see connection to /socket.io
3. Status: 101 Switching Protocols

PWA Installation:
1. Install app on mobile
2. App should work offline with cached data
3. Push notifications should work
```

#### 8.3 Performance Tests

```bash
# Frontend PageSpeed Insights
https://pagespeed.web.dev

# Backend latency check
curl -w "@curl-format.txt" -o /dev/null -s https://api.example.com

# Socket.IO latency
# In DevTools: Monitor WebSocket ping/pong
# Should be <100ms on same region
```

#### 8.4 Security Tests

```
SSL/TLS Check:
- https://www.ssllabs.com/ssltest/
- Both backend and frontend should get A+

Security Headers:
- https://securityheaders.com/
- Check for CSP, X-Frame-Options, etc.

OWASP Top 10:
1. Injection - InputValidationService prevents
2. Broken Auth - JWT + WsJwtGuard verified
3. XSS - ValidationService sanitizes
4. Broken Access - AuthorizationService checks
5. Rate Limiting - RateLimitService enforces
```

### Stage 9: Monitoring & Logging (30 minutes)

#### 9.1 Setup Render Monitoring

```
Render Dashboard → Services → backend
Metrics:
- CPU Usage
- Memory Usage
- Requests/min
- Error Rate

Logs:
- Application logs
- Build logs
- Deployment logs
```

#### 9.2 Setup Firebase Monitoring

```
Firebase Console → Performance
Monitors:
- Page load time
- First Contentful Paint
- Largest Contentful Paint
- Cumulative Layout Shift

Crash Analytics:
- Reports JavaScript errors
- Stack traces
- Affected users
```

#### 9.3 Database Monitoring

```
PostgreSQL Metrics (via Render):
- Active connections
- Query performance
- Disk usage
- Backup status

Set up alerts for:
- High memory usage
- High error rate
- Slow queries
```

### Stage 10: Post-Deployment Tasks (30 minutes)

#### 10.1 Update DNS Records

```bash
# Point domain to Firebase Hosting
# In your DNS provider (Namecheap, GoDaddy, etc.)

# CNAME Record:
# Name: www
# Type: CNAME
# Value: landlords.firebaseapp.com

# Or A Record (for root domain):
# Type: A
# Value: <Firebase IP address>

# Verify DNS propagation
nslookup landlords.example.com
```

#### 10.2 Update App Configuration

```typescript
// Update app URLs everywhere
// frontend/.env.production
// backend/.env.production
// Firebase config
// Render service variables
```

#### 10.3 Setup Backups

```bash
# Database backups
# Render PostgreSQL: Automatic daily backups included

# Firebase Backups
# Google Cloud Console → Backup and Disaster Recovery
# Enable automated backups

# Manual backups
pg_dump -U landlords_admin -h host -d landlords_prod > backup.sql
```

#### 10.4 Documentation

Create deployment documentation:
```
1. How to deploy changes
2. Emergency rollback procedure
3. Database recovery steps
4. Monitoring dashboards
5. Contact information
```

---

## Rollback Procedure

### If Issues Occur

```bash
# Option 1: Revert to previous deployment
# Render Dashboard → Services → backend → Deployment
# Click previous deployment → Deploy

# Option 2: Rollback database
# PostgreSQL restore from backup
pg_restore -U landlords_admin -h host -d landlords_prod backup.sql

# Option 3: Rollback frontend
# Firebase Hosting → Deployments
# Click previous deployment → Revert
```

---

## Monitoring Commands

```bash
# Check backend health
watch -n 5 'curl -s https://backend.onrender.com/health'

# Check database connection
psql -U landlords_admin -h host -d landlords_prod -c "SELECT NOW();"

# Check Socket.IO connections
# Frontend DevTools → Network → WS tab
# Should show connection established

# Monitor logs
# Render: tail -f <service-logs>
# Firebase: Firebase Console → Logs
```

---

## Troubleshooting

### Backend won't start
```
1. Check DATABASE_URL
2. Check JWT_SECRET
3. Check FIREBASE_* env vars
4. Check logs: Render Dashboard → Logs
5. Run npm run build locally to debug
```

### Frontend won't load
```
1. Check NEXT_PUBLIC_API_URL
2. Check NEXT_PUBLIC_SOCKET_URL
3. Check Firebase config
4. Open DevTools → Console for errors
5. Check Firebase Hosting Logs
```

### Socket.IO connection fails
```
1. Check CORS origin in both frontend and backend
2. Check SOCKET_IO_CORS_ORIGIN env var
3. Check WebSocket connection in DevTools
4. Verify HTTPS for both frontend and backend
5. Check firewall rules
```

### Database migration fails
```
1. Check DATABASE_URL format
2. Check database permissions
3. Run: npx prisma migrate status
4. Run: npx prisma migrate resolve --rolled-back <migration-name>
5. Re-run: npx prisma migrate deploy
```

---

## Success Criteria

- [ ] Backend deployed to Render and responding to requests
- [ ] Frontend deployed to Firebase and loading
- [ ] Database migrations complete and data accessible
- [ ] Socket.IO WebSocket connections established
- [ ] Push notifications working
- [ ] PWA installable on mobile
- [ ] HTTPS working for both frontend and backend
- [ ] All environment variables configured
- [ ] Monitoring dashboard shows healthy metrics
- [ ] SSL/TLS scores A+ on ssllabs.com

---

## Go-Live Checklist

Before making production live:

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Backup strategy in place
- [ ] Monitoring setup complete
- [ ] Team trained on deployment
- [ ] DNS configured
- [ ] Custom domain working
- [ ] SSL certificates valid
- [ ] Database backed up
- [ ] Rollback plan documented
- [ ] Support team ready
- [ ] Announcement prepared
- [ ] Analytics tracking enabled

---

## Post-Deployment Monitoring (First 24 hours)

Monitor these metrics closely:

1. **Error Rate**: Should be <0.1%
2. **Response Time**: API should respond <200ms
3. **WebSocket Latency**: Should be <100ms
4. **Database Connections**: Should be <20
5. **Memory Usage**: Should be <80%
6. **CPU Usage**: Should be <70%
7. **Request Rate**: Monitor for unusual spikes

If any metric goes critical:
1. Check Render/Firebase logs
2. Check database status
3. Consider scaling up resources
4. Contact support team

---

## Estimated Timeline

| Stage | Task | Duration |
|-------|------|----------|
| 1 | Environment Configuration | 30 min |
| 2 | Database Setup | 1 hour |
| 3 | Backend Deployment | 1.5 hours |
| 4 | Database Migration | 30 min |
| 5 | Frontend Deployment | 1 hour |
| 6 | PWA Setup | 30 min |
| 7 | Configuration | 30 min |
| 8 | Testing | 1 hour |
| 9 | Monitoring Setup | 30 min |
| 10 | Post-Deployment | 30 min |
| | **TOTAL** | **~8 hours** |

---

## Success Message

Once Phase 10 is complete:

```
🚀 LANDLORDS Application Successfully Deployed! 🚀

Frontend: https://landlords.example.com
Backend API: https://api.landlords.example.com
Status: ✅ ALL SYSTEMS OPERATIONAL

Features:
✅ Real-Time Messaging (Socket.IO)
✅ Audio/Video Calling (WebRTC)
✅ Push Notifications (Firebase Cloud Messaging)
✅ Voice Messages (MediaRecorder)
✅ Media Sharing (Drag & Drop)
✅ PWA Installation (iOS/Android)
✅ Real-Time Dashboard (Live Updates)
✅ Mobile Device Access (Camera/Mic/Geolocation)
✅ Security Implementation (Rate Limiting, Validation, Authorization)
✅ Database Persistence (PostgreSQL)

10/10 Phases Complete - Production Ready! 🎉
```

---

## Next Steps After Deployment

1. Monitor production for 24 hours
2. Gather user feedback
3. Plan additional features:
   - Analytics dashboard
   - Admin panel enhancements
   - Advanced search
   - Recommendations engine
   - Multi-language support
4. Security audits (quarterly)
5. Performance optimization (ongoing)
6. Feature roadmap planning

---

**Ready for Phase 10? Let's deploy!** 🚀
