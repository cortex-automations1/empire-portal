/**
 * Shared Constants
 */

export const ENTITY_NAMES = {
  KBG: 'Keystone Business Group',
  KFG: 'Keystone Financial Group',
  MYTE: 'MYTE LLC',
  CORTEX: 'Cortex Automations',
  VIZION: 'Vizion Business Solutions',
  THRYVE: 'Thryve Advisors',
  SUMMIT: 'Summit Eye Care',
} as const;

export const ENTITY_TYPES = {
  PARENT: 'parent',
  INVESTMENT: 'investment',
  OPERATING: 'operating',
} as const;

export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;

export const CAPITAL_FLOW_TYPES = {
  PROFIT_DISTRIBUTION: 'profit_distribution',
  INVESTMENT_RETURN: 'investment_return',
  OWNER_DRAW: 'owner_draw',
} as const;

export const DEFAULT_THRESHOLDS = {
  LOW_BALANCE: 1000,
  GOAL_BEHIND_PERCENT: 10,
} as const;
