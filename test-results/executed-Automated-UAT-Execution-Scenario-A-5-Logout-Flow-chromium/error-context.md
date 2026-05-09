# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: executed.spec.ts >> Automated UAT Execution >> Scenario A.5: Logout Flow
- Location: core/executed.spec.ts:134:9

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.scrollIntoViewIfNeeded: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('span.oxd-userdropdown-tab')
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
            - textbox "Username" [active] [ref=e28]
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
  132 |     });
  133 | 
  134 |     test('Scenario A.5: Logout Flow', async ({ page }) => {
  135 |         const resultsDir = path.join(process.cwd(), 'results', 'A_5');
  136 |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  137 | 
  138 |         await test.step('Navigate to OrangeHRM', async () => {
  139 |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  140 |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  141 |         });
  142 | 
  143 |         await test.step('Input Username', async () => {
  144 |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`{{username}}`);
  145 |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  146 |         });
  147 | 
  148 |         await test.step('Input Password', async () => {
  149 |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`{{password}}`);
  150 |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  151 |         });
  152 | 
  153 |         await test.step('Click Login Button', async () => {
  154 |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  155 |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  156 |         });
  157 | 
  158 |         await test.step('Click User Dropdown', async () => {
> 159 |             await page.locator(`span.oxd-userdropdown-tab`).scrollIntoViewIfNeeded(); await page.locator(`span.oxd-userdropdown-tab`).click({ force: true });
      |                                                             ^ Error: locator.scrollIntoViewIfNeeded: Test timeout of 60000ms exceeded.
  160 |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  161 |         });
  162 | 
  163 |         await test.step('Click Logout', async () => {
  164 |             await page.locator(`a.oxd-userdropdown-link:has-text("Logout")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-userdropdown-link:has-text("Logout")`).click({ force: true });
  165 |             await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
  166 |         });
  167 | 
  168 |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  169 |     });
  170 | 
  171 |     test('Scenario B.1: Navigate to Admin', async ({ page }) => {
  172 |         const resultsDir = path.join(process.cwd(), 'results', 'B_1');
  173 |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  174 | 
  175 |         await test.step('Navigate to OrangeHRM', async () => {
  176 |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  177 |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  178 |         });
  179 | 
  180 |         await test.step('Input Username', async () => {
  181 |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
  182 |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  183 |         });
  184 | 
  185 |         await test.step('Input Password', async () => {
  186 |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
  187 |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  188 |         });
  189 | 
  190 |         await test.step('Click Login Button', async () => {
  191 |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  192 |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  193 |         });
  194 | 
  195 |         await test.step('Click Admin Menu', async () => {
  196 |             await page.locator(`a.oxd-main-menu-item:has-text("Admin")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("Admin")`).click({ force: true });
  197 |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  198 |         });
  199 | 
  200 |         await test.step('Verify Admin Header', async () => {
  201 |             await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toContainText(`Admin`, { timeout: 10000 });
  202 |             await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
  203 |         });
  204 | 
  205 |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  206 |     });
  207 | 
  208 |     test('Scenario B.2: Navigate to PIM', async ({ page }) => {
  209 |         const resultsDir = path.join(process.cwd(), 'results', 'B_2');
  210 |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  211 | 
  212 |         await test.step('Navigate to OrangeHRM', async () => {
  213 |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  214 |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  215 |         });
  216 | 
  217 |         await test.step('Input Username', async () => {
  218 |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
  219 |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  220 |         });
  221 | 
  222 |         await test.step('Input Password', async () => {
  223 |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
  224 |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  225 |         });
  226 | 
  227 |         await test.step('Click Login Button', async () => {
  228 |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  229 |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  230 |         });
  231 | 
  232 |         await test.step('Click PIM Menu', async () => {
  233 |             await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
  234 |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  235 |         });
  236 | 
  237 |         await test.step('Verify PIM Header', async () => {
  238 |             await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toContainText(`PIM`, { timeout: 10000 });
  239 |             await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
  240 |         });
  241 | 
  242 |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  243 |     });
  244 | 
  245 |     test('Scenario B.3: Navigate to Leave', async ({ page }) => {
  246 |         const resultsDir = path.join(process.cwd(), 'results', 'B_3');
  247 |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  248 | 
  249 |         await test.step('Navigate to OrangeHRM', async () => {
  250 |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  251 |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  252 |         });
  253 | 
  254 |         await test.step('Input Username', async () => {
  255 |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
  256 |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  257 |         });
  258 | 
  259 |         await test.step('Input Password', async () => {
```