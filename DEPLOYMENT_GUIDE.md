# VB Desk Deployment Guide

## ✅ Current Status

**Smart Contract:** Deployed to Devnet  
**Program ID:** `AQN8iwxj5s9cupFA4bhaK7ccuCyN2fD7EH3ari3T3uXf`  
**Network:** Solana Devnet  
**Explorer:** https://explorer.solana.com/address/AQN8iwxj5s9cupFA4bhaK7ccuCyN2fD7EH3ari3T3uXf?cluster=devnet

## 🌐 Frontend Deployment (Cloudflare Pages)

### Prerequisites
- Cloudflare account (free tier is fine)
- GitHub repository connected

### Deploy to Cloudflare Pages

1. **Login to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com/
   - Navigate to **Pages** section

2. **Create New Project**
   - Click **"Create a project"**
   - Select **"Connect to Git"**
   - Authorize GitHub and select `pedro-gattai/VBdeskBot`

3. **Configure Build Settings**
   ```
   Project name: vb-desk (or your choice)
   Production branch: main
   Build command: cd frontend && npm install && npm run build
   Build output directory: frontend/dist
   Root directory: /
   ```

4. **Environment Variables**
   
   Add these in Cloudflare Pages settings:
   ```
   VITE_NETWORK=devnet
   VITE_PROGRAM_ID=AQN8iwxj5s9cupFA4bhaK7ccuCyN2fD7EH3ari3T3uXf
   VITE_EXPLORER_URL=https://explorer.solana.com
   ```

5. **Deploy**
   - Click **"Save and Deploy"**
   - Wait 2-3 minutes for build
   - Your site will be live at: `https://vb-desk.pages.dev` (or custom domain)

### Alternative: Manual Deployment

```bash
# From project root
cd frontend
npm install
npm run build

# Deploy the dist/ folder to any static host:
# - Cloudflare Pages
# - Vercel
# - Netlify
# - GitHub Pages
```

## 📱 Custom Domain (Optional)

1. Go to Cloudflare Pages project settings
2. Navigate to **Custom domains**
3. Add your domain (e.g., `vb-desk.com`)
4. Follow DNS configuration instructions

## 🔗 After Deployment

Update these files with your live URL:

1. **README.md** - Add demo link
2. **Colosseum submission** - Include live demo URL
3. **USER_GUIDE.md** - Add "Try it now" link

## 🧪 Testing

After deployment, test these features:

- [ ] Wallet connection (Phantom)
- [ ] Auction list loads
- [ ] Create auction form appears
- [ ] Network shows "devnet"
- [ ] Program ID matches

## 🚀 Production Deployment (Mainnet)

When ready for mainnet:

1. Deploy contract to mainnet-beta
2. Update environment variables:
   ```
   VITE_NETWORK=mainnet-beta
   VITE_PROGRAM_ID=<new-mainnet-program-id>
   VITE_RPC_ENDPOINT=<premium-rpc-endpoint>
   ```
3. Redeploy frontend
4. Test thoroughly with small amounts first

## 🛠️ Troubleshooting

**Build fails:**
- Check Node version (v18+ required)
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall

**Wallet won't connect:**
- Ensure user has Phantom installed
- Check browser console for errors
- Verify network is set to devnet in wallet

**Transactions fail:**
- Ensure wallet has devnet SOL
- Use faucet: https://faucet.solana.com/
- Check program is deployed correctly

## 📊 Monitoring

Monitor your deployment:
- Cloudflare Analytics (traffic, performance)
- Solana Explorer (transaction history)
- Browser console (user errors)

---

**Built with:** Vite, React, Solana Web3.js, Anchor  
**Network:** Solana Devnet  
**For Colosseum Agent Hackathon 2025**
