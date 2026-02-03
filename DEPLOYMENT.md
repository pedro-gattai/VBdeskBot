# VB Desk Frontend - Deployment Guide

## 🎯 Deployment Checklist

### Pre-Deployment (Local)
- [ ] Code builds without errors: `npm run build`
- [ ] All pages render correctly: `npm run dev`
- [ ] Wallet connects via Phantom
- [ ] Form validation works
- [ ] No console errors
- [ ] Responsive design tested (mobile + desktop)
- [ ] Environment vars configured

### Cloudflare Pages (Recommended)

#### Step 1: Prepare Repository
```bash
# Ensure code is committed
git add -A
git commit -m "Ready for Cloudflare deployment"
git push origin main
```

#### Step 2: Connect to Cloudflare
1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Pages** > **Create Project**
3. Select **Connect to Git** > Authorize GitHub
4. Select repository: `pedro-gattai/VBdeskBot`
5. Click **Begin setup**

#### Step 3: Configure Build
| Setting | Value |
|---------|-------|
| **Project name** | vbdesk-frontend |
| **Production branch** | main |
| **Framework preset** | Next.js |
| **Build command** | `npm run build` |
| **Build output directory** | `.next` |
| **Root directory** | `app/` |

#### Step 4: Environment Variables
Add these in Cloudflare Pages settings:

**For Devnet (Staging)**:
```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=DEVNET_PROGRAM_ID_HERE
NEXT_PUBLIC_WALLET_ADAPTER_NETWORK=devnet
```

**For Mainnet-Beta (Production)**:
```
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_PROGRAM_ID=MAINNET_PROGRAM_ID_HERE
NEXT_PUBLIC_WALLET_ADAPTER_NETWORK=mainnet-beta
```

#### Step 5: Deploy
Click **Save and Deploy**. Cloudflare will:
1. Clone repository
2. Install dependencies
3. Run build command
4. Deploy to `vbdesk-frontend.pages.dev`

### GitHub Actions CI/CD

Automatic deployment on push to `main`:

1. **Prerequisites**:
   - Repository: `pedro-gattai/VBdeskBot`
   - Secrets configured:
     - `CLOUDFLARE_API_TOKEN`
     - `CLOUDFLARE_ACCOUNT_ID`

2. **Setup secrets**:
   ```bash
   # In GitHub repo > Settings > Secrets > New repository secret
   # Add CLOUDFLARE_API_TOKEN (get from Cloudflare dashboard)
   # Add CLOUDFLARE_ACCOUNT_ID (from URL or account settings)
   ```

3. **Workflow file**: `.github/workflows/deploy-cloudflare.yml`
   - Triggers on push to `main`
   - Runs tests, build, deploy

### Vercel (Alternative)

```bash
npm i -g vercel

# Login
vercel login

# Deploy
cd app
vercel
```

### Manual Deployment

```bash
# Build locally
npm run build

# Upload .next directory to your server
scp -r .next user@server:/var/www/vbdesk/

# Start server
npm start
```

## 🔄 Environment Setup by Stage

### Development (Local)
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=DEVNET_ID
NODE_ENV=development
```

### Staging (Devnet)
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=DEVNET_ID
NODE_ENV=production
```

### Production (Mainnet-Beta)
```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_PROGRAM_ID=MAINNET_ID
NODE_ENV=production
```

## ✅ Post-Deployment Tests

After deployment, verify:

### Connectivity
```bash
curl https://vbdesk-frontend.pages.dev/
```

### Wallet Integration
1. Open site in browser
2. Click "Connect Wallet"
3. Verify Phantom connects successfully
4. Check network matches (Devnet/Mainnet)

### Page Rendering
- [ ] Home page loads auctions
- [ ] Create page shows form
- [ ] Auction detail page displays correctly
- [ ] Navigation works
- [ ] Responsive on mobile

### Functionality
- [ ] Forms validate input
- [ ] Wallet connection persists
- [ ] No console errors
- [ ] Loading states work
- [ ] Error messages display

## 🔧 Troubleshooting Deployments

### Build Fails on Cloudflare

**Error: "Bus error" or timeout**
- Check build output directory is `.next`
- Ensure `npm install` succeeds
- Try increasing timeout in Cloudflare settings

**Error: "Module not found"**
- Verify root directory is `app/`
- Check `package.json` location
- Ensure all imports use correct paths

### Site Not Loading

**Blank page or 404**
- Verify `.next` folder exists
- Check root directory config
- Review Cloudflare Pages logs

**Wallet won't connect**
- Check environment variables are set
- Verify `NEXT_PUBLIC_*` vars (public to browser)
- Ensure Phantom supports the network

### Performance Issues

**Slow load times**
- Check RPC endpoint health
- Enable Cloudflare caching
- Review bundle size: `npm run build -- --analyze`

**High memory usage**
- Reduce number of auction items displayed
- Implement pagination
- Optimize images

## 🚀 Rollback Plan

If deployment has issues:

```bash
# Cloudflare Pages: Automatic (set in dashboard)
# - Go to Pages > Deployments
# - Click "Rollback" on previous working version

# GitHub Actions: Revert commit
git revert HEAD
git push origin main
# Workflow runs again with previous code
```

## 📊 Monitoring

Set up alerts for:
- Deployment failures
- High error rates
- Downtime (use Pingdom/UptimeRobot)
- RPC endpoint health

## 📝 Deployment Log

| Date | Environment | Status | Notes |
|------|-------------|--------|-------|
| 2025-02-03 | Cloudflare (Devnet) | Pending | Setup complete, ready for deploy |
| | | | |

---

**Last Updated**: Feb 3, 2025
**Next Step**: Run `npm run build` locally to verify, then push to GitHub
