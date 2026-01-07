#!/bin/bash

# Vercel Deployment Script
# This script helps you deploy your NestJS backend to Vercel

echo "🚀 Vercel Deployment Helper"
echo "=========================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI is not installed."
    echo "📦 Installing Vercel CLI globally..."
    npm install -g vercel
    echo "✅ Vercel CLI installed!"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
    echo ""
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
else
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

# Prompt for deployment type
echo "Select deployment type:"
echo "1) Preview deployment (for testing)"
echo "2) Production deployment"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying to preview..."
        vercel
        ;;
    2)
        echo ""
        echo "🚀 Deploying to production..."
        vercel --prod
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "⚠️  IMPORTANT REMINDERS:"
echo "1. Make sure you've set GEMINI_API_KEY in Vercel environment variables"
echo "2. Consider migrating from SQLite to a cloud database (see VERCEL_DEPLOYMENT.md)"
echo "3. Update CORS origins in src/main.ts if needed"
