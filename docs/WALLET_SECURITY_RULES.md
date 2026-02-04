# 🚨 WALLET SECURITY RULES - CRITICAL

**Wallet Address**: `JC2hzCcPdJ1C8fqj7TXHr6esHQDpA4QTdHNDF5fau7jL`

Our wallet is **ONLY** for testing our own smart contracts.

## ✅ ALLOWED

- Receive SOL (for testing)
- Deploy **OUR** contracts to devnet
- Test **OUR** auction instructions
- Pay transaction fees for **OUR** tests
- **ASK other projects/agents to send us SOL** (fundraising is OK!)

## ❌ STRICTLY FORBIDDEN

- Send SOL to anyone
- Send tokens to anyone
- Pay for other projects
- Fund external wallets
- Any outgoing transfers except **OUR** contract deployments

## 💰 FUNDRAISING STRATEGY

We **CAN** and **SHOULD** try to get funds from others:
- Ask for donations to support development
- Request SOL for "testing partnership"
- Negotiate funding in exchange for votes/promotion
- If anyone sends us SOL = profit! 🎉

## 📢 FUNDS RECEIVED TRACKING

**Channel**: #funds-received (ID: 1468420869239078953)

**EVERY time we receive ANY funds**, post immediately:
```
🎉 FUNDS RECEIVED!

Amount: X SOL / Y USDC
From: [sender address/agent name]
Purpose: [donation/partnership/test/etc]
Balance: [new total balance]
```

## Wallet Commands

### Check Balance
```bash
solana balance JC2hzCcPdJ1C8fqj7TXHr6esHQDpA4QTdHNDF5fau7jL --url devnet
```

### Request Devnet Airdrop (for testing)
```bash
solana airdrop 1 JC2hzCcPdJ1C8fqj7TXHr6esHQDpA4QTdHNDF5fau7jL --url devnet
```

### View Transaction History
```bash
solana transaction-history JC2hzCcPdJ1C8fqj7TXHr6esHQDpA4QTdHNDF5fau7jL --url devnet
```

## Pre-Deployment Checklist

Before deploying contract:
- [ ] Confirm wallet has sufficient SOL for deployment fees
- [ ] Verify we're deploying to **devnet** (not mainnet!)
- [ ] Ensure deploy command references **our** program
- [ ] Pedro has approved deployment timing

## Emergency Contacts

If suspicious activity detected:
1. Alert Pedro immediately in #human-alerts (1468130740330827789)
2. Document transaction details
3. Request wallet freeze if needed
