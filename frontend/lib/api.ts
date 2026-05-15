/**
 * API Client Library for Debate AI Arena
 * 
 * Type-safe HTTP client for communicating with the backend API.
 * Provides methods for all debate-related endpoints with proper error handling.
 */

import {
  Debate,
  HistoryItem,
  DebateStats,
  StartDebateRequest,
  StartDebateResponse,
  GetDebateResponse,
  ListDebatesResponse,
  GetHistoryResponse,
  DeleteDebateResponse,
  GetStatsResponse,
  APIError,
  PaginationParams,
  DebateStreamEvent,
} from "@/types";
import { parseSSEBuffer } from "@/lib/sse";

/**
 * API Configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH || "";
const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Custom error class for API errors
 */
export class APIClientError extends Error {
  status: number;
  detail: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "APIClientError";
    this.status = status;
    this.detail = detail || message;
  }
}

/**
 * Request configuration options
 */
interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

interface StartDebateStreamOptions {
  debateId?: string;
  signal?: AbortSignal;
}

/**
 * API Client class with methods for all backend endpoints
 */
class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Builds the full URL with query parameters
   * 
   * @param endpoint - API endpoint path
   * @param params - Query parameters
   * @returns Full URL string
   */
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${API_BASE_PATH}${endpoint}`, this.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Makes an HTTP request with error handling
   * 
   * @param endpoint - API endpoint path
   * @param config - Request configuration
   * @returns Parsed response data
   * @throws APIClientError on request failure
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { params, ...fetchConfig } = config;
    const url = this.buildURL(endpoint, params);

    // Default headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...fetchConfig.headers,
    };

    // Log request in development mode
    if (IS_DEV) {
      console.log(`[API] ${fetchConfig.method || "GET"} ${url}`);
      if (fetchConfig.body) {
        console.log("[API] Request body:", fetchConfig.body);
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers,
      });

      // Parse response body
      let data: any;
      const contentType = response.headers.get("content-type");
      
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Log response in development mode
      if (IS_DEV) {
        console.log(`[API] Response ${response.status}:`, data);
      }

      // Handle error responses
      if (!response.ok) {
        const errorDetail = typeof data === "object" ? data.detail : data;
        throw new APIClientError(
          `API request failed: ${response.statusText}`,
          response.status,
          errorDetail
        );
      }

      return data as T;
    } catch (error) {
      // Re-throw APIClientError
      if (error instanceof APIClientError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new APIClientError(
          "Network error: Unable to reach the server",
          0,
          error.message
        );
      }

      // Handle other errors
      throw new APIClientError(
        "An unexpected error occurred",
        500,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Starts a new debate session
   * 
   * @param topic - The debate topic
   * @returns Complete debate data with arguments and consensus
   * @throws APIClientError on request failure
   * 
   * @example
   * ```ts
   * const debate = await api.startDebate("Should AI replace human jobs?");
   * console.log(debate.debate_id, debate.arguments);
   * ```
   */
  async startDebate(topic: string): Promise<StartDebateResponse> {
    const request: StartDebateRequest = { topic };
    
    return this.request<StartDebateResponse>("/debate/start", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async startDebateStream(
    topic: string,
    onEvent: (event: DebateStreamEvent) => void,
    options: StartDebateStreamOptions = {}
  ): Promise<void> {
    const request: StartDebateRequest = {
      topic,
      debate_id: options.debateId,
    };
    const url = this.buildURL("/debate/start/stream");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Accept": "text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: options.signal,
      });

      if (!response.ok) {
        let detail = response.statusText;
        try {
          const data = await response.json();
          detail = typeof data === "object" && data?.detail ? data.detail : detail;
        } catch {
          detail = await response.text();
        }

        throw new APIClientError(
          `API request failed: ${response.statusText}`,
          response.status,
          detail
        );
      }

      if (!response.body) {
        throw new APIClientError(
          "Streaming is not supported by this browser",
          0
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSSEBuffer(buffer);
        buffer = parsed.remainder;
        parsed.events.forEach(onEvent);
      }

      buffer += decoder.decode();
      if (buffer.trim()) {
        const parsed = parseSSEBuffer(`${buffer}\n\n`);
        parsed.events.forEach(onEvent);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      if (error instanceof APIClientError) {
        throw error;
      }

      if (error instanceof TypeError) {
        throw new APIClientError(
          "Network error: Unable to reach the server",
          0,
          error.message
        );
      }

      throw new APIClientError(
        "An unexpected error occurred",
        500,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Gets a debate by ID
   * 
   * @param id - Unique debate identifier
   * @returns Complete debate data
   * @throws APIClientError if debate not found or request fails
   * 
   * @example
   * ```ts
   * const debate = await api.getDebate("abc-123");
   * console.log(debate.topic, debate.status);
   * ```
   */
  async getDebate(id: string): Promise<GetDebateResponse> {
    return this.request<GetDebateResponse>(`/debate/${id}`);
  }

  /**
   * Lists all debates with pagination
   * 
   * @param params - Pagination parameters (skip, limit)
   * @returns Array of debate objects
   * @throws APIClientError on request failure
   * 
   * @example
   * ```ts
   * const debates = await api.listDebates({ skip: 0, limit: 20 });
   * debates.forEach(d => console.log(d.topic));
   * ```
   */
  async listDebates(params?: PaginationParams): Promise<ListDebatesResponse> {
    return this.request<ListDebatesResponse>("/debate", {
      params: params as Record<string, any>,
    });
  }

  /**
   * Gets debate history with pagination
   * 
   * @param params - Pagination parameters (skip, limit)
   * @returns Array of simplified debate history items
   * @throws APIClientError on request failure
   * 
   * @example
   * ```ts
   * const history = await api.getHistory({ skip: 0, limit: 10 });
   * history.forEach(h => console.log(h.topic, h.created_at));
   * ```
   */
  async getHistory(params?: PaginationParams): Promise<GetHistoryResponse> {
    return this.request<GetHistoryResponse>("/history", {
      params: params as Record<string, any>,
    });
  }

  /**
   * Deletes a debate and all its arguments
   * 
   * @param id - Unique debate identifier
   * @returns Success message with deleted debate ID
   * @throws APIClientError if debate not found or request fails
   * 
   * @example
   * ```ts
   * const result = await api.deleteDebate("abc-123");
   * console.log(result.message);
   * ```
   */
  async deleteDebate(id: string): Promise<DeleteDebateResponse> {
    return this.request<DeleteDebateResponse>(`/history/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Gets statistics about all debates
   * 
   * @returns Comprehensive debate statistics
   * @throws APIClientError on request failure
   * 
   * @example
   * ```ts
   * const stats = await api.getStats();
   * console.log(`Total debates: ${stats.total_debates}`);
   * console.log(`Avg arguments: ${stats.avg_arguments_per_debate}`);
   * ```
   */
  async getStats(): Promise<GetStatsResponse> {
    return this.request<GetStatsResponse>("/history/stats");
  }

  /**
   * Health check endpoint
   * 
   * @returns True if API is reachable
   * 
   * @example
   * ```ts
   * const isHealthy = await api.healthCheck();
   * if (!isHealthy) console.error("API is down");
   * ```
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.baseURL);
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Default API client instance
 * 
 * Use this singleton instance throughout your application.
 * 
 * @example
 * ```ts
 * import { api } from "@/lib/api";
 * 
 * const debate = await api.startDebate("AI Ethics");
 * ```
 */
export const api = new APIClient();

/**
 * Creates a new API client with custom base URL
 * 
 * Useful for testing or connecting to different environments.
 * 
 * @param baseURL - Custom API base URL
 * @returns New API client instance
 * 
 * @example
 * ```ts
 * const testApi = createAPIClient("http://localhost:3000");
 * ```
 */
export function createAPIClient(baseURL: string): APIClient {
  return new APIClient(baseURL);
}

/**
 * Type guard to check if an error is an APIClientError
 * 
 * @param error - Error to check
 * @returns True if error is APIClientError
 * 
 * @example
 * ```ts
 * try {
 *   await api.startDebate("");
 * } catch (error) {
 *   if (isAPIError(error)) {
 *     console.error(`API Error ${error.status}: ${error.detail}`);
 *   }
 * }
 * ```
 */
export function isAPIError(error: unknown): error is APIClientError {
  return error instanceof APIClientError;
}

/**
 * Formats an API error for display
 * 
 * @param error - Error to format
 * @returns User-friendly error message
 * 
 * @example
 * ```ts
 * try {
 *   await api.getDebate("invalid-id");
 * } catch (error) {
 *   toast.error(formatAPIError(error));
 * }
 * ```
 */
export function formatAPIError(error: unknown): string {
  if (isAPIError(error)) {
    if (error.status === 404) {
      return "Resource not found";
    }
    if (error.status === 400) {
      return `Invalid request: ${error.detail}`;
    }
    if (error.status === 500) {
      return "Server error. Please try again later.";
    }
    if (error.status === 0) {
      return "Unable to connect to server. Please check your connection.";
    }
    return error.detail;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "An unexpected error occurred";
}

// Export types for convenience
export type { APIClient };

// Made with Bob
