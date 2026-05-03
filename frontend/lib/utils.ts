/**
 * Utility Functions for Debate AI Arena
 * 
 * Common helper functions used throughout the application.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 * 
 * This utility merges Tailwind CSS classes intelligently, resolving conflicts
 * and removing duplicates. Useful for conditional styling with Tailwind.
 * 
 * @param inputs - Class names to combine
 * @returns Merged class string
 * 
 * @example
 * ```ts
 * cn("px-4 py-2", isActive && "bg-blue-500", "hover:bg-blue-600")
 * // Returns: "px-4 py-2 bg-blue-500 hover:bg-blue-600"
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats an ISO date string to a human-readable format
 * 
 * @param isoDate - ISO 8601 date string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 * 
 * @example
 * ```ts
 * formatDate("2024-01-15T10:30:00Z")
 * // Returns: "Jan 15, 2024, 10:30 AM"
 * ```
 */
export function formatDate(
  isoDate: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return isoDate;
  }
}

/**
 * Formats a date to relative time (e.g., "2 hours ago")
 * 
 * @param isoDate - ISO 8601 date string
 * @returns Relative time string
 * 
 * @example
 * ```ts
 * formatRelativeTime("2024-01-15T10:30:00Z")
 * // Returns: "2 hours ago"
 * ```
 */
export function formatRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
    
    return formatDate(isoDate, { month: "short", day: "numeric", year: "numeric" });
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return isoDate;
  }
}

/**
 * Agent color mapping for consistent UI styling
 */
const AGENT_COLORS: Record<string, string> = {
  devil_1: "#ef4444", // red-500
  devil_2: "#b91c1c", // red-700
  optimist_1: "#10b981", // green-500
  optimist_2: "#059669", // green-600
  judge: "#8b5cf6", // purple-500
};

/**
 * Gets the color associated with an agent
 * 
 * @param agentName - Name of the agent
 * @returns Hex color code
 * 
 * @example
 * ```ts
 * getAgentColor("devils_advocate")
 * // Returns: "#ef4444"
 * ```
 */
export function getAgentColor(agentName: string): string {
  return AGENT_COLORS[agentName.toLowerCase()] || "#6b7280"; // gray-500 as fallback
}

/**
 * Agent emoji mapping for visual identification
 */
const AGENT_EMOJIS: Record<string, string> = {
  devil_1: "🧠",
  devil_2: "🛡️",
  optimist_1: "✨",
  optimist_2: "🚀",
  judge: "⚖️",
};

/**
 * Gets the emoji associated with an agent
 * 
 * @param agentName - Name of the agent
 * @returns Emoji character
 * 
 * @example
 * ```ts
 * getAgentEmoji("devils_advocate")
 * // Returns: "😈"
 * ```
 */
export function getAgentEmoji(agentName: string): string {
  return AGENT_EMOJIS[agentName.toLowerCase()] || "🤖";
}

/**
 * Truncates text to a specified length with ellipsis
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 * 
 * @example
 * ```ts
 * truncateText("This is a long text", 10)
 * // Returns: "This is a..."
 * ```
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Delays execution for a specified time
 * 
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 * 
 * @example
 * ```ts
 * await sleep(1000); // Wait 1 second
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safely parses JSON with fallback
 * 
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 * 
 * @example
 * ```ts
 * safeJsonParse('{"key": "value"}', {})
 * // Returns: { key: "value" }
 * ```
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return fallback;
  }
}

/**
 * Generates a random ID
 * 
 * @param prefix - Optional prefix for the ID
 * @returns Random ID string
 * 
 * @example
 * ```ts
 * generateId("debate")
 * // Returns: "debate_abc123xyz"
 * ```
 */
export function generateId(prefix?: string): string {
  const random = Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}_${random}` : random;
}

/**
 * Copies text to clipboard
 * 
 * @param text - Text to copy
 * @returns Promise that resolves when copied
 * 
 * @example
 * ```ts
 * await copyToClipboard("Hello World");
 * ```
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

/**
 * Formats a number with commas
 * 
 * @param num - Number to format
 * @returns Formatted number string
 * 
 * @example
 * ```ts
 * formatNumber(1234567)
 * // Returns: "1,234,567"
 * ```
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Debounces a function call
 * 
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait
 * @returns Debounced function
 * 
 * @example
 * ```ts
 * const debouncedSearch = debounce((query) => search(query), 300);
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Checks if code is running in browser
 * 
 * @returns True if in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Gets environment variable value
 * 
 * @param key - Environment variable key
 * @param fallback - Fallback value if not found
 * @returns Environment variable value or fallback
 * 
 * @example
 * ```ts
 * getEnvVar("NEXT_PUBLIC_API_URL", "http://localhost:8000")
 * ```
 */
export function getEnvVar(key: string, fallback: string = ""): string {
  if (isBrowser()) {
    return (window as any).ENV?.[key] || process.env[key] || fallback;
  }
  return process.env[key] || fallback;
}

// Made with Bob
