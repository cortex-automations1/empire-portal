/**
 * API Types
 * Standard API request/response structures
 */

export type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        message: string;
        code: string;
        details?: unknown;
      };
    };

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: unknown;
}
