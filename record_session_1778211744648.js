const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  let currentLabelIdx = 0;
  const flowLabels = ["Navigate to Studio"];
  await page.exposeFunction('captureAction', async (action) => {
    const mPath = '/Users/alvin/CodeProjects/AutoTest/core/mappings.json';
    const labelToMap = flowLabels[currentLabelIdx];
    if (!labelToMap) return;
    const mappings = JSON.parse(fs.readFileSync(mPath, 'utf8'));
    mappings[labelToMap] = { steps: [action] };
    fs.writeFileSync(mPath, JSON.stringify(mappings, null, 2));
    currentLabelIdx++;
  });
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login', { waitUntil: 'domcontentloaded' });
  await page.addInitScript(() => {
    const flowLabels = ["Navigate to Studio"];
    let currentIdx = 0;
    let mode = 'record';
    const injectToolbar = () => {
      if (document.getElementById('autotest-toolbar')) return;
      const tb = document.createElement('div');
      tb.id = 'autotest-toolbar';
      tb.style = 'position:fixed; top:0; left:0; right:0; height:45px; background:#1c1e21; color:white; z-index:2147483647; display:flex; align-items:center; padding:0 20px; font-family:sans-serif; font-size:13px; border-bottom:2px solid #1877f2; pointer-events:auto;';
      tb.innerHTML = '<div style="flex:1; display:flex; align-items:center; gap:15px;"><b style="color:#1877f2;">AutoTest</b><div id="at-step-info"></div></div><div style="display:flex; gap:8px;"><button id="at-btn-record" style="background:#1877f2; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer;">⏺ Record</button><button id="at-btn-visible" style="background:#333; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer;">👁 Visible</button><button id="at-btn-text" style="background:#333; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer;">📝 Text</button><button id="at-btn-skip" style="background:#555; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer;">Next ⏭</button></div>';
      document.documentElement.appendChild(tb);
      if(document.body) document.body.style.paddingTop = '45px';
      document.getElementById('at-btn-record').onclick = (e) => { e.stopPropagation(); mode = 'record'; updateUI(); };
      document.getElementById('at-btn-visible').onclick = (e) => { e.stopPropagation(); mode = 'assertVisible'; updateUI(); };
      document.getElementById('at-btn-text').onclick = (e) => { e.stopPropagation(); mode = 'assertText'; updateUI(); };
      document.getElementById('at-btn-skip').onclick = (e) => { e.stopPropagation(); currentIdx++; updateUI(); };
      updateUI();
    };
    const updateUI = () => {
      const info = document.getElementById('at-step-info');
      if(info) info.innerHTML = currentIdx < flowLabels.length ? 'Mapping: <b>' + flowLabels[currentIdx] + '</b>' : '🏁 Done';
    };
    const observer = new MutationObserver(injectToolbar);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    injectToolbar();
    window.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('#autotest-toolbar')) return;
      const el = e.target;
      const target = el.id ? '#' + el.id : (el.getAttribute('name') ? 'input[name="' + el.getAttribute('name') + '"]' : el.tagName.toLowerCase());
      const action = { type: mode === 'record' ? 'click' : mode, target };
      if (mode === 'assertText') action.value = el.innerText.trim();
      window.captureAction(action);
      currentIdx++; updateUI();
    }, true);
  });
  await new Promise(r => browser.on('disconnected', r));
  process.exit(0);
})();