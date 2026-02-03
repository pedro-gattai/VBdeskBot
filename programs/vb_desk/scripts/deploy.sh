#!/bin/bash

# VB Desk Deployment Script
# Deploys smart contract to Solana Devnet

set -e

echo "Building contract..."
anchor build

echo "Deploying to Devnet..."
anchor deploy --provider.cluster devnet

echo "✅ Deployment complete!"
