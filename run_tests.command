#!/bin/bash
cd "$(dirname "$0")"
echo "---------------------------------------"
echo "🚀 STEP 1: Generate Blueprint + Compile Spec..."
echo "---------------------------------------"
# [DEF-049] Standardize CLI execution to prevent zombies and redundancy
SCENARIO_FILE=$(ls -t temp_uploads/scenario_uploaded*.xlsx 2>/dev/null | head -n 1)
if [ -z "$SCENARIO_FILE" ]; then
  SCENARIO_FILE=$(ls -t scenario_uploaded*.xlsx 2>/dev/null | head -n 1)
fi

if [ -z "$SCENARIO_FILE" ]; then
  echo "❌ No scenario file found. Upload through Studio first."
  exit 1
fi

echo "Using Matrix: $SCENARIO_FILE"
node core/scenario_parser.js "$SCENARIO_FILE" || exit 1
node core/compiler.js || exit 1

echo ""
echo "---------------------------------------"
echo "🤖 STEP 2: Running Playwright (Hardened Mode)..."
echo "---------------------------------------"
# [DEF-036/049] Standard headed mode (no --ui)
npx playwright test core/executed.spec.ts --headed

echo ""
echo "---------------------------------------"
echo "📊 STEP 3: Results"
echo "---------------------------------------"
echo "Screenshots and traces are in results/"
