const fs = require('fs');
const html = fs.readFileSync('studio/studio-ui.html', 'utf8');

const oldStart = html.indexOf('<div id="guidance-modal"');
// Find end: two closing </div> tags after oldStart
let depth = 0, pos = oldStart, endIdx = -1;
for (let i = oldStart; i < html.length; i++) {
    if (html.startsWith('<div', i)) depth++;
    else if (html.startsWith('</div>', i)) { depth--; if (depth === 0) { endIdx = i + 6; break; } }
}

const newModal = `    <div id="guidance-modal" class="modal">
        <div class="modal-content" style="width: 520px;">
            <h3>\uD83C\uDFA5 Codegen Recording Guide</h3>
            <div style="font-size: 14px; margin-bottom: 20px; line-height:1.7;">
                <p><strong>Step 1 \u2014 Browser opens:</strong> A Chromium window opens with a <em>live code recorder panel</em>. This is <strong>Playwright Codegen</strong> \u2014 the real recorder, not the debugger.</p>
                <p><strong>Step 2 \u2014 Record your actions:</strong> Click, type, and navigate in the browser. Every action is captured as Playwright code automatically in real-time.</p>
                <p><strong>Step 3 \u2014 Close the browser:</strong> When you have finished recording, <strong>close the Chromium window</strong>. The code is auto-saved.</p>
                <p><strong>Step 4 \u2014 Code auto-fills:</strong> The recorded code appears in the textarea below <em>automatically</em>. Review it, then click <strong>"Sync &amp; Save Action"</strong>.</p>
                <p style="background:#FEF9C3;padding:8px;border-radius:4px;font-size:12px;">\uD83D\uDCA1 You can also paste codegen output manually into the textarea at any time.</p>
            </div>
            <button class="btn btn-primary" onclick="document.getElementById('guidance-modal').style.display='none'">Got it \u2014 open the browser!</button>
        </div>
    </div>`;

const result = html.slice(0, oldStart) + newModal + html.slice(endIdx);
fs.writeFileSync('studio/studio-ui.html', result, 'utf8');
console.log(`Done. Replaced guidance modal (was chars ${oldStart}-${endIdx}).`);
