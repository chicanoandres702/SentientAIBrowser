#!/bin/bash
# Feature: Backend | Why: Start the proxy server with orchestrator for mission/task execution

echo "🚀 Starting Sentient Proxy Server with AI Orchestrator..."

cd functions
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix TypeScript errors."
    exit 1
fi

echo "✅ Build successful. Starting proxy server..."
node lib/proxy-server.js
