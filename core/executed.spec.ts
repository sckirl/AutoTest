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

  it('Scenario A.1 - Iteration 1: Successful Login Demo', async () => {
    const resultsDir = path.join(process.cwd(), 'results', 'A_1_Iter1');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
        await driver.url("https://practicetestautomation.com/practice-test-login/");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_1.png'));
        await driver.$("//*[@text=\"Username\" or @content-desc=\"Username\"]").setValue("student");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_2.png'));
        await driver.$("//*[@text=\"Password\" or @content-desc=\"Password\"]").setValue("Password123");
      await driver.pause(800);
      await driver.saveScreenshot(path.join(resultsDir, 'STEP_3.png'));
        await driver.$("getByRole(\"button\", \"name\")").click();
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
