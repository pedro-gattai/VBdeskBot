# ✅ Cloudflare Pages - Correct Build Settings

## Problem
Repository has TWO frontend directories:
- `app/` (old Next.js - not used)
- `frontend/` (new Vite - **this is the one we want**)

Cloudflare was detecting `app/package.json` first and failing.

## ✅ CORRECT Settings

Go to: **Cloudflare Pages → Your Project → Settings → Builds & deployments**

### Build Configuration

```
Framework preset:        None
Build command:           npm install && npm run build
Build output directory:  dist
Root directory:          frontend
```

**⚠️ IMPORTANT:** Set `Root directory` to **`frontend`**

This tells Cloudflare to:
1. Start in the `frontend/` directory
2. Run `npm install` (uses `frontend/package.json`)
3. Run `npm run build` (runs `vite build`)
4. Output to `frontend/dist/`

### Environment Variables

Click **"Add variable"** for each:

```
Variable name            Value
────────────────────────────────────────────────────────────
VITE_NETWORK             devnet
VITE_PROGRAM_ID          AQN8iwxj5s9cupFA4bhaK7ccuCyN2fD7EH3ari3T3uXf
VITE_EXPLORER_URL        https://explorer.solana.com
```

### Node.js Version (Optional)

If Cloudflare asks for Node version:
```
NODE_VERSION = 18
```

## After Saving

1. Click **Save**
2. Go to **Deployments** tab
3. Click **Retry deployment** on the failed build

## Expected Success Output

```
✓ Cloning repository...
✓ HEAD is now at 532a9aa
✓ Using root directory: frontend
✓ Installing project dependencies: npm install
✓ Building project: npm run build
✓ 4811 modules transformed
✓ dist/index.html                   0.46 kB
✓ dist/assets/index-BDXJFwao.css    6.20 kB
✓ dist/assets/index-CtKrua0W.js   580.71 kB
✓ built in ~10s
✓ Deployment complete!
```

## Troubleshooting

**If it still fails:**

1. Delete the Cloudflare Pages project
2. Create a new project
3. Connect to GitHub repo `pedro-gattai/VBdeskBot`
4. Use settings above **FROM THE START**
5. Deploy

**DO NOT use:**
- `npm clean-install` or `npm ci` (too strict)
- `cd frontend &&` in build command (not needed with Root directory set)
- Empty/blank Root directory (will detect wrong package.json)

---

**Ready to deploy:** https://dash.cloudflare.com/pages
