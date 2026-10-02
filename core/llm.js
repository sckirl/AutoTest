// Phase C slice 1: OpenAI-compatible LLM client. Stdlib fetch only, no new dependency.
// Any base URL works (public or private) — no host blocking.
function resolveProvider(env) {
    const baseUrl = String((env && env.LLM_BASE_URL) || '').trim().replace(/\/+$/, '');
    const apiKey = String((env && env.LLM_API_KEY) || '').trim();
    const model = String((env && env.LLM_MODEL) || '').trim();
    if (!baseUrl || !apiKey || !model) return { enabled: false };
    return { enabled: true, baseUrl, apiKey, model };
}

function buildRequest(provider, prompt) {
    return {
        url: provider.baseUrl + '/chat/completions',
        options: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + provider.apiKey },
            body: JSON.stringify({ model: provider.model, messages: [{ role: 'user', content: prompt }] }),
            signal: AbortSignal.timeout(30_000),
        },
    };
}

async function complete(provider, prompt) {
    const { url, options } = buildRequest(provider, prompt);
    const res = await fetch(url, options);
    if (!res.ok) throw new Error('LLM request failed: ' + res.status + ' ' + (await res.text()).slice(0, 200));
    const data = await res.json();
    const text = data && data.choices && data.choices[0] && data.choices[0].message
        && data.choices[0].message.content;
    if (!text) throw new Error('LLM returned no content: ' + JSON.stringify(data).slice(0, 200));
    return text.trim();
}

module.exports = { resolveProvider, buildRequest, complete };
