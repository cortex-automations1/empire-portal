import { describe, it, expect } from 'vitest';
import {
  maskAccountNumber,
  maskEmail,
  sanitizeApiKey,
  sanitizeForLog,
  redactErrorMessage,
  isSensitiveValue,
  simpleHash,
} from './security';

describe('maskAccountNumber', () => {
  it('masks long account numbers', () => {
    expect(maskAccountNumber('1234567890')).toBe('****7890');
    expect(maskAccountNumber('123456789012345')).toBe('****2345');
  });

  it('does not mask short account numbers', () => {
    expect(maskAccountNumber('123')).toBe('123');
    expect(maskAccountNumber('1234')).toBe('1234');
  });

  it('shows max 4 asterisks', () => {
    expect(maskAccountNumber('12345678')).toBe('****5678');
  });

  it('handles empty string', () => {
    expect(maskAccountNumber('')).toBe('');
  });
});

describe('maskEmail', () => {
  it('masks email addresses', () => {
    expect(maskEmail('david@cortex.ai')).toBe('d***@cortex.ai');
    expect(maskEmail('test@example.com')).toBe('t***@example.com');
  });

  it('does not mask very short local parts', () => {
    expect(maskEmail('a@b.com')).toBe('a@b.com');
  });

  it('handles invalid emails', () => {
    expect(maskEmail('notanemail')).toBe('notanemail');
    expect(maskEmail('')).toBe('');
  });
});

describe('sanitizeApiKey', () => {
  it('shows first 8 characters only', () => {
    expect(sanitizeApiKey('secret-token:mercury_production_wma_ABC123')).toBe('secret-t...');
    expect(sanitizeApiKey('1234567890abcdef')).toBe('12345678...');
  });

  it('does not sanitize short keys', () => {
    expect(sanitizeApiKey('short')).toBe('short');
  });

  it('handles missing key', () => {
    expect(sanitizeApiKey('')).toBe('[missing]');
  });
});

describe('sanitizeForLog', () => {
  it('sanitizes sensitive fields', () => {
    const obj = {
      apiKey: 'secret-token:abc123',
      balance: 50000,
      accountNumber: '1234567890',
    };

    const result = sanitizeForLog(obj);

    expect(result.apiKey).toBe('secret-t...');
    expect(result.balance).toBe(50000);
    expect(result.accountNumber).toBe('12345678...');
  });

  it('sanitizes nested objects', () => {
    const obj = {
      config: {
        apiKey: 'secret123',
        timeout: 30000,
      },
    };

    const result = sanitizeForLog(obj);

    expect((result.config as Record<string, unknown>).apiKey).toBe('secret12...');
    expect((result.config as Record<string, unknown>).timeout).toBe(30000);
  });

  it('handles custom sensitive fields', () => {
    const obj = {
      customSecret: 'sensitive-data-123',
      normalField: 'value',
    };

    const result = sanitizeForLog(obj, ['customSecret']);

    expect(result.customSecret).toBe('sensitiv...');
    expect(result.normalField).toBe('value');
  });

  it('preserves non-sensitive fields', () => {
    const obj = {
      userId: '123',
      action: 'balance.view',
      timestamp: 1234567890,
    };

    const result = sanitizeForLog(obj);

    expect(result).toEqual(obj);
  });
});

describe('redactErrorMessage', () => {
  it('redacts API tokens', () => {
    const message = 'Invalid API key: secret-token:mercury_production_wma_ABC123';
    expect(redactErrorMessage(message)).toBe('Invalid API key: [REDACTED_TOKEN]');
  });

  it('redacts Bearer tokens', () => {
    const message = 'Authorization failed: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    expect(redactErrorMessage(message)).toBe('Authorization failed: Bearer [REDACTED]');
  });

  it('redacts API keys', () => {
    const message = 'Error: api_key=abc123def456';
    expect(redactErrorMessage(message)).toBe('Error: api_key: [REDACTED]');
  });

  it('redacts passwords', () => {
    const message = 'Login failed: password: mypassword123';
    expect(redactErrorMessage(message)).toBe('Login failed: password: [REDACTED]');
  });

  it('preserves non-sensitive parts', () => {
    const message = 'Connection timeout after 30000ms';
    expect(redactErrorMessage(message)).toBe('Connection timeout after 30000ms');
  });
});

describe('isSensitiveValue', () => {
  it('detects secret tokens', () => {
    expect(isSensitiveValue('secret-token:mercury_abc123')).toBe(true);
  });

  it('detects Bearer tokens', () => {
    expect(isSensitiveValue('Bearer abc123def456')).toBe(true);
  });

  it('detects Stripe-style keys', () => {
    expect(isSensitiveValue('sk_test_abc123')).toBe(true);
    expect(isSensitiveValue('pk_live_def456')).toBe(true);
  });

  it('detects Base64 tokens', () => {
    expect(isSensitiveValue('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).toBe(true);
  });

  it('does not flag normal strings', () => {
    expect(isSensitiveValue('normal-string')).toBe(false);
    expect(isSensitiveValue('short')).toBe(false);
  });
});

describe('simpleHash', () => {
  it('generates consistent hashes', () => {
    const hash1 = simpleHash('test-string');
    const hash2 = simpleHash('test-string');
    expect(hash1).toBe(hash2);
  });

  it('generates different hashes for different inputs', () => {
    const hash1 = simpleHash('string1');
    const hash2 = simpleHash('string2');
    expect(hash1).not.toBe(hash2);
  });

  it('returns alphanumeric hash', () => {
    const hash = simpleHash('any-string');
    expect(hash).toMatch(/^[a-z0-9]+$/);
  });
});
