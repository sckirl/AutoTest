# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: executed.spec.ts >> Automated UAT Execution >> Scenario B.10: Navigate to Maintenance
- Location: core/executed.spec.ts:504:9

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h6.oxd-topbar-header-breadcrumb-module')
Expected substring: "Maintenance"
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 10000ms
  - waiting for locator('h6.oxd-topbar-header-breadcrumb-module')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e5]:
    - heading "Administrator Access" [level=6] [ref=e6]
    - generic [ref=e8]: You have requested to access a critical Administrator function in OrangeHRM and are required to validate your credentials below
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: 
        - generic [ref=e13]: Username
      - textbox [disabled] [ref=e15]: Admin
    - generic [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]: 
        - generic [ref=e20]: Password
      - textbox [active] [ref=e22]
    - generic [ref=e23]:
      - button "Cancel" [ref=e24] [cursor=pointer]
      - button "Confirm" [ref=e25] [cursor=pointer]
  - generic [ref=e26]:
    - paragraph [ref=e27]: OrangeHRM OS 5.8
    - paragraph [ref=e28]:
      - text: © 2005 - 2026
      - link "OrangeHRM, Inc" [ref=e29] [cursor=pointer]:
        - /url: http://www.orangehrm.com
      - text: . All rights reserved.
```

# Test source

```ts
  434 |         await test.step('Navigate to OrangeHRM', async () => {
  435 |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  436 |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  437 |         });
  438 | 
  439 |         await test.step('Input Username', async () => {
  440 |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
  441 |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  442 |         });
  443 | 
  444 |         await test.step('Input Password', async () => {
  445 |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
  446 |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  447 |         });
  448 | 
  449 |         await test.step('Click Login Button', async () => {
  450 |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  451 |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  452 |         });
  453 | 
  454 |         await test.step('Click Dashboard Menu', async () => {
  455 |             await page.locator(`a.oxd-main-menu-item:has-text("Dashboard")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("Dashboard")`).click({ force: true });
  456 |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  457 |         });
  458 | 
  459 |         await test.step('Verify Dashboard Header', async () => {
  460 |             await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toBeVisible({ timeout: 10000 });
  461 |             await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
  462 |         });
  463 | 
  464 |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  465 |     });
  466 | 
  467 |     test('Scenario B.9: Navigate to Directory', async ({ page }) => {
  468 |         const resultsDir = path.join(process.cwd(), 'results', 'B_9');
  469 |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  470 | 
  471 |         await test.step('Navigate to OrangeHRM', async () => {
  472 |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  473 |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  474 |         });
  475 | 
  476 |         await test.step('Input Username', async () => {
  477 |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
  478 |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  479 |         });
  480 | 
  481 |         await test.step('Input Password', async () => {
  482 |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
  483 |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  484 |         });
  485 | 
  486 |         await test.step('Click Login Button', async () => {
  487 |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  488 |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  489 |         });
  490 | 
  491 |         await test.step('Click Directory Menu', async () => {
  492 |             await page.locator(`a.oxd-main-menu-item:has-text("Directory")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("Directory")`).click({ force: true });
  493 |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  494 |         });
  495 | 
  496 |         await test.step('Verify Directory Header', async () => {
  497 |             await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toContainText(`Directory`, { timeout: 10000 });
  498 |             await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
  499 |         });
  500 | 
  501 |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  502 |     });
  503 | 
  504 |     test('Scenario B.10: Navigate to Maintenance', async ({ page }) => {
  505 |         const resultsDir = path.join(process.cwd(), 'results', 'B_10');
  506 |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  507 | 
  508 |         await test.step('Navigate to OrangeHRM', async () => {
  509 |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  510 |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  511 |         });
  512 | 
  513 |         await test.step('Input Username', async () => {
  514 |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
  515 |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  516 |         });
  517 | 
  518 |         await test.step('Input Password', async () => {
  519 |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
  520 |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  521 |         });
  522 | 
  523 |         await test.step('Click Login Button', async () => {
  524 |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  525 |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  526 |         });
  527 | 
  528 |         await test.step('Click Maintenance Menu', async () => {
  529 |             await page.locator(`a.oxd-main-menu-item:has-text("Maintenance")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("Maintenance")`).click({ force: true });
  530 |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  531 |         });
  532 | 
  533 |         await test.step('Verify Maintenance Header', async () => {
> 534 |             await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toContainText(`Maintenance`, { timeout: 10000 });
      |                                                                                  ^ Error: expect(locator).toContainText(expected) failed
  535 |             await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
  536 |         });
  537 | 
  538 |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  539 |     });
  540 | 
  541 |     test('Scenario C.1: Add Employee 1', async ({ page }) => {
  542 |         const resultsDir = path.join(process.cwd(), 'results', 'C_1');
  543 |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  544 | 
  545 |         await test.step('Navigate to OrangeHRM', async () => {
  546 |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  547 |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  548 |         });
  549 | 
  550 |         await test.step('Input Username', async () => {
  551 |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
  552 |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  553 |         });
  554 | 
  555 |         await test.step('Input Password', async () => {
  556 |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
  557 |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  558 |         });
  559 | 
  560 |         await test.step('Click Login Button', async () => {
  561 |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  562 |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  563 |         });
  564 | 
  565 |         await test.step('Click PIM Menu', async () => {
  566 |             await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
  567 |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  568 |         });
  569 | 
  570 |         await test.step('Click Add Employee Tab', async () => {
  571 |             await page.locator(`li.oxd-topbar-body-nav-tab:has-text("Add Employee")`).scrollIntoViewIfNeeded(); await page.locator(`li.oxd-topbar-body-nav-tab:has-text("Add Employee")`).click({ force: true });
  572 |             await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
  573 |         });
  574 | 
  575 |         await test.step('Input First Name', async () => {
  576 |             await page.locator(`input[name="firstName"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="firstName"]`).fill(`Test1`);
  577 |             await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
  578 |         });
  579 | 
  580 |         await test.step('Input Last Name', async () => {
  581 |             await page.locator(`input[name="lastName"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="lastName"]`).fill(`User1`);
  582 |             await page.screenshot({ path: path.join(resultsDir, `STEP_7_ACT_0.png`), fullPage: true });
  583 |         });
  584 | 
  585 |         await test.step('Click Save Button', async () => {
  586 |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  587 |             await page.screenshot({ path: path.join(resultsDir, `STEP_8_ACT_0.png`), fullPage: true });
  588 |         });
  589 | 
  590 |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  591 |     });
  592 | 
  593 |     test('Scenario C.2: Add Employee 2', async ({ page }) => {
  594 |         const resultsDir = path.join(process.cwd(), 'results', 'C_2');
  595 |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  596 | 
  597 |         await test.step('Navigate to OrangeHRM', async () => {
  598 |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  599 |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  600 |         });
  601 | 
  602 |         await test.step('Input Username', async () => {
  603 |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
  604 |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  605 |         });
  606 | 
  607 |         await test.step('Input Password', async () => {
  608 |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
  609 |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  610 |         });
  611 | 
  612 |         await test.step('Click Login Button', async () => {
  613 |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  614 |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  615 |         });
  616 | 
  617 |         await test.step('Click PIM Menu', async () => {
  618 |             await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
  619 |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  620 |         });
  621 | 
  622 |         await test.step('Click Add Employee Tab', async () => {
  623 |             await page.locator(`li.oxd-topbar-body-nav-tab:has-text("Add Employee")`).scrollIntoViewIfNeeded(); await page.locator(`li.oxd-topbar-body-nav-tab:has-text("Add Employee")`).click({ force: true });
  624 |             await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
  625 |         });
  626 | 
  627 |         await test.step('Input First Name', async () => {
  628 |             await page.locator(`input[name="firstName"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="firstName"]`).fill(`Test2`);
  629 |             await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
  630 |         });
  631 | 
  632 |         await test.step('Input Last Name', async () => {
  633 |             await page.locator(`input[name="lastName"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="lastName"]`).fill(`User2`);
  634 |             await page.screenshot({ path: path.join(resultsDir, `STEP_7_ACT_0.png`), fullPage: true });
```