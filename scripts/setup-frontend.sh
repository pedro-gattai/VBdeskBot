#!/bin/bash
set -e

echo "🚀 VB Desk Frontend Setup"
echo "========================\n"

# Check Node version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo ""

# Navigate to app directory
cd "$(dirname "$0")/../app"

echo "📦 Installing dependencies..."
npm install

echo ""
echo "📝 Setting up environment..."

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local (update with your config)"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🎨 Verifying Tailwind setup..."
if [ ! -f tailwind.config.ts ]; then
    echo "❌ tailwind.config.ts not found"
    exit 1
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update app/.env.local with your Solana RPC endpoint"
echo "  2. npm run dev         # Start development server"
echo "  3. npm run build       # Build for production"
echo ""
echo "📖 Read FRONTEND_README.md for full documentation"
