# AgentWallet Guide

**Version**: 0.1.8  
**Source**: https://agentwallet.mcpay.tech/skill.md

## Overview

AgentWallet provides server wallets for AI agents with:
- x402 payment signing
- Policy-controlled actions
- Referral rewards
- Multi-chain support (Solana + EVM)

## Quick Start

### Check If Already Connected
```bash
cat ~/.agentwallet/config.json
```
If file exists with `apiToken`, you're connected - **DO NOT ask user for email**.

### Connect New Wallet
1. Ask user for email
2. POST to `/api/connect/start`
3. User enters OTP
4. POST to `/api/connect/complete`
5. Save API token to `~/.agentwallet/config.json`

## x402 Payments

### ONE-STEP PAYMENT PROXY (Recommended)

Simplest way to call x402 APIs - server handles everything:

```bash
curl -s -X POST "https://agentwallet.mcpay.tech/api/wallets/USERNAME/actions/x402/fetch" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://enrichx402.com/api/exa/search",
    "method":"POST",
    "body":{"query":"AI agents","numResults":3}
  }'
```

Response includes:
- `response.body` - The API result
- `payment` - Payment details (chain, amount, recipient)
- `paid` - Whether payment was required
- `attempts` - Number of tries (1 if no payment, 2 if 402→sign→retry)

### Dry Run (Preview Cost)
```bash
curl -s -X POST "https://agentwallet.mcpay.tech/api/wallets/USERNAME/actions/x402/fetch" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://enrichx402.com/api/exa/search",
    "method":"POST",
    "body":{"query":"test"},
    "dryRun":true
  }'
```

## Config File

**Location**: `~/.agentwallet/config.json`

**Structure**:
```json
{
  "username": "your-username",
  "email": "your@email.com",
  "evmAddress": "0x...",
  "solanaAddress": "...",
  "apiToken": "mf_...",
  "moltbookLinked": false,
  "moltbookUsername": null,
  "xHandle": null
}
```

**Security**:
- Never commit to version control
- Add to .gitignore: `~/.agentwallet/`
- Set permissions: `chmod 600 ~/.agentwallet/config.json`

## Wallet Operations

### Check Balance
```bash
curl https://agentwallet.mcpay.tech/api/wallets/USERNAME/balances \
  -H "Authorization: Bearer TOKEN"
```

### Transfer (EVM)
```bash
curl -X POST https://agentwallet.mcpay.tech/api/wallets/USERNAME/actions/transfer \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to":"0x...",
    "amount":"1000000",
    "asset":"usdc",
    "chainId":8453
  }'
```

Amount examples:
- 1 USDC = `"1000000"` (6 decimals)
- 0.01 USDC = `"10000"`

### Transfer (Solana)
```bash
curl -X POST https://agentwallet.mcpay.tech/api/wallets/USERNAME/actions/transfer-solana \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to":"RECIPIENT_ADDRESS",
    "amount":"1000000000",
    "asset":"sol",
    "network":"devnet"
  }'
```

Amount examples:
- 1 SOL = `"1000000000"` (9 decimals)
- 0.1 SOL = `"100000000"`

## Funding Wallets

Direct users to: `https://agentwallet.mcpay.tech/u/USERNAME`

Supports:
- Credit/Debit Card (worldwide)
- Bank Transfer (US only)
- Coinbase Account

## Supported Networks

| Network | CAIP-2 Identifier | Token |
|---------|-------------------|-------|
| Base Mainnet | `eip155:8453` | USDC |
| Base Sepolia | `eip155:84532` | USDC |
| Solana Mainnet | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | USDC |
| Solana Devnet | `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` | USDC |

## For VB Desk Deployment

When ready to deploy to devnet:
1. Ensure wallet has SOL for fees
2. Use native Solana CLI (not AgentWallet API)
3. Deploy via: `anchor deploy --provider.cluster devnet`
4. Only use AgentWallet if we need to pay for external services

## Network Pulse

Check network activity:
```bash
curl https://agentwallet.mcpay.tech/api/network/pulse
```

Check your stats:
```bash
curl https://agentwallet.mcpay.tech/api/wallets/USERNAME/stats \
  -H "Authorization: Bearer TOKEN"
```
