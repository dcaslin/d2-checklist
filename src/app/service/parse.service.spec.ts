import { TestBed } from '@angular/core/testing';
import { ParseService } from './parse.service';
import { DestinyCacheService } from './destiny-cache.service';
import { GearParserService } from './gear-parser.service';
import { TriumphParserService } from './triumph-parser.service';
import { MilestoneParserService } from './milestone-parser.service';
import { HistoryParserService } from './history-parser.service';
import {
  Character,
  ClassAllowed,
  InventoryItem,
  BUCKET_WEAPON_KINETIC,
  BUCKET_WEAPON_ENERGY,
  BUCKET_WEAPON_POWER,
  BUCKET_ARMOR_HELMET,
  BUCKET_ARMOR_GAUNTLETS,
  BUCKET_ARMOR_CHEST,
  BUCKET_ARMOR_LEG,
  BUCKET_ARMOR_CLASS,
  BUCKETS_ALL_POWER
} from './model';

// Helper to create a minimal Character with required fields for calculateMaxLight
function makeCharacter(classType: number, overrides: Partial<Character> = {}): Character {
  const char = new Character(1, 'mem-1', 'Titan', 1000, `char-${classType}`);
  char.classType = classType;
  Object.assign(char, overrides);
  return char;
}

// Helper to create a minimal InventoryItem stub with only fields needed by calculateMaxLight
function makeGearItem(bucketHash: number, power: number, classAllowed: ClassAllowed = ClassAllowed.Any): Partial<InventoryItem> {
  return {
    power,
    classAllowed,
    inventoryBucket: { hash: bucketHash } as any
  };
}

// Creates a full set of 8 gear items (3 weapons + 5 armor) at the given power level
function makeFullGearSet(power: number, classAllowed: ClassAllowed = ClassAllowed.Any): Partial<InventoryItem>[] {
  return BUCKETS_ALL_POWER.map(bucket => makeGearItem(bucket, power, classAllowed));
}

describe('ParseService', () => {
  let service: ParseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ParseService,
        { provide: DestinyCacheService, useValue: {} },
        { provide: GearParserService, useValue: {} },
        { provide: TriumphParserService, useValue: {} },
        { provide: MilestoneParserService, useValue: {} },
        { provide: HistoryParserService, useValue: {} }
      ]
    });
    service = TestBed.inject(ParseService);
  });

  describe('static getBasicValue', () => {
    it('should return null for null input', () => {
      expect(ParseService.getBasicValue(null)).toBeFalsy();
    });

    it('should return null when basic is null', () => {
      expect(ParseService.getBasicValue({ basic: null })).toBeFalsy();
    });

    it('should extract basic.value', () => {
      expect(ParseService.getBasicValue({ basic: { value: 42 } })).toBe(42);
    });

    it('should handle zero value', () => {
      expect(ParseService.getBasicValue({ basic: { value: 0 } })).toBe(0);
    });
  });

  describe('static getBasicDisplayValue', () => {
    it('should return null for null input', () => {
      expect(ParseService.getBasicDisplayValue(null)).toBeFalsy();
    });

    it('should return null when basic is null', () => {
      expect(ParseService.getBasicDisplayValue({ basic: null })).toBeFalsy();
    });

    it('should extract basic.displayValue', () => {
      expect(ParseService.getBasicDisplayValue({ basic: { displayValue: '99' } })).toBe('99');
    });
  });

  describe('static camelKebab', () => {
    it('should split camelCase into words', () => {
      expect(ParseService.camelKebab(null!, 'helloWorld')).toBe('Hello World');
    });

    it('should remove prefix and split', () => {
      expect(ParseService.camelKebab('stat', 'statResilience')).toBe('Resilience');
    });

    it('should capitalize first letter of single word', () => {
      expect(ParseService.camelKebab(null!, 'test')).toBe('Test');
    });
  });

  describe('calculateMaxLight (private)', () => {
    function callCalculateMaxLight(chars: Character[], gear: Partial<InventoryItem>[], artifactBonus: number) {
      (service as any).calculateMaxLight(chars, gear, artifactBonus);
    }

    it('should calculate base power level from average of best gear per slot', () => {
      const char = makeCharacter(ClassAllowed.Titan);
      // All 8 slots at 1600 power
      const gear = makeFullGearSet(1600);

      callCalculateMaxLight([char], gear, 0);

      expect(char.basePL).toBe(1600);
      expect(char.light).toBe(1600);
    });

    it('should add artifact bonus to light', () => {
      const char = makeCharacter(ClassAllowed.Titan);
      const gear = makeFullGearSet(1600);

      callCalculateMaxLight([char], gear, 15);

      expect(char.basePL).toBe(1600);
      expect(char.light).toBe(1615);
    });

    it('should floor the average base power level', () => {
      const char = makeCharacter(ClassAllowed.Titan);
      // 7 slots at 1600, 1 slot at 1601 => avg = 1600.125 => floor = 1600
      const gear = BUCKETS_ALL_POWER.map((bucket, i) =>
        makeGearItem(bucket, i === 0 ? 1601 : 1600)
      );

      callCalculateMaxLight([char], gear, 0);

      expect(char.basePL).toBe(1600);
      expect(char.light).toBe(1600);
    });

    it('should pick the highest power item per bucket', () => {
      const char = makeCharacter(ClassAllowed.Titan);
      const gear = [
        // Two kinetic weapons, should pick the 1610
        makeGearItem(BUCKET_WEAPON_KINETIC, 1610),
        makeGearItem(BUCKET_WEAPON_KINETIC, 1590),
        // Rest of slots at 1600
        makeGearItem(BUCKET_WEAPON_ENERGY, 1600),
        makeGearItem(BUCKET_WEAPON_POWER, 1600),
        makeGearItem(BUCKET_ARMOR_HELMET, 1600),
        makeGearItem(BUCKET_ARMOR_GAUNTLETS, 1600),
        makeGearItem(BUCKET_ARMOR_CHEST, 1600),
        makeGearItem(BUCKET_ARMOR_LEG, 1600),
        makeGearItem(BUCKET_ARMOR_CLASS, 1600),
      ];

      callCalculateMaxLight([char], gear, 0);

      // (1610 + 7*1600) / 8 = 12810/8 = 1601.25 => floor = 1601
      expect(char.basePL).toBe(1601);
    });

    it('should respect class-specific gear restrictions', () => {
      const titan = makeCharacter(ClassAllowed.Titan);
      const hunter = makeCharacter(ClassAllowed.Hunter);

      const gear = [
        // Weapons are class-agnostic
        makeGearItem(BUCKET_WEAPON_KINETIC, 1600),
        makeGearItem(BUCKET_WEAPON_ENERGY, 1600),
        makeGearItem(BUCKET_WEAPON_POWER, 1600),
        // High-power Titan armor
        makeGearItem(BUCKET_ARMOR_HELMET, 1620, ClassAllowed.Titan),
        makeGearItem(BUCKET_ARMOR_GAUNTLETS, 1620, ClassAllowed.Titan),
        makeGearItem(BUCKET_ARMOR_CHEST, 1620, ClassAllowed.Titan),
        makeGearItem(BUCKET_ARMOR_LEG, 1620, ClassAllowed.Titan),
        makeGearItem(BUCKET_ARMOR_CLASS, 1620, ClassAllowed.Titan),
        // Low-power Hunter armor
        makeGearItem(BUCKET_ARMOR_HELMET, 1580, ClassAllowed.Hunter),
        makeGearItem(BUCKET_ARMOR_GAUNTLETS, 1580, ClassAllowed.Hunter),
        makeGearItem(BUCKET_ARMOR_CHEST, 1580, ClassAllowed.Hunter),
        makeGearItem(BUCKET_ARMOR_LEG, 1580, ClassAllowed.Hunter),
        makeGearItem(BUCKET_ARMOR_CLASS, 1580, ClassAllowed.Hunter),
      ];

      callCalculateMaxLight([titan, hunter], gear, 0);

      // Titan: (3*1600 + 5*1620) / 8 = (4800+8100)/8 = 1612.5 => floor 1612
      expect(titan.basePL).toBe(1612);
      // Hunter: (3*1600 + 5*1580) / 8 = (4800+7900)/8 = 1587.5 => floor 1587
      expect(hunter.basePL).toBe(1587);
    });

    it('should handle empty characters array', () => {
      const gear = makeFullGearSet(1600);
      // Should not throw
      callCalculateMaxLight([], gear, 0);
    });

    it('should handle empty gear array', () => {
      const char = makeCharacter(ClassAllowed.Titan);
      // No gear means no powerLevels, basePL stays at default (0)
      callCalculateMaxLight([char], [], 10);
      expect(char.basePL).toBe(0);
      expect(char.light).toBe(1000); // unchanged from constructor
    });

    it('should handle missing inventory bucket on gear items', () => {
      const char = makeCharacter(ClassAllowed.Titan);
      const gear = [
        { power: 1600, classAllowed: ClassAllowed.Any, inventoryBucket: null } as any,
      ];
      // Should not throw, just skip the item
      callCalculateMaxLight([char], gear, 0);
      expect(char.basePL).toBe(0);
    });

    it('should set basePLString without fraction when average is exact', () => {
      const char = makeCharacter(ClassAllowed.Titan);
      const gear = makeFullGearSet(1600);

      callCalculateMaxLight([char], gear, 0);

      expect(char.basePLString).toBe('1600 Base PL');
    });

    it('should set basePLString with fraction when average is not exact', () => {
      const char = makeCharacter(ClassAllowed.Titan);
      // 7 slots at 1600, 1 slot at 1604 => avg = 1600.5
      const gear = BUCKETS_ALL_POWER.map((bucket, i) =>
        makeGearItem(bucket, i === 0 ? 1604 : 1600)
      );

      callCalculateMaxLight([char], gear, 0);

      // basePL = floor(1600.5) = 1600
      expect(char.basePL).toBe(1600);
      // lightFraction should be set for the 0.5 part
      expect(char.lightFraction).toBeTruthy();
      expect(char.basePLString).toContain('1600');
      expect(char.basePLString).toContain('Base PL');
      expect(char.basePLString).toContain('/');
    });

    it('should populate bestPlGear for each bucket', () => {
      const char = makeCharacter(ClassAllowed.Titan);
      const gear = makeFullGearSet(1600);

      callCalculateMaxLight([char], gear, 0);

      for (const bucketHash of BUCKETS_ALL_POWER) {
        expect(char.bestPlGear[bucketHash]).toBeTruthy();
        expect(char.bestPlGear[bucketHash].power).toBe(1600);
      }
    });

    it('should calculate independently for multiple characters', () => {
      const titan = makeCharacter(ClassAllowed.Titan);
      const warlock = makeCharacter(ClassAllowed.Warlock);
      // All gear is ClassAllowed.Any, so both characters see same gear
      const gear = makeFullGearSet(1550);

      callCalculateMaxLight([titan, warlock], gear, 5);

      expect(titan.basePL).toBe(1550);
      expect(titan.light).toBe(1555);
      expect(warlock.basePL).toBe(1550);
      expect(warlock.light).toBe(1555);
    });

    it('should handle partial gear (not all 8 slots filled)', () => {
      const char = makeCharacter(ClassAllowed.Titan);
      // Only provide weapons (3 slots)
      const gear = [
        makeGearItem(BUCKET_WEAPON_KINETIC, 1600),
        makeGearItem(BUCKET_WEAPON_ENERGY, 1610),
        makeGearItem(BUCKET_WEAPON_POWER, 1620),
      ];

      callCalculateMaxLight([char], gear, 0);

      // avg of 3 items = (1600+1610+1620)/3 = 1610
      expect(char.basePL).toBe(1610);
      expect(char.light).toBe(1610);
    });

    it('should handle zero artifact bonus', () => {
      const char = makeCharacter(ClassAllowed.Titan);
      const gear = makeFullGearSet(1500);

      callCalculateMaxLight([char], gear, 0);

      expect(char.basePL).toBe(1500);
      expect(char.light).toBe(1500);
    });

    it('should handle negative artifact bonus', () => {
      const char = makeCharacter(ClassAllowed.Titan);
      const gear = makeFullGearSet(1500);

      callCalculateMaxLight([char], gear, -5);

      expect(char.basePL).toBe(1500);
      expect(char.light).toBe(1495);
    });
  });
});
