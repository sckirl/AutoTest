// ponytail: zero-dependency persistent JSON document database for actions, synonyms, and groups
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');

const DB_PATH = path.join(__dirname, 'action_database.json');

function extractVariables(text) {
    if (!text || typeof text !== 'string') return [];
    const matches = text.match(/\{([a-zA-Z0-9_]+)\}/g);
    return matches ? Array.from(new Set(matches.map(m => m.replace(/[{}]/g, '')))) : [];
}

function parseCodeToSteps(code) {
    const steps = [];
    if (!code || typeof code !== 'string') return steps;
    try {
        const ast = acorn.parse(code, { ecmaVersion: 2020, allowAwaitOutsideFunction: true, sourceType: 'module' });
        walk.simple(ast, {
            CallExpression(node) {
                if (node.callee && node.callee.type === 'MemberExpression') {
                    if (node.callee.object && node.callee.object.type === 'ConditionalExpression') return;
                    let targetRaw = code.substring(node.callee.object.start, node.callee.object.end).replace(/^page\./, '');
                    const method = node.callee.property.name;
                    if (['click', 'fill', 'press', 'goto', 'selectOption', 'check', 'uncheck', 'toBeVisible', 'toHaveText'].includes(method)) {
                        let target = null;
                        if (method === 'goto' && node.arguments.length > 0) {
                            target = node.arguments[0].value !== undefined ? node.arguments[0].value : code.substring(node.arguments[0].start, node.arguments[0].end).replace(/^['"`]|['"`]$/g, '');
                        } else if (['toBeVisible', 'toHaveText'].includes(method)) {
                            if (node.callee.object && node.callee.object.type === 'CallExpression' && node.callee.object.callee.name === 'expect') {
                                if (node.callee.object.arguments.length > 0) {
                                    target = code.substring(node.callee.object.arguments[0].start, node.callee.object.arguments[0].end).replace(/^page\./, '');
                                }
                            }
                        } else {
                            target = targetRaw;
                        }
                        if (target) {
                            const step = { type: method, target };
                            if (['fill', 'press', 'selectOption', 'toHaveText'].includes(method) && node.arguments.length > 0) {
                                step.value = node.arguments[0].value !== undefined ? node.arguments[0].value : code.substring(node.arguments[0].start, node.arguments[0].end).replace(/^['"`]|['"`]$/g, '');
                            }
                            steps.push(step);
                        }
                    }
                }
            }
        });
    } catch (e) {
        // Fallback for simple goto
        if (code.includes('page.goto(')) {
            const m = code.match(/page\.goto\(['"]([^'"]+)['"]\)/);
            if (m) steps.push({ type: 'goto', target: m[1] });
        }
    }
    return steps;
}

const ActionDB = {
    init() {
        if (!fs.existsSync(DB_PATH)) {
            const initial = { version: 1, actions: [], groups: [] };
            fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
            return initial;
        }
        try {
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        } catch (e) {
            const initial = { version: 1, actions: [], groups: [] };
            fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
            return initial;
        }
    },

    read() {
        return this.init();
    },

    write(data) {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    },

    saveAction({ id, name, description = '', code = '', synonyms = [], platform = 'web' }) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Action name is required');
        }
        const db = this.read();
        const actionId = id || `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const trimmedName = name.trim();
        const cleanSynonyms = Array.isArray(synonyms) ? Array.from(new Set(synonyms.map(s => String(s).trim()).filter(Boolean))) : [];
        const steps = parseCodeToSteps(code);
        const variables = extractVariables(code + ' ' + JSON.stringify(steps));
        const now = Date.now();

        const existingIdx = db.actions.findIndex(a => a.id === actionId);
        const actionObj = {
            id: actionId,
            name: trimmedName,
            description: String(description || '').trim(),
            code: String(code || ''),
            steps,
            synonyms: cleanSynonyms,
            platform: platform === 'mobile' ? 'mobile' : 'web',
            variables,
            createdAt: existingIdx >= 0 ? db.actions[existingIdx].createdAt : now,
            updatedAt: now
        };

        if (existingIdx >= 0) {
            db.actions[existingIdx] = actionObj;
        } else {
            db.actions.push(actionObj);
        }
        this.write(db);
        return actionObj;
    },

    deleteAction(id) {
        const db = this.read();
        db.actions = db.actions.filter(a => a.id !== id);
        // remove from groups
        db.groups.forEach(g => {
            if (Array.isArray(g.actionIds)) {
                g.actionIds = g.actionIds.filter(aid => aid !== id);
            }
        });
        this.write(db);
        return true;
    },

    saveGroup({ id, name, description = '', actionIds = [], synonyms = [] }) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Group name is required');
        }
        const db = this.read();
        const groupId = id || `grp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const trimmedName = name.trim();
        const cleanActionIds = Array.isArray(actionIds) ? actionIds : [];
        const cleanSynonyms = Array.isArray(synonyms) ? Array.from(new Set(synonyms.map(s => String(s).trim()).filter(Boolean))) : [];

        // Aggregate variables from member actions
        const varSet = new Set();
        cleanActionIds.forEach(aid => {
            const act = db.actions.find(a => a.id === aid);
            if (act && Array.isArray(act.variables)) {
                act.variables.forEach(v => varSet.add(v));
            }
        });

        const now = Date.now();
        const existingIdx = db.groups.findIndex(g => g.id === groupId);
        const groupObj = {
            id: groupId,
            name: trimmedName,
            description: String(description || '').trim(),
            actionIds: cleanActionIds,
            synonyms: cleanSynonyms,
            variables: Array.from(varSet),
            createdAt: existingIdx >= 0 ? db.groups[existingIdx].createdAt : now,
            updatedAt: now
        };

        if (existingIdx >= 0) {
            db.groups[existingIdx] = groupObj;
        } else {
            db.groups.push(groupObj);
        }
        this.write(db);
        return groupObj;
    },

    deleteGroup(id) {
        const db = this.read();
        db.groups = db.groups.filter(g => g.id !== id);
        this.write(db);
        return true;
    },

    resolveAction(term) {
        if (!term) return null;
        const clean = String(term).trim();
        const db = this.read();
        return db.actions.find(a => a.name === clean || (Array.isArray(a.synonyms) && a.synonyms.includes(clean))) || null;
    },

    resolveGroup(term) {
        if (!term) return null;
        const clean = String(term).trim();
        const db = this.read();
        return db.groups.find(g => g.name === clean || (Array.isArray(g.synonyms) && g.synonyms.includes(clean))) || null;
    },

    getGroupSteps(groupId) {
        const db = this.read();
        const grp = typeof groupId === 'string' ? db.groups.find(g => g.id === groupId) : groupId;
        if (!grp || !Array.isArray(grp.actionIds)) return [];
        return grp.actionIds.map(aid => db.actions.find(a => a.id === aid)).filter(Boolean);
    },

    linkSynonym(excelLabel, targetType, targetId) {
        if (!excelLabel || !targetId) throw new Error('excelLabel and targetId required');
        const db = this.read();
        const cleanLabel = String(excelLabel).trim();
        if (targetType === 'group') {
            const grp = db.groups.find(g => g.id === targetId);
            if (!grp) throw new Error(`Group not found: ${targetId}`);
            if (!grp.synonyms) grp.synonyms = [];
            if (!grp.synonyms.includes(cleanLabel)) grp.synonyms.push(cleanLabel);
        } else {
            const act = db.actions.find(a => a.id === targetId);
            if (!act) throw new Error(`Action not found: ${targetId}`);
            if (!act.synonyms) act.synonyms = [];
            if (!act.synonyms.includes(cleanLabel)) act.synonyms.push(cleanLabel);
        }
        this.write(db);
        return true;
    },

    // Resolves any step label to an array of action steps (unpacks groups seamlessly)
    resolveSteps(label) {
        const grp = this.resolveGroup(label);
        if (grp) {
            const acts = this.getGroupSteps(grp);
            const allSteps = [];
            acts.forEach(a => {
                if (Array.isArray(a.steps)) allSteps.push(...a.steps);
            });
            return allSteps;
        }
        const act = this.resolveAction(label);
        if (act && Array.isArray(act.steps)) {
            return act.steps;
        }
        return null;
    }
};

module.exports = ActionDB;
