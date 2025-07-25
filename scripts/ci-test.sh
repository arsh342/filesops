#!/bin/bash

# CI Test Script
# This script simulates what happens in CI/CD environments

echo "🔄 Starting CI simulation..."

# Clean install (what CI does)
echo "📦 Running npm ci..."
npm ci

if [ $? -eq 0 ]; then
    echo "✅ npm ci succeeded"
else
    echo "❌ npm ci failed"
    exit 1
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build succeeded"
else
    echo "❌ Build failed"
    exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm test

if [ $? -eq 0 ]; then
    echo "✅ Tests passed"
else
    echo "❌ Tests failed"
    exit 1
fi

echo "🎉 All CI checks passed successfully!"
