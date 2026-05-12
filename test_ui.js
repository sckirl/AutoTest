const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    
    await page.goto('http://localhost:3000');
    await page.click('#tab-data-matrix');
    await page.waitForTimeout(500);
    
    const html = await page.content();
    require('fs').writeFileSync('page_dump.html', html);
    
    await page.click('text="+ Add Iteration"');
    await page.waitForTimeout(500);
    
    const html2 = await page.content();
    require('fs').writeFileSync('page_dump2.html', html2);

    await browser.close();
})();
