import { HistoryParserService } from './history-parser.service';
import { AggHistoryEntry } from './model';

describe('HistoryParserService', () => {

  function makeEntry(overrides: Partial<AggHistoryEntry> = {}): AggHistoryEntry {
    return {
      name: 'Test Activity',
      type: 'raid',
      hash: ['123'],
      activityBestSingleGameScore: 100,
      fastestCompletionMsForActivity: 600000,
      activityCompletions: 5,
      charCompletions: [{ char: { id: 'c1' } as any, count: 5 }],
      activityKills: 200,
      activityAssists: 50,
      activityDeaths: 10,
      activityPrecisionKills: 100,
      activitySecondsPlayed: 3600,
      activityLightLevel: 1800,
      efficiency: 5,
      ...overrides
    };
  }

  describe('mergeAggHistory2', () => {
    it('should return empty array for empty input', () => {
      expect(HistoryParserService.mergeAggHistory2([])).toEqual([]);
    });

    it('should handle null entries in array', () => {
      const result = HistoryParserService.mergeAggHistory2([null!]);
      expect(result).toEqual([]);
    });

    it('should return single entry from single character dict', () => {
      const dict = { 'Raid Activity': makeEntry({ name: 'Raid Activity' }) };
      const result = HistoryParserService.mergeAggHistory2([dict]);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Raid Activity');
    });

    it('should merge matching entries across characters', () => {
      const dict1 = { 'Raid': makeEntry({ name: 'Raid', activityKills: 100, activityDeaths: 5, activityCompletions: 3 }) };
      const dict2 = { 'Raid': makeEntry({ name: 'Raid', activityKills: 150, activityDeaths: 8, activityCompletions: 4 }) };
      const result = HistoryParserService.mergeAggHistory2([dict1, dict2]);
      expect(result.length).toBe(1);
      expect(result[0].activityKills).toBe(250);
      expect(result[0].activityDeaths).toBe(13);
      expect(result[0].activityCompletions).toBe(7);
    });

    it('should calculate KD ratio', () => {
      const dict = { 'Raid': makeEntry({ name: 'Raid', activityKills: 100, activityDeaths: 10 }) };
      const result = HistoryParserService.mergeAggHistory2([dict]);
      expect(result[0].kd).toBe(10);
    });

    it('should set KD to kills when deaths is 0', () => {
      const dict = { 'Raid': makeEntry({ name: 'Raid', activityKills: 50, activityDeaths: 0 }) };
      const result = HistoryParserService.mergeAggHistory2([dict]);
      expect(result[0].kd).toBe(50);
    });

    it('should strip "Nightfall: " prefix from names', () => {
      const dict = { 'NF': makeEntry({ name: 'Nightfall: The Disgraced' }) };
      const result = HistoryParserService.mergeAggHistory2([dict]);
      expect(result[0].name).toBe('The Disgraced');
    });

    it('should skip QUEST entries', () => {
      const dict = {
        'Raid': makeEntry({ name: 'Some Raid' }),
        'Quest': makeEntry({ name: 'QUEST: Do Something' })
      };
      const result = HistoryParserService.mergeAggHistory2([dict]);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Some Raid');
    });

    it('should sort by activityLightLevel desc then name asc', () => {
      const dict = {
        'A': makeEntry({ name: 'Bravo', activityLightLevel: 1800 }),
        'B': makeEntry({ name: 'Alpha', activityLightLevel: 1800 }),
        'C': makeEntry({ name: 'Charlie', activityLightLevel: 1900 })
      };
      const result = HistoryParserService.mergeAggHistory2([dict]);
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Alpha');
      expect(result[2].name).toBe('Bravo');
    });

    it('should dedupe hash arrays after merge', () => {
      const dict1 = { 'Raid': makeEntry({ name: 'Raid', hash: ['h1', 'h2'] }) };
      const dict2 = { 'Raid': makeEntry({ name: 'Raid', hash: ['h2', 'h3'] }) };
      const result = HistoryParserService.mergeAggHistory2([dict1, dict2]);
      expect(result[0].hash.length).toBe(3);
      expect(result[0].hash).toContain('h1');
      expect(result[0].hash).toContain('h2');
      expect(result[0].hash).toContain('h3');
    });

    it('should keep different activities separate', () => {
      const dict = {
        'Raid1': makeEntry({ name: 'Kings Fall' }),
        'Raid2': makeEntry({ name: 'Vow of the Disciple' })
      };
      const result = HistoryParserService.mergeAggHistory2([dict]);
      expect(result.length).toBe(2);
    });

    it('should pick fastest completion time when merging', () => {
      const dict1 = { 'Raid': makeEntry({ name: 'Raid', fastestCompletionMsForActivity: 600000 }) };
      const dict2 = { 'Raid': makeEntry({ name: 'Raid', fastestCompletionMsForActivity: 300000 }) };
      const result = HistoryParserService.mergeAggHistory2([dict1, dict2]);
      expect(result[0].fastestCompletionMsForActivity).toBe(300000);
    });

    it('should pick max light level and best score when merging', () => {
      const dict1 = { 'Raid': makeEntry({ name: 'Raid', activityLightLevel: 1700, activityBestSingleGameScore: 50 }) };
      const dict2 = { 'Raid': makeEntry({ name: 'Raid', activityLightLevel: 1800, activityBestSingleGameScore: 80 }) };
      const result = HistoryParserService.mergeAggHistory2([dict1, dict2]);
      expect(result[0].activityLightLevel).toBe(1800);
      expect(result[0].activityBestSingleGameScore).toBe(80);
    });
  });
});
