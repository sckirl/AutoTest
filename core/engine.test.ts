import { AutomationEngine } from './engine';

describe('AutomationEngine - tokenize', () => {
    let engine: AutomationEngine;

    beforeEach(() => {
        engine = new AutomationEngine('dummy-path.json');
    });

    test('should return empty string if value is empty or undefined', () => {
        // @ts-ignore - testing private method
        expect(engine.tokenize('', {})).toBe('');
        // @ts-ignore
        expect(engine.tokenize(undefined as any, {})).toBe('');
        // @ts-ignore
        expect(engine.tokenize(null as any, {})).toBe('');
    });

    test('should replace simple tokens with data values', () => {
        const data = { name: 'John', age: '30' };
        // @ts-ignore
        expect(engine.tokenize('Hello {{name}}, you are {{age}}', data)).toBe('Hello John, you are 30');
    });

    test('should replace with empty string if token not found in data', () => {
        const data = { name: 'John' };
        // @ts-ignore
        expect(engine.tokenize('Hello {{name}} {{lastName}}', data)).toBe('Hello John ');
    });

    test('should handle multiple occurrences of the same token', () => {
        const data = { word: 'test' };
        // @ts-ignore
        expect(engine.tokenize('{{word}} {{word}} {{word}}', data)).toBe('test test test');
    });

    test('should handle no tokens present in the string', () => {
        const data = { name: 'John' };
        // @ts-ignore
        expect(engine.tokenize('Hello World', data)).toBe('Hello World');
    });

    test('should ignore malformed tokens', () => {
        const data = { name: 'John' };
        // @ts-ignore
        expect(engine.tokenize('Hello {name} {{name', data)).toBe('Hello {name} {{name');
    });

    test('should ignore empty tokens', () => {
        const data = { '': 'emptyKey' };
        // @ts-ignore
        expect(engine.tokenize('Hello {{}}', data)).toBe('Hello emptyKey');
    });
});
