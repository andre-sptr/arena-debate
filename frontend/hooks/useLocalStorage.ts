/**
 * useLocalStorage Hook
 * 
 * Generic hook for localStorage persistence with TypeScript type safety.
 * Handles JSON serialization, SSR compatibility, and cross-tab synchronization.
 */

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from "react";

/**
 * Type for the setValue function
 */
type SetValue<T> = Dispatch<SetStateAction<T>>;

/**
 * Return type for useLocalStorage hook
 */
type UseLocalStorageReturn<T> = [
  /** Current value */
  T,
  /** Function to update value */
  SetValue<T>,
  /** Function to remove value from localStorage */
  () => void
];

/**
 * Generic hook for localStorage persistence
 * 
 * Features:
 * - Type-safe with TypeScript generics
 * - Handles JSON serialization/deserialization
 * - SSR-safe (Next.js compatible)
 * - Syncs across browser tabs
 * - Provides remove function
 * - Error handling for invalid JSON
 * 
 * @param key - localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns [value, setValue, removeValue] tuple
 * 
 * @example
 * ```tsx
 * import { useLocalStorage } from "@/hooks/useLocalStorage";
 * 
 * function UserPreferences() {
 *   const [theme, setTheme, removeTheme] = useLocalStorage<string>(
 *     "theme",
 *     "light"
 *   );
 * 
 *   return (
 *     <div>
 *       <p>Current theme: {theme}</p>
 *       <button onClick={() => setTheme("dark")}>Dark Mode</button>
 *       <button onClick={() => setTheme("light")}>Light Mode</button>
 *       <button onClick={removeTheme}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // With complex objects
 * interface UserSettings {
 *   notifications: boolean;
 *   language: string;
 * }
 * 
 * function Settings() {
 *   const [settings, setSettings] = useLocalStorage<UserSettings>(
 *     "user-settings",
 *     { notifications: true, language: "en" }
 *   );
 * 
 *   return (
 *     <div>
 *       <label>
 *         <input
 *           type="checkbox"
 *           checked={settings.notifications}
 *           onChange={(e) =>
 *             setSettings({ ...settings, notifications: e.target.checked })
 *           }
 *         />
 *         Enable Notifications
 *       </label>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    // SSR check
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      // Parse stored json or return initialValue
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      // If error, return initial value
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * Return a wrapped version of useState's setter function that
   * persists the new value to localStorage.
   */
  const setValue: SetValue<T> = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to local storage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  /**
   * Remove the value from localStorage
   */
  const removeValue = useCallback(() => {
    try {
      // Reset to initial value
      setStoredValue(initialValue);

      // Remove from local storage
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  /**
   * Listen for changes to this key in other tabs/windows
   */
  useEffect(() => {
    // SSR check
    if (typeof window === "undefined") {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          console.error(`Error parsing storage event for key "${key}":`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        // Key was removed
        setStoredValue(initialValue);
      }
    };

    // Add event listener
    window.addEventListener("storage", handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook variant that returns an object instead of tuple
 * Useful when you prefer named properties
 * 
 * @param key - localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns Object with value, setValue, and removeValue
 * 
 * @example
 * ```tsx
 * function Component() {
 *   const { value, setValue, removeValue } = useLocalStorageObject(
 *     "my-key",
 *     "default"
 *   );
 *   
 *   return <div>{value}</div>;
 * }
 * ```
 */
export function useLocalStorageObject<T>(
  key: string,
  initialValue: T
): {
  value: T;
  setValue: SetValue<T>;
  removeValue: () => void;
} {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue);

  return { value, setValue, removeValue };
}

/**
 * Hook for boolean values with toggle function
 * Convenient for feature flags, preferences, etc.
 * 
 * @param key - localStorage key
 * @param initialValue - Initial boolean value
 * @returns Object with value, setValue, toggle, and removeValue
 * 
 * @example
 * ```tsx
 * function DarkModeToggle() {
 *   const { value: isDark, toggle } = useLocalStorageBoolean(
 *     "dark-mode",
 *     false
 *   );
 *   
 *   return (
 *     <button onClick={toggle}>
 *       {isDark ? "Light Mode" : "Dark Mode"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useLocalStorageBoolean(
  key: string,
  initialValue: boolean = false
): {
  value: boolean;
  setValue: SetValue<boolean>;
  toggle: () => void;
  removeValue: () => void;
} {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, [setValue]);

  return { value, setValue, toggle, removeValue };
}

/**
 * Hook for array values with helper methods
 * Convenient for lists, collections, etc.
 * 
 * @param key - localStorage key
 * @param initialValue - Initial array value
 * @returns Object with array helpers
 * 
 * @example
 * ```tsx
 * function RecentSearches() {
 *   const { value: searches, push, remove, clear } = useLocalStorageArray<string>(
 *     "recent-searches",
 *     []
 *   );
 *   
 *   const addSearch = (term: string) => {
 *     push(term);
 *   };
 *   
 *   return (
 *     <ul>
 *       {searches.map((search, i) => (
 *         <li key={i}>
 *           {search}
 *           <button onClick={() => remove(i)}>Remove</button>
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useLocalStorageArray<T>(
  key: string,
  initialValue: T[] = []
): {
  value: T[];
  setValue: SetValue<T[]>;
  push: (item: T) => void;
  remove: (index: number) => void;
  clear: () => void;
  removeValue: () => void;
} {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue);

  const push = useCallback(
    (item: T) => {
      setValue((prev) => [...prev, item]);
    },
    [setValue]
  );

  const remove = useCallback(
    (index: number) => {
      setValue((prev) => prev.filter((_, i) => i !== index));
    },
    [setValue]
  );

  const clear = useCallback(() => {
    setValue([]);
  }, [setValue]);

  return { value, setValue, push, remove, clear, removeValue };
}

// Made with Bob