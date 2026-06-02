# HARIS Property Creation API - Fix Guide

## Issue
Landlords are unable to add/create properties. Error indicates the API endpoint is offline or unreachable.

---

## Quick Diagnostic Checklist

### 1. **Check if Backend is Running**
```bash
# Windows - Check if process is running on port 3001
netstat -ano | findstr :3001

# If nothing shows, backend is NOT running
```

### 2. **Check Database Connection**
- Ensure PostgreSQL database is running
- Verify `DATABASE_URL` in `.env` is correct
- For Docker: `docker ps` should show `haris-postgres` container

### 3. **Verify API Accessibility**
- Test in browser: `http://localhost:3001/api/swagger`
- Should show Swagger/OpenAPI documentation
- If connection refused, backend is not running

### 4. **Check Firewall/Network**
- Ensure port 3001 is not blocked by Windows Firewall
- Ensure frontend can reach `http://localhost:3001/api/v1`

---

## Step-by-Step Fix

### Option A: Running Backend Locally (Recommended for Development)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Create `.env` file from template:**
   ```bash
   copy .env.example .env
   ```

4. **Update `.env` with database credentials:**
   ```
   PORT=3001
   DATABASE_URL=postgresql://haris_user:haris_password@localhost:5432/haris_db
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key-here
   ```

5. **Ensure PostgreSQL is running** (locally or via Docker)

6. **Run Prisma migrations:**
   ```bash
   npx prisma migrate dev
   ```

7. **Start the backend server:**
   ```bash
   npm run start:dev
   ```

   Expected output:
   ```
   [Nest] Port: 3001, GET /api/swagger ...
   ```

### Option B: Using Docker (Recommended for Production)

1. **Ensure Docker is installed and running**

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Verify all services are healthy:**
   ```bash
   docker-compose ps
   ```

   Expected output should show all services as "Up":
   - haris-postgres (healthy)
   - haris-redis (healthy)
   - haris-typesense (healthy or starting)
   - haris-backend (healthy or restarting)
   - haris-frontend (healthy or restarting)

4. **Check backend logs for errors:**
   ```bash
   docker-compose logs backend
   ```

5. **If backend keeps restarting, check database:**
   ```bash
   docker-compose logs postgres
   ```

---

## Verifying the Fix

### 1. **Test API Health**
```bash
curl http://localhost:3001/api/v1/properties
# Should return JSON with property list, not connection error
```

### 2. **Test with Swagger UI**
- Open: `http://localhost:3001/api/swagger`
- Expand `Properties` section
- Try "GET /api/v1/properties"
- Should return 200 OK

### 3. **Create Property via Swagger**
1. Get a JWT token (from Auth endpoints)
2. Click "Authorize" and paste token
3. Try POST /api/v1/properties
4. Should return 201 Created

### 4. **Test from Frontend**
1. Navigate to Landlord Dashboard
2. Create new property form
3. Fill in required fields
4. Click "Save listing"
5. Should see success message

---

## Common Issues & Solutions

### Issue: "Connection refused" or "ERR_FAILED_TO_FETCH"
**Cause:** Backend not running or port 3001 not accessible
**Solution:**
- Start backend: `npm run start:dev`
- Check port: `netstat -ano | findstr :3001`
- Check firewall settings

### Issue: "Bad Request" (400 errors)
**Cause:** Validation error in request payload
**Solution:**
- Check browser console for error details
- Ensure all required fields are filled
- Verify bedrooms/bathrooms are numbers
- Check API response error message

### Issue: "Unauthorized" (401 error)
**Cause:** JWT token expired or invalid
**Solution:**
- Sign out and sign in again
- Check browser localStorage for `haris_token`
- Token should be a valid JWT

### Issue: "Forbidden" (403 error)
**Cause:** Landlord account not approved by admin
**Solution:**
- Admin must approve landlord in Admin Dashboard
- Go to `/admin` > Users > Approve landlord

### Issue: "Internal Server Error" (500)
**Cause:** Backend crash or database issue
**Solution:**
- Check backend logs: `docker-compose logs backend`
- Ensure database is running
- Check database permissions
- Run migrations: `npx prisma migrate dev`

---

## API Endpoint Details

**Property Creation Endpoint:**
- **Method:** POST
- **URL:** `/api/v1/properties`
- **Auth:** Required (Bearer JWT token)
- **Role:** LANDLORD or ADMIN
- **Body:**
```json
{
  "title": "2-Bedroom Apartment",
  "price": 500000,
  "city": "Kampala",
  "description": "Beautiful apartment in the city center",
  "propertyType": "APARTMENT",
  "bedrooms": 2,
  "bathrooms": 1,
  "address": "123 Main St",
  "imageUrls": ["https://..."],
  "youtubeUrls": [],
  "amenityNames": ["WiFi", "Parking"],
  "nearbyFacilities": ["School", "Clinic"]
}
```

**Response (201):**
```json
{
  "id": "cuid_here",
  "slug": "2-bedroom-apartment-xyz",
  "title": "2-Bedroom Apartment",
  "status": "PENDING_REVIEW",
  ...other fields
}
```

---

## Debug Mode

To enable detailed error logging:

1. **In backend `.env`:**
   ```
   LOG_LEVEL=debug
   NODE_ENV=development
   ```

2. **Check logs:**
   ```bash
   docker-compose logs backend --follow
   ```

3. **Test property creation:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/properties \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test",
       "price": 100,
       "city": "Test City",
       "description": "Test",
       "propertyType": "APARTMENT",
       "bedrooms": 1,
       "bathrooms": 1,
       "address": "Test Addr"
     }'
   ```

---

## Environment Files

### Frontend .env.local
```
NEXT_PUBLIC_APP_NAME=HARIS
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Backend .env
```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://haris_user:haris_password@localhost:5432/haris_db
REDIS_URL=redis://localhost:6379
TYPESENSE_HOST=http://localhost:8108
TYPESENSE_API_KEY=xyz
JWT_SECRET=change_me_in_production
```

---

## Support Commands

```bash
# Check backend status
docker-compose ps backend

# Restart backend
docker-compose restart backend

# View backend logs
docker-compose logs backend -f

# Stop all services
docker-compose down

# Start fresh (clears volumes)
docker-compose down -v
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate dev

# Seed database
docker-compose exec backend npx prisma db seed

# Check if ports are free
netstat -ano | findstr :3001
netstat -ano | findstr :3000
netstat -ano | findstr :5432
```

---

## Success Indicators

✅ Backend running and responding at `http://localhost:3001/api/swagger`
✅ Database connected and migrations applied
✅ Landlord can create property without errors
✅ Property appears in landlord's listing
✅ Admin can approve property
✅ Property visible on marketplace

---

## Next Steps

1. Follow Quick Diagnostic Checklist
2. Choose and follow Option A or B above
3. Run Verification tests
4. If issues persist, check Common Issues section
5. Enable Debug Mode and share logs
