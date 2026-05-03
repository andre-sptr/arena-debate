/**
 * useDebate Hook
 * 
 * Custom hook for fetching and managing a single debate by ID.
 * Handles loading states, error handling, and automatic refetching.
 */

import { useState, useEffect, useCallback } from "react";
import { api, isAPIError, formatAPIError } from "@/lib/api";
import { Debate } from "@/types";

/**
 * Return type for useDebate hook
 */
interface UseDebateReturn {
  /** The debate data, null if not loaded or error */
  debate: Debate | null;
  /** Loading state - true while fetching */
  isLoading: boolean;
  /** Error message if request failed */
  error: string | null;
  /** Function to manually refetch the debate */
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing a single debate
 * 
 * Features:
 * - Auto-fetches debate on mount when ID is provided
 * - Handles loading and error states
 * - Provides refetch function for manual updates
 * - Type-safe with TypeScript
 * - SSR-safe (Next.js compatible)
 * 
 * @param debateId - Unique debate identifier (optional)
 * @returns Debate data, loading state, error state, and refetch function
 * 
 * @example
 * ```tsx
 * import { useDebate } from "@/hooks/useDebate";
 * 
 * function DebateView({ id }: { id: string }) {
 *   const { debate, isLoading, error, refetch } = useDebate(id);
 * 
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!debate) return <div>No debate found</div>;
 * 
 *   return (
 *     <div>
 *       <h1>{debate.topic}</h1>
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDebate(debateId?: string): UseDebateReturn {
  const [debate, setDebate] = useState<Debate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the debate from the API
   */
  const fetchDebate = useCallback(async () => {
    // Don't fetch if no ID provided
    if (!debateId) {
      setDebate(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getDebate(debateId);
      setDebate(data);
      setError(null);
    } catch (err) {
      const errorMessage = formatAPIError(err);
      setError(errorMessage);
      setDebate(null);

      // Log error in development
      if (process.env.NODE_ENV === "development") {
        console.error("[useDebate] Error fetching debate:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [debateId]);

  /**
   * Auto-fetch on mount and when debateId changes
   */
  useEffect(() => {
    fetchDebate();
  }, [fetchDebate]);

  /**
   * Cleanup function
   */
  useEffect(() => {
    return () => {
      // Reset state on unmount
      setDebate(null);
      setIsLoading(false);
      setError(null);
    };
  }, []);

  return {
    debate,
    isLoading,
    error,
    refetch: fetchDebate,
  };
}

/**
 * Hook variant that throws errors instead of returning them
 * Useful with React Error Boundaries
 * 
 * @param debateId - Unique debate identifier
 * @returns Debate data and refetch function
 * @throws Error if request fails
 * 
 * @example
 * ```tsx
 * function DebateView({ id }: { id: string }) {
 *   const { debate, refetch } = useDebateOrThrow(id);
 *   
 *   return <div>{debate.topic}</div>;
 * }
 * ```
 */
export function useDebateOrThrow(debateId: string): {
  debate: Debate | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const { debate, isLoading, error, refetch } = useDebate(debateId);

  if (error) {
    throw new Error(error);
  }

  return { debate, isLoading, refetch };
}

// Made with Bob