/**
 * Custom Hooks Index
 * 
 * Central export point for all custom React hooks.
 * Import hooks from this file for cleaner imports.
 */

// Zustand Store
export {
  useDebateStore,
  useCurrentDebate,
  useDebates,
  useDebateLoading,
  useDebateError,
} from "./useDebateStore";

// Debate Hooks
export { useDebate, useDebateOrThrow } from "./useDebate";
export { useDebateList, useAllDebates } from "./useDebateList";
export {
  useStartDebate,
  useStartDebateWithReset,
  useStartDebateWithStore,
} from "./useStartDebate";
export { useStreamDebate } from "./useStreamDebate";

// Utility Hooks
export {
  useLocalStorage,
  useLocalStorageObject,
  useLocalStorageBoolean,
  useLocalStorageArray,
} from "./useLocalStorage";

// Made with Bob
