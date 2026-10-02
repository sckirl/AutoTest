// ponytail: shared helpers module, zero-dependency, pure stdlib logic
const fs = require('fs');
const path = require('path');
let _acorn = null;
function getAcorn() {
    if (!_acorn) {
        ensureDriversPath(module, __dirname);
        _acorn = require('acorn');
    }
    return _acorn;
}

// A1.3: under Electron, DRIVERS/ ships unpacked in extraResources (process.resourcesPath),
// not __dirname-relative — inside app.asar, '../DRIVERS' only escapes to the asar root.
// process.resourcesPath is undefined outside Electron, so dev/test resolution is unchanged.
function resolveDriversRoot(baseDirname) {
    // A1.3 known-gap fix: core/scenario_parser.js and core/compiler.js run as separate `node
    // ...` processes (server.js's execSync), so they never see Electron's own
    // process.resourcesPath — electron/main.js bridges it via RESOURCES_PATH env instead.
    const resourcesPath = process.resourcesPath || process.env.RESOURCES_PATH;
    return resourcesPath
        ? path.join(resourcesPath, 'DRIVERS')
        : path.resolve(baseDirname, '../DRIVERS');
}

/**
 * Banking Block Compliance: Strict DRIVERS/ Resolution. This bundled-dependency bootstrap was
 * copy-pasted verbatim in core/compiler.js and core/scenario_parser.js (and a larger variant
 * in studio/server.js). Callers pass their own `module`/`__dirname` since module.paths is
 * per-file, not shared.
 */
function ensureDriversPath(callerModule, callerDirname) {
    const DRIVERS_PATH = path.join(resolveDriversRoot(callerDirname), 'node_modules');
    if (fs.existsSync(DRIVERS_PATH)) {
        callerModule.paths.unshift(DRIVERS_PATH);
        process.env.NODE_PATH = DRIVERS_PATH;
        require('module').Module._initPaths();
    }
    return DRIVERS_PATH;
}

// A0.5.1: the closed set of Playwright locator-chain methods this app is allowed to emit.
// Anything else (evaluate, context, goto, constructor, ...) is rejected structurally, not by keyword.
const SAFE_LOCATOR_METHODS = new Set([
    'getByRole', 'getByText', 'getByLabel', 'getByPlaceholder', 'getByTestId',
    'getByAltText', 'getByTitle', 'locator', 'frameLocator',
    'filter', 'first', 'last', 'nth', 'and', 'or'
]);

// A0.8.1: validate call arguments recursively so nested expressions (eval, require, process.exit)
// cannot execute inside locator calls like locator(process.exit()) or getByRole('b', { name: eval(...) }).
function isSafeArg(node) {
    if (!node) return false;
    if (node.type === 'Literal') return true;
    if (node.type === 'UnaryExpression' && (node.operator === '-' || node.operator === '+') && node.argument.type === 'Literal') return true;
    if (node.type === 'ObjectExpression') {
        return node.properties.every(prop =>
            prop.type === 'Property' && prop.kind === 'init' && !prop.computed &&
            (prop.key.type === 'Identifier' || prop.key.type === 'Literal') &&
            isSafeArg(prop.value)
        );
    }
    if (node.type === 'ArrayExpression') {
        return node.elements.every(el => el && isSafeArg(el));
    }
    // Playwright codegen emits filter({ has: page.getByRole('button') }) verbatim. A nested
    // page-rooted locator is exactly as safe as a top-level one — it is validated by the same
    // rules — so run it through the same structural walk rather than rejecting it. Rejecting
    // was not a safe default: the compiler downgrades a rejected target to
    // page.locator("<raw string>"), which can never match, so the step silently tests nothing.
    if (node.type === 'CallExpression' || node.type === 'MemberExpression') {
        return isSafeChainNode(node);
    }
    return false;
}

/**
 * Structural walk shared by isSafeChain (top-level `page.<target>`) and isSafeArg (a nested
 * `page.…` locator inside an argument). Returns true only for a call/member chain rooted at
 * the `page` identifier using SAFE_LOCATOR_METHODS, with every argument itself safe.
 */
function isSafeChainNode(node) {
    let n = node;
    while (n.type === 'CallExpression' || n.type === 'MemberExpression') {
        if (n.type === 'CallExpression' && !n.arguments.every(isSafeArg)) return false;
        const member = n.type === 'CallExpression' ? n.callee : n;
        if (member.type !== 'MemberExpression' || member.computed ||
            member.property.type !== 'Identifier' || !SAFE_LOCATOR_METHODS.has(member.property.name)) {
            return false;
        }
        n = member.object;
    }
    return n.type === 'Identifier' && n.name === 'page';
}

/**
 * Validates that `target` is a single, well-formed Playwright locator-chain expression
 * rooted at `page`, using only SAFE_LOCATOR_METHODS — an AST structural check, not a
 * keyword blocklist. A blocklist is bypassable by any chain that avoids its exact keywords
 * (e.g. "getByRole('b').click(); await page.goto(...)"); parsing `page.<target>` as a single
 * expression and rejecting trailing content closes that off, since injected extra statements
 * can't appear inside one expression's AST span.
 */
function isSafeChain(target) {
    if (typeof target !== 'string' || !target) return null;
    const src = 'page.' + target;
    let ast;
    try { ast = getAcorn().parseExpressionAt(src, 0, { ecmaVersion: 2020 }); }
    catch (e) { return null; }
    if (ast.end !== src.length) return null; // trailing junk (e.g. "; more code") = injection
    return isSafeChainNode(ast) ? target : null;
}

/**
 * Interpolates {variable_name} tokens from iteration data or fallback Excel step data.
 */
function interpolate(templateStr, iterData, fallbackObj) {
    if (!templateStr) return "";
    let processedStr = String(templateStr);
    processedStr = processedStr.replace(/['"]\{([a-zA-Z0-9_]+)\}['"]/g, '{$1}');
    processedStr = processedStr.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
        let val = "";
        // A0.8.4: do not treat intentional blank "" in iterData as absent — an empty string
        // override in the Data Matrix must not fall through to non-empty Excel data.
        if (iterData && iterData[key] !== undefined && iterData[key] !== null) {
            val = iterData[key];
        } else if (fallbackObj && fallbackObj[key] !== undefined && fallbackObj[key] !== null) {
            val = fallbackObj[key];
        } else if (!(iterData && key in iterData) && !(fallbackObj && key in fallbackObj)) {
            // A0.5.4: key absent everywhere (a typo'd Excel header) must fail loudly, not
            // compile a test that fills the field blank and "passes" having tested nothing.
            // A key present but intentionally blank (in iterData or fallbackObj) is untouched.
            throw new Error(`Unresolved test data key "{${key}}" — no "${key}" column found for this scenario (check the Excel header for a typo).`);
        }
        return val;
    });
    return processedStr;
}

/**
 * Escapes values safely into JSON string literals for code generation.
 */
const q = (v) => JSON.stringify(String(v ?? ''));

/**
 * Codegen always records literal values (e.g. "admin123"), never {key} placeholders.
 * When a Mapping_Key is shared across scenarios with different Data (a negative-path
 * scenario reusing "Input Password" with a different password, say), the literal from
 * whichever scenario it was recorded under silently wins on every replay, ignoring
 * every other scenario's Data. Rewriting an exact-match literal back to {key} at save
 * time is what lets interpolate() do its job for every scenario sharing this step.
 * Mutates and returns steps.
 */
function tokenizeLiterals(steps, data) {
    if (!data) return steps;
    for (const step of steps) {
        for (const [key, val] of Object.entries(data)) {
            if (val === '' || val === undefined || val === null) continue;
            const strVal = String(val);
            if (step.value === strVal) step.value = `{${key}}`;
            if (step.target === strVal) step.target = `{${key}}`;
        }
    }
    return steps;
}

/**
 * Deletes orphaned recording artifacts from `dir` and returns the filenames removed.
 * One predicate covers replay_* and codegen_* so a cancelled recording of either kind
 * can't leak forever (the previous inline sweep in server.js only caught replay_*).
 */
function sweepOrphans(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter(f => /^(replay|codegen)_/.test(f) && /\.(spec\.js|spec\.ts|js|ts)$/.test(f))
        .filter(f => {
            try { fs.unlinkSync(path.join(dir, f)); return true; } catch (e) { return false; }
        });
}

/**
 * Validates a codegen/replay session id before it's interpolated into a filesystem path.
 * The server only ever generates `Date.now().toString()` (digits), so anything else —
 * including a `../` traversal payload — is rejected outright, not sanitized.
 */
function safeSessionId(id) {
    return (typeof id === 'string' && /^[0-9]+$/.test(id)) ? id : null;
}

/**
 * A0.7.1 follow-up (blackbox pass): 'Mobile'/'MOBILE'/'mobile ' all bypassed a strict
 * `platform === 'mobile'` check in both /record and /run, each fixed inline and each with
 * the same gap. Normalize once, use everywhere platform is compared.
 */
function normalizePlatform(p) {
    return String(p || '').trim().toLowerCase();
}

/**
 * A0.5.2: true if any key in `obj` looks like a credential. Confirmed by running it that
 * Playwright's tracing.start() has no way to redact a specific fill()/selectOption() value —
 * even {screenshots:false, snapshots:false, sources:false} and tracing.stopChunk({mode:'discard'})
 * still leak the literal into trace.trace. So the only reliable move is: don't trace a scenario
 * whose Data contains one of these keys at all (compiler.js skips tracing.start/stop for it).
 */
function hasSensitiveKey(obj) {
    return !!obj && Object.keys(obj).some(k => /password|secret|token|pin/i.test(k));
}

function buildCodegenArgs({ cli, targetUrl, outputPath, profileDir }) {
    return [cli, 'codegen', targetUrl, '--output', outputPath, '--user-data-dir', profileDir];
}

function buildCodegenEnv({ baseEnv, browserPath, browsersPath, nodePath, packaged }) {
    const env = { ...baseEnv, PW_HEADLESS: '0', AUTOTEST_CDP_PROFILE: 'isolated' };
    if (browserPath) {
        env.BROWSER_PATH = browserPath;
        env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = browserPath;
        env.PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH = browserPath;
    }
    if (browsersPath) {
        env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;
        env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1';
    }
    if (nodePath) env.NODE_PATH = nodePath;
    if (packaged) env.ELECTRON_RUN_AS_NODE = '1';
    return env;
}

module.exports = {
    isSafeChain,
    interpolate,
    tokenizeLiterals,
    sweepOrphans,
    safeSessionId,
    hasSensitiveKey,
    normalizePlatform,
    ensureDriversPath,
    resolveDriversRoot,
    buildCodegenArgs,
    buildCodegenEnv,
    q
};
