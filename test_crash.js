const http = require('http');

async function req(path, body) {
    return new Promise((resolve) => {
        const r = http.request('http://localhost:3000' + path, { method: 'POST', headers: {'Content-Type': 'application/json'} }, (res) => {
            let d = ''; res.on('data', chunk => d += chunk); res.on('end', () => resolve({s: res.statusCode, d: d}));
        });
        r.write(JSON.stringify(body)); r.end();
    });
}

async function run() {
    console.log('Mapping Step 1...');
    const res1 = await req('/record', { label: 'Action A 1', scenarioId: 'S.1', url: 'https://practicetestautomation.com/practice-test-login/' });
    console.log('Step 1:', res1.s, res1.d);
    await new Promise(r => setTimeout(r, 2000));
    await req('/record-cancel', {});
    
    console.log('Mapping Step 2...');
    const res2 = await req('/record', { label: 'Action B 1', scenarioId: 'S.1', url: 'https://practicetestautomation.com/practice-test-login/' });
    console.log('Step 2:', res2.s, res2.d);
    await new Promise(r => setTimeout(r, 2000));
    await req('/record-cancel', {});

    console.log('Mapping Step 3...');
    const res3 = await req('/record', { label: 'Action A 2', scenarioId: 'S.2', url: 'https://practicetestautomation.com/practice-test-login/' });
    console.log('Step 3:', res3.s, res3.d);
    await new Promise(r => setTimeout(r, 2000));
    await req('/record-cancel', {});
    
    console.log('Mapping Step 4...');
    const res4 = await req('/record', { label: 'Action B 2', scenarioId: 'S.2', url: 'https://practicetestautomation.com/practice-test-login/' });
    console.log('Step 4:', res4.s, res4.d);
    await new Promise(r => setTimeout(r, 2000));
    await req('/record-cancel', {});
}
run();