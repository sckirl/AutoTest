const fs = require('fs');
const http = require('http');

async function req(path, method, body) {
    return new Promise((resolve) => {
        const r = http.request('http://localhost:3000' + path, { method, headers: {'Content-Type': 'application/json'} }, (res) => {
            let d = ''; res.on('data', chunk => d += chunk); res.on('end', () => resolve({s: res.statusCode, d}));
        });
        if (body) r.write(JSON.stringify(body));
        r.end();
    });
}

(async () => {
    try {
        console.log('🔄 FINAL DEMO: Resetting system...');
        await req('/restart', 'POST', {});
        
        fs.copyFileSync('demo_blueprint.xlsx', 'scenario_uploaded.xlsx');
        console.log('📄 Demo blueprint uploaded.');

        const boilerplate = (code) => `import { test, expect } from '@playwright/test';\ntest('test', async ({ page }) => {\n  ${code}\n});`;

        const mappings = [
            { label: 'Navigate to Practice Site', code: boilerplate("await page.goto('https://practicetestautomation.com/practice-test-login/');") },
            { label: 'Input Demo Username', code: boilerplate("await page.getByLabel('Username').fill('{Username}');") },
            { label: 'Input Demo Password', code: boilerplate("await page.getByLabel('Password').fill('{Password}');") },
            { label: 'Submit Login', code: boilerplate("await page.getByRole('button', { name: 'Submit' }).click();") },
            { label: 'Verify Success Message', code: boilerplate("await expect(page.getByText('Logged In Successfully')).toBeVisible();") }
        ];

        for (const m of mappings) {
            console.log(`   -> Mapping: ${m.label}`);
            await req('/save-mapping', 'POST', { label: m.label, code: m.code });
        }

        await req('/data-matrix', 'POST', { 'A.1': [ { 'Username': 'student', 'Password': 'Password123' } ] });

        console.log('🚀 Triggering WEB execution...');
        await req('/run', 'POST', { workers: 1, platform: 'web' });
        
        let done = false;
        while (!done) {
            const res = await req('/run-status', 'GET');
            const status = JSON.parse(res.d);
            if (status.phase === 'completed' || status.phase === 'failed') done = true;
            else {
                process.stdout.write('.');
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        console.log('\n✅ WEB execution complete.');

        console.log('🚀 Triggering MOBILE compilation check...');
        process.env.AUTOTEST_PLATFORM = 'mobile';
        require('child_process').execSync('node core/compiler.js');
        const mobileCode = fs.readFileSync('core/executed.spec.ts', 'utf8');
        if (mobileCode.includes('driver.$(\"//*[@text=\\\"Submit\\\"')) {
            console.log('✅ MOBILE Translation SUCCESS: Extracted button name from getByRole.');
        } else {
            console.log('❌ MOBILE Translation FAILED.');
            // console.log(mobileCode);
        }

        console.log('\n🌟 FINAL KPI VERIFICATION COMPLETE.');
    } catch (e) {
        console.error("DEMO ERROR:", e);
    }
})();