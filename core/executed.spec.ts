const { remote } = require('webdriverio');
const path = require('path');
const fs = require('fs');

describe('Automated UAT Execution (Mobile)', function() {
  let driver;
  before(async () => {
    driver = await remote({ capabilities: { platformName: 'Android', 'appium:automationName': 'UiAutomator2' } });
  });
  after(async () => {
    if (driver) await driver.deleteSession();
  });

  it('Scenario A: OrangeHRM Standard Flows', async () => {
    const resultsDir = path.join(process.cwd(), 'results', 'A');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
    } finally {
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'FINAL.png'));
    }
  });

  it('Scenario A.1 - Iteration 1: Successful Admin Login', async () => {
    const resultsDir = path.join(process.cwd(), 'results', 'A_1_Iter1');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
        await driver.url("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_1.png'));
        await driver.$("getByRole(\"textbox\", \"name\")").click();
        await driver.$("//*[@text=\"admin\" or @content-desc=\"admin\"]").setValue("admin");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_2.png'));
        await driver.$("//*[@text=\"admin123\" or @content-desc=\"admin123\"]").setValue("admin123");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_3.png'));
        await driver.$("//*[@text=\"Login\" or @content-desc=\"Login\"]").click();
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_4.png'));
    } finally {
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'FINAL.png'));
    }
  });

  it('Scenario A.1 - Iteration 2: Successful Admin Login', async () => {
    const resultsDir = path.join(process.cwd(), 'results', 'A_1_Iter2');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
        await driver.url("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_1.png'));
        await driver.$("getByRole(\"textbox\", \"name\")").click();
        await driver.$("//*[@text=\"spv\" or @content-desc=\"spv\"]").setValue("spv");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_2.png'));
        await driver.$("//*[@text=\"spv123\" or @content-desc=\"spv123\"]").setValue("spv123");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_3.png'));
        await driver.$("//*[@text=\"Login\" or @content-desc=\"Login\"]").click();
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_4.png'));
    } finally {
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'FINAL.png'));
    }
  });

  it('Scenario A.2: Navigate to My Info', async () => {
    const resultsDir = path.join(process.cwd(), 'results', 'A_2');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
        await driver.url("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_1.png'));
        await driver.$("getByRole(\"textbox\", \"name\")").click();
        await driver.$("getByRole(\"textbox\", \"name\")").setValue("");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_2.png'));
        await driver.$("//*[@text=\"admin123\" or @content-desc=\"admin123\"]").setValue("admin123");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_3.png'));
        await driver.$("//*[@text=\"Login\" or @content-desc=\"Login\"]").click();
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_4.png'));
        await driver.$("//*[@text=\"My Info\" or @content-desc=\"My Info\"]").click();
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_5.png'));
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_6.png'));
    } finally {
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'FINAL.png'));
    }
  });

  it('Scenario B.1: Invalid Login Attempt', async () => {
    const resultsDir = path.join(process.cwd(), 'results', 'B_1');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
        await driver.url("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_1.png'));
        await driver.$("getByRole(\"textbox\", \"name\")").click();
        await driver.$("getByRole(\"textbox\", \"name\")").setValue("");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_2.png'));
        await driver.$("//*[@text=\"Wrong123\" or @content-desc=\"Wrong123\"]").setValue("Wrong123");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_3.png'));
        await driver.$("//*[@text=\"Login\" or @content-desc=\"Login\"]").click();
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_4.png'));
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_5.png'));
    } finally {
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'FINAL.png'));
    }
  });

});
