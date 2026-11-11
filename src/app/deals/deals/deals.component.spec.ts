import { ClassAllowed } from '@app/service/model';
import { VendorDeals } from '@app/service/vendor.service';
import { filterDealsByClass } from './deals.component';

describe('filterDealsByClass', () => {
    const item = (classAllowed: ClassAllowed) => ({ classAllowed } as any);

    const deals = (): VendorDeals => ({
        playerLoading: false,
        vendorsLoading: 0,
        totalVendors: 0,
        legendary: [
            { classType: ClassAllowed.Titan, gear: [item(ClassAllowed.Titan)] } as any,
            { classType: ClassAllowed.Hunter, gear: [item(ClassAllowed.Hunter)] } as any
        ],
        exotic: [
            { gear: [item(ClassAllowed.Warlock)], marginalValue: 1 },
            { gear: [item(ClassAllowed.Hunter)], marginalValue: 1 }
        ],
        collection: [
            { vendor: {} as any, data: [item(ClassAllowed.Titan), item(ClassAllowed.Any)] },
            { vendor: {} as any, data: [item(ClassAllowed.Warlock)] }
        ],
        bansheeWeapons: []
    });

    it('should return deals unchanged when nothing is ignored', () => {
        const d = deals();
        expect(filterDealsByClass(d, [])).toBe(d);
    });

    it('should return null for null deals', () => {
        expect(filterDealsByClass(null, [ClassAllowed.Titan])).toBeNull();
    });

    it('should drop legendary and exotic armor deals for ignored classes', () => {
        const result = filterDealsByClass(deals(), [ClassAllowed.Titan, ClassAllowed.Warlock])!;
        expect(result.legendary.map(x => x.classType)).toEqual([ClassAllowed.Hunter]);
        expect(result.exotic.map(x => x.gear[0].classAllowed)).toEqual([ClassAllowed.Hunter]);
    });

    it('should keep class-agnostic collection items and drop vendors left empty', () => {
        const result = filterDealsByClass(deals(), [ClassAllowed.Titan, ClassAllowed.Warlock])!;
        expect(result.collection.length).toBe(1);
        expect(result.collection[0].data.map(x => x.classAllowed)).toEqual([ClassAllowed.Any]);
    });
});
