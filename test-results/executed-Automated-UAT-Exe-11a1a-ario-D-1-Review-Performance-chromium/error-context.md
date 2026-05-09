# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: executed.spec.ts >> Automated UAT Execution >> Scenario D.1: Review Performance
- Location: core/executed.spec.ts:1011:9

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.scrollIntoViewIfNeeded: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('a.orangehrm-tabs-item:has-text("Performance")')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - complementary [ref=e4]:
      - navigation "Sidepanel" [ref=e5]:
        - generic [ref=e6]:
          - link "client brand banner" [ref=e7] [cursor=pointer]:
            - /url: https://www.orangehrm.com/
            - img "client brand banner" [ref=e9]
          - text: 
        - generic [ref=e10]:
          - generic [ref=e11]:
            - generic [ref=e12]:
              - textbox "Search" [ref=e15]
              - button "" [ref=e16] [cursor=pointer]:
                - generic [ref=e17]: 
            - separator [ref=e18]
          - list [ref=e19]:
            - listitem [ref=e20]:
              - link "Admin" [ref=e21] [cursor=pointer]:
                - /url: /web/index.php/admin/viewAdminModule
                - generic [ref=e24]: Admin
            - listitem [ref=e25]:
              - link "PIM" [ref=e26] [cursor=pointer]:
                - /url: /web/index.php/pim/viewPimModule
                - generic [ref=e40]: PIM
            - listitem [ref=e41]:
              - link "Leave" [ref=e42] [cursor=pointer]:
                - /url: /web/index.php/leave/viewLeaveModule
                - generic [ref=e45]: Leave
            - listitem [ref=e46]:
              - link "Time" [ref=e47] [cursor=pointer]:
                - /url: /web/index.php/time/viewTimeModule
                - generic [ref=e53]: Time
            - listitem [ref=e54]:
              - link "Recruitment" [ref=e55] [cursor=pointer]:
                - /url: /web/index.php/recruitment/viewRecruitmentModule
                - generic [ref=e61]: Recruitment
            - listitem [ref=e62]:
              - link "My Info" [ref=e63] [cursor=pointer]:
                - /url: /web/index.php/pim/viewMyDetails
                - generic [ref=e69]: My Info
            - listitem [ref=e70]:
              - link "Performance" [ref=e71] [cursor=pointer]:
                - /url: /web/index.php/performance/viewPerformanceModule
                - generic [ref=e79]: Performance
            - listitem [ref=e80]:
              - link "Dashboard" [ref=e81] [cursor=pointer]:
                - /url: /web/index.php/dashboard/index
                - generic [ref=e84]: Dashboard
            - listitem [ref=e85]:
              - link "Directory" [ref=e86] [cursor=pointer]:
                - /url: /web/index.php/directory/viewDirectory
                - generic [ref=e89]: Directory
            - listitem [ref=e90]:
              - link "Maintenance" [ref=e91] [cursor=pointer]:
                - /url: /web/index.php/maintenance/viewMaintenanceModule
                - generic [ref=e95]: Maintenance
            - listitem [ref=e96]:
              - link "Claim" [ref=e97] [cursor=pointer]:
                - /url: /web/index.php/claim/viewClaimModule
                - img [ref=e100]
                - generic [ref=e104]: Claim
            - listitem [ref=e105]:
              - link "Buzz" [ref=e106] [cursor=pointer]:
                - /url: /web/index.php/buzz/viewBuzz
                - generic [ref=e109]: Buzz
    - banner [ref=e110]:
      - generic [ref=e111]:
        - generic [ref=e112]:
          - text: 
          - heading "PIM" [level=6] [ref=e114]
        - link "Upgrade" [ref=e116]:
          - /url: https://orangehrm.com/open-source/upgrade-to-advanced
          - button "Upgrade" [ref=e117] [cursor=pointer]: Upgrade
        - list [ref=e123]:
          - listitem [ref=e124]:
            - generic [ref=e125] [cursor=pointer]:
              - img "profile picture" [ref=e126]
              - paragraph [ref=e127]: Lavone Hackett
              - generic [ref=e128]: 
      - navigation "Topbar Menu" [ref=e130]:
        - list [ref=e131]:
          - button "" [ref=e133] [cursor=pointer]:
            - generic [ref=e134]: 
  - generic [ref=e135]:
    - generic [ref=e139]:
      - generic [ref=e140]:
        - generic [ref=e141]:
          - heading "Lavone Hackett" [level=6] [ref=e143]
          - img "profile picture" [ref=e146] [cursor=pointer]
        - tablist [ref=e147]:
          - tab "Personal Details" [ref=e148]:
            - link "Personal Details" [ref=e149] [cursor=pointer]:
              - /url: /web/index.php/pim/viewPersonalDetails/empNumber/7
          - tab "Contact Details" [ref=e150]:
            - link "Contact Details" [ref=e151] [cursor=pointer]:
              - /url: /web/index.php/pim/contactDetails/empNumber/7
          - tab "Emergency Contacts" [ref=e152]:
            - link "Emergency Contacts" [ref=e153] [cursor=pointer]:
              - /url: /web/index.php/pim/viewEmergencyContacts/empNumber/7
          - tab "Dependents" [ref=e154]:
            - link "Dependents" [ref=e155] [cursor=pointer]:
              - /url: /web/index.php/pim/viewDependents/empNumber/7
          - tab "Immigration" [ref=e156]:
            - link "Immigration" [ref=e157] [cursor=pointer]:
              - /url: /web/index.php/pim/viewImmigration/empNumber/7
          - tab "Job" [ref=e158]:
            - link "Job" [ref=e159] [cursor=pointer]:
              - /url: /web/index.php/pim/viewJobDetails/empNumber/7
          - tab "Salary" [ref=e160]:
            - link "Salary" [ref=e161] [cursor=pointer]:
              - /url: /web/index.php/pim/viewSalaryList/empNumber/7
          - tab "Report-to" [ref=e162]:
            - link "Report-to" [ref=e163] [cursor=pointer]:
              - /url: /web/index.php/pim/viewReportToDetails/empNumber/7
          - tab "Qualifications" [ref=e164]:
            - link "Qualifications" [ref=e165] [cursor=pointer]:
              - /url: /web/index.php/pim/viewQualifications/empNumber/7
          - tab "Memberships" [ref=e166]:
            - link "Memberships" [ref=e167] [cursor=pointer]:
              - /url: /web/index.php/pim/viewMemberships/empNumber/7
      - generic [ref=e168]:
        - generic [ref=e169]:
          - heading "Personal Details" [level=6] [ref=e170]
          - separator [ref=e171]
          - generic [ref=e172]:
            - generic [ref=e176]:
              - generic [ref=e178]: Employee Full Name*
              - generic [ref=e179]:
                - textbox "First Name" [ref=e182]: Lavone
                - textbox "Middle Name" [ref=e185]: Anthony
                - textbox "Last Name" [ref=e188]: Hackett
            - separator [ref=e189]
            - generic [ref=e190]:
              - generic [ref=e191]:
                - generic [ref=e193]:
                  - generic [ref=e195]: Employee Id
                  - textbox [ref=e197]: EMP6876
                - generic [ref=e199]:
                  - generic [ref=e201]: Other Id
                  - textbox [ref=e203]: OTH6876
              - generic [ref=e204]:
                - generic [ref=e206]:
                  - generic [ref=e208]: Driver's License Number
                  - textbox [ref=e210]: "56788"
                - generic [ref=e212]:
                  - generic [ref=e214]: License Expiry Date
                  - generic [ref=e217]:
                    - textbox "yyyy-dd-mm" [ref=e218]: 2023-18-10
                    - generic [ref=e219] [cursor=pointer]: 
            - separator [ref=e220]
            - generic [ref=e221]:
              - generic [ref=e222]:
                - generic [ref=e224]:
                  - generic [ref=e226]: Nationality
                  - generic [ref=e229] [cursor=pointer]:
                    - generic [ref=e230]: American
                    - generic [ref=e232]: 
                - generic [ref=e234]:
                  - generic [ref=e236]: Marital Status
                  - generic [ref=e239] [cursor=pointer]:
                    - generic [ref=e240]: Single
                    - generic [ref=e242]: 
              - generic [ref=e243]:
                - generic [ref=e245]:
                  - generic [ref=e247]: Date of Birth
                  - generic [ref=e250]:
                    - textbox "yyyy-dd-mm" [ref=e251]: 2023-21-10
                    - generic [ref=e252] [cursor=pointer]: 
                - generic [ref=e254]:
                  - generic [ref=e256]: Gender
                  - generic [ref=e257]:
                    - generic [ref=e261] [cursor=pointer]:
                      - radio "Male" [checked] [ref=e262]
                      - text: Male
                    - generic [ref=e267] [cursor=pointer]:
                      - radio "Female" [ref=e268]
                      - text: Female
            - separator [ref=e270]
            - generic [ref=e271]:
              - paragraph [ref=e272]: "* Required"
              - button "Save" [ref=e273] [cursor=pointer]
        - generic [ref=e274]:
          - separator [ref=e275]
          - generic [ref=e276]:
            - heading "Custom Fields" [level=6] [ref=e277]
            - separator [ref=e278]
            - generic [ref=e279]:
              - generic [ref=e281]:
                - generic [ref=e283]:
                  - generic [ref=e285]: ACC
                  - textbox [ref=e287]: "445"
                - generic [ref=e289]:
                  - generic [ref=e291]: BSB
                  - textbox [ref=e293]
              - separator [ref=e294]
              - button "Save" [ref=e296] [cursor=pointer]
        - generic [ref=e297]:
          - separator [ref=e298]
          - generic [ref=e300]:
            - heading "Attachments" [level=6] [ref=e301]
            - button " Add" [ref=e302] [cursor=pointer]:
              - generic [ref=e303]: 
              - text: Add
          - generic [ref=e304]:
            - separator [ref=e305]
            - generic [ref=e307]: (1) Record Found
          - table [ref=e309]:
            - rowgroup [ref=e310]:
              - row " File Name Description Size Type Date Added Added By Actions" [ref=e311]:
                - columnheader "" [ref=e312]:
                  - generic [ref=e314] [cursor=pointer]:
                    - checkbox "" [ref=e315]
                    - generic [ref=e317]: 
                - columnheader "File Name" [ref=e318]
                - columnheader "Description" [ref=e319]
                - columnheader "Size" [ref=e320]
                - columnheader "Type" [ref=e321]
                - columnheader "Date Added" [ref=e322]
                - columnheader "Added By" [ref=e323]
                - columnheader "Actions" [ref=e324]
            - rowgroup [ref=e325]:
              - row " test.png test 53.16 kB image/png 2024-06-02 Admin   " [ref=e327]:
                - cell "" [ref=e328]:
                  - generic [ref=e331] [cursor=pointer]:
                    - checkbox "" [ref=e332]
                    - generic [ref=e334]: 
                - cell "test.png" [ref=e335]:
                  - generic [ref=e336]: test.png
                - cell "test" [ref=e337]:
                  - generic [ref=e338]: test
                - cell "53.16 kB" [ref=e339]:
                  - generic [ref=e340]: 53.16 kB
                - cell "image/png" [ref=e341]:
                  - generic [ref=e342]: image/png
                - cell "2024-06-02" [ref=e343]:
                  - generic [ref=e344]: 2024-06-02
                - cell "Admin" [ref=e345]:
                  - generic [ref=e346]: Admin
                - cell "  " [ref=e347]:
                  - generic [ref=e348]:
                    - button "" [ref=e349] [cursor=pointer]:
                      - generic [ref=e350]: 
                    - button "" [ref=e351] [cursor=pointer]:
                      - generic [ref=e352]: 
                    - button "" [ref=e353] [cursor=pointer]:
                      - generic [ref=e354]: 
    - generic [ref=e355]:
      - paragraph [ref=e356]: OrangeHRM OS 5.8
      - paragraph [ref=e357]:
        - text: © 2005 - 2026
        - link "OrangeHRM, Inc" [ref=e358] [cursor=pointer]:
          - /url: http://www.orangehrm.com
        - text: . All rights reserved.
```

# Test source

```ts
  941  |         await test.step('Input Password', async () => {
  942  |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
  943  |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  944  |         });
  945  | 
  946  |         await test.step('Click Login Button', async () => {
  947  |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  948  |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  949  |         });
  950  | 
  951  |         await test.step('Click PIM Menu', async () => {
  952  |             await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
  953  |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  954  |         });
  955  | 
  956  |         await test.step('Input Employee Name Search', async () => {
  957  |             await page.locator(`div.oxd-input-group:has(label:has-text("Employee Name")) input`).scrollIntoViewIfNeeded(); await page.locator(`div.oxd-input-group:has(label:has-text("Employee Name")) input`).fill(`Test4`);
  958  |             await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
  959  |         });
  960  | 
  961  |         await test.step('Click Search Button', async () => {
  962  |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  963  |             await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
  964  |         });
  965  | 
  966  |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  967  |     });
  968  | 
  969  |     test('Scenario C.10: Search Employee 5', async ({ page }) => {
  970  |         const resultsDir = path.join(process.cwd(), 'results', 'C_10');
  971  |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  972  | 
  973  |         await test.step('Navigate to OrangeHRM', async () => {
  974  |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  975  |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  976  |         });
  977  | 
  978  |         await test.step('Input Username', async () => {
  979  |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
  980  |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  981  |         });
  982  | 
  983  |         await test.step('Input Password', async () => {
  984  |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
  985  |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  986  |         });
  987  | 
  988  |         await test.step('Click Login Button', async () => {
  989  |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  990  |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  991  |         });
  992  | 
  993  |         await test.step('Click PIM Menu', async () => {
  994  |             await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
  995  |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  996  |         });
  997  | 
  998  |         await test.step('Input Employee Name Search', async () => {
  999  |             await page.locator(`div.oxd-input-group:has(label:has-text("Employee Name")) input`).scrollIntoViewIfNeeded(); await page.locator(`div.oxd-input-group:has(label:has-text("Employee Name")) input`).fill(`Test5`);
  1000 |             await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
  1001 |         });
  1002 | 
  1003 |         await test.step('Click Search Button', async () => {
  1004 |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  1005 |             await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
  1006 |         });
  1007 | 
  1008 |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  1009 |     });
  1010 | 
  1011 |     test('Scenario D.1: Review Performance', async ({ page }) => {
  1012 |         const resultsDir = path.join(process.cwd(), 'results', 'D_1');
  1013 |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  1014 | 
  1015 |         await test.step('Navigate to OrangeHRM', async () => {
  1016 |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  1017 |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  1018 |         });
  1019 | 
  1020 |         await test.step('Input Username', async () => {
  1021 |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
  1022 |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  1023 |         });
  1024 | 
  1025 |         await test.step('Input Password', async () => {
  1026 |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
  1027 |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  1028 |         });
  1029 | 
  1030 |         await test.step('Click Login Button', async () => {
  1031 |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  1032 |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  1033 |         });
  1034 | 
  1035 |         await test.step('Click My Info Menu', async () => {
  1036 |             await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).click({ force: true });
  1037 |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  1038 |         });
  1039 | 
  1040 |         await test.step('Click Review Performance Section', async () => {
> 1041 |             await page.locator(`a.orangehrm-tabs-item:has-text("Performance")`).scrollIntoViewIfNeeded(); await page.locator(`a.orangehrm-tabs-item:has-text("Performance")`).click({ force: true });
       |                                                                                 ^ Error: locator.scrollIntoViewIfNeeded: Test timeout of 60000ms exceeded.
  1042 |             await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
  1043 |         });
  1044 | 
  1045 |         await test.step('Verify Content Visibility', async () => {
  1046 |             await expect(page.locator(`.orangehrm-edit-employee-content`)).toBeVisible({ timeout: 10000 });
  1047 |             await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
  1048 |         });
  1049 | 
  1050 |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  1051 |     });
  1052 | 
  1053 |     test('Scenario D.2: Update Contact Details', async ({ page }) => {
  1054 |         const resultsDir = path.join(process.cwd(), 'results', 'D_2');
  1055 |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  1056 | 
  1057 |         await test.step('Navigate to OrangeHRM', async () => {
  1058 |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  1059 |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  1060 |         });
  1061 | 
  1062 |         await test.step('Input Username', async () => {
  1063 |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
  1064 |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  1065 |         });
  1066 | 
  1067 |         await test.step('Input Password', async () => {
  1068 |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
  1069 |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  1070 |         });
  1071 | 
  1072 |         await test.step('Click Login Button', async () => {
  1073 |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  1074 |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  1075 |         });
  1076 | 
  1077 |         await test.step('Click My Info Menu', async () => {
  1078 |             await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).click({ force: true });
  1079 |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  1080 |         });
  1081 | 
  1082 |         await test.step('Click Update Contact Details Section', async () => {
  1083 |             await page.locator(`a.orangehrm-tabs-item:has-text("Contact Details")`).scrollIntoViewIfNeeded(); await page.locator(`a.orangehrm-tabs-item:has-text("Contact Details")`).click({ force: true });
  1084 |             await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
  1085 |         });
  1086 | 
  1087 |         await test.step('Verify Content Visibility', async () => {
  1088 |             await expect(page.locator(`.orangehrm-edit-employee-content`)).toBeVisible({ timeout: 10000 });
  1089 |             await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
  1090 |         });
  1091 | 
  1092 |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  1093 |     });
  1094 | 
  1095 |     test('Scenario D.3: View Job Info', async ({ page }) => {
  1096 |         const resultsDir = path.join(process.cwd(), 'results', 'D_3');
  1097 |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  1098 | 
  1099 |         await test.step('Navigate to OrangeHRM', async () => {
  1100 |             await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
  1101 |             await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
  1102 |         });
  1103 | 
  1104 |         await test.step('Input Username', async () => {
  1105 |             await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
  1106 |             await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
  1107 |         });
  1108 | 
  1109 |         await test.step('Input Password', async () => {
  1110 |             await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
  1111 |             await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
  1112 |         });
  1113 | 
  1114 |         await test.step('Click Login Button', async () => {
  1115 |             await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
  1116 |             await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
  1117 |         });
  1118 | 
  1119 |         await test.step('Click My Info Menu', async () => {
  1120 |             await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).click({ force: true });
  1121 |             await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
  1122 |         });
  1123 | 
  1124 |         await test.step('Click View Job Info Section', async () => {
  1125 |             await page.locator(`a.orangehrm-tabs-item:has-text("Job")`).scrollIntoViewIfNeeded(); await page.locator(`a.orangehrm-tabs-item:has-text("Job")`).click({ force: true });
  1126 |             await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
  1127 |         });
  1128 | 
  1129 |         await test.step('Verify Content Visibility', async () => {
  1130 |             await expect(page.locator(`.orangehrm-edit-employee-content`)).toBeVisible({ timeout: 10000 });
  1131 |             await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
  1132 |         });
  1133 | 
  1134 |         await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
  1135 |     });
  1136 | 
  1137 |     test('Scenario D.4: Check Salary Details', async ({ page }) => {
  1138 |         const resultsDir = path.join(process.cwd(), 'results', 'D_4');
  1139 |         if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  1140 | 
  1141 |         await test.step('Navigate to OrangeHRM', async () => {
```