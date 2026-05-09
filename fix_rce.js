const fs = require('fs');

function harden(path) {
    let code = fs.readFileSync(path, 'utf8');
    const strictSafeGetBy = \`const safeGetBy = (target) => {
        if (typeof target !== 'string') return null;
        const m = target.match(/^getBy(Role|Label|Placeholder|Text|AltText|Title|TestId|DisplayValue)\\((.*)\\)$/);
        if (!m) return null;
        const args = m[2];
        // Strictly allow only quotes, alphanumeric, space, and safe selector chars. Block ANY operators or nested calls.
        if (!/^(['"\`])[a-zA-Z0-9\\s\\-#\\.\\:\\(\\)_\\[\\]\\=\\/\\\\\\*\\+,]*\\1$/.test(args)) return null;
        return target;
    };\`;

    if (path.includes('server.js')) {
        code = code.replace(/function safeGetBy\\(target\\) \\{[\\s\\S]*?return target;\\n\\}/, strictSafeGetBy.replace('const safeGetBy = (target) =>', 'function safeGetBy(target)'));
    } else {
        code = code.replace(/const safeGetBy = \\(target\\) => \\{[\\s\\S]*?return target;\\n\\s*\\};/, strictSafeGetBy);
    }
    fs.writeFileSync(path, code);
}

harden('studio/server.js');
harden('core/compiler.js');
console.log('RCE Shield Hardened.');
