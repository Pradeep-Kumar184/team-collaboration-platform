#!/bin/bash

# Deploy to Netlify Script

echo "🚀 Deploying to Netlify..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Navigate to frontend directory
cd frontend

# Build the project
echo "📦 Building frontend..."
npm run build

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
netlify deploy --prod --dir=build

echo "✅ Frontend deployed to Netlify!"
echo "🔗 Check your deployment at: https://app.netlify.com/"