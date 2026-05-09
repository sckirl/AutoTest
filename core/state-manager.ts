import * as fs from 'fs';
import * as path from 'path';

interface ScopeEntry {
    id: string;
    createdAt: string;
    usedInScenarios: string[];
}

interface StateFile {
    version: string;
    lastUpdated: string;
    scopes: Record<string, ScopeEntry>;
    globalCounter: number;
    metadata: {
        framework: string;
        testRunCount: number;
        lastTestRun: string;
    };
}

export class StateManager {
    private statePath: string;
    private state: StateFile;
    private backupPath: string;

    constructor(statePath: string = path.join(process.cwd(), 'core/state.json')) {
        this.statePath = statePath;
        this.backupPath = `${statePath}.backup`;
        this.state = this.loadState();
    }

    public resolveOrGenerateId(scope: string, scenarioId?: string): string {
        const normalizedScope = this.normalizeScope(scope);

        if (this.state.scopes[normalizedScope]) {
            const scopeEntry = this.state.scopes[normalizedScope];
            if (scenarioId && !scopeEntry.usedInScenarios.includes(scenarioId)) {
                scopeEntry.usedInScenarios.push(scenarioId);
                this.persistState();
            }
            return scopeEntry.id;
        }

        const newId = this.generateId();
        this.state.scopes[normalizedScope] = {
            id: newId,
            createdAt: new Date().toISOString(),
            usedInScenarios: scenarioId ? [scenarioId] : []
        };
        this.state.globalCounter++;
        this.state.lastUpdated = new Date().toISOString();
        this.state.metadata.lastTestRun = new Date().toISOString();

        this.persistState();
        return newId;
    }

    public getIdByScope(scope: string): string | undefined {
        const normalizedScope = this.normalizeScope(scope);
        return this.state.scopes[normalizedScope]?.id;
    }

    public getAllScopes(): Record<string, ScopeEntry> {
        return { ...this.state.scopes };
    }

    public resetState(): void {
        this.state = this.createEmptyState();
        this.persistState();
        console.log('🔄 State reset successfully');
    }

    private generateId(): string {
        const timestamp = Date.now();
        const counter = this.state.globalCounter + 1;
        return `Test_${timestamp}_${counter}`;
    }

    private normalizeScope(scope: string): string {
        const match = scope.match(/\d+/);
        if (match) {
            return match[0].padStart(4, '0');
        }
        return scope;
    }

    private loadState(): StateFile {
        try {
            if (!fs.existsSync(this.statePath)) {
                console.log('📝 Creating new state file');
                return this.createEmptyState();
            }

            const content = fs.readFileSync(this.statePath, 'utf8');
            const state = JSON.parse(content);

            if (this.validateState(state)) {
                console.log(`✅ Loaded state with ${Object.keys(state.scopes).length} scope(s)`);
                state.metadata.testRunCount = (state.metadata.testRunCount || 0) + 1;
                return state;
            } else {
                console.warn('⚠️  Invalid state schema, creating fresh state');
                return this.createEmptyState();
            }
        } catch (err: any) {
            console.warn(`⚠️  State file corrupted (${err.message}), creating fresh state`);
            if (fs.existsSync(this.backupPath)) {
                try {
                    const backupContent = fs.readFileSync(this.backupPath, 'utf8');
                    const backupState = JSON.parse(backupContent);
                    if (this.validateState(backupState)) {
                        console.log('✅ Restored from backup');
                        return backupState;
                    }
                } catch (backupErr) {
                    console.warn('⚠️  Backup also corrupted');
                }
            }
            return this.createEmptyState();
        }
    }

    public persistState(): void {
        const tempPath = `${this.statePath}.tmp`;

        try {
            this.state.lastUpdated = new Date().toISOString();

            fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), 'utf8');

            const written = JSON.parse(fs.readFileSync(tempPath, 'utf8'));
            if (!this.validateState(written)) {
                throw new Error('Written state failed validation');
            }

            if (fs.existsSync(this.statePath)) {
                fs.copyFileSync(this.statePath, this.backupPath);
            }

            fs.renameSync(tempPath, this.statePath);
        } catch (err: any) {
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
            console.error(`❌ Failed to persist state: ${err.message}`);
            throw err;
        }
    }

    private validateState(state: any): boolean {
        if (!state || typeof state !== 'object') return false;
        if (!state.version || typeof state.version !== 'string') return false;
        if (!state.scopes || typeof state.scopes !== 'object') return false;
        if (typeof state.globalCounter !== 'number') return false;
        if (!state.metadata || typeof state.metadata !== 'object') return false;
        return true;
    }

    private createEmptyState(): StateFile {
        return {
            version: '1.0',
            lastUpdated: new Date().toISOString(),
            scopes: {},
            globalCounter: 0,
            metadata: {
                framework: 'AutoTest',
                testRunCount: 1,
                lastTestRun: new Date().toISOString()
            }
        };
    }

    public getState(): StateFile {
        return { ...this.state };
    }
}
