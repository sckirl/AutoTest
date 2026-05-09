const http = require('http');
const fs = require('fs');
const path = require('path');

async function uploadExcel() {
    return new Promise((resolve, reject) => {
        const boundary = '--------------------------' + Date.now();
        const filePath = path.join(process.cwd(), 'scenario_qa.xlsx');
        const fileData = fs.readFileSync(filePath);
        
        const postData = Buffer.concat([
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="excel"; filename="scenario_qa.xlsx"\r\n`),
            Buffer.from(`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`),
            fileData,
            Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);

        const req = http.request('http://localhost:3000/upload', {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': postData.length
            }
        }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function triggerRun() {
    return new Promise((resolve, reject) => {
        const req = http.request('http://localhost:3000/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.write(JSON.stringify({ workers: 4 }));
        req.end();
    });
}

async function pollStatus() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            http.get('http://localhost:3000/run-status', (res) => {
                let body = '';
                res.on('data', d => body += d);
                res.on('end', () => {
                    const data = JSON.parse(body);
                    console.log(`Phase: ${data.phase} - ${data.message}`);
                    if (data.phase === 'completed' || data.phase === 'failed') {
                        clearInterval(interval);
                        resolve(data);
                    }
                });
            });
        }, 2000);
    });
}

async function main() {
    console.log('--- STARTING UAT E2E AUDIT ---');
    try {
        const upload = await uploadExcel();
        console.log('Upload Result:', upload);
        
        const run = await triggerRun();
        console.log('Run Trigger Result:', run);
        
        const finalStatus = await pollStatus();
        console.log('Final Execution Status:', finalStatus);
    } catch (err) {
        console.error('UAT AUDIT CRASHED:', err);
    }
}

main();
