/**
 * Custom Error Classes
 * Consistent error handling across the portal
 */

export class MercuryAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public mercuryCode?: string
  ) {
    super(message);
    this.name = 'MercuryAPIError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public query?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
  }
}
