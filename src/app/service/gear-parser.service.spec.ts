import { GearParserService } from './gear-parser.service';
import { DamageType } from './model';

describe('GearParserService', () => {

  describe('cookDamageType', () => {
    it('should map None', () => {
      expect(GearParserService.cookDamageType(DamageType.None)).toBe('None');
    });

    it('should map Kinetic', () => {
      expect(GearParserService.cookDamageType(DamageType.Kinetic)).toBe('Kinetic');
    });

    it('should map Arc', () => {
      expect(GearParserService.cookDamageType(DamageType.Arc)).toBe('Arc');
    });

    it('should map Thermal to Solar', () => {
      expect(GearParserService.cookDamageType(DamageType.Thermal)).toBe('Solar');
    });

    it('should map Void', () => {
      expect(GearParserService.cookDamageType(DamageType.Void)).toBe('Void');
    });

    it('should map Stasis', () => {
      expect(GearParserService.cookDamageType(DamageType.Stasis)).toBe('Stasis');
    });

    it('should map Strand', () => {
      expect(GearParserService.cookDamageType(DamageType.Strand)).toBe('Strand');
    });

    it('should return empty string for Raid', () => {
      expect(GearParserService.cookDamageType(DamageType.Raid)).toBe('');
    });

    it('should return empty string for unknown values', () => {
      expect(GearParserService.cookDamageType(99 as DamageType)).toBe('');
    });
  });

  describe('isDamageTypeEnergy', () => {
    it('should return true for Arc', () => {
      expect(GearParserService.isDamageTypeEnergy(DamageType.Arc)).toBe(true);
    });

    it('should return true for Thermal (Solar)', () => {
      expect(GearParserService.isDamageTypeEnergy(DamageType.Thermal)).toBe(true);
    });

    it('should return true for Void', () => {
      expect(GearParserService.isDamageTypeEnergy(DamageType.Void)).toBe(true);
    });

    it('should return true for Stasis', () => {
      expect(GearParserService.isDamageTypeEnergy(DamageType.Stasis)).toBe(true);
    });

    it('should return true for Strand', () => {
      expect(GearParserService.isDamageTypeEnergy(DamageType.Strand)).toBe(true);
    });

    it('should return false for None', () => {
      expect(GearParserService.isDamageTypeEnergy(DamageType.None)).toBe(false);
    });

    it('should return false for Kinetic', () => {
      expect(GearParserService.isDamageTypeEnergy(DamageType.Kinetic)).toBe(false);
    });

    it('should return false for Raid', () => {
      expect(GearParserService.isDamageTypeEnergy(DamageType.Raid)).toBe(false);
    });
  });

  describe('getPlugName', () => {
    function makePlugDesc(name: string, categoryIdentifier = 'frames', categoryHash = 12345): any {
      return {
        displayProperties: { name },
        plug: {
          plugCategoryIdentifier: categoryIdentifier,
          plugCategoryHash: categoryHash
        }
      };
    }

    it('should return name for valid plug', () => {
      expect(GearParserService.getPlugName(makePlugDesc('Enhanced Barrel'))).toBe('Enhanced Barrel');
    });

    it('should return null for null name', () => {
      const desc = makePlugDesc('test');
      desc.displayProperties.name = null;
      expect(GearParserService.getPlugName(desc)).toBeFalsy();
    });

    it('should return null for empty name', () => {
      expect(GearParserService.getPlugName(makePlugDesc('   '))).toBeFalsy();
    });

    it('should return null when plug is null', () => {
      const desc = { displayProperties: { name: 'Test' }, plug: null };
      expect(GearParserService.getPlugName(desc)).toBeFalsy();
    });

    it('should return null when plugCategoryIdentifier is null', () => {
      const desc = makePlugDesc('Test');
      desc.plug.plugCategoryIdentifier = null;
      expect(GearParserService.getPlugName(desc)).toBeFalsy();
    });

    it('should return null when plugCategoryHash is null', () => {
      const desc = makePlugDesc('Test');
      desc.plug.plugCategoryHash = null;
      expect(GearParserService.getPlugName(desc)).toBeFalsy();
    });

    it('should return null for tracker plugs (hash 2947756142)', () => {
      expect(GearParserService.getPlugName(makePlugDesc('Kill Tracker', 'tracker', 2947756142))).toBeFalsy();
    });
  });
});
