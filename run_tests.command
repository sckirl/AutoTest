#!/bin/bash
cd "$(dirname "$0")"
echo "---------------------------------------"
echo "🚀 STEP 1: Generate Blueprint + Compile Spec..."
echo "---------------------------------------"
SCENARIO_FILE=$(ls -t scenario_uploaded*.xlsx 2>/dev/null | head -n 1)
if [ -z "$SCENARIO_FILE" ]; then
  echo "❌ no scenario_uploaded*.xlsx found in project root."
  echo "   Upload through Studio first."
  exit 1
fi
node core/scenario_parser.js "$SCENARIO_FILE" || exit 1
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
