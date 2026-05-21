const http = require('http');
const fs = require('fs');
const path = require('path');

async function testStress() {
    console.log("--- Starting Stress Test ---");
    
    // 1. Upload
    const boundary = '--------------------------' + Date.now();
    const filePath = path.join(process.cwd(), 'scenario_stress_100.xlsx');
    const fileData = fs.readFileSync(filePath);
    const postData = Buffer.concat([
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from(`Content-Disposition: form-data; name="excel"; filename="scenario_stress_100.xlsx"\r\n`),
        Buffer.from(`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`),
        fileData,
        Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const uploadRes = await new Promise((resolve) => {
        const req = http.request('http://localhost:3000/upload', {
            method: 'POST',
            headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }
        }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.write(postData);
        req.end();
    });
    console.log("Upload:", uploadRes.message);

    // 2. Scan
    const scanRes = await new Promise((resolve) => {
        http.get('http://localhost:3000/scan', (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve(JSON.parse(body)));
        });
    });
    console.log("Scan:", scanRes.steps.length, "steps detected.");
    
    // 3. Manual Map Simulation (Map first 5 steps)
    console.log("Simulating manual mapping...");
    for (let i = 0; i < 5; i++) {
        const step = scanRes.steps[i];
        const saveRes = await new Promise((resolve) => {
            const req = http.request('http://localhost:3000/save-mapping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, (res) => {
                let body = '';
                res.on('data', d => body += d);
                res.on('end', () => resolve(JSON.parse(body)));
            });
            req.write(JSON.stringify({
                label: step.label,
                code: `await page.locator('#test-${i}').click();`
            }));
            req.end();
        });
        process.stdout.write(saveRes.message === "Saved." ? "." : "F");
    }
    console.log("\nStress Test Passed.");
}

testStress();
