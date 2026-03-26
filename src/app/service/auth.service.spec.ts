import { AuthService, Token } from './auth.service';

// Access private static methods via bracket notation for testing
const cookToken = (AuthService as any)['cookToken'].bind(AuthService) as (token: Token) => Token;
const isValid = (AuthService as any)['isValid'].bind(AuthService) as (token: Token) => boolean;
const isValidRefresh = (AuthService as any)['isValidRefresh'].bind(AuthService) as (token: Token) => boolean;
const randomString = (AuthService as any)['randomString'].bind(AuthService) as (length: number) => string;
const parseError = (AuthService as any)['parseError'].bind(AuthService) as (err: any) => string;

function makeToken(overrides: Partial<Token> = {}): Token {
  return {
    inception: 0,
    expiration: 0,
    refresh_expiration: 0,
    expires_in: 3600,
    refresh_expires_in: 7776000,
    access_token: 'test-access-token',
    token_type: 'Bearer',
    refresh_token: 'test-refresh-token',
    membership_id: '12345',
    ...overrides
  };
}

describe('AuthService', () => {

  describe('cookToken', () => {
    it('should set inception to approximately now', () => {
      const before = new Date().getTime();
      const token = makeToken({ expires_in: 3600, refresh_expires_in: 7776000 });
      cookToken(token);
      const after = new Date().getTime();

      expect(token.inception).toBeGreaterThanOrEqual(before);
      expect(token.inception).toBeLessThanOrEqual(after);
    });

    it('should compute expiration from expires_in (seconds) converted to ms', () => {
      const token = makeToken({ expires_in: 3600 });
      cookToken(token);

      const expectedExpiration = token.inception + 3600 * 1000;
      expect(token.expiration).toBe(expectedExpiration);
    });

    it('should compute refresh_expiration from refresh_expires_in (seconds) converted to ms', () => {
      const token = makeToken({ refresh_expires_in: 7776000 });
      cookToken(token);

      const expectedRefreshExpiration = token.inception + 7776000 * 1000;
      expect(token.refresh_expiration).toBe(expectedRefreshExpiration);
    });

    it('should return the same token object', () => {
      const token = makeToken();
      const result = cookToken(token);
      expect(result).toBe(token);
    });

    it('should handle small expires_in values', () => {
      const token = makeToken({ expires_in: 1, refresh_expires_in: 1 });
      cookToken(token);

      expect(token.expiration).toBe(token.inception + 1000);
      expect(token.refresh_expiration).toBe(token.inception + 1000);
    });

    it('should handle zero expires_in', () => {
      const token = makeToken({ expires_in: 0, refresh_expires_in: 0 });
      cookToken(token);

      expect(token.expiration).toBe(token.inception);
      expect(token.refresh_expiration).toBe(token.inception);
    });
  });

  describe('isValid', () => {
    it('should return true when expiration is in the future', () => {
      const token = makeToken({ expiration: new Date().getTime() + 60000 });
      expect(isValid(token)).toBe(true);
    });

    it('should return false when expiration is in the past', () => {
      const token = makeToken({ expiration: new Date().getTime() - 60000 });
      expect(isValid(token)).toBe(false);
    });

    it('should return false when expiration is exactly now (or just passed)', () => {
      const token = makeToken({ expiration: new Date().getTime() - 1 });
      expect(isValid(token)).toBe(false);
    });

    it('should return true for a freshly cooked token with non-zero expires_in', () => {
      const token = makeToken({ expires_in: 3600 });
      cookToken(token);
      expect(isValid(token)).toBe(true);
    });

    it('should return false for a cooked token with zero expires_in', () => {
      const token = makeToken({ expires_in: 0 });
      cookToken(token);
      // expiration equals inception which is <= now
      expect(isValid(token)).toBe(false);
    });
  });

  describe('isValidRefresh', () => {
    it('should return true when refresh_expiration is in the future', () => {
      const token = makeToken({ refresh_expiration: new Date().getTime() + 60000 });
      expect(isValidRefresh(token)).toBe(true);
    });

    it('should return false when refresh_expiration is in the past', () => {
      const token = makeToken({ refresh_expiration: new Date().getTime() - 60000 });
      expect(isValidRefresh(token)).toBe(false);
    });

    it('should return false when refresh_expiration is exactly now (or just passed)', () => {
      const token = makeToken({ refresh_expiration: new Date().getTime() - 1 });
      expect(isValidRefresh(token)).toBe(false);
    });

    it('should return true for a freshly cooked token with non-zero refresh_expires_in', () => {
      const token = makeToken({ refresh_expires_in: 7776000 });
      cookToken(token);
      expect(isValidRefresh(token)).toBe(true);
    });

    it('should return false for a cooked token with zero refresh_expires_in', () => {
      const token = makeToken({ refresh_expires_in: 0 });
      cookToken(token);
      expect(isValidRefresh(token)).toBe(false);
    });
  });

  describe('randomString', () => {
    it('should return a string of the requested length', () => {
      expect(randomString(10).length).toBe(10);
    });

    it('should return an empty string for length 0', () => {
      expect(randomString(0)).toBe('');
    });

    it('should return a string of length 1', () => {
      expect(randomString(1).length).toBe(1);
    });

    it('should only contain alphanumeric characters', () => {
      const result = randomString(1000);
      expect(result).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should produce different strings on successive calls (probabilistic)', () => {
      const a = randomString(20);
      const b = randomString(20);
      // Extremely unlikely to be the same with 62^20 possible values
      expect(a).not.toBe(b);
    });

    it('should handle large lengths', () => {
      const result = randomString(500);
      expect(result.length).toBe(500);
      expect(result).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('parseError', () => {
    it('should extract error_description from json() method', () => {
      const err = {
        json: () => ({ error_description: 'Token expired' }),
        status: 401,
        statusText: 'Unauthorized'
      };
      expect(parseError(err)).toBe('Token expired');
    });

    it('should return connection refused message when status is 0', () => {
      const err = { status: 0, statusText: '' };
      expect(parseError(err)).toBe('Connection refused, is your internet connection ok?');
    });

    it('should extract message property when json() is unavailable', () => {
      const err = { message: 'Something went wrong', status: 500 };
      expect(parseError(err)).toBe('Something went wrong');
    });

    it('should use status and statusText when no message', () => {
      const err = { status: 404, statusText: 'Not Found' };
      expect(parseError(err)).toBe('404 Not Found');
    });

    it('should return unexpected problem string for unrecognized error shapes', () => {
      const err = { foo: 'bar' };
      expect(parseError(err)).toBe('Unexpected problem: [object Object]');
    });

    it('should prefer json() error_description over other properties', () => {
      const err = {
        json: () => ({ error_description: 'From JSON' }),
        message: 'From message',
        status: 500,
        statusText: 'Server Error'
      };
      expect(parseError(err)).toBe('From JSON');
    });

    it('should handle json() throwing an exception', () => {
      const err = {
        json: () => { throw new Error('parse failure'); },
        message: 'Fallback message'
      };
      expect(parseError(err)).toBe('Fallback message');
    });

    it('should handle status 0 even when json() throws', () => {
      const err = {
        json: () => { throw new Error('fail'); },
        status: 0
      };
      expect(parseError(err)).toBe('Connection refused, is your internet connection ok?');
    });

    it('should return unexpected problem for a plain string-like error', () => {
      const err = 'some error string';
      expect(parseError(err)).toBe('Unexpected problem: some error string');
    });

    it('should handle Error objects via message property', () => {
      const err = new Error('native error');
      expect(parseError(err)).toBe('native error');
    });

    it('should handle null json() return gracefully', () => {
      const err = {
        json: () => null,
        message: 'Fallback'
      };
      // json() returns null, so jsonMsg is null, falls through to message
      expect(parseError(err)).toBe('Fallback');
    });

    it('should handle json() returning object without error_description', () => {
      const err = {
        json: () => ({ other_field: 'value' }),
        message: 'Fallback message'
      };
      // json().error_description is undefined, which is treated as null
      expect(parseError(err)).toBe('Fallback message');
    });
  });
});
