import {
  dedupeArray,
  decimalToFraction,
  greatestCommonDenominator,
  getBasicValue,
  getBasicDisplayValue,
  camelKebab,
  buildDynamicStrings,
  dynamicStringReplace,
  dynamicStringClear,
  parseProgression,
  cookAccountProgression,
  INTERPOLATION_PATTERN,
  PrivProgression
} from './parse-utils';
import { Progression } from './model';

describe('parse-utils', () => {

  describe('dedupeArray', () => {
    it('should remove duplicate primitives', () => {
      expect(dedupeArray([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
      expect(dedupeArray([])).toEqual([]);
    });

    it('should handle strings', () => {
      expect(dedupeArray(['a', 'b', 'a'])).toEqual(['a', 'b']);
    });

    it('should handle array with no duplicates', () => {
      expect(dedupeArray([1, 2, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('greatestCommonDenominator', () => {
    it('should find GCD of two numbers', () => {
      expect(greatestCommonDenominator(12, 8)).toBe(4);
    });

    it('should return first number when second is 0', () => {
      expect(greatestCommonDenominator(5, 0)).toBe(5);
    });

    it('should handle coprime numbers', () => {
      expect(greatestCommonDenominator(7, 13)).toBe(1);
    });

    it('should handle equal numbers', () => {
      expect(greatestCommonDenominator(6, 6)).toBe(6);
    });
  });

  describe('decimalToFraction', () => {
    it('should return null for integers', () => {
      expect(decimalToFraction(5)).toBeFalsy();
    });

    it('should convert 0.5 to 1/2', () => {
      const result = decimalToFraction(0.5);
      expect(result).toEqual({ top: 1, bottom: 2 });
    });

    it('should convert 0.25 to 1/4', () => {
      const result = decimalToFraction(0.25);
      expect(result).toEqual({ top: 1, bottom: 4 });
    });

    it('should convert 0.75 to 3/4', () => {
      const result = decimalToFraction(0.75);
      expect(result).toEqual({ top: 3, bottom: 4 });
    });
  });

  describe('getBasicValue', () => {
    it('should return null for null input', () => {
      expect(getBasicValue(null)).toBeFalsy();
    });

    it('should return null when basic is null', () => {
      expect(getBasicValue({ basic: null })).toBeFalsy();
    });

    it('should extract basic.value', () => {
      expect(getBasicValue({ basic: { value: 42 } })).toBe(42);
    });

    it('should handle zero value', () => {
      expect(getBasicValue({ basic: { value: 0 } })).toBe(0);
    });
  });

  describe('getBasicDisplayValue', () => {
    it('should return null for null input', () => {
      expect(getBasicDisplayValue(null)).toBeFalsy();
    });

    it('should return null when basic is null', () => {
      expect(getBasicDisplayValue({ basic: null })).toBeFalsy();
    });

    it('should extract basic.displayValue', () => {
      expect(getBasicDisplayValue({ basic: { displayValue: '42' } })).toBe('42');
    });
  });

  describe('camelKebab', () => {
    it('should split camelCase into words', () => {
      expect(camelKebab(null!, 'helloWorld')).toBe('Hello World');
    });

    it('should remove prefix and split', () => {
      expect(camelKebab('stat', 'statResilience')).toBe('Resilience');
    });

    it('should capitalize first letter', () => {
      expect(camelKebab(null!, 'test')).toBe('Test');
    });

    it('should handle multiple camelCase boundaries', () => {
      expect(camelKebab(null!, 'thisIsATest')).toBe('This Is ATest');
    });
  });

  describe('buildDynamicStrings', () => {
    it('should build from empty response', () => {
      const result = buildDynamicStrings({});
      expect(result).toEqual({ character: {}, profile: {} });
    });

    it('should extract profile string variables', () => {
      const resp = {
        profileStringVariables: {
          data: {
            integerValuesByHash: { '123': 456 }
          }
        }
      };
      const result = buildDynamicStrings(resp);
      expect(result.profile).toEqual({ '123': 456 });
    });

    it('should extract character string variables', () => {
      const resp = {
        characterStringVariables: {
          data: {
            'char1': { integerValuesByHash: { '789': 100 } }
          }
        }
      };
      const result = buildDynamicStrings(resp);
      expect(result.character['char1']).toEqual({ '789': 100 });
    });

    it('should handle both profile and character variables', () => {
      const resp = {
        profileStringVariables: {
          data: { integerValuesByHash: { 'a': 1 } }
        },
        characterStringVariables: {
          data: {
            'c1': { integerValuesByHash: { 'b': 2 } }
          }
        }
      };
      const result = buildDynamicStrings(resp);
      expect(result.profile).toEqual({ 'a': 1 });
      expect(result.character['c1']).toEqual({ 'b': 2 });
    });
  });

  describe('dynamicStringReplace', () => {
    it('should replace interpolation patterns with character values', () => {
      const dynamicStrings = {
        character: { 'char1': { '12345': 999 } },
        profile: {}
      };
      const result = dynamicStringReplace('You have {var:12345} points', 'char1', dynamicStrings);
      expect(result).toBe('You have 999 points');
    });

    it('should fall back to profile values', () => {
      const dynamicStrings = {
        character: {},
        profile: { '12345': 500 }
      };
      const result = dynamicStringReplace('Score: {var:12345}', 'char1', dynamicStrings);
      expect(result).toBe('Score: 500');
    });

    it('should keep original pattern if no value found', () => {
      const dynamicStrings = { character: {}, profile: {} };
      const result = dynamicStringReplace('Score: {var:99999}', 'char1', dynamicStrings);
      expect(result).toBe('Score: {var:99999}');
    });

    it('should handle multiple patterns', () => {
      const dynamicStrings = {
        character: { 'c1': { '111': 10, '222': 20 } },
        profile: {}
      };
      const result = dynamicStringReplace('{var:111} / {var:222}', 'c1', dynamicStrings);
      expect(result).toBe('10 / 20');
    });

    it('should prefer character values over profile values', () => {
      const dynamicStrings = {
        character: { 'c1': { '111': 42 } },
        profile: { '111': 99 }
      };
      const result = dynamicStringReplace('{var:111}', 'c1', dynamicStrings);
      expect(result).toBe('42');
    });
  });

  describe('dynamicStringClear', () => {
    it('should remove all interpolation patterns', () => {
      const result = dynamicStringClear('You have {var:12345} of {var:67890} points');
      expect(result).toBe('You have  of  points');
    });

    it('should return text unchanged if no patterns', () => {
      const result = dynamicStringClear('No patterns here');
      expect(result).toBe('No patterns here');
    });
  });

  describe('INTERPOLATION_PATTERN', () => {
    it('should match {var:digits} pattern', () => {
      expect('{var:12345}'.match(INTERPOLATION_PATTERN)).toBeTruthy();
    });

    it('should not match other patterns', () => {
      expect('{foo:12345}'.match(INTERPOLATION_PATTERN)).toBeFalsy();
    });
  });

  describe('parseProgression', () => {
    function makePrivProgression(overrides: Partial<PrivProgression> = {}): PrivProgression {
      return {
        factionHash: 0,
        progressionHash: 12345,
        dailyProgress: 100,
        dailyLimit: 200,
        weeklyProgress: 500,
        weeklyLimit: 1000,
        currentProgress: 5000,
        level: 5,
        levelCap: 10,
        stepIndex: 0,
        progressToNextLevel: 200,
        nextLevelAt: 1000,
        ...overrides
      };
    }

    function makeDesc(name: string, overrides: any = {}): any {
      return {
        displayProperties: {
          name,
          icon: '/icon.png',
          description: 'A progression'
        },
        steps: [],
        ...overrides
      };
    }

    it('should return null when desc is null', () => {
      const result = parseProgression(makePrivProgression(), null);
      expect(result).toBeFalsy();
    });

    it('should parse basic progression', () => {
      const p = makePrivProgression();
      const desc = makeDesc('Gunsmith');
      const result = parseProgression(p, desc);
      expect(result).toBeTruthy();
      expect(result.name).toBe('Gunsmith');
      expect(result.info).toBe('Banshee');
      expect(result.icon).toBe('/icon.png');
      expect(result.level).toBe(5);
      expect(result.currentProgress).toBe(5000);
    });

    it('should rename known progressions', () => {
      const testCases: [string, string, string][] = [
        ['Exodus Black AI', 'Failsafe', 'Nessus'],
        ['Dead Zone Scout', 'Devrim', 'EDZ'],
        ['The Crucible', 'Crucible', 'Shaxx'],
        ['Cryptarchs', 'Cryptarchs', 'Rahool'],
      ];
      for (const [inputName, expectedName, expectedInfo] of testCases) {
        const result = parseProgression(makePrivProgression(), makeDesc(inputName));
        expect(result.name).toBe(expectedName, `name for "${inputName}"`);
        expect(result.info).toBe(expectedInfo, `info for "${inputName}"`);
      }
    });

    it('should return null for Classified progression', () => {
      const result = parseProgression(makePrivProgression(), makeDesc('Classified'));
      expect(result).toBeFalsy();
    });

    it('should return null for Resonance Rank', () => {
      const result = parseProgression(makePrivProgression(), makeDesc('Resonance Rank'));
      expect(result).toBeFalsy();
    });

    it('should calculate percentToNextLevel', () => {
      const p = makePrivProgression({ progressToNextLevel: 250, nextLevelAt: 1000 });
      const result = parseProgression(p, makeDesc('Gunsmith'));
      expect(result.percentToNextLevel).toBe(0.25);
    });

    it('should set percentToNextLevel to 1 when nextLevelAt is 0', () => {
      const p = makePrivProgression({ nextLevelAt: 0 });
      const result = parseProgression(p, makeDesc('Gunsmith'));
      expect(result.percentToNextLevel).toBe(1);
    });

    it('should parse steps when present', () => {
      const desc = makeDesc('Gunsmith', {
        steps: [
          { stepName: 'GUARDIAN I', progressTotal: 100 },
          { stepName: 'BRAVE I', progressTotal: 200 },
          { stepName: 'HEROIC I', progressTotal: 300 }
        ]
      });
      const p = makePrivProgression({ level: 1 });
      const result = parseProgression(p, desc);
      expect(result.steps).toBeTruthy();
      expect(result.steps.length).toBe(3);
      expect(result.steps[0].stepName).toBe('Guardian I');
      expect(result.steps[1].cumulativeTotal).toBe(300);
      expect(result.totalProgress).toBe(600);
      expect(result.title).toBe('Brave I');
      expect(result.nextTitle).toBe('Heroic I');
    });

    it('should set title to Max when level >= steps length', () => {
      const desc = makeDesc('Gunsmith', {
        steps: [
          { stepName: 'GUARDIAN I', progressTotal: 100 },
          { stepName: 'BRAVE I', progressTotal: 200 }
        ]
      });
      const p = makePrivProgression({ level: 2 });
      const result = parseProgression(p, desc);
      expect(result.title).toBe('Max');
    });

    it('should merge supplementary progression', () => {
      const p = makePrivProgression({ dailyProgress: 0, weeklyProgress: 0 });
      const supp: PrivProgression = {
        ...makePrivProgression(),
        dailyProgress: 50,
        weeklyProgress: 300,
        currentResetCount: 3
      };
      const result = parseProgression(p, makeDesc('Gunsmith'), supp);
      expect(result.dailyProgress).toBe(50);
      expect(result.weeklyProgress).toBe(300);
      expect(result.currentResetCount).toBe(3);
    });

    it('should override clan progression names by hash', () => {
      const p = makePrivProgression({ progressionHash: 3759191272 });
      const result = parseProgression(p, makeDesc('Whatever'));
      expect(result.name).toBe('Guided Trials');
    });
  });

  describe('cookAccountProgression', () => {
    it('should set completeProgress to currentProgress', () => {
      const prog = new Progression();
      prog.currentProgress = 1000;
      cookAccountProgression(prog);
      expect(prog.completeProgress).toBe(1000);
    });

    it('should return early with no steps', () => {
      const prog = new Progression();
      prog.currentProgress = 1000;
      prog.steps = [];
      cookAccountProgression(prog);
      expect(prog.completeProgress).toBe(1000);
    });

    it('should include resets in completeProgress', () => {
      const prog = new Progression();
      prog.currentProgress = 500;
      prog.currentResetCount = 2;
      prog.steps = [
        { stepName: 'A', progressTotal: 100, cumulativeTotal: 100 },
        { stepName: 'B', progressTotal: 200, cumulativeTotal: 300 }
      ];
      cookAccountProgression(prog);
      // maxLevel = 300, resets = 2, so completeProgress = 2 * 300 + 500 = 1100
      expect(prog.completeProgress).toBe(1100);
    });

    it('should not add resets when resetCount is 0', () => {
      const prog = new Progression();
      prog.currentProgress = 500;
      prog.currentResetCount = 0;
      prog.steps = [
        { stepName: 'A', progressTotal: 100, cumulativeTotal: 100 }
      ];
      cookAccountProgression(prog);
      expect(prog.completeProgress).toBe(500);
    });
  });
});
