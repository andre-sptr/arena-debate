/**
 * Zustand Store for Global Debate State Management
 * 
 * Provides centralized state management for debates with actions to:
 * - Store current debate data
 * - Manage debate list
 * - Track loading states
 * - Handle errors
 * - Persist to localStorage (optional)
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Debate, Argument, DebateStatus } from "@/types";

/**
 * Debate store state interface
 */
interface DebateStore {
  // State
  currentDebate: Debate | null;
  debates: Debate[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setDebate: (debate: Debate) => void;
  addArgument: (argument: Argument) => void;
  updateStatus: (status: DebateStatus) => void;
  clearDebate: () => void;
  setDebates: (debates: Debate[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/**
 * Zustand store for debate state management
 * 
 * Features:
 * - Global state for current debate and debate list
 * - Loading and error state management
 * - Actions for updating debate data
 * - Optional localStorage persistence
 * - TypeScript type safety
 * 
 * @example
 * ```tsx
 * import { useDebateStore } from "@/hooks/useDebateStore";
 * 
 * function DebateComponent() {
 *   const { currentDebate, setDebate, isLoading } = useDebateStore();
 *   
 *   return (
 *     <div>
 *       {isLoading ? "Loading..." : currentDebate?.topic}
 *     </div>
 *   );
 * }
 * ```
 */
export const useDebateStore = create<DebateStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentDebate: null,
      debates: [],
      isLoading: false,
      error: null,

      /**
       * Sets the current debate
       * 
       * @param debate - Complete debate object
       */
      setDebate: (debate: Debate) => {
        set({ currentDebate: debate, error: null });
      },

      /**
       * Adds a new argument to the current debate
       * 
       * @param argument - Argument to add
       */
      addArgument: (argument: Argument) => {
        const { currentDebate } = get();
        if (!currentDebate) return;

        const updatedDebate: Debate = {
          ...currentDebate,
          arguments: [...currentDebate.arguments, argument],
          total_arguments: currentDebate.total_arguments + 1,
        };

        set({ currentDebate: updatedDebate });
      },

      /**
       * Updates the status of the current debate
       * 
       * @param status - New debate status
       */
      updateStatus: (status: DebateStatus) => {
        const { currentDebate } = get();
        if (!currentDebate) return;

        const updatedDebate: Debate = {
          ...currentDebate,
          status,
          completed_at:
            status === DebateStatus.COMPLETED
              ? new Date().toISOString()
              : currentDebate.completed_at,
        };

        set({ currentDebate: updatedDebate });
      },

      /**
       * Clears the current debate
       */
      clearDebate: () => {
        set({ currentDebate: null, error: null });
      },

      /**
       * Sets the list of debates
       * 
       * @param debates - Array of debate objects
       */
      setDebates: (debates: Debate[]) => {
        set({ debates, error: null });
      },

      /**
       * Sets the loading state
       * 
       * @param isLoading - Loading state
       */
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      /**
       * Sets an error message
       * 
       * @param error - Error message or null to clear
       */
      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },

      /**
       * Clears the error state
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "debate-storage", // localStorage key
      storage: createJSONStorage(() => {
        // SSR-safe localStorage check
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      // Only persist debates list, not loading/error states
      partialize: (state) => ({
        debates: state.debates,
        currentDebate: state.currentDebate,
      }),
    }
  )
);

/**
 * Selector hooks for optimized re-renders
 */

/**
 * Hook to get only the current debate
 */
export const useCurrentDebate = () =>
  useDebateStore((state) => state.currentDebate);

/**
 * Hook to get only the debates list
 */
export const useDebates = () => useDebateStore((state) => state.debates);

/**
 * Hook to get only the loading state
 */
export const useDebateLoading = () =>
  useDebateStore((state) => state.isLoading);

/**
 * Hook to get only the error state
 */
export const useDebateError = () => useDebateStore((state) => state.error);

// Made with Bob