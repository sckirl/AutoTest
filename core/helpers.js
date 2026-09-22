// ponytail: shared helpers module, zero-dependency, pure stdlib logic
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

// A0.5.1: the closed set of Playwright locator-chain methods this app is allowed to emit.
// Anything else (evaluate, context, goto, constructor, ...) is rejected structurally, not by keyword.
const SAFE_LOCATOR_METHODS = new Set([
    'getByRole', 'getByText', 'getByLabel', 'getByPlaceholder', 'getByTestId',
    'getByAltText', 'getByTitle', 'locator', 'frameLocator',
    'filter', 'first', 'last', 'nth', 'and', 'or'
]);

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
    try { ast = acorn.parseExpressionAt(src, 0, { ecmaVersion: 2020 }); }
    catch (e) { return null; }
    if (ast.end !== src.length) return null; // trailing junk (e.g. "; more code") = injection
    let n = ast;
    while (n.type === 'CallExpression' || n.type === 'MemberExpression') {
        const member = n.type === 'CallExpression' ? n.callee : n;
        if (member.type !== 'MemberExpression' || member.computed ||
            member.property.type !== 'Identifier' || !SAFE_LOCATOR_METHODS.has(member.property.name)) {
            return null;
        }
        n = member.object;
    }
    return (n.type === 'Identifier' && n.name === 'page') ? target : null;
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
        if (iterData && iterData[key] !== undefined && iterData[key] !== null && iterData[key] !== "") {
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
 * A0.5.2: true if any key in `obj` looks like a credential. Confirmed by running it that
 * Playwright's tracing.start() has no way to redact a specific fill()/selectOption() value —
 * even {screenshots:false, snapshots:false, sources:false} and tracing.stopChunk({mode:'discard'})
 * still leak the literal into trace.trace. So the only reliable move is: don't trace a scenario
 * whose Data contains one of these keys at all (compiler.js skips tracing.start/stop for it).
 */
function hasSensitiveKey(obj) {
    return !!obj && Object.keys(obj).some(k => /password|secret|token|pin/i.test(k));
}

module.exports = {
    isSafeChain,
    interpolate,
    tokenizeLiterals,
    sweepOrphans,
    safeSessionId,
    hasSensitiveKey,
    q
};
