import { TestBed } from '@angular/core/testing';
import { TriumphParserService } from './triumph-parser.service';
import { DestinyCacheService } from './destiny-cache.service';
import { TriumphRecordNode, PathEntry } from './model';

describe('TriumphParserService', () => {
    let service: TriumphParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                TriumphParserService,
                { provide: DestinyCacheService, useValue: {} }
            ]
        });
        service = TestBed.inject(TriumphParserService);
    });

    describe('getBestPres', () => {
        it('should return null when no nodes contain the key', () => {
            const nodes = [{ a: { progress: 1 } }, { b: { progress: 2 } }];
            expect(service.getBestPres(nodes, 'missing')).toBeNull();
        });

        it('should return the only matching node', () => {
            const nodes = [{ myKey: { progress: 5 } }];
            expect(service.getBestPres(nodes, 'myKey')).toEqual({ progress: 5 });
        });

        it('should return node with highest progress across multiple node sets', () => {
            const nodes = [
                { myKey: { progress: 3 } },
                { myKey: { progress: 7 } },
                { myKey: { progress: 1 } }
            ];
            expect(service.getBestPres(nodes, 'myKey')).toEqual({ progress: 7 });
        });

        it('should skip null entries', () => {
            const nodes = [
                { myKey: null },
                { myKey: { progress: 4 } }
            ];
            expect(service.getBestPres(nodes, 'myKey')).toEqual({ progress: 4 });
        });

        it('should return null for empty array', () => {
            expect(service.getBestPres([], 'any')).toBeNull();
        });
    });

    describe('recAvg (private)', () => {
        it('should return 0 when objectives is null', () => {
            expect(service['recAvg']({ objectives: null })).toBe(0);
        });

        it('should calculate average progress for single objective', () => {
            const rec = {
                objectives: [{ progress: 50, completionValue: 100 }]
            };
            expect(service['recAvg'](rec)).toBe(0.5);
        });

        it('should sum progress ratios for multiple objectives', () => {
            const rec = {
                objectives: [
                    { progress: 50, completionValue: 100 },
                    { progress: 30, completionValue: 60 }
                ]
            };
            expect(service['recAvg'](rec)).toBe(1.0);
        });

        it('should skip objectives with zero completionValue', () => {
            const rec = {
                objectives: [
                    { progress: 50, completionValue: 0 },
                    { progress: 25, completionValue: 50 }
                ]
            };
            expect(service['recAvg'](rec)).toBe(0.5);
        });

        it('should skip objectives with null completionValue', () => {
            const rec = {
                objectives: [
                    { progress: 10, completionValue: null },
                    { progress: 10, completionValue: 10 }
                ]
            };
            expect(service['recAvg'](rec)).toBe(1.0);
        });

        it('should return 0 for empty objectives array', () => {
            expect(service['recAvg']({ objectives: [] })).toBe(0);
        });
    });

    describe('findLeaves', () => {
        function makeTriumph(hash: string, pathHashes: number[]): TriumphRecordNode {
            return {
                hash,
                path: pathHashes.map(h => ({ path: '', hash: h + '' } as PathEntry))
            } as any;
        }

        it('should return triumphs whose path contains a matching hash', () => {
            const triumphs = [
                makeTriumph('t1', [100, 200]),
                makeTriumph('t2', [300, 400]),
                makeTriumph('t3', [200, 500])
            ];
            const result = service.findLeaves(triumphs, [200]);
            expect(result.length).toBe(2);
            expect(result[0].hash).toBe('t1');
            expect(result[1].hash).toBe('t3');
        });

        it('should return empty array when no paths match', () => {
            const triumphs = [makeTriumph('t1', [100])];
            expect(service.findLeaves(triumphs, [999])).toEqual([]);
        });

        it('should return empty array for empty triumphs', () => {
            expect(service.findLeaves([], [100])).toEqual([]);
        });

        it('should not duplicate a triumph even if multiple path entries match', () => {
            const triumphs = [makeTriumph('t1', [100, 200])];
            const result = service.findLeaves(triumphs, [100, 200]);
            expect(result.length).toBe(1);
        });
    });

    describe('getBestCol (private)', () => {
        it('should return null when no nodes contain the key', () => {
            expect(service['getBestCol']([{ a: 1 }], 'missing')).toBeNull();
        });

        it('should prefer node with collected state (bit 0 clear)', () => {
            const nodes = [
                { item: { state: 1 } },  // not collected (bit 0 set)
                { item: { state: 0 } }   // collected (bit 0 clear)
            ];
            expect(service['getBestCol'](nodes, 'item')).toEqual({ state: 0 });
        });

        it('should return first match when only one exists', () => {
            const nodes = [{ item: { state: 3 } }];
            expect(service['getBestCol'](nodes, 'item')).toEqual({ state: 3 });
        });
    });
});
