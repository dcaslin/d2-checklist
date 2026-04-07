import { TestBed } from '@angular/core/testing';
import { MilestoneParserService } from './milestone-parser.service';
import { DestinyCacheService } from './destiny-cache.service';
import { Const, MilestoneActivity, NameDesc } from './model';

describe('MilestoneParserService', () => {
    let service: MilestoneParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                MilestoneParserService,
                { provide: DestinyCacheService, useValue: {} }
            ]
        });
        service = TestBed.inject(MilestoneParserService);
    });

    describe('parseMilestonePl', () => {
        it('should return Powerful 3 for "Powerful Gear (Tier 3)"', () => {
            const result = service.parseMilestonePl('Powerful Gear (Tier 3)');
            expect(result.key).toBe(Const.BOOST_POWERFUL_3);
        });

        it('should return Powerful 2 for "Powerful Gear (Tier 2)"', () => {
            const result = service.parseMilestonePl('Powerful Gear (Tier 2)');
            expect(result.key).toBe(Const.BOOST_POWERFUL_2);
        });

        it('should return Powerful 1 for "Powerful Gear"', () => {
            const result = service.parseMilestonePl('Powerful Gear');
            expect(result.key).toBe(Const.BOOST_POWERFUL_1);
        });

        it('should return Pinnacle for "Pinnacle Gear"', () => {
            const result = service.parseMilestonePl('Pinnacle Gear');
            expect(result.key).toBe(Const.BOOST_PINNACLE);
        });

        it('should return Pinnacle Weak for "Pinnacle Gear (Weak)"', () => {
            const result = service.parseMilestonePl('Pinnacle Gear (Weak)');
            expect(result.key).toBe(Const.BOOST_PINNACLE_WEAK);
        });

        it('should return Legendary for "Legendary Gear"', () => {
            const result = service.parseMilestonePl('Legendary Gear');
            expect(result.key).toBe(Const.BOOST_UNKNOWN); // BOOST_LEGENDARY maps key to BOOST_UNKNOWN
        });

        it('should return Unknown for null rewards', () => {
            const result = service.parseMilestonePl(null!);
            expect(result.key).toBe(Const.BOOST_UNKNOWN);
        });

        it('should return Unknown for empty string', () => {
            const result = service.parseMilestonePl('');
            expect(result.key).toBe(Const.BOOST_UNKNOWN);
        });

        it('should return Unknown for unrecognized reward string', () => {
            const result = service.parseMilestonePl('Some Random Reward');
            expect(result.key).toBe(Const.BOOST_UNKNOWN);
        });
    });

    describe('hasChallenge (static)', () => {
        it('should return true when challenge with matching hash exists', () => {
            const act = {
                challenges: [
                    { objective: { objectiveHash: '12345' } },
                    { objective: { objectiveHash: '67890' } }
                ]
            };
            expect(MilestoneParserService['hasChallenge'](act, '67890')).toBe(true);
        });

        it('should return false when no matching hash', () => {
            const act = {
                challenges: [{ objective: { objectiveHash: '12345' } }]
            };
            expect(MilestoneParserService['hasChallenge'](act, '99999')).toBe(false);
        });

        it('should return false when challenges is null', () => {
            expect(MilestoneParserService['hasChallenge']({}, '12345')).toBe(false);
        });

        it('should return false when challenges is empty array', () => {
            expect(MilestoneParserService['hasChallenge']({ challenges: [] }, '12345')).toBe(false);
        });
    });
});
