import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCompactCurrency,
  formatPercentage,
  parseCurrency,
  calculatePercentageChange,
  dollarsToCents,
  centsToDollars,
  sumCents,
  averageCents,
  formatChange,
} from './currency';

describe('formatCurrency', () => {
  it('formats positive amounts correctly', () => {
    expect(formatCurrency(123456)).toBe('$1,234.56');
    expect(formatCurrency(10000)).toBe('$100.00');
    expect(formatCurrency(50)).toBe('$0.50');
  });

  it('formats negative amounts correctly', () => {
    expect(formatCurrency(-123456)).toBe('-$1,234.56');
    expect(formatCurrency(-50)).toBe('-$0.50');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles very large amounts', () => {
    expect(formatCurrency(123456789012)).toBe('$1,234,567,890.12');
  });

  it('shows + sign when showSign is true', () => {
    expect(formatCurrency(123456, { showSign: true })).toBe('+$1,234.56');
    expect(formatCurrency(-123456, { showSign: true })).toBe('-$1,234.56');
    expect(formatCurrency(0, { showSign: true })).toBe('$0.00');
  });
});

describe('formatCompactCurrency', () => {
  it('formats small amounts normally', () => {
    expect(formatCompactCurrency(50000)).toBe('$500.00');
  });

  it('formats thousands with K suffix', () => {
    expect(formatCompactCurrency(123456)).toBe('$1.2K');
    expect(formatCompactCurrency(543210)).toBe('$5.4K');
  });

  it('formats millions with M suffix', () => {
    expect(formatCompactCurrency(123456789)).toBe('$1.2M');
  });

  it('formats billions with B suffix', () => {
    expect(formatCompactCurrency(123456789012)).toBe('$1.2B');
  });
});

describe('formatPercentage', () => {
  it('formats positive percentages with + sign', () => {
    expect(formatPercentage(0.15)).toBe('+15.00%');
    expect(formatPercentage(0.0567)).toBe('+5.67%');
  });

  it('formats negative percentages', () => {
    expect(formatPercentage(-0.05)).toBe('-5.00%');
    expect(formatPercentage(-0.1234)).toBe('-12.34%');
  });

  it('formats zero', () => {
    expect(formatPercentage(0)).toBe('0.00%');
  });

  it('respects decimal places parameter', () => {
    expect(formatPercentage(0.1567, 1)).toBe('+15.7%');
    expect(formatPercentage(0.1567, 3)).toBe('+15.670%');
  });
});

describe('parseCurrency', () => {
  it('parses currency strings to cents', () => {
    expect(parseCurrency('$1,234.56')).toBe(123456);
    expect(parseCurrency('$100.00')).toBe(10000);
    expect(parseCurrency('$0.50')).toBe(50);
  });

  it('parses negative amounts', () => {
    expect(parseCurrency('-$25.00')).toBe(-2500);
  });

  it('parses plain numbers', () => {
    expect(parseCurrency('1234.56')).toBe(123456);
    expect(parseCurrency('500')).toBe(50000);
  });

  it('handles invalid input gracefully', () => {
    expect(parseCurrency('')).toBe(0);
    expect(parseCurrency('invalid')).toBe(0);
  });
});

describe('calculatePercentageChange', () => {
  it('calculates positive percentage change', () => {
    expect(calculatePercentageChange(120000, 100000)).toBe(0.2);
    expect(calculatePercentageChange(150000, 100000)).toBe(0.5);
  });

  it('calculates negative percentage change', () => {
    expect(calculatePercentageChange(80000, 100000)).toBe(-0.2);
    expect(calculatePercentageChange(50000, 100000)).toBe(-0.5);
  });

  it('handles zero previous value', () => {
    expect(calculatePercentageChange(100000, 0)).toBe(1);
    expect(calculatePercentageChange(0, 0)).toBe(0);
  });

  it('handles no change', () => {
    expect(calculatePercentageChange(100000, 100000)).toBe(0);
  });
});

describe('dollarsToCents', () => {
  it('converts dollars to cents', () => {
    expect(dollarsToCents(12.34)).toBe(1234);
    expect(dollarsToCents(100)).toBe(10000);
    expect(dollarsToCents(0.50)).toBe(50);
  });

  it('rounds to nearest cent', () => {
    expect(dollarsToCents(12.345)).toBe(1235);
    expect(dollarsToCents(12.344)).toBe(1234);
  });
});

describe('centsToDollars', () => {
  it('converts cents to dollars', () => {
    expect(centsToDollars(1234)).toBe(12.34);
    expect(centsToDollars(10000)).toBe(100);
    expect(centsToDollars(50)).toBe(0.5);
  });
});

describe('sumCents', () => {
  it('sums array of amounts', () => {
    expect(sumCents([10000, 20000, 30000])).toBe(60000);
    expect(sumCents([50, 100, 150])).toBe(300);
  });

  it('handles empty array', () => {
    expect(sumCents([])).toBe(0);
  });

  it('handles negative amounts', () => {
    expect(sumCents([10000, -5000, 3000])).toBe(8000);
  });
});

describe('averageCents', () => {
  it('calculates average', () => {
    expect(averageCents([10000, 20000, 30000])).toBe(20000);
    expect(averageCents([100, 200, 300])).toBe(200);
  });

  it('handles empty array', () => {
    expect(averageCents([])).toBe(0);
  });

  it('rounds to nearest cent', () => {
    expect(averageCents([10000, 10000, 10001])).toBe(10000);
  });
});

describe('formatChange', () => {
  it('formats positive change', () => {
    const result = formatChange(120000, 100000);
    expect(result.value).toBe('+$200.00');
    expect(result.percentage).toBe('+20.00%');
    expect(result.class).toBe('text-green-600');
  });

  it('formats negative change', () => {
    const result = formatChange(80000, 100000);
    expect(result.value).toBe('-$200.00');
    expect(result.percentage).toBe('-20.00%');
    expect(result.class).toBe('text-red-600');
  });

  it('formats no change', () => {
    const result = formatChange(100000, 100000);
    expect(result.value).toBe('$0.00');
    expect(result.percentage).toBe('0.00%');
    expect(result.class).toBe('text-gray-600');
  });
});
