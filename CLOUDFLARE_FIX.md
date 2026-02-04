# Cloudflare Pages Deployment Fix

## Problem
Cloudflare deployed from commit `086dd43` instead of the latest `df7795b`.

## Solution

### Step 1: Update Build Settings in Cloudflare

1. Go to Cloudflare Pages → Your Project → Settings → Builds & deployments

2. **Update these settings:**
   ```
   Build command:          cd frontend && npm install && npm run build
   Build output directory: frontend/dist
   Root directory:         (leave empty or set to /)
   ```

3. Click **Save**

### Step 2: Retry Deployment

**Option A: Retry Failed Deployment**
- Go to Deployments tab
- Find the failed deployment
- Click the three dots (⋮) → **Retry deployment**

**Option B: Trigger New Deployment**
- Go to Deployments tab
- Click **Create deployment**
- Select branch: `main`
- Click **Deploy**

**Option C: Push Empty Commit** (forces rebuild)
```bash
cd /root/.openclaw/workspace/VBdeskBot
git commit --allow-empty -m "Trigger Cloudflare rebuild"
git push
```

### Step 3: Verify Latest Commit

Before deploying, verify Cloudflare is using the latest commit:
- In deployment logs, check: `HEAD is now at df7795b`
- NOT: `HEAD is now at 086dd43`

## Expected Build Output

✅ Successful build should show:
```
Installing project dependencies: npm clean-install
✓ 4811 modules transformed
dist/index.html                   0.46 kB
dist/assets/index-BDXJFwao.css    6.20 kB
dist/assets/index-CtKrua0W.js   580.71 kB
✓ built in ~10s
```

## Environment Variables (Important!)

Don't forget to set these in Cloudflare Pages → Settings → Environment variables:

```
VITE_NETWORK=devnet
VITE_PROGRAM_ID=AQN8iwxj5s9cupFA4bhaK7ccuCyN2fD7EH3ari3T3uXf
VITE_EXPLORER_URL=https://explorer.solana.com
```

## Alternative: Force Latest Commit

If Cloudflare keeps deploying old commits:

1. Delete the Cloudflare Pages project
2. Create a new one
3. Connect to GitHub repo
4. Use the build settings from Step 1 above
5. Deploy

---

**Current Status:**
- ✅ Latest code pushed to GitHub: `df7795b`
- ✅ Frontend builds locally without errors
- ❌ Cloudflare needs to pull latest commit

**Next Action:** Update build settings and retry deployment
