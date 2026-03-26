import { BungieService } from './bungie.service';
import { Const } from './model';

describe('BungieService', () => {

  describe('parsePlatform', () => {

    describe('numeric string lookups', () => {
      it('should parse "1" as Xbox', () => {
        const result = BungieService.parsePlatform('1');
        expect(result).toBeTruthy();
        expect(result!.type).toBe(1);
        expect(result!.name).toBe('XBL');
      });

      it('should parse "2" as PSN', () => {
        const result = BungieService.parsePlatform('2');
        expect(result).toBeTruthy();
        expect(result!.type).toBe(2);
        expect(result!.name).toBe('PSN');
      });

      it('should parse "3" as Steam', () => {
        const result = BungieService.parsePlatform('3');
        expect(result).toBeTruthy();
        expect(result!.type).toBe(3);
        expect(result!.name).toBe('STEAM');
      });

      it('should parse "4" as Battle.net', () => {
        const result = BungieService.parsePlatform('4');
        expect(result).toBeTruthy();
        expect(result!.type).toBe(4);
        expect(result!.name).toBe('BNET');
      });

      it('should parse "5" as Stadia', () => {
        const result = BungieService.parsePlatform('5');
        expect(result).toBeTruthy();
        expect(result!.type).toBe(5);
        expect(result!.name).toBe('STADIA');
      });

      it('should parse "6" as Epic', () => {
        const result = BungieService.parsePlatform('6');
        expect(result).toBeTruthy();
        expect(result!.type).toBe(6);
        expect(result!.name).toBe('EPIC');
      });
    });

    describe('name string lookups (case-sensitive after lowercase)', () => {
      // parsePlatform lowercases the input and compares against p.name
      // Platform names are stored uppercase (XBL, PSN, etc.)
      // So lowercase input like 'xbl' will NOT match 'XBL'
      it('should not match lowercase "xbl" (stored name is uppercase "XBL")', () => {
        const result = BungieService.parsePlatform('xbl');
        expect(result).toBeNull();
      });

      it('should not match lowercase "psn" (stored name is uppercase "PSN")', () => {
        const result = BungieService.parsePlatform('psn');
        expect(result).toBeNull();
      });

      it('should not match lowercase "steam" (stored name is uppercase "STEAM")', () => {
        const result = BungieService.parsePlatform('steam');
        expect(result).toBeNull();
      });

      it('should not match lowercase "bnet" (stored name is uppercase "BNET")', () => {
        const result = BungieService.parsePlatform('bnet');
        expect(result).toBeNull();
      });
    });

    describe('null, undefined, and unknown values', () => {
      it('should return null for null input', () => {
        expect(BungieService.parsePlatform(null!)).toBeNull();
      });

      it('should return null for undefined input', () => {
        expect(BungieService.parsePlatform(undefined!)).toBeNull();
      });

      it('should return null for empty string', () => {
        expect(BungieService.parsePlatform('')).toBeNull();
      });

      it('should return null for unknown platform string', () => {
        expect(BungieService.parsePlatform('nintendo')).toBeNull();
      });

      it('should return null for out-of-range numeric string', () => {
        expect(BungieService.parsePlatform('99')).toBeNull();
      });

      it('should return null for "0" (ALL platform is not in PLATFORMS_ARRAY)', () => {
        expect(BungieService.parsePlatform('0')).toBeNull();
      });
    });

    describe('whitespace handling', () => {
      it('should trim whitespace and still match', () => {
        const result = BungieService.parsePlatform('  3  ');
        expect(result).toBeTruthy();
        expect(result!.type).toBe(3);
      });
    });

    describe('returns actual Platform instances from Const', () => {
      it('should return the exact same Platform reference as Const', () => {
        const result = BungieService.parsePlatform('1');
        expect(result).toBe(Const.XBL_PLATFORM);
      });

      it('should return the exact PSN platform reference', () => {
        const result = BungieService.parsePlatform('2');
        expect(result).toBe(Const.PSN_PLATFORM);
      });

      it('should return the exact Steam platform reference', () => {
        const result = BungieService.parsePlatform('3');
        expect(result).toBe(Const.STEAM_PLATFORM);
      });
    });
  });

  describe('getActivityModes', () => {
    let modes: any[];

    beforeEach(() => {
      modes = BungieService.getActivityModes();
    });

    it('should return a non-empty array', () => {
      expect(modes).toBeTruthy();
      expect(modes.length).toBeGreaterThan(0);
    });

    it('should return ActivityMode objects with type, name, and desc properties', () => {
      for (const mode of modes) {
        expect(mode.type).toBeDefined();
        expect(mode.name).toBeDefined();
        expect(mode.desc).toBeDefined();
        expect(typeof mode.type).toBe('number');
        expect(typeof mode.name).toBe('string');
        expect(typeof mode.desc).toBe('string');
      }
    });

    it('should include "All" mode with type 0', () => {
      const allMode = modes.find(m => m.type === 0);
      expect(allMode).toBeTruthy();
      expect(allMode.name).toBe('All');
    });

    it('should include Raid mode with type 4', () => {
      const raidMode = modes.find(m => m.type === 4);
      expect(raidMode).toBeTruthy();
      expect(raidMode.name).toBe('Raid');
    });

    it('should include Dungeon mode with type 82', () => {
      const dungeonMode = modes.find(m => m.type === 82);
      expect(dungeonMode).toBeTruthy();
      expect(dungeonMode.name).toBe('Dungeon');
    });

    it('should include Gambit mode with type 64', () => {
      const gambitMode = modes.find(m => m.type === 64);
      expect(gambitMode).toBeTruthy();
      expect(gambitMode.name).toBe('Gambit');
    });

    it('should include Trials mode with type 84', () => {
      const trialsMode = modes.find(m => m.type === 84);
      expect(trialsMode).toBeTruthy();
      expect(trialsMode.name).toBe('Trials');
    });

    it('should include PvE and PvP modes', () => {
      const pveMode = modes.find(m => m.type === 7);
      const pvpMode = modes.find(m => m.type === 5);
      expect(pveMode).toBeTruthy();
      expect(pveMode.name).toBe('All - PvE');
      expect(pvpMode).toBeTruthy();
      expect(pvpMode.name).toBe('All - PvP');
    });

    it('should return a fresh array each time (not shared reference)', () => {
      const modes2 = BungieService.getActivityModes();
      expect(modes).not.toBe(modes2);
      expect(modes).toEqual(modes2);
    });
  });

  describe('parseBungieResponse', () => {
    let service: any;

    beforeEach(() => {
      // Create a minimal object with just the properties parseBungieResponse needs
      service = {
        apiDown: false,
        parseBungieResponse: BungieService.prototype.parseBungieResponse
      };
    });

    it('should return Response data on success (ErrorCode 1)', () => {
      const response = {
        ErrorCode: 1,
        Response: { characters: ['titan', 'warlock', 'hunter'] }
      };
      const result = service.parseBungieResponse(response);
      expect(result).toEqual({ characters: ['titan', 'warlock', 'hunter'] });
    });

    it('should set apiDown to false on success', () => {
      service.apiDown = true;
      service.parseBungieResponse({ ErrorCode: 1, Response: {} });
      expect(service.apiDown).toBe(false);
    });

    it('should return privacy object for ErrorCode 1665', () => {
      const response = { ErrorCode: 1665, Message: 'Privacy' };
      const result = service.parseBungieResponse(response);
      expect(result).toEqual({ privacy: true });
    });

    it('should set apiDown to true for ErrorCode 5 (system disabled)', () => {
      const response = { ErrorCode: 5, Message: 'System disabled' };
      expect(() => service.parseBungieResponse(response)).toThrow();
      expect(service.apiDown).toBe(true);
    });

    it('should throw with message for non-1 ErrorCode', () => {
      const response = { ErrorCode: 99, Message: 'Something went wrong' };
      expect(() => service.parseBungieResponse(response)).toThrowError('Something went wrong');
    });

    it('should throw for response without ErrorCode', () => {
      expect(() => service.parseBungieResponse({})).toThrowError('Unexpected response from Bungie');
    });

    it('should throw for response with ErrorCode 0', () => {
      // ErrorCode 0 is falsy, so !j.ErrorCode is true
      expect(() => service.parseBungieResponse({ ErrorCode: 0, Response: {} })).toThrowError('Unexpected response from Bungie');
    });

    it('should handle null Response field on success', () => {
      const result = service.parseBungieResponse({ ErrorCode: 1, Response: null });
      expect(result).toBeNull();
    });

    it('should not set apiDown for non-5 error codes', () => {
      service.apiDown = false;
      const response = { ErrorCode: 1665, Message: 'Privacy' };
      service.parseBungieResponse(response);
      expect(service.apiDown).toBe(false);
    });
  });
});
