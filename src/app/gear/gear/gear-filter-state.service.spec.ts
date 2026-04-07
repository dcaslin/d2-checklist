import { generateState, _processComparison } from './gear-filter-state.service';
import { ItemType } from '@app/service/model';

describe('GearFilterStateService', () => {

    describe('generateState', () => {
        it('should set allSelected true when all choices are true', () => {
            const config = { displayTabs: [ItemType.Weapon] } as any;
            const choices = [{ value: true } as any, { value: true } as any];
            expect(generateState(config, choices, ItemType.Weapon).allSelected).toBe(true);
        });

        it('should set allSelected false when some choices are false', () => {
            const config = { displayTabs: [ItemType.Weapon] } as any;
            const choices = [{ value: true } as any, { value: false } as any];
            expect(generateState(config, choices, ItemType.Weapon).allSelected).toBe(false);
        });

        it('should set hidden when item type not in displayTabs', () => {
            const config = { displayTabs: [ItemType.Weapon] } as any;
            expect(generateState(config, [{ value: true } as any], ItemType.Armor).hidden).toBe(true);
        });

        it('should set hidden false when item type is in displayTabs', () => {
            const config = { displayTabs: [ItemType.Weapon, ItemType.Armor] } as any;
            expect(generateState(config, [{ value: true } as any], ItemType.Armor).hidden).toBe(false);
        });
    });

    describe('_processComparison', () => {
        // All tests use prefix 'is:power' and tagVal 'is:power<op><num>'

        describe('>= operator', () => {
            it('should return true when gear value equals threshold', () => {
                expect(_processComparison('is:power', 'is:power>=100', 100)).toBe(true);
            });

            it('should return true when gear value exceeds threshold', () => {
                expect(_processComparison('is:power', 'is:power>=100', 150)).toBe(true);
            });

            it('should return false when gear value is below threshold', () => {
                expect(_processComparison('is:power', 'is:power>=100', 99)).toBe(false);
            });
        });

        describe('> operator', () => {
            it('should return true when gear value exceeds threshold', () => {
                expect(_processComparison('is:power', 'is:power>100', 101)).toBe(true);
            });

            it('should return false when gear value equals threshold', () => {
                expect(_processComparison('is:power', 'is:power>100', 100)).toBe(false);
            });

            it('should return false when gear value is below threshold', () => {
                expect(_processComparison('is:power', 'is:power>100', 50)).toBe(false);
            });
        });

        describe('<= operator', () => {
            it('should return true when gear value equals threshold', () => {
                expect(_processComparison('is:power', 'is:power<=100', 100)).toBe(true);
            });

            it('should return true when gear value is below threshold', () => {
                expect(_processComparison('is:power', 'is:power<=100', 50)).toBe(true);
            });

            it('should return false when gear value exceeds threshold', () => {
                expect(_processComparison('is:power', 'is:power<=100', 101)).toBe(false);
            });
        });

        describe('< operator', () => {
            it('should return true when gear value is below threshold', () => {
                expect(_processComparison('is:power', 'is:power<100', 99)).toBe(true);
            });

            it('should return false when gear value equals threshold', () => {
                expect(_processComparison('is:power', 'is:power<100', 100)).toBe(false);
            });
        });

        describe('= operator', () => {
            it('should return true when gear value equals threshold', () => {
                expect(_processComparison('is:power', 'is:power=100', 100)).toBe(true);
            });

            it('should return false when gear value does not equal threshold', () => {
                expect(_processComparison('is:power', 'is:power=100', 99)).toBe(false);
            });
        });

        describe('edge cases', () => {
            it('should return null when prefix does not match tagVal', () => {
                expect(_processComparison('is:power', 'is:copies>=5', 10)).toBeFalsy();
            });

            it('should return null when no operator is present', () => {
                expect(_processComparison('is:power', 'is:power100', 100)).toBeFalsy();
            });

            it('should return null when value is not a number', () => {
                expect(_processComparison('is:power', 'is:power>=abc', 100)).toBeFalsy();
            });

            it('should handle zero as threshold', () => {
                expect(_processComparison('is:power', 'is:power>=0', 0)).toBe(true);
            });

            it('should handle zero as gear value', () => {
                expect(_processComparison('is:power', 'is:power>0', 0)).toBe(false);
            });

            it('should work with different prefixes', () => {
                expect(_processComparison('is:copies', 'is:copies>=3', 5)).toBe(true);
                expect(_processComparison('has:capacity', 'has:capacity<=5', 3)).toBe(true);
            });
        });
    });
});
