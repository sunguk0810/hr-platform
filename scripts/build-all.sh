#!/bin/bash

echo "Building all modules..."

cd "$(dirname "$0")/.."

./gradlew clean build -x test --parallel

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================"
    echo "Build completed successfully!"
    echo "============================================"
else
    echo ""
    echo "============================================"
    echo "Build failed!"
    echo "============================================"
    exit 1
fi
