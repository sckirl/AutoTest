# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: executed.spec.ts >> Automated UAT Execution >> Scenario A.1: Valid Admin Login
- Location: core/executed.spec.ts:6:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h6.oxd-topbar-header-breadcrumb-module')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('h6.oxd-topbar-header-breadcrumb-module')
    - waiting for" https://opensource-demo.orangehrmlive.com/web/index.php/auth/validate" navigation to finish...
    - navigated to "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login"

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e6]:
    - img "company-branding" [ref=e8]
    - generic [ref=e9]:
      - heading "Login" [level=5] [ref=e10]
      - generic [ref=e11]:
        - generic [ref=e12]:
          - alert [ref=e13]:
            - generic [ref=e14]:
              - generic [ref=e15]: 
              - paragraph [ref=e16]: Invalid credentials
          - generic [ref=e18]:
            - paragraph [ref=e19]: "Username : Admin"
            - paragraph [ref=e20]: "Password : admin123"
        - generic [ref=e21]:
          - generic [ref=e23]:
            - generic [ref=e24]:
              - generic [ref=e25]: 
              - generic [ref=e26]: Username
            - textbox "Username" [ref=e28]
          - generic [ref=e30]:
            - generic [ref=e31]:
              - generic [ref=e32]: 
              - generic [ref=e33]: Password
            - textbox "Password" [ref=e35]
          - button "Login" [ref=e37] [cursor=pointer]
          - paragraph [ref=e39] [cursor=pointer]: Forgot your password?
      - generic [ref=e40]:
        - generic [ref=e41]:
          - link [ref=e42] [cursor=pointer]:
            - /url: https://www.linkedin.com/company/orangehrm/mycompany/
          - link [ref=e45] [cursor=pointer]:
            - /url: https://www.facebook.com/OrangeHRM/
          - link [ref=e48] [cursor=pointer]:
            - /url: https://twitter.com/orangehrm?lang=en
          - link [ref=e51] [cursor=pointer]:
            - /url: https://www.youtube.com/c/OrangeHRMInc
        - generic [ref=e54]:
          - paragraph [ref=e55]: OrangeHRM OS 5.8
          - paragraph [ref=e56]:
            - text: © 2005 - 2026
            - link "OrangeHRM, Inc" [ref=e57] [cursor=pointer]:
              - /url: http://www.orangehrm.com
            - text: . All rights reserved.
  - img "orangehrm-logo" [ref=e59]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import * as path from 'path';
  3   | import * as fs from 'fs';
  4   | 
  5   | test.describe('Automated UAT Execution', () => {
  6   |     test('Scenario A.1: Valid Admin Login', async ({ page }) => {
  7   |         const resultsDir = path.join(process.cwd(), 'results', 'A_1');
  8   |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  9   | 
  10  |         await test.step('Navigate to OrangeHRM', async () => {
  11  |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  12  |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  13  |         });
  14  | 
  15  |         await test.step('Input Username', async () => {
  16  |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`{{username}}`);
  17  |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  18  |         });
  19  | 
  20  |         await test.step('Input Password', async () => {
  21  |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`{{password}}`);
  22  |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  23  |         });
  24  | 
  25  |         await test.step('Click Login Button', async () => {
  26  |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  27  |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  28  |         });
  29  | 
  30  |         await test.step('Verify Dashboard Header', async () => {
> 31  |             await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toBeVisible({ timeout: 10000 });
      |                                                                                  ^ Error: expect(locator).toBeVisible() failed
  32  |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  33  |         });
  34  | 
  35  |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  36  |     });
  37  | 
  38  |     test('Scenario A.2: Invalid Username', async ({ page }) => {
  39  |         const resultsDir = path.join(process.cwd(), 'results', 'A_2');
  40  |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  41  | 
  42  |         await test.step('Navigate to OrangeHRM', async () => {
  43  |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  44  |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  45  |         });
  46  | 
  47  |         await test.step('Input Username', async () => {
  48  |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`{{username}}`);
  49  |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  50  |         });
  51  | 
  52  |         await test.step('Input Password', async () => {
  53  |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`{{password}}`);
  54  |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  55  |         });
  56  | 
  57  |         await test.step('Click Login Button', async () => {
  58  |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  59  |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  60  |         });
  61  | 
  62  |         await test.step('Verify Login Error Message', async () => {
  63  |             await expect(page.locator(`.oxd-alert--error`)).toBeVisible({ timeout: 10000 });
  64  |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  65  |         });
  66  | 
  67  |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  68  |     });
  69  | 
  70  |     test('Scenario A.3: Invalid Password', async ({ page }) => {
  71  |         const resultsDir = path.join(process.cwd(), 'results', 'A_3');
  72  |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  73  | 
  74  |         await test.step('Navigate to OrangeHRM', async () => {
  75  |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  76  |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  77  |         });
  78  | 
  79  |         await test.step('Input Username', async () => {
  80  |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`{{username}}`);
  81  |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  82  |         });
  83  | 
  84  |         await test.step('Input Password', async () => {
  85  |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`{{password}}`);
  86  |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  87  |         });
  88  | 
  89  |         await test.step('Click Login Button', async () => {
  90  |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  91  |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  92  |         });
  93  | 
  94  |         await test.step('Verify Login Error Message', async () => {
  95  |             await expect(page.locator(`.oxd-alert--error`)).toBeVisible({ timeout: 10000 });
  96  |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  97  |         });
  98  | 
  99  |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  100 |     });
  101 | 
  102 |     test('Scenario A.4: Empty Credentials', async ({ page }) => {
  103 |         const resultsDir = path.join(process.cwd(), 'results', 'A_4');
  104 |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  105 | 
  106 |         await test.step('Navigate to OrangeHRM', async () => {
  107 |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  108 |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  109 |         });
  110 | 
  111 |         await test.step('Input Username', async () => {
  112 |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`{{username}}`);
  113 |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  114 |         });
  115 | 
  116 |         await test.step('Input Password', async () => {
  117 |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`{{password}}`);
  118 |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  119 |         });
  120 | 
  121 |         await test.step('Click Login Button', async () => {
  122 |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  123 |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  124 |         });
  125 | 
  126 |         await test.step('Verify Login Error Message', async () => {
  127 |             await expect(page.locator(`.oxd-alert--error`)).toBeVisible({ timeout: 10000 });
  128 |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  129 |         });
  130 | 
  131 |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
```