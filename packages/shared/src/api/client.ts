/**
 * API Client
 * 
 * Typed fetch wrapper for making requests to the Empire Portal API.
 * Provides consistent error handling and automatic type inference.
 */

import type { ApiResponse } from '../types/api';

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * API client error
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Default configuration
 */
const defaultConfig: ApiClientConfig = {
  baseUrl: '/api',
  timeout: 30000, // 30 seconds
};

let globalConfig: ApiClientConfig = { ...defaultConfig };

/**
 * Configure the API client globally
 * @param config - Configuration options
 */
export function configureApiClient(config: Partial<ApiClientConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Make a fetch request with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError('Request timeout', 408, 'TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Make an API request
 */
async function apiRequest<T>(
  method: string,
  path: string,
  options?: {
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    headers?: Record<string, string>;
    config?: Partial<ApiClientConfig>;
  }
): Promise<T> {
  const config = { ...globalConfig, ...options?.config };
  const url = new URL(path, config.baseUrl || window.location.origin);

  // Add query parameters
  if (options?.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
    ...options?.headers,
  };

  // Build request options
  const requestOptions: RequestInit = {
    method,
    headers,
  };

  if (options?.body) {
    requestOptions.body = JSON.stringify(options.body);
  }

  // Make request
  let response: Response;
  try {
    response = await fetchWithTimeout(url.toString(), requestOptions, config.timeout || 30000);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Network error',
      0,
      'NETWORK_ERROR'
    );
  }

  // Parse response
  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch (error) {
    throw new ApiClientError(
      'Invalid JSON response',
      response.status,
      'INVALID_RESPONSE'
    );
  }

  // Handle API errors
  if (!data.success) {
    throw new ApiClientError(
      data.error.message || 'API error',
      response.status,
      data.error.code,
      data.error.details
    );
  }

  return data.data;
}

/**
 * GET request
 * @param path - API endpoint path (relative to baseUrl)
 * @param options - Request options
 * @returns Response data
 * 
 * @example
 * const balances = await apiGet<Balance[]>('/mercury/balances');
 * const entity = await apiGet<Entity>('/entities/myte');
 */
export async function apiGet<T>(
  path: string,
  options?: {
    query?: Record<string, string | number | boolean | undefined>;
    headers?: Record<string, string>;
    config?: Partial<ApiClientConfig>;
  }
): Promise<T> {
  return apiRequest<T>('GET', path, options);
}

/**
 * POST request
 * @param path - API endpoint path
 * @param body - Request body
 * @param options - Request options
 * @returns Response data
 * 
 * @example
 * const result = await apiPost<SyncResult>('/mercury/sync');
 * const goal = await apiPost<Goal>('/goals', { name: '...' });
 */
export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: {
    headers?: Record<string, string>;
    config?: Partial<ApiClientConfig>;
  }
): Promise<T> {
  return apiRequest<T>('POST', path, { ...options, body });
}

/**
 * PUT request
 * @param path - API endpoint path
 * @param body - Request body
 * @param options - Request options
 * @returns Response data
 * 
 * @example
 * const updated = await apiPut<Goal>('/goals/123', { currentValue: 50000 });
 */
export async function apiPut<T>(
  path: string,
  body?: unknown,
  options?: {
    headers?: Record<string, string>;
    config?: Partial<ApiClientConfig>;
  }
): Promise<T> {
  return apiRequest<T>('PUT', path, { ...options, body });
}

/**
 * PATCH request
 * @param path - API endpoint path
 * @param body - Request body (partial update)
 * @param options - Request options
 * @returns Response data
 * 
 * @example
 * const updated = await apiPatch<Entity>('/entities/myte', { status: 'INACTIVE' });
 */
export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: {
    headers?: Record<string, string>;
    config?: Partial<ApiClientConfig>;
  }
): Promise<T> {
  return apiRequest<T>('PATCH', path, { ...options, body });
}

/**
 * DELETE request
 * @param path - API endpoint path
 * @param options - Request options
 * @returns Response data
 * 
 * @example
 * await apiDelete('/goals/123');
 */
export async function apiDelete<T = void>(
  path: string,
  options?: {
    headers?: Record<string, string>;
    config?: Partial<ApiClientConfig>;
  }
): Promise<T> {
  return apiRequest<T>('DELETE', path, options);
}

/**
 * Retry a request with exponential backoff
 * @param fn - Async function to retry
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @param baseDelay - Base delay in ms (default: 1000)
 * @returns Result of the function
 * 
 * @example
 * const data = await retryRequest(() => apiGet<Balance[]>('/mercury/balances'));
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on client errors (4xx)
      if (error instanceof ApiClientError && error.statusCode && error.statusCode < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Batch multiple API requests
 * @param requests - Array of request functions
 * @returns Array of results (in same order)
 * 
 * @example
 * const [balances, transactions] = await batchRequests([
 *   () => apiGet<Balance[]>('/mercury/balances'),
 *   () => apiGet<Transaction[]>('/mercury/transactions'),
 * ]);
 */
export async function batchRequests<T extends unknown[]>(
  requests: { [K in keyof T]: () => Promise<T[K]> }
): Promise<T> {
  return Promise.all(requests.map((fn) => fn())) as Promise<T>;
}
