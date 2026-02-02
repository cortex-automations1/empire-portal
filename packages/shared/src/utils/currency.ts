/**
 * Currency Utilities
 * 
 * All money values in Empire Portal are stored as CENTS (integers) for precision.
 * This matches Mercury Bank API format and prevents floating-point errors.
 * 
 * Example: $1,234.56 is stored as 123456 cents
 */

/**
 * Format cents as currency string
 * @param cents - Amount in cents (integer)
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "$1,234.56")
 * 
 * @example
 * formatCurrency(123456) // "$1,234.56"
 * formatCurrency(50000)  // "$500.00"
 * formatCurrency(-2500)  // "-$25.00"
 */
export function formatCurrency(
  cents: number,
  options: {
    currency?: string;
    locale?: string;
    showSign?: boolean;
  } = {}
): string {
  const {
    currency = 'USD',
    locale = 'en-US',
    showSign = false,
  } = options;

  const dollars = cents / 100;

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);

  if (showSign && cents > 0) {
    return `+${formatted}`;
  }

  return formatted;
}

/**
 * Format cents as compact currency (K, M, B suffixes)
 * @param cents - Amount in cents
 * @returns Compact string (e.g., "$1.2K", "$5.3M")
 * 
 * @example
 * formatCompactCurrency(123456)     // "$1.2K"
 * formatCompactCurrency(5432100)    // "$54.3K"
 * formatCompactCurrency(123456789)  // "$1.2M"
 */
export function formatCompactCurrency(cents: number): string {
  const dollars = cents / 100;

  if (Math.abs(dollars) < 1000) {
    return formatCurrency(cents);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(dollars);
}

/**
 * Format percentage with sign
 * @param value - Decimal percentage (0.15 = 15%)
 * @param decimals - Decimal places (default: 2)
 * @returns Formatted percentage (e.g., "+15.00%", "-5.25%")
 * 
 * @example
 * formatPercentage(0.15)   // "+15.00%"
 * formatPercentage(-0.05)  // "-5.00%"
 * formatPercentage(0.1567, 1) // "+15.7%"
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  const percent = value * 100;
  const sign = percent > 0 ? '+' : percent === 0 ? '' : '';
  return `${sign}${percent.toFixed(decimals)}%`;
}

/**
 * Parse currency string to cents
 * @param value - Currency string (e.g., "$1,234.56", "1234.56")
 * @returns Amount in cents (integer)
 * 
 * @example
 * parseCurrency("$1,234.56") // 123456
 * parseCurrency("500")       // 50000
 * parseCurrency("-$25.00")   // -2500
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const dollars = parseFloat(cleaned) || 0;
  return Math.round(dollars * 100);
}

/**
 * Calculate percentage change between two amounts
 * @param current - Current amount in cents
 * @param previous - Previous amount in cents
 * @returns Decimal percentage change (0.15 = 15% increase)
 * 
 * @example
 * calculatePercentageChange(120000, 100000) // 0.20 (20% increase)
 * calculatePercentageChange(80000, 100000)  // -0.20 (20% decrease)
 * calculatePercentageChange(100000, 0)      // 1.00 (100% from zero)
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 1 : 0;
  return (current - previous) / Math.abs(previous);
}

/**
 * Convert dollars to cents
 * @param dollars - Amount in dollars (can be decimal)
 * @returns Amount in cents (integer)
 * 
 * @example
 * dollarsToCents(12.34)  // 1234
 * dollarsToCents(100)    // 10000
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 * @param cents - Amount in cents (integer)
 * @returns Amount in dollars (decimal)
 * 
 * @example
 * centsToDollars(1234)  // 12.34
 * centsToDollars(10000) // 100.00
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Sum array of amounts in cents
 * @param amounts - Array of amounts in cents
 * @returns Total in cents
 * 
 * @example
 * sumCents([10000, 20000, 30000]) // 60000 ($600.00)
 */
export function sumCents(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}

/**
 * Calculate average of amounts in cents
 * @param amounts - Array of amounts in cents
 * @returns Average in cents (rounded)
 * 
 * @example
 * averageCents([10000, 20000, 30000]) // 20000 ($200.00)
 */
export function averageCents(amounts: number[]): number {
  if (amounts.length === 0) return 0;
  return Math.round(sumCents(amounts) / amounts.length);
}

/**
 * Format change indicator with color class
 * @param current - Current amount
 * @param previous - Previous amount
 * @returns Object with formatted value and CSS class
 * 
 * @example
 * formatChange(120000, 100000)
 * // { value: "+$200.00 (20.00%)", class: "text-green-600" }
 */
export function formatChange(
  current: number,
  previous: number
): { value: string; percentage: string; class: string } {
  const change = current - previous;
  const percentChange = calculatePercentageChange(current, previous);

  return {
    value: formatCurrency(change, { showSign: true }),
    percentage: formatPercentage(percentChange),
    class: change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600',
  };
}
