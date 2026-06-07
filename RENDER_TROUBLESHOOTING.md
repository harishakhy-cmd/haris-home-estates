# 🔧 Render Backend Troubleshooting Guide

Quick reference for diagnosing and fixing common Render deployment issues.

---

## 📊 Current Status

**Backend Service**: `haris-backend`  
**Platform**: Render.com  
**Status**: Re-deploying with fixes  
**Expected**: Online in 5-10 minutes

---

## 🚨 Error: "Exited with status 1"

### Symptom
Service keeps failing with multiple restart attempts, then rollback.

### Common Causes & Fixes

#### 1. Missing Environment Variables ✅ FIXED
**Symptom**: `Environment validation error: ...`

**Check**: Render dashboard → haris-backend → Environment
```
Required variables:
✅ DATABASE_URL (from Render PostgreSQL)
✅ JWT_SECRET (from Render secrets)
✅ JWT_ACCESS_EXPIRATION (default: 15m)
✅ JWT_REFRESH_EXPIRATION (default: 7d)
✅ CORS_ORIGIN (default: https://harisv2.web.app)
✅ NODE_ENV (default: production)
✅ PORT (default: 3000)
```

**Fix**: Update render.yaml with all required vars (ALREADY DONE ✅)

---

#### 2. Prisma Not Generated
**Symptom**: `Cannot find module '@prisma/client'`

**Check**: Build logs should show:
```
npm install
npx prisma generate  ← Should see this
npm run build
```

**Fix**: Added to build command in render.yaml (ALREADY DONE ✅)

---

#### 3. Wrong Working Directory
**Symptom**: `Cannot find module 'dist/main.js'` or build fails

**Check**: Start command should be:
```
cd backend && npx prisma db push --skip-generate && node dist/main.js
```

**Fix**: Updated in render.yaml (ALREADY DONE ✅)

---

#### 4. Database Connection Failed
**Symptom**: `ECONNREFUSED` or `getaddrinfo ENOTFOUND`

**Check**: 
1. Render PostgreSQL service exists: https://dashboard.render.com/d/srv-xxx
2. DATABASE_URL is correct format:
   ```
   postgresql://user:password@host:port/dbname?sslmode=require
   ```

**Fix**:
1. Create PostgreSQL database if missing:
   - Dashboard → New → PostgreSQL
   - Name: `haris-db`
   - Region: Same as backend
2. Wait 2-3 minutes for database to initialize
3. Trigger redeployment: Push new commit

---

#### 5. Port Binding Issue
**Symptom**: `EADDRINUSE: address already in use :::3000`

**Check**: PORT must be 3000 (Render default for free tier)

**Fix**: Verify in render.yaml:
```yaml
envVars:
  - key: PORT
    value: 3000  ← Must be exactly 3000
```

---

## 🔍 How to Diagnose

### Check Logs
1. Go to https://dashboard.render.com
2. Click service `haris-backend`
3. Click "Logs" tab
4. Look for error messages:
   - `Error` = problem to fix
   - `Warning` = optional feature disabled (OK)
   - `listening on port 3000` = SUCCESS ✅

### Check Build Details
1. Dashboard → haris-backend → "Deploys" tab
2. Click most recent deploy
3. Check:
   - ✅ Build phase succeeded
   - ✅ Start phase succeeded
   - ✅ Shows "Instance is running"

### Test Endpoint
```bash
curl https://haris-backend.onrender.com/health
```
Expected response: `{"status":"healthy"}`

---

## 🔨 Manual Fixes

### If Backend Still Failing After 10 Minutes

**Option 1: Trigger Manual Redeployment**
1. Dashboard → haris-backend
2. Click "Manual Deploy" button
3. Wait 5-10 minutes

**Option 2: Check & Fix Render Secrets**
1. Dashboard → haris-backend
2. Click "Environment" tab
3. Verify `JWT_SECRET` exists (created automatically? Check if needs manual setup)
4. If missing:
   - Go to Account → Secrets
   - Create: `jwt-secret` with random 32-char hex value
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

**Option 3: Rebuild from Source**
1. Local machine: `cd D:\LANDLORDS`
2. Test build locally:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run build
   ```
3. If build fails locally, fix error before pushing
4. Push fix: `git push origin main`

---

## 📝 Environment Variable Checklist

| Variable | Required | Source | Current Value |
|----------|----------|--------|---|
| DATABASE_URL | ✅ Yes | Render PostgreSQL | `postgresql://...` |
| JWT_SECRET | ✅ Yes | Render Secrets | `*****` |
| NODE_ENV | ✅ Yes | render.yaml | `production` |
| PORT | ✅ Yes | render.yaml | `3000` |
| JWT_ACCESS_EXPIRATION | ✅ Yes | render.yaml | `15m` |
| JWT_REFRESH_EXPIRATION | ✅ Yes | render.yaml | `7d` |
| CORS_ORIGIN | ✅ Yes | render.yaml | `https://harisv2.web.app` |
| FRONTEND_URL | ✅ Yes | render.yaml | `https://harisv2.web.app` |
| SOCKET_IO_CORS | ✅ Yes | render.yaml | `https://harisv2.web.app` |
| LOG_LEVEL | ⚠️ Optional | render.yaml | `info` |
| REDIS_URL | ⚠️ Optional | - | Empty (OK) |
| CLOUDINARY_* | ⚠️ Optional | - | Empty (OK) |
| FIREBASE_* | ⚠️ Optional | - | Empty (OK) |

---

## ✅ Success Indicators

Service is healthy when:
1. ✅ Logs show: `Application is running on port 3000`
2. ✅ No repeated "Instance failed" messages
3. ✅ Status shows "Running" (green)
4. ✅ Health check responds: `{"status":"healthy"}`
5. ✅ WebSocket connects from frontend
6. ✅ No error logs in Render dashboard

---

## 🔄 Re-deployment Steps

If all else fails:

1. **Pull latest code**
   ```bash
   git pull origin main
   ```

2. **Verify build locally**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run build
   npm run start  # Should start on port 3000
   ```

3. **Make a dummy change**
   ```bash
   echo "# test" >> README.md
   git add README.md
   git commit -m "test: trigger redeployment"
   git push origin main
   ```

4. **Monitor Render**
   - Dashboard shows new deploy starting
   - Wait for completion
   - Check logs for errors

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **NestJS Docs**: https://docs.nestjs.com
- **Prisma Docs**: https://www.prisma.io/docs
- **Socket.IO Docs**: https://socket.io/docs

---

## 💡 Pro Tips

1. **Always test locally first**
   - Build and run locally to catch errors early
   - Render failures are usually logic issues, not deployment issues

2. **Monitor logs in real-time**
   - Render dashboard updates live
   - Keep tab open during deployment

3. **Database schema changes**
   - After any Prisma schema changes:
   - Run: `npx prisma generate` (in build)
   - Run: `npx prisma db push` (in start)
   - This syncs database

4. **Rate limiting**
   - Current config: 100 requests per 60 seconds
   - Adjust if needed in render.yaml

5. **CORS issues**
   - If frontend can't reach backend:
   - Check CORS_ORIGIN matches frontend URL
   - Current: `https://harisv2.web.app`

---

**Last Updated**: 2026-06-08 00:39 GMT+3  
**Status**: Fixes applied, re-deployment in progress  
**Expected**: Backend online in 5-10 minutes
