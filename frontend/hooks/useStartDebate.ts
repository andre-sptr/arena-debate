/**
 * useStartDebate Hook
 * 
 * Custom hook for starting a new debate session.
 * Handles form submission, loading states, and error handling.
 */

import { useState, useCallback } from "react";
import { api, formatAPIError } from "@/lib/api";
import { Debate, StartDebateRequest } from "@/types";

/**
 * Return type for useStartDebate hook
 */
interface UseStartDebateReturn {
  /** Function to start a new debate */
  startDebate: (topic: string) => Promise<Debate | null>;
  /** Loading state - true while starting debate */
  isLoading: boolean;
  /** Error message if request failed */
  error: string | null;
  /** The created debate result */
  debate: Debate | null;
  /** Reset the hook state */
  reset: () => void;
}

/**
 * Hook for starting a new debate
 * 
 * Features:
 * - Handles debate creation via API
 * - Manages loading and error states
 * - Returns created debate data
 * - Provides reset function to clear state
 * - Type-safe with TypeScript
 * - Proper error handling
 * 
 * @returns startDebate function, loading state, error state, debate result, and reset function
 * 
 * @example
 * ```tsx
 * import { useStartDebate } from "@/hooks/useStartDebate";
 * 
 * function StartDebateForm() {
 *   const { startDebate, isLoading, error, debate, reset } = useStartDebate();
 *   const [topic, setTopic] = useState("");
 * 
 *   const handleSubmit = async (e: React.FormEvent) => {
 *     e.preventDefault();
 *     const result = await startDebate(topic);
 *     if (result) {
 *       console.log("Debate started:", result.debate_id);
 *       // Navigate to debate page or show success
 *     }
 *   };
 * 
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         value={topic}
 *         onChange={(e) => setTopic(e.target.value)}
 *         disabled={isLoading}
 *       />
 *       <button type="submit" disabled={isLoading || !topic}>
 *         {isLoading ? "Starting..." : "Start Debate"}
 *       </button>
 *       {error && <div className="error">{error}</div>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useStartDebate(): UseStartDebateReturn {
  const [debate, setDebate] = useState<Debate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Starts a new debate with the given topic
   * 
   * @param topic - The debate topic
   * @returns The created debate or null if failed
   */
  const startDebate = useCallback(async (topic: string): Promise<Debate | null> => {
    // Validate topic
    if (!topic || topic.trim().length === 0) {
      setError("Topic cannot be empty");
      return null;
    }

    setIsLoading(true);
    setError(null);
    setDebate(null);

    try {
      const data = await api.startDebate(topic.trim());
      setDebate(data);
      setError(null);

      // Log success in development
      if (process.env.NODE_ENV === "development") {
        console.log("[useStartDebate] Debate started:", data.debate_id);
      }

      return data;
    } catch (err) {
      const errorMessage = formatAPIError(err);
      setError(errorMessage);
      setDebate(null);

      // Log error in development
      if (process.env.NODE_ENV === "development") {
        console.error("[useStartDebate] Error starting debate:", err);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Resets the hook state
   */
  const reset = useCallback(() => {
    setDebate(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    startDebate,
    isLoading,
    error,
    debate,
    reset,
  };
}

/**
 * Hook variant with automatic state reset after success
 * Useful for forms that should clear after submission
 * 
 * @param resetDelay - Delay in ms before resetting (default: 2000)
 * @returns startDebate function, loading state, error state, and debate result
 * 
 * @example
 * ```tsx
 * function QuickStartForm() {
 *   const { startDebate, isLoading, error } = useStartDebateWithReset(3000);
 *   
 *   const handleSubmit = async (topic: string) => {
 *     const debate = await startDebate(topic);
 *     if (debate) {
 *       // State will auto-reset after 3 seconds
 *       router.push(`/debate/${debate.debate_id}`);
 *     }
 *   };
 *   
 *   return <form>...</form>;
 * }
 * ```
 */
export function useStartDebateWithReset(resetDelay: number = 2000): {
  startDebate: (topic: string) => Promise<Debate | null>;
  isLoading: boolean;
  error: string | null;
  debate: Debate | null;
} {
  const { startDebate: originalStartDebate, isLoading, error, debate, reset } = useStartDebate();

  const startDebateWithReset = useCallback(
    async (topic: string): Promise<Debate | null> => {
      const result = await originalStartDebate(topic);
      
      if (result) {
        // Reset state after delay
        setTimeout(() => {
          reset();
        }, resetDelay);
      }
      
      return result;
    },
    [originalStartDebate, reset, resetDelay]
  );

  return {
    startDebate: startDebateWithReset,
    isLoading,
    error,
    debate,
  };
}

/**
 * Hook variant that integrates with Zustand store
 * Automatically updates the global debate store on success
 * 
 * @returns startDebate function, loading state, and error state
 * 
 * @example
 * ```tsx
 * import { useStartDebateWithStore } from "@/hooks/useStartDebate";
 * 
 * function StartDebateButton() {
 *   const { startDebate, isLoading, error } = useStartDebateWithStore();
 *   
 *   const handleClick = async () => {
 *     const debate = await startDebate("AI Ethics");
 *     if (debate) {
 *       // Debate is automatically added to global store
 *       console.log("Debate in store!");
 *     }
 *   };
 *   
 *   return <button onClick={handleClick}>Start</button>;
 * }
 * ```
 */
export function useStartDebateWithStore(): {
  startDebate: (topic: string) => Promise<Debate | null>;
  isLoading: boolean;
  error: string | null;
} {
  const { startDebate: originalStartDebate, isLoading, error } = useStartDebate();

  const startDebateWithStore = useCallback(
    async (topic: string): Promise<Debate | null> => {
      const result = await originalStartDebate(topic);
      
      if (result) {
        // Import store dynamically to avoid circular dependencies
        const { useDebateStore } = await import("./useDebateStore");
        const { setDebate } = useDebateStore.getState();
        setDebate(result);
      }
      
      return result;
    },
    [originalStartDebate]
  );

  return {
    startDebate: startDebateWithStore,
    isLoading,
    error,
  };
}

// Made with Bob