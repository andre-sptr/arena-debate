/**
 * useDebateList Hook
 * 
 * Custom hook for fetching and managing a list of debates with pagination support.
 * Handles loading states, error handling, and pagination controls.
 */

import { useState, useEffect, useCallback } from "react";
import { api, formatAPIError } from "@/lib/api";
import { Debate, PaginationParams } from "@/types";

/**
 * Pagination controls interface
 */
interface PaginationControls {
  /** Current page number (0-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Change page size */
  setPageSize: (size: number) => void;
  /** Check if there are more items */
  hasMore: boolean;
}

/**
 * Return type for useDebateList hook
 */
interface UseDebateListReturn {
  /** Array of debate objects */
  debates: Debate[];
  /** Loading state - true while fetching */
  isLoading: boolean;
  /** Error message if request failed */
  error: string | null;
  /** Pagination controls */
  pagination: PaginationControls;
  /** Function to manually refetch debates */
  refetch: () => Promise<void>;
}

/**
 * Options for useDebateList hook
 */
interface UseDebateListOptions {
  /** Initial page size (default: 10) */
  initialPageSize?: number;
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

/**
 * Hook for fetching and managing a list of debates
 * 
 * Features:
 * - Auto-fetches debates on mount
 * - Pagination support with controls
 * - Handles loading and error states
 * - Provides refetch function
 * - Type-safe with TypeScript
 * - SSR-safe (Next.js compatible)
 * 
 * @param options - Configuration options
 * @returns Debates array, loading state, error state, pagination controls, and refetch function
 * 
 * @example
 * ```tsx
 * import { useDebateList } from "@/hooks/useDebateList";
 * 
 * function DebateList() {
 *   const { debates, isLoading, error, pagination, refetch } = useDebateList({
 *     initialPageSize: 20
 *   });
 * 
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 * 
 *   return (
 *     <div>
 *       {debates.map(debate => (
 *         <div key={debate.debate_id}>{debate.topic}</div>
 *       ))}
 *       <button onClick={pagination.prevPage} disabled={pagination.page === 0}>
 *         Previous
 *       </button>
 *       <button onClick={pagination.nextPage} disabled={!pagination.hasMore}>
 *         Next
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDebateList(
  options: UseDebateListOptions = {}
): UseDebateListReturn {
  const { initialPageSize = 10, autoFetch = true } = options;

  const [debates, setDebates] = useState<Debate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [hasMore, setHasMore] = useState<boolean>(true);

  /**
   * Fetches debates from the API
   */
  const fetchDebates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: PaginationParams = {
        skip: page * pageSize,
        limit: pageSize,
      };

      const data = await api.listDebates(params);
      setDebates(data);
      
      // Check if there are more items
      // If we got fewer items than requested, there are no more
      setHasMore(data.length === pageSize);
      
      setError(null);
    } catch (err) {
      const errorMessage = formatAPIError(err);
      setError(errorMessage);
      setDebates([]);
      setHasMore(false);

      // Log error in development
      if (process.env.NODE_ENV === "development") {
        console.error("[useDebateList] Error fetching debates:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  /**
   * Auto-fetch on mount and when pagination changes
   */
  useEffect(() => {
    if (autoFetch) {
      fetchDebates();
    }
  }, [fetchDebates, autoFetch]);

  /**
   * Pagination control functions
   */
  const nextPage = useCallback(() => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(0, prev - 1));
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(0, newPage));
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(0); // Reset to first page when changing page size
  }, []);

  /**
   * Cleanup function
   */
  useEffect(() => {
    return () => {
      // Reset state on unmount
      setDebates([]);
      setIsLoading(false);
      setError(null);
    };
  }, []);

  return {
    debates,
    isLoading,
    error,
    pagination: {
      page,
      pageSize,
      nextPage,
      prevPage,
      goToPage,
      setPageSize: changePageSize,
      hasMore,
    },
    refetch: fetchDebates,
  };
}

/**
 * Simplified hook for fetching all debates without pagination
 * 
 * @returns Debates array, loading state, error state, and refetch function
 * 
 * @example
 * ```tsx
 * function AllDebates() {
 *   const { debates, isLoading, error } = useAllDebates();
 *   
 *   return (
 *     <div>
 *       {debates.map(d => <div key={d.debate_id}>{d.topic}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAllDebates(): {
  debates: Debate[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { debates, isLoading, error, refetch } = useDebateList({
    initialPageSize: 1000, // Large number to get all debates
    autoFetch: true,
  });

  return { debates, isLoading, error, refetch };
}

// Made with Bob