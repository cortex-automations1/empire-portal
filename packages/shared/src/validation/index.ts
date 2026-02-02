/**
 * Validation Schemas
 * 
 * Shared Zod schemas for validating API inputs across frontend and backend.
 * Using Zod for type-safe validation with automatic TypeScript type inference.
 */

import { z } from 'zod';

// ============================================================================
// Entity Validation
// ============================================================================

/**
 * Entity ID format: lowercase letters and dashes only
 */
export const EntityIdSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z][a-z0-9-]*$/, 'Entity ID must be lowercase letters, numbers, and dashes only');

/**
 * Entity type
 */
export const EntityTypeSchema = z.enum(['PARENT', 'INVESTMENT', 'OPERATING']);

/**
 * Entity status
 */
export const EntityStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);

// ============================================================================
// Account Validation
// ============================================================================

/**
 * Account number (digits only, 4-17 chars typical for US banks)
 */
export const AccountNumberSchema = z
  .string()
  .regex(/^\d{4,17}$/, 'Account number must be 4-17 digits');

/**
 * Routing number (9 digits for US banks)
 */
export const RoutingNumberSchema = z
  .string()
  .regex(/^\d{9}$/, 'Routing number must be 9 digits');

// ============================================================================
// Money Validation
// ============================================================================

/**
 * Amount in cents (integer, can be negative for debits)
 */
export const CentsSchema = z.number().int().finite();

/**
 * Amount in cents (positive only)
 */
export const PositiveCentsSchema = z.number().int().positive().finite();

/**
 * Percentage (0.0 to 1.0)
 */
export const PercentageSchema = z.number().min(0).max(1);

// ============================================================================
// Date/Time Validation
// ============================================================================

/**
 * ISO 8601 date-time string
 */
export const DateTimeSchema = z.string().datetime();

/**
 * ISO 8601 date string (YYYY-MM-DD)
 */
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Date range (start and end dates)
 */
export const DateRangeSchema = z.object({
  startDate: DateSchema,
  endDate: DateSchema,
}).refine((data) => data.startDate <= data.endDate, {
  message: 'Start date must be before or equal to end date',
});

// ============================================================================
// API Query Validation
// ============================================================================

/**
 * Balance query parameters
 */
export const BalanceQuerySchema = z.object({
  entityId: EntityIdSchema.optional(),
  accountId: z.string().optional(),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  limit: z.number().int().min(1).max(1000).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
});

export type BalanceQuery = z.infer<typeof BalanceQuerySchema>;

/**
 * Transaction query parameters
 */
export const TransactionQuerySchema = z.object({
  entityId: EntityIdSchema.optional(),
  accountId: z.string().optional(),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  minAmount: CentsSchema.optional(),
  maxAmount: CentsSchema.optional(),
  search: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(1000).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
});

export type TransactionQuery = z.infer<typeof TransactionQuerySchema>;

/**
 * Entity filter parameters
 */
export const EntityFilterSchema = z.object({
  type: EntityTypeSchema.optional(),
  status: EntityStatusSchema.optional(),
  search: z.string().max(200).optional(),
});

export type EntityFilter = z.infer<typeof EntityFilterSchema>;

// ============================================================================
// Goal Validation
// ============================================================================

/**
 * Goal creation/update input
 */
export const GoalInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  entityId: EntityIdSchema.optional(),
  targetValue: CentsSchema,
  currentValue: CentsSchema.optional().default(0),
  unit: z.string().max(50).optional().default('USD'),
  startDate: DateSchema,
  endDate: DateSchema,
  phase: z.string().max(100).optional(),
});

export type GoalInput = z.infer<typeof GoalInputSchema>;

// ============================================================================
// Capital Flow Validation
// ============================================================================

/**
 * Capital flow type
 */
export const CapitalFlowTypeSchema = z.enum([
  'PROFIT_DISTRIBUTION',
  'INVESTMENT_RETURN',
  'OWNER_DRAW',
  'TRANSFER',
]);

/**
 * Capital flow input
 */
export const CapitalFlowInputSchema = z.object({
  fromEntityId: EntityIdSchema,
  toEntityId: EntityIdSchema.optional(),
  amount: PositiveCentsSchema,
  type: CapitalFlowTypeSchema,
  description: z.string().max(500).optional(),
  date: DateSchema,
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional().default('PENDING'),
});

export type CapitalFlowInput = z.infer<typeof CapitalFlowInputSchema>;

// ============================================================================
// Alert Validation
// ============================================================================

/**
 * Alert severity
 */
export const AlertSeveritySchema = z.enum(['INFO', 'WARNING', 'CRITICAL']);

/**
 * Alert input
 */
export const AlertInputSchema = z.object({
  entityId: EntityIdSchema.optional(),
  accountId: z.string().optional(),
  title: z.string().min(1).max(200),
  message: z.string().max(1000),
  severity: AlertSeveritySchema,
  actionUrl: z.string().url().optional(),
});

export type AlertInput = z.infer<typeof AlertInputSchema>;

// ============================================================================
// User Validation (Phase 5)
// ============================================================================

/**
 * User role
 */
export const UserRoleSchema = z.enum(['OWNER', 'ADMIN', 'VIEWER', 'AUDITOR']);

/**
 * Email validation
 */
export const EmailSchema = z.string().email().max(255);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate and parse query parameters from URL search params
 * @param schema - Zod schema
 * @param params - URLSearchParams or Record<string, string>
 * @returns Parsed and validated data
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  schema: T,
  params: URLSearchParams | Record<string, string | undefined>
): z.infer<T> {
  const obj: Record<string, unknown> = {};

  if (params instanceof URLSearchParams) {
    params.forEach((value, key) => {
      obj[key] = value;
    });
  } else {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        obj[key] = value;
      }
    });
  }

  // Convert numeric strings to numbers for Zod number schemas
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'string') {
      const num = parseFloat(value);
      if (!isNaN(num) && value === num.toString()) {
        obj[key] = num;
      }
    }
  }

  return schema.parse(obj);
}

/**
 * Safe validation (returns result object instead of throwing)
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Result object { success: boolean, data?: T, error?: ZodError }
 */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

/**
 * Format Zod validation errors for API responses
 * @param error - Zod validation error
 * @returns Formatted error object
 */
export function formatValidationError(error: z.ZodError): {
  message: string;
  fields: Record<string, string>;
} {
  const fields: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    fields[path] = err.message;
  });

  return {
    message: 'Validation failed',
    fields,
  };
}
