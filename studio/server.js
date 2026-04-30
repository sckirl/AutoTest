const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

const CORE_DIR = path.join(__dirname, '../core');
const RESULTS_DIR = path.join(__dirname, '../results');

// 1. RESTART ENDPOINT: Wipes mappings, blueprints, and results
app.post('/restart', (req, res) => {
    console.log("⚠️ Restart triggered. Wiping all data...");
    
    // Reset Mappings to empty
    fs.writeFileSync(path.join(CORE_DIR, 'mappings.json'), JSON.stringify({}, null, 2));
    
    // Wipe Results folder
    if (fs.existsSync(RESULTS_DIR)) {
        fs.rmSync(RESULTS_DIR, { recursive: true, force: true });
        fs.mkdirSync(RESULTS_DIR);
    }

    res.json({ message: "System restarted. Mappings and Results have been wiped clean." });
});

// 2. RUN TESTS ENDPOINT
app.post('/run', (req, res) => {
    console.log("🚀 Running Playwright tests...");
    exec('npx playwright test core/runner.spec.ts', (error, stdout, stderr) => {
        res.json({ stdout, stderr, error });
    });
});

app.listen(3000, () => {
    console.log('🚀 Automation Studio Server running at http://localhost:3000');
});
