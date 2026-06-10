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

    describe('parsePublicMilestones with missing manifest entries', () => {
        function makeMilestoneDesc(hash: number): any {
            return {
                hash,
                milestoneType: 3,
                displayProperties: { name: 'Test Milestone', description: 'desc', icon: 'icon.png' }
            };
        }

        function makePublicMs(milestoneHash: number, activityHash: number): any {
            return {
                milestoneHash,
                order: 1,
                startDate: '2026-06-09T17:00:00Z',
                endDate: '2026-06-16T17:00:00Z',
                activities: [{ activityHash, challengeObjectiveHashes: [], modifierHashes: [] }]
            };
        }

        it('should skip activities whose hash is missing from the manifest', async () => {
            const mockCache: any = {
                getMilestone: (hash: any) => Promise.resolve(makeMilestoneDesc(hash)),
                getActivity: () => Promise.resolve(undefined) // hash dropped by manifest update
            };
            const svc = new MilestoneParserService(mockCache);
            const result = await svc.parsePublicMilestones({ '1': makePublicMs(1, 555) });
            expect(result.publicMilestones.length).toBe(1);
            expect(result.publicMilestones[0].activities.length).toBe(0);
        });

        it('should tolerate a missing activity mode when falling back for icons', async () => {
            const aDesc = {
                displayProperties: { name: 'Test Activity', description: 'd', icon: 'missing_icon.png' },
                activityLightLevel: 100,
                tier: 1,
                activityModeHashes: [999]
            };
            const mockCache: any = {
                getMilestone: (hash: any) => Promise.resolve(makeMilestoneDesc(hash)),
                getActivity: () => Promise.resolve(aDesc),
                getActivityMode: () => Promise.resolve(undefined) // hash dropped by manifest update
            };
            const svc = new MilestoneParserService(mockCache);
            const result = await svc.parsePublicMilestones({ '1': makePublicMs(1, 555) });
            expect(result.publicMilestones.length).toBe(1);
            expect(result.publicMilestones[0].activities.length).toBe(1);
            expect(result.publicMilestones[0].activities[0].name).toBe('Test Activity');
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
