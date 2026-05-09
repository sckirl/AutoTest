import { test, expect } from '@playwright/test';
import { StateManager } from './state-manager';
import { AutomationEngine } from './engine';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Unique ID Generation Tests', () => {
    const testStatePath = path.join(__dirname, 'test-state.json');
    
    test.beforeEach(() => {
        if (fs.existsSync(testStatePath)) {
            fs.unlinkSync(testStatePath);
        }
    });

    test.afterEach(() => {
        if (fs.existsSync(testStatePath)) {
            fs.unlinkSync(testStatePath);
        }
    });

    test('StateManager generates unique IDs with Test_ prefix and timestamp', () => {
        const stateManager = new StateManager(testStatePath);
        const id = stateManager.resolveOrGenerateId('0001');
        
        expect(id).toMatch(/^Test_\d{13}_\d+$/);
        console.log('Generated ID:', id);
    });

    test('StateManager returns same ID for same scope', () => {
        const stateManager = new StateManager(testStatePath);
        const id1 = stateManager.resolveOrGenerateId('0001');
        const id2 = stateManager.resolveOrGenerateId('0001');
        
        expect(id1).toBe(id2);
        console.log('Scope 0001 ID (consistent):', id1);
    });

    test('StateManager generates different IDs for different scopes', () => {
        const stateManager = new StateManager(testStatePath);
        const id1 = stateManager.resolveOrGenerateId('0001');
        const id2 = stateManager.resolveOrGenerateId('0002');
        
        expect(id1).not.toBe(id2);
        console.log('Scope 0001:', id1);
        console.log('Scope 0002:', id2);
    });

    test('StateManager normalizes scope numbers', () => {
        const stateManager = new StateManager(testStatePath);
        const id1 = stateManager.resolveOrGenerateId('1');
        const id2 = stateManager.resolveOrGenerateId('001');
        const id3 = stateManager.resolveOrGenerateId('0001');
        
        expect(id1).toBe(id2);
        expect(id2).toBe(id3);
        console.log('Normalized scope ID:', id1);
    });

    test('StateManager persists and loads state correctly', async () => {
        const stateManager1 = new StateManager(testStatePath);
        const id1 = stateManager1.resolveOrGenerateId('0001');
        await stateManager1.persistState();
        
        const stateManager2 = new StateManager(testStatePath);
        const id2 = stateManager2.resolveOrGenerateId('0001');
        
        expect(id2).toBe(id1);
        console.log('Persisted and loaded ID:', id1);
    });

    test('StateManager creates backup on persist', async () => {
        const stateManager = new StateManager(testStatePath);
        stateManager.resolveOrGenerateId('0001');
        await stateManager.persistState();
        
        const backupPath = testStatePath + '.backup';
        expect(fs.existsSync(backupPath)).toBe(true);
        
        if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
        }
    });

    test('AutomationEngine tokenizes {Unique_XXXX} placeholders', () => {
        const testMappingPath = path.join(__dirname, 'mappings.json');
        const engine = new AutomationEngine(testMappingPath);
        
        const testData = { userName: 'TestUser' };
        const input1 = 'Search {Unique_0001}';
        const input2 = 'Form {Unique_0001}';
        
        const result1 = (engine as any).tokenize(input1, testData);
        const result2 = (engine as any).tokenize(input2, testData);
        
        expect(result1).toMatch(/^Search Test_\d{13}_\d+$/);
        expect(result2).toMatch(/^Form Test_\d{13}_\d+$/);
        expect(result1.replace('Search ', '')).toBe(result2.replace('Form ', ''));
        
        console.log('Tokenized result 1:', result1);
        console.log('Tokenized result 2:', result2);
    });

    test('AutomationEngine tokenizes both {Unique_XXXX} and {{variable}}', () => {
        const testMappingPath = path.join(__dirname, 'mappings.json');
        const engine = new AutomationEngine(testMappingPath);
        
        const testData = { userName: 'AdminUser' };
        const input = '{{userName}} creates {Unique_0003}';
        
        const result = (engine as any).tokenize(input, testData);
        
        expect(result).toMatch(/^AdminUser creates Test_\d{13}_\d+$/);
        console.log('Combined tokenization result:', result);
    });

    test('AutomationEngine handles multiple unique IDs in one string', () => {
        const testMappingPath = path.join(__dirname, 'mappings.json');
        const engine = new AutomationEngine(testMappingPath);
        
        const testData = {};
        const input = 'Form A {Unique_0001} and Form B {Unique_0002}';
        
        const result = (engine as any).tokenize(input, testData);
        
        expect(result).toMatch(/^Form A Test_\d{13}_\d+ and Form B Test_\d{13}_\d+$/);
        
        const ids = result.match(/Test_\d{13}_\d+/g);
        expect(ids).toHaveLength(2);
        expect(ids[0]).not.toBe(ids[1]);
        
        console.log('Multiple IDs result:', result);
    });

    test('State file has correct schema after multiple operations', async () => {
        const stateManager = new StateManager(testStatePath);
        
        stateManager.resolveOrGenerateId('0001');
        stateManager.resolveOrGenerateId('0002');
        stateManager.resolveOrGenerateId('0003');
        
        await stateManager.persistState();
        
        const state = JSON.parse(fs.readFileSync(testStatePath, 'utf8'));
        
        expect(state.version).toBe('1.0');
        expect(state.scopes).toBeDefined();
        expect(Object.keys(state.scopes).length).toBe(3);
        expect(state.scopes['0001']).toBeDefined();
        expect(state.scopes['0002']).toBeDefined();
        expect(state.scopes['0003']).toBeDefined();
        expect(state.globalCounter).toBe(3);
        expect(state.metadata.framework).toBe('AutoTest');
        
        console.log('State schema validated:', JSON.stringify(state, null, 2));
    });
});
