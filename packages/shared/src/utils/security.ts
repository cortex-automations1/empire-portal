/**
 * Security Utilities
 * 
 * Functions for masking sensitive data and sanitizing for logs.
 * Critical for financial application - never expose full account numbers or API keys.
 */

/**
 * Mask account number (show last 4 digits only)
 * @param accountNumber - Full account number
 * @returns Masked account number (e.g., "****1234")
 * 
 * @example
 * maskAccountNumber("1234567890") // "****7890"
 * maskAccountNumber("123")        // "123" (too short to mask)
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length <= 4) {
    return accountNumber;
  }

  const lastFour = accountNumber.slice(-4);
  const maskLength = Math.min(accountNumber.length - 4, 4); // Show max 4 asterisks
  return '*'.repeat(maskLength) + lastFour;
}

/**
 * Mask email address (show first char + domain)
 * @param email - Email address
 * @returns Masked email (e.g., "d***@example.com")
 * 
 * @example
 * maskEmail("david@cortex.ai") // "d***@cortex.ai"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }

  const [local, domain] = email.split('@');
  if (local.length <= 1) {
    return email;
  }

  return `${local[0]}***@${domain}`;
}

/**
 * Sanitize API key for logging (show first 8 chars only)
 * @param apiKey - Full API key or token
 * @returns Sanitized key (e.g., "secret-t...")
 * 
 * @example
 * sanitizeApiKey("secret-token:mercury_production_wma_ABC123")
 * // "secret-t..."
 */
export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey) {
    return '[missing]';
  }

  if (apiKey.length <= 8) {
    return apiKey; // Too short to sanitize
  }

  return apiKey.slice(0, 8) + '...';
}

/**
 * Sanitize object for logging (mask sensitive fields)
 * @param obj - Object that may contain sensitive data
 * @param sensitiveFields - Field names to mask (default: common sensitive fields)
 * @returns Sanitized object safe for logging
 * 
 * @example
 * sanitizeForLog({ apiKey: "secret123", balance: 50000 })
 * // { apiKey: "secret12...", balance: 50000 }
 */
export function sanitizeForLog(
  obj: Record<string, unknown>,
  sensitiveFields: string[] = [
    'apiKey',
    'api_key',
    'token',
    'password',
    'secret',
    'authorization',
    'accountNumber',
    'routingNumber',
  ]
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()));

    if (isSensitive && typeof value === 'string') {
      sanitized[key] = sanitizeApiKey(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeForLog(value as Record<string, unknown>, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Redact sensitive information from error messages
 * @param message - Error message that may contain sensitive data
 * @returns Redacted message
 * 
 * @example
 * redactErrorMessage("Invalid API key: secret-token:abc123")
 * // "Invalid API key: [REDACTED]"
 */
export function redactErrorMessage(message: string): string {
  // Redact anything that looks like an API key or token
  return message
    .replace(/secret-token:[a-zA-Z0-9_-]+/g, '[REDACTED_TOKEN]')
    .replace(/Bearer [a-zA-Z0-9_-]+/g, 'Bearer [REDACTED]')
    .replace(/api[_-]?key[:\s=]+[a-zA-Z0-9_-]+/gi, 'api_key: [REDACTED]')
    .replace(/password[:\s=]+[^\s]+/gi, 'password: [REDACTED]');
}

/**
 * Check if a value looks like sensitive data (heuristic)
 * @param value - String value to check
 * @returns True if value appears to be sensitive
 */
export function isSensitiveValue(value: string): boolean {
  if (!value || value.length < 10) {
    return false;
  }

  // Check for common patterns
  const patterns = [
    /^secret-token:/i,
    /^Bearer /i,
    /^sk_[a-z]+_/i, // Stripe-style keys
    /^pk_[a-z]+_/i,
    /^[A-Za-z0-9+/]{30,}[=]{0,2}$/, // Base64-encoded (likely token), padding optional
  ];

  return patterns.some((pattern) => pattern.test(value));
}

/**
 * Hash a value for comparison (not cryptographically secure - for cache keys, etc.)
 * @param value - Value to hash
 * @returns Simple hash string
 */
export function simpleHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
