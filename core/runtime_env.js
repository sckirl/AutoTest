// Zero-dependency .env loader for direct Node and Electron server startup.
const fs = require('fs');
const path = require('path');

function parseDotEnv(text) {
    const values = {};
    for (const raw of String(text).split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!match) continue;
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        values[match[1]] = value;
    }
    return values;
}

function loadDotEnv(filePath) {
    if (!filePath || !fs.existsSync(filePath)) return {};
    const values = parseDotEnv(fs.readFileSync(filePath, 'utf8'));
    for (const [key, value] of Object.entries(values)) {
        if (process.env[key] === undefined) process.env[key] = value;
    }
    return values;
}

function loadRuntimeEnv() {
    const candidates = [
        process.env.AUTOTEST_ENV_FILE,
        path.join(process.cwd(), '.env'),
        process.env.AUTOTEST_STATE_DIR && path.join(process.env.AUTOTEST_STATE_DIR, '.env'),
    ].filter(Boolean);
    for (const filePath of [...new Set(candidates)]) loadDotEnv(filePath);
    return process.env;
}

module.exports = { parseDotEnv, loadDotEnv, loadRuntimeEnv };
