#!/bin/bash

# Deploy to Vercel Script

echo "🚀 Deploying to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to frontend directory
cd frontend

# Deploy to Vercel
echo "📦 Building and deploying frontend..."
vercel --prod

echo "✅ Frontend deployed to Vercel!"
echo "🔗 Check your deployment at: https://vercel.com/dashboard"