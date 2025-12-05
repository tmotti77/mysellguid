# MySellGuid - Quick Deployment Guide

## Status: Backend Build Verified ✅

Your backend compiles successfully and is ready for deployment.

---

## 🚀 DEPLOYMENT STEPS (Do These Now)

### Step 1: Get Your Database URL

1. Open: https://dashboard.render.com
2. Click on **mysellguid-db** (your PostgreSQL database)
3. Scroll to **Connections**
4. **Copy** the **Internal Database URL**
   - It looks like: `postgres://mysellguid_user:xxx@dpg-xxx.oregon-postgres.render.com/mysellguid`

### Step 2: Get Your Redis URL

1. In Render Dashboard, click **mysellguid-redis**
2. **Copy** the **Internal Redis URL**
   - It looks like: `redis://red-xxx:6379`

### Step 3: Add Environment Variables

1. Go to **mysellguid-api** service
2. Click **Environment** tab (left sidebar)
3. Click **Add Environment Variable** and add:

```
DATABASE_URL = [paste your Internal Database URL here]
REDIS_URL = [paste your Internal Redis URL here]
SYNC_DATABASE = true
```

4. Click **Save Changes**
5. Wait for redeploy to start (watch the logs)

### Step 4: Enable PostGIS

1. Go back to **mysellguid-db**
2. Click **Shell** tab
3. Run these commands:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

4. Type `\q` to exit

### Step 5: Verify It Works

1. Wait for deploy to finish (2-3 minutes)
2. Visit: https://mysellguid-api.onrender.com/api/health
3. You should see: `{"status":"ok",...}`

### Step 6: Seed Test Data

Visit this URL in your browser:
```
https://mysellguid-api.onrender.com/api/seed
```

You'll see: `{"users":2,"stores":5,"sales":10}`

### Step 7: IMPORTANT - Remove SYNC_DATABASE

After successful deployment:
1. Go to mysellguid-api > Environment
2. **Delete** the `SYNC_DATABASE` variable
3. Save changes

This prevents accidental table recreation.

---

## 🧪 Test Your Deployment

### API Health Check
https://mysellguid-api.onrender.com/api/health

### Swagger Documentation
https://mysellguid-api.onrender.com/api/docs

### Test Geospatial Search
https://mysellguid-api.onrender.com/api/sales/nearby?lat=32.15&lng=34.91&radius=10000

### Test Login (via Swagger)
1. Go to Swagger docs
2. Find `POST /api/auth/login`
3. Click "Try it out"
4. Enter:
```json
{
  "email": "test@mysellguid.com",
  "password": "password123"
}
```

---

## 📱 Test Mobile App

Your mobile app is already configured! Just run:

```powershell
cd mobile
npx expo start
```

Then scan the QR code with Expo Go app.

**Test credentials:**
- Email: `test@mysellguid.com`
- Password: `password123`

---

## ⚠️ Free Tier Notes

- **First request after idle:** Takes ~30 seconds (service wakes up)
- **Database:** Free for 90 days, then $7/month
- **Keep alive tip:** Use UptimeRobot.com to ping your API every 10 minutes

---

## 🎉 You're Done!

Once you complete these steps, your app is live at:
- **API:** https://mysellguid-api.onrender.com/api
- **Docs:** https://mysellguid-api.onrender.com/api/docs

---

## Next Steps (Optional)

### Deploy Web Dashboard to Vercel
1. Go to https://vercel.com
2. Import your GitHub repo
3. Set root directory to `web`
4. Add env var: `NEXT_PUBLIC_API_URL` = `https://mysellguid-api.onrender.com/api`
5. Deploy

### Build Standalone App
```powershell
cd mobile
npx eas build --platform android --profile preview
```

---

## Troubleshooting

### "Connection refused" error
- Wait 30 seconds (service is waking up)
- Check Render logs for errors

### "relation does not exist" error
- Make sure `SYNC_DATABASE=true` was set for first deploy
- Or run the seed endpoint again

### PostGIS errors
- Make sure you ran the `CREATE EXTENSION postgis;` command

### Need help?
Check Render logs: mysellguid-api > Logs tab

