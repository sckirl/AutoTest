#!/bin/bash
cd "$(dirname "$0")"
echo "---------------------------------------"
echo "🚀 STEP 1: Building Code from Excel..."
echo "---------------------------------------"
node producer.js

echo ""
echo "---------------------------------------"
echo "🤖 STEP 2: Running the Browser Tests..."
echo "---------------------------------------"
npx playwright test

echo ""
echo "---------------------------------------"
echo "📊 STEP 3: Opening Visual Report..."
echo "---------------------------------------"
npx playwright show-report
