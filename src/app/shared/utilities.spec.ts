import { getHttpErrorMsg, safeStringifyError, sortByField, Primer } from './utilities';
import { HttpErrorResponse } from '@angular/common/http';

describe('Utilities', () => {

    describe('getHttpErrorMsg', () => {
        it('should return empty string for null', () => {
            expect(getHttpErrorMsg(null)).toBe('');
        });

        it('should return empty string for undefined', () => {
            expect(getHttpErrorMsg(undefined)).toBe('');
        });

        it('should return empty string for non-HttpErrorResponse', () => {
            expect(getHttpErrorMsg({ message: 'oops' })).toBe('');
        });

        it('should return Message from HttpErrorResponse error body', () => {
            const err = new HttpErrorResponse({
                error: { Message: 'Rate limited' },
                status: 429,
                statusText: 'Too Many Requests'
            });
            expect(getHttpErrorMsg(err)).toBe('Rate limited');
        });

        it('should return empty string when HttpErrorResponse has no Message', () => {
            const err = new HttpErrorResponse({
                error: { code: 500 },
                status: 500,
                statusText: 'Server Error'
            });
            expect(getHttpErrorMsg(err)).toBe('');
        });
    });

    describe('safeStringifyError', () => {
        it('should stringify simple objects', () => {
            expect(safeStringifyError({ a: 1, b: 'two' })).toBe('{"a":1,"b":"two"}');
        });

        it('should handle circular references', () => {
            const obj: any = { name: 'test' };
            obj.self = obj;
            const result = safeStringifyError(obj);
            expect(result).toContain('"name":"test"');
            expect(() => JSON.parse(result)).not.toThrow();
        });

        it('should serialize Error objects with name, message, and stack', () => {
            const err = new Error('boom');
            const result = JSON.parse(safeStringifyError(err));
            expect(result.name).toBe('Error');
            expect(result.message).toBe('boom');
            expect(result.stack).toBeTruthy();
        });

        it('should handle null', () => {
            expect(safeStringifyError(null)).toBe('null');
        });

        it('should handle nested Error objects', () => {
            const obj = { outer: new Error('inner') };
            const result = JSON.parse(safeStringifyError(obj));
            expect(result.outer.message).toBe('inner');
        });
    });

    describe('sortByField', () => {
        it('should sort ascending by string field', () => {
            const items = [{ name: 'banana' }, { name: 'apple' }, { name: 'cherry' }];
            items.sort(sortByField('name', false, null!));
            expect(items.map(i => i.name)).toEqual(['apple', 'banana', 'cherry']);
        });

        it('should sort descending when reverse is true', () => {
            const items = [{ name: 'banana' }, { name: 'apple' }, { name: 'cherry' }];
            items.sort(sortByField('name', true, null!));
            expect(items.map(i => i.name)).toEqual(['cherry', 'banana', 'apple']);
        });

        it('should sort by numeric field', () => {
            const items = [{ power: 1600 }, { power: 1550 }, { power: 1620 }];
            items.sort(sortByField('power', false, null!));
            expect(items.map(i => i.power)).toEqual([1550, 1600, 1620]);
        });

        it('should apply primer function before comparing', () => {
            const items = [{ val: '10' }, { val: '9' }, { val: '100' }];
            const primer: Primer = (x) => parseInt(x, 10);
            items.sort(sortByField('val', false, primer));
            expect(items.map(i => i.val)).toEqual(['9', '10', '100']);
        });

        it('should return 0 for equal values', () => {
            const comparator = sortByField('x', false, null!);
            expect(comparator({ x: 5 }, { x: 5 })).toBe(0);
        });
    });
});
