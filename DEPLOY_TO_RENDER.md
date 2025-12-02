# 🚀 Deploy MySellGuid to Render.com (FREE)

## Overview
This guide will help you deploy MySellGuid to the cloud so anyone can access it.

**Total time:** ~15-20 minutes
**Cost:** FREE (with limitations)

---

## Step 1: Create Render Account (2 min)

1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended - makes deployment easier)
4. Verify your email if needed

---

## Step 2: Create PostgreSQL Database (3 min)

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Fill in:
   - **Name:** `mysellguid-db`
   - **Database:** `mysellguid`
   - **User:** `mysellguid_user`
   - **Region:** `Frankfurt (EU Central)` (closest to Israel)
   - **Plan:** `Free`
3. Click **"Create Database"**
4. **WAIT** for it to be ready (1-2 min)
5. **COPY** the **"External Database URL"** - you'll need this!

### Enable PostGIS Extension
1. In your database page, go to **"Shell"** tab
2. Run this command:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## Step 3: Create Redis (2 min)

1. Click **"New +"** → **"Redis"**
2. Fill in:
   - **Name:** `mysellguid-redis`
   - **Region:** `Frankfurt (EU Central)`
   - **Plan:** `Free`
3. Click **"Create Redis"**
4. **COPY** the **"Internal Redis URL"** - you'll need this!

---

## Step 4: Deploy Backend (5 min)

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:
   - Select **"Build and deploy from a Git repository"**
   - Connect to GitHub if not already
   - Select **`tmotti77/mysellguid`** repository
3. Configure the service:
   - **Name:** `mysellguid-api`
   - **Region:** `Frankfurt (EU Central)`
   - **Branch:** `master`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Plan:** `Free`

4. Add **Environment Variables** (click "Advanced" → "Add Environment Variable"):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | (paste the External Database URL from Step 2) |
| `REDIS_URL` | (paste the Internal Redis URL from Step 3) |
| `JWT_SECRET` | (click "Generate" or type a random 32-char string) |
| `JWT_REFRESH_SECRET` | (click "Generate" or type a different random string) |
| `JWT_EXPIRATION` | `15m` |
| `JWT_REFRESH_EXPIRATION` | `7d` |
| `CORS_ORIGINS` | `*` |

5. Click **"Create Web Service"**
6. **WAIT** for deployment (3-5 min) - watch the logs!

### Verify Backend is Working
Once deployed, visit: `https://mysellguid-api.onrender.com/api/health`

You should see:
```json
{"status":"ok","database":"connected",...}
```

---

## Step 5: Seed the Database (1 min)

Open your browser and go to:
```
https://mysellguid-api.onrender.com/api/seed
```

Or use PowerShell:
```powershell
Invoke-RestMethod -Uri "https://mysellguid-api.onrender.com/api/seed" -Method POST
```

This creates test data (users, stores, sales).

---

## Step 6: Deploy Web Dashboard to Vercel (5 min)

1. Go to **https://vercel.com**
2. Sign up with **GitHub**
3. Click **"Add New..."** → **"Project"**
4. Import **`tmotti77/mysellguid`** repository
5. Configure:
   - **Root Directory:** `web`
   - **Framework Preset:** `Next.js`
6. Add Environment Variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://mysellguid-api.onrender.com/api`
7. Click **"Deploy"**

Your web dashboard will be at: `https://mysellguid-web.vercel.app`

---

## Step 7: Update Mobile App (2 min)

Update the API URL in `mobile/app.json`:

```json
"extra": {
  "apiUrl": "https://mysellguid-api.onrender.com/api"
}
```

Then restart Expo:
```powershell
cd mobile
npx expo start -c
```

---

## 🎉 Done! Your URLs:

| Service | URL |
|---------|-----|
| **Backend API** | https://mysellguid-api.onrender.com/api |
| **Web Dashboard** | https://mysellguid-web.vercel.app |
| **Mobile App** | Share Expo QR code |

---

## Test Credentials

- **Email:** `test@mysellguid.com`
- **Password:** `password123`

- **Store Owner Email:** `store@mysellguid.com`
- **Password:** `password123`

---

## Sharing with Friends

### For Mobile App:
1. Run `npx expo start` on your computer
2. Friends install **Expo Go** app
3. Share the QR code or link

### For Web Dashboard:
Just share the Vercel URL!

---

## ⚠️ Free Tier Limitations

| Service | Limitation |
|---------|------------|
| Render Web Service | Sleeps after 15 min of no traffic. First request takes ~30 sec to wake up. |
| Render PostgreSQL | Free for 90 days, then $7/month |
| Render Redis | Free tier available |
| Vercel | Unlimited for hobby projects |

---

## Troubleshooting

### Backend won't start?
- Check the logs in Render dashboard
- Make sure DATABASE_URL is correct
- Ensure PostGIS extension is enabled

### Database connection failed?
- Wait 2-3 minutes after creating database
- Check the External URL is correct
- Make sure SSL is enabled in the connection

### CORS errors?
- Add your frontend URLs to CORS_ORIGINS
- Example: `https://mysellguid-web.vercel.app,http://localhost:3001`

---

## Need Help?

Check the logs:
1. Render Dashboard → Your Service → "Logs" tab
2. Vercel Dashboard → Your Project → "Functions" tab

