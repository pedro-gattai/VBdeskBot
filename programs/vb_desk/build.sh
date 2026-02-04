#!/bin/bash
# VB Desk Build Script
# Sets correct PATHs and builds the Anchor program

set -e

# Add Rust and Solana to PATH
export PATH="/root/.cargo/bin:$PATH"
export PATH="/root/.local/share/solana/install/releases/stable-90098d261e2be2f898769d9ee35141597f1a2234/solana-release/bin:$PATH"

echo "🔧 Environment:"
echo "  Rust: $(rustc --version)"
echo "  Cargo: $(cargo --version)"
echo "  Anchor: $(anchor --version)"
echo "  Solana: $(solana --version)"
echo ""

cd "$(dirname "$0")"

echo "🔨 Building VB Desk Anchor program..."
cargo +nightly build-bpf

echo ""
echo "✅ Build complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Update program ID: anchor keys list"
echo "  2. Deploy to devnet: anchor deploy"
echo "  3. Run tests: anchor test"
