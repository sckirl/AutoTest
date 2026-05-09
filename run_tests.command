#!/bin/bash
cd "$(dirname "$0")"
echo "---------------------------------------"
echo "🚀 STEP 1: Generate Blueprint + Compile Spec..."
echo "---------------------------------------"
if [ ! -f "scenario_uploaded.xlsx" ]; then
  echo "❌ scenario_uploaded.xlsx not found in project root."
  echo "   Upload through Studio first, or place scenario file as scenario_uploaded.xlsx."
  exit 1
fi
node core/scenario_parser.js scenario_uploaded.xlsx || exit 1
node core/compiler.js || exit 1

echo ""
echo "---------------------------------------"
echo "🤖 STEP 2: Running Playwright (Core Spec)..."
echo "---------------------------------------"
npx playwright test core/executed.spec.ts --ui

echo ""
echo "---------------------------------------"
echo "📊 STEP 3: Trace/Results"
echo "---------------------------------------"
echo "Open Playwright UI for trace with red click markers."
echo "Screenshots are in results/<SCENARIO_ID>/"
