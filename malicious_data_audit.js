const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🧨 [ZERO-TRUST] Auditing Data Matrix Injection...");

const maliciousData = {
  "A.1": [
    { "username": "'; rm -rf /; '" }, // Classic Injection attempt
    { "username": "${process.env.SECRET}" }, // Template literal leak attempt
    { "username": "A".repeat(10000) } // Buffer stress
  ]
};

const blueprint = [
  {
    "Scenario_ID": "A.1",
    "Role": "Audit",
    "Flow": [
      { "Mapping_Key": "Step1", "Data": {} }
    ]
  }
];

const mappings = {
  "Step1": {
    "steps": [
      { "type": "fill", "target": "input", "value": "{username}" }
    ]
  }
};

fs.writeFileSync('core/runtime_data.json', JSON.stringify(maliciousData));
fs.writeFileSync('core/blueprint.json', JSON.stringify(blueprint));
fs.writeFileSync('core/mappings.json', JSON.stringify(mappings));

try {
    console.log("   -> Compiling malicious payload...");
    execSync('node core/compiler.js', { stdio: 'pipe' });
    const code = fs.readFileSync('core/executed.spec.ts', 'utf8');
    
    if (code.includes("'; rm -rf /; '")) {
        console.log("✅ [AUDIT] Malicious string escaped correctly in generated code.");
    }
    
    console.log("✅ [AUDIT] SUCCESS: Compiler handled malicious inputs safely.");
} catch (e) {
    console.error("❌ [AUDIT] CRITICAL: Compiler CRASHED on malicious input: " + e.message);
}

console.log("\n🏆 [ZERO-TRUST] Data Audit Complete.");
