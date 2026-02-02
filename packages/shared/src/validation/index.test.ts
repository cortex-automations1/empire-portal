import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  EntityIdSchema,
  AccountNumberSchema,
  RoutingNumberSchema,
  CentsSchema,
  PositiveCentsSchema,
  PercentageSchema,
  DateSchema,
  DateRangeSchema,
  BalanceQuerySchema,
  TransactionQuerySchema,
  GoalInputSchema,
  CapitalFlowInputSchema,
  AlertInputSchema,
  validateQueryParams,
  safeValidate,
  formatValidationError,
} from './index';

describe('EntityIdSchema', () => {
  it('validates correct entity IDs', () => {
    expect(() => EntityIdSchema.parse('myte')).not.toThrow();
    expect(() => EntityIdSchema.parse('cortex-automations')).not.toThrow();
    expect(() => EntityIdSchema.parse('kbg')).not.toThrow();
  });

  it('rejects invalid entity IDs', () => {
    expect(() => EntityIdSchema.parse('UPPERCASE')).toThrow();
    expect(() => EntityIdSchema.parse('has space')).toThrow();
    expect(() => EntityIdSchema.parse('has_underscore')).toThrow();
    expect(() => EntityIdSchema.parse('')).toThrow();
  });
});

describe('AccountNumberSchema', () => {
  it('validates correct account numbers', () => {
    expect(() => AccountNumberSchema.parse('1234567890')).not.toThrow();
    expect(() => AccountNumberSchema.parse('123456789012345')).not.toThrow();
  });

  it('rejects invalid account numbers', () => {
    expect(() => AccountNumberSchema.parse('123')).toThrow(); // Too short
    expect(() => AccountNumberSchema.parse('123456789012345678')).toThrow(); // Too long
    expect(() => AccountNumberSchema.parse('abcd1234')).toThrow(); // Contains letters
  });
});

describe('RoutingNumberSchema', () => {
  it('validates correct routing numbers', () => {
    expect(() => RoutingNumberSchema.parse('123456789')).not.toThrow();
  });

  it('rejects invalid routing numbers', () => {
    expect(() => RoutingNumberSchema.parse('12345678')).toThrow(); // Too short
    expect(() => RoutingNumberSchema.parse('1234567890')).toThrow(); // Too long
    expect(() => RoutingNumberSchema.parse('12345678a')).toThrow(); // Contains letter
  });
});

describe('CentsSchema', () => {
  it('validates integer cents', () => {
    expect(() => CentsSchema.parse(12345)).not.toThrow();
    expect(() => CentsSchema.parse(-500)).not.toThrow();
    expect(() => CentsSchema.parse(0)).not.toThrow();
  });

  it('rejects non-integer or infinite values', () => {
    expect(() => CentsSchema.parse(123.45)).toThrow();
    expect(() => CentsSchema.parse(Infinity)).toThrow();
    expect(() => CentsSchema.parse(NaN)).toThrow();
  });
});

describe('PositiveCentsSchema', () => {
  it('validates positive cents', () => {
    expect(() => PositiveCentsSchema.parse(12345)).not.toThrow();
    expect(() => PositiveCentsSchema.parse(1)).not.toThrow();
  });

  it('rejects zero or negative', () => {
    expect(() => PositiveCentsSchema.parse(0)).toThrow();
    expect(() => PositiveCentsSchema.parse(-100)).toThrow();
  });
});

describe('PercentageSchema', () => {
  it('validates percentages 0-1', () => {
    expect(() => PercentageSchema.parse(0)).not.toThrow();
    expect(() => PercentageSchema.parse(0.5)).not.toThrow();
    expect(() => PercentageSchema.parse(1)).not.toThrow();
  });

  it('rejects values outside 0-1', () => {
    expect(() => PercentageSchema.parse(-0.1)).toThrow();
    expect(() => PercentageSchema.parse(1.1)).toThrow();
  });
});

describe('DateSchema', () => {
  it('validates YYYY-MM-DD format', () => {
    expect(() => DateSchema.parse('2026-02-02')).not.toThrow();
    expect(() => DateSchema.parse('2025-12-31')).not.toThrow();
  });

  it('rejects invalid formats', () => {
    expect(() => DateSchema.parse('02-02-2026')).toThrow();
    expect(() => DateSchema.parse('2026/02/02')).toThrow();
    expect(() => DateSchema.parse('invalid')).toThrow();
  });
});

describe('DateRangeSchema', () => {
  it('validates valid date ranges', () => {
    expect(() => DateRangeSchema.parse({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    })).not.toThrow();

    expect(() => DateRangeSchema.parse({
      startDate: '2026-02-01',
      endDate: '2026-02-01', // Same day
    })).not.toThrow();
  });

  it('rejects invalid date ranges', () => {
    expect(() => DateRangeSchema.parse({
      startDate: '2026-02-02',
      endDate: '2026-01-01', // End before start
    })).toThrow();
  });
});

describe('BalanceQuerySchema', () => {
  it('validates balance queries', () => {
    const result = BalanceQuerySchema.parse({
      entityId: 'myte',
      limit: 50,
    });

    expect(result.entityId).toBe('myte');
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0); // Default
  });

  it('applies defaults', () => {
    const result = BalanceQuerySchema.parse({});
    expect(result.limit).toBe(100);
    expect(result.offset).toBe(0);
  });

  it('enforces limits', () => {
    expect(() => BalanceQuerySchema.parse({ limit: 0 })).toThrow();
    expect(() => BalanceQuerySchema.parse({ limit: 2000 })).toThrow();
  });
});

describe('TransactionQuerySchema', () => {
  it('validates transaction queries', () => {
    const result = TransactionQuerySchema.parse({
      entityId: 'cortex',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      minAmount: 10000,
      maxAmount: 100000,
      search: 'AWS',
    });

    expect(result.entityId).toBe('cortex');
    expect(result.minAmount).toBe(10000);
    expect(result.search).toBe('AWS');
  });

  it('validates search length', () => {
    expect(() => TransactionQuerySchema.parse({ search: 'a'.repeat(201) })).toThrow();
  });
});

describe('GoalInputSchema', () => {
  it('validates goal input', () => {
    const result = GoalInputSchema.parse({
      name: 'Reach $100K',
      targetValue: 10000000,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    expect(result.name).toBe('Reach $100K');
    expect(result.currentValue).toBe(0); // Default
  });

  it('requires name and dates', () => {
    expect(() => GoalInputSchema.parse({
      targetValue: 10000000,
    })).toThrow();
  });
});

describe('CapitalFlowInputSchema', () => {
  it('validates capital flow input', () => {
    const result = CapitalFlowInputSchema.parse({
      fromEntityId: 'myte',
      toEntityId: 'kfg',
      amount: 50000,
      type: 'PROFIT_DISTRIBUTION',
      date: '2026-02-01',
    });

    expect(result.fromEntityId).toBe('myte');
    expect(result.amount).toBe(50000);
    expect(result.status).toBe('PENDING'); // Default
  });

  it('requires positive amount', () => {
    expect(() => CapitalFlowInputSchema.parse({
      fromEntityId: 'myte',
      amount: -1000,
      type: 'PROFIT_DISTRIBUTION',
      date: '2026-02-01',
    })).toThrow();
  });
});

describe('AlertInputSchema', () => {
  it('validates alert input', () => {
    const result = AlertInputSchema.parse({
      title: 'Low Balance',
      message: 'MYTE checking account below $1K',
      severity: 'WARNING',
    });

    expect(result.title).toBe('Low Balance');
    expect(result.severity).toBe('WARNING');
  });

  it('validates optional URL', () => {
    const result = AlertInputSchema.parse({
      title: 'Test',
      message: 'Message',
      severity: 'INFO',
      actionUrl: 'https://portal.keystonebg.us/businesses/myte',
    });

    expect(result.actionUrl).toBe('https://portal.keystonebg.us/businesses/myte');
  });

  it('rejects invalid URL', () => {
    expect(() => AlertInputSchema.parse({
      title: 'Test',
      message: 'Message',
      severity: 'INFO',
      actionUrl: 'not-a-url',
    })).toThrow();
  });
});

describe('validateQueryParams', () => {
  it('validates from URLSearchParams', () => {
    const params = new URLSearchParams('entityId=myte&limit=50');
    const result = validateQueryParams(BalanceQuerySchema, params);

    expect(result.entityId).toBe('myte');
    expect(result.limit).toBe(50);
  });

  it('validates from object', () => {
    const params = { entityId: 'cortex', limit: '100' };
    const result = validateQueryParams(BalanceQuerySchema, params);

    expect(result.entityId).toBe('cortex');
    expect(result.limit).toBe(100); // Converted to number
  });

  it('converts numeric strings', () => {
    const params = { limit: '75', offset: '10' };
    const result = validateQueryParams(BalanceQuerySchema, params);

    expect(result.limit).toBe(75);
    expect(result.offset).toBe(10);
  });
});

describe('safeValidate', () => {
  it('returns success for valid data', () => {
    const result = safeValidate(EntityIdSchema, 'myte');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('myte');
    }
  });

  it('returns error for invalid data', () => {
    const result = safeValidate(EntityIdSchema, 'INVALID');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});

describe('formatValidationError', () => {
  it('formats Zod errors', () => {
    try {
      BalanceQuerySchema.parse({ limit: -1 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formatted = formatValidationError(error);

        expect(formatted.message).toBe('Validation failed');
        expect(formatted.fields).toHaveProperty('limit');
      }
    }
  });

  it('includes field paths', () => {
    try {
      GoalInputSchema.parse({ name: '', targetValue: 100 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formatted = formatValidationError(error);

        expect(formatted.fields).toHaveProperty('name');
        expect(formatted.fields).toHaveProperty('startDate');
      }
    }
  });
});
