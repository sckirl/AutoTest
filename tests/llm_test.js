// Slice 1: resolveProvider on/off + OpenAI request shape. Pure node, no server.
// Live complete() runs only when LLM_BASE_URL + LLM_API_KEY + LLM_MODEL are set,
// otherwise skipped — no fake fixture in the repo.
const assert = require('assert');
const { resolveProvider, buildRequest, complete } = require('../core/llm');

const cfg = {
    LLM_BASE_URL: 'https://integrate.api.nvidia.com/v1',
    LLM_API_KEY: 'test-key',
    LLM_MODEL: 'qwen/qwen3-next-80b-a3b',
};

// Disabled: nothing set
assert.deepStrictEqual(resolveProvider({}), { enabled: false });
// Disabled: partial
assert.deepStrictEqual(
    resolveProvider({ LLM_BASE_URL: 'https://x/v1', LLM_MODEL: 'm' }),
    { enabled: false }
);
// Enabled: all three set (trailing slash trimmed)
let p = resolveProvider(cfg);
assert.strictEqual(p.enabled, true);
assert.strictEqual(p.baseUrl, 'https://integrate.api.nvidia.com/v1');
assert.strictEqual(p.model, 'qwen/qwen3-next-80b-a3b');

// Request shape: OpenAI chat-completions
const req = buildRequest(p, 'hello');
assert.strictEqual(req.url, 'https://integrate.api.nvidia.com/v1/chat/completions');
assert.strictEqual(req.options.method, 'POST');
assert.strictEqual(req.options.headers['Authorization'], 'Bearer test-key');
assert.strictEqual(req.options.headers['Content-Type'], 'application/json');
const body = JSON.parse(req.options.body);
assert.strictEqual(body.model, 'qwen/qwen3-next-80b-a3b');
assert.deepStrictEqual(body.messages, [{ role: 'user', content: 'hello' }]);

console.log('PASS: llm resolve + request shape (offline)');

// Live call: only with a real key in env, otherwise skip
if (process.env.LLM_API_KEY && process.env.LLM_BASE_URL && process.env.LLM_MODEL) {
    (async () => {
        const live = resolveProvider(process.env);
        const text = await complete(live, 'Reply with exactly: ok');
        assert.ok(text && text.length > 0, 'expected non-empty reply, got: ' + JSON.stringify(text));
        console.log('PASS: llm live call, reply was: ' + JSON.stringify(text.slice(0, 80)));
    })().catch(e => { console.error('FAIL: llm live call:', e.message); process.exit(1); });
} else {
    console.log('SKIP: llm live call (no LLM_API_KEY in env)');
}
