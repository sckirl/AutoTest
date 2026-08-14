// ponytail: shared helpers module — zero-dependency, pure stdlib logic

/**
 * Validates that locator string uses safe Playwright selector chains
 * and blocks arbitrary code execution tokens.
 */
function isSafeChain(target) {
    if (typeof target !== 'string') return null;
    if (!target.match(/^(getBy|locator|frameLocator)/)) return null;
    if (/\b(require|exec|eval|process|import|global|constructor|window|document)\b/.test(target)) return null;
    return target;
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
        }
        return val;
    });
    return processedStr;
}

/**
 * Escapes values safely into JSON string literals for code generation.
 */
const q = (v) => JSON.stringify(String(v ?? ''));

module.exports = {
    isSafeChain,
    interpolate,
    q
};
