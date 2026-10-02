// Phase C: one generic mapping prompt; the page tree and step label are the only domain input.
function buildPrompt({ ariaSnapshot, label, data = {}, rejected = [] }) {
    return [
        'You map a test-step label to Playwright actions on the page shown below.',
        '',
        'PAGE (accessibility tree):',
        String(ariaSnapshot || ''),
        '',
        `STEP LABEL: ${JSON.stringify(String(label || ''))}`,
        `TEST DATA: ${JSON.stringify(data)}`,
        `PREVIOUSLY REJECTED: ${JSON.stringify(rejected)}`,
        '',
        'RULES',
        '1. Output ONLY await page.... lines. No imports, wrapper, prose, or markdown.',
        '2. Emit as many lines as the step needs.',
        '3. Every referenced element MUST appear in the page tree. Never invent one.',
        '4. For each TEST DATA key, use the quoted string value {key}, never its literal value.',
        '5. Prefer getByRole, getByLabel, getByPlaceholder, getByText, then locator().',
        '6. For checks, use await expect(locator).toBeVisible(), await expect(locator).toHaveText(...), or await locator.isVisible().',
        '7. If no element can satisfy the label, output exactly CANNOT_MAP.'
    ].join('\n');
}

module.exports = { buildPrompt };
