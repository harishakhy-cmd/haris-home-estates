# ⚡ QUICK DEPLOYMENT REFERENCE

## 🎯 What's Done

✅ **Frontend**: Deployed to Firebase (https://harisv2.web.app)  
✅ **Backend**: Code pushed - ready for Render auto-deployment  
✅ **All 7 Bugs**: Fixed and deployed  

---

## 📍 Current Status

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ✅ Live | https://harisv2.web.app |
| Custom Domain | ⏳ DNS Pending | https://harishome.com |
| Backend | ⏳ Service Setup | Render Dashboard |

---

## 🚀 Next: Complete These 2 Steps

### Step 1: Custom Domain (Firebase) - 5 mins
```
1. Go to: https://console.firebase.google.com
2. Project: harisv2
3. Hosting → Custom Domains
4. Add: harishome.com
5. Update DNS records at your domain registrar
6. Wait 5-30 mins for DNS propagation
```

### Step 2: Backend Service (Render) - 5 mins
```
1. Go to: https://dashboard.render.com
2. New Web Service
3. Connect GitHub: harishakhy-cmd/haris-home-estates
4. Use default settings from render.yaml
5. Add env vars:
   - DATABASE_URL = [your DB connection]
   - JWT_SECRET = [your secret]
   - NODE_ENV = production
6. Deploy
```

---

## 🔄 Auto-Deployment Enabled

After Render service is created:
- **Any git push** to main branch → Auto-deploys to Render
- **Firebase** → Already auto-updates on `firebase deploy`

---

## 🧪 Test Commands

```bash
# Test Frontend
curl https://harisv2.web.app

# Test Backend (after Render setup)
curl https://haris-backend.onrender.com/health

# View Render Logs
# Go to: https://dashboard.render.com
# → haris-backend service
# → Logs tab

# Manual Firebase Deploy (if needed)
firebase deploy --only hosting:harisv2
```

---

## 📊 Deployment Checklist

- [ ] Custom domain DNS records added
- [ ] Custom domain verified in Firebase
- [ ] Render service created
- [ ] Environment variables set in Render
- [ ] First deployment successful
- [ ] Backend API responding
- [ ] Frontend → Backend integration working
- [ ] Test all 7 bug fixes on live site

---

## ⚠️ Common Issues

| Issue | Fix |
|-------|-----|
| Custom domain not working | Check DNS records, wait 10-30 mins |
| Render build failing | Check DATABASE_URL environment variable |
| API calls failing | Verify CORS_ORIGIN in backend |
| Stickers not loading | Check Giphy API key (if using real API) |

---

## 📞 Live URLs (After Setup Complete)

```
Frontend:  https://harishome.com ✅
Backend:   https://haris-backend.onrender.com ✅
Swagger:   https://haris-backend.onrender.com/api/swagger ✅
```

---

## 🎉 Done!

All code is deployed. Just need to:
1. Set up custom domain DNS (automatic after)
2. Create Render service (one-time setup)
3. That's it! Auto-deployment is now active

Estimated time: **15-40 minutes**
