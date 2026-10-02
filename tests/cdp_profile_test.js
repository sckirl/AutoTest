// TDD contract checks for the isolated stable-Chrome recording runtime.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { parseDotEnv, loadDotEnv } = require('../core/runtime_env');
const profile = require('../core/cdp_session');

function withEnv(changes, fn) {
    const old = {};
    for (const [key, value] of Object.entries(changes)) {
        old[key] = process.env[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
    try { return fn(); }
    finally {
        for (const [key, value] of Object.entries(old)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
}

// This test is intentionally RED until the runtime env/profile contract is implemented.
const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autotest-profile-'));
try {
    withEnv({ AUTOTEST_STATE_DIR: stateDir, AUTOTEST_CDP_PROFILE: 'isolated' }, () => {
        assert.strictEqual(profile.resolveRealProfileDir(), path.join(stateDir, 'autotest'),
            'isolated recording must use the fixed autotest profile directory');
    });

    withEnv({ AUTOTEST_STATE_DIR: stateDir, AUTOTEST_CDP_PROFILE: undefined }, () => {
        assert.strictEqual(profile.resolveRealProfileDir(), path.join(stateDir, 'autotest'),
            'direct server startup must default to the isolated autotest profile');
    });

    const envFile = path.join(stateDir, '.env');
    fs.writeFileSync(envFile, '# comment\nAUTOTEST_CHROME_PATH="/configured/stable/chrome"\nIGNORED_LINE\n');
    assert.deepStrictEqual(parseDotEnv(fs.readFileSync(envFile, 'utf8')), {
        AUTOTEST_CHROME_PATH: '/configured/stable/chrome'
    }, 'dotenv parser must ignore comments and malformed lines and unquote values');
    withEnv({ AUTOTEST_CHROME_PATH: undefined, AUTOTEST_ENV_FILE: undefined }, () => {
        loadDotEnv(envFile);
        assert.strictEqual(process.env.AUTOTEST_CHROME_PATH, '/configured/stable/chrome',
            '.env should supply an unset Chrome path');
    });
    withEnv({ AUTOTEST_CHROME_PATH: '/process/stable/chrome' }, () => {
        loadDotEnv(envFile);
        assert.strictEqual(process.env.AUTOTEST_CHROME_PATH, '/process/stable/chrome',
            'an explicit process Chrome path must win over .env');
    });

    const chromePath = path.join(stateDir, 'chrome.exe');
    fs.writeFileSync(chromePath, 'stable chrome placeholder');
    withEnv({ AUTOTEST_CHROME_PATH: chromePath }, () => {
        assert.strictEqual(profile.resolveSystemChromePath(), chromePath,
            'configured stable Chrome path must be selected before platform defaults');
    });
    withEnv({ AUTOTEST_CHROME_PATH: path.join(stateDir, 'missing-chrome') }, () => {
        assert.throws(() => profile.resolveSystemChromePath(), e =>
            e.code === 'CHROME_PATH_INVALID' && e.message.includes('AUTOTEST_CHROME_PATH'),
            'missing configured Chrome path must fail with a typed configuration error');
    });

    console.log('PASS: cdp_profile_test — fixed autotest profile, env precedence, and Chrome override');
} finally {
    fs.rmSync(stateDir, { recursive: true, force: true });
}
