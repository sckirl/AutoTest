const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch({ headed: true });
    console.log('Headed browser launched successfully');
    await browser.close();
  } catch (e) {
    console.error('Failed to launch headed browser:', e.message);
  }
})();
