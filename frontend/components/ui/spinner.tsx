/**
 * Spinner Component — Premium Orbital Design
 * 
 * Dual-ring orbital animation with gradient colors.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Spinner size types
 */
export type SpinnerSize = "sm" | "md" | "lg" | "xl";

/**
 * Spinner component props
 */
export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

/**
 * Size configuration
 */
const sizeConfig: Record<SpinnerSize, { outer: string; inner: string; border: string }> = {
  sm: { outer: "h-4 w-4", inner: "h-2.5 w-2.5", border: "border-[2px]" },
  md: { outer: "h-8 w-8", inner: "h-5 w-5", border: "border-[2px]" },
  lg: { outer: "h-12 w-12", inner: "h-8 w-8", border: "border-[3px]" },
  xl: { outer: "h-16 w-16", inner: "h-11 w-11", border: "border-[3px]" },
};

/**
 * Spinner component
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  className,
  label = "Loading",
}) => {
  const config = sizeConfig[size];

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", config.outer, className)}
      role="status"
      aria-label={label}
    >
      {/* Outer ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full animate-orbit",
          config.border,
          "border-arena-cyan/30 border-t-arena-cyan"
        )}
      />
      {/* Inner ring */}
      <div
        className={cn(
          "absolute rounded-full animate-orbit-reverse",
          config.inner,
          config.border,
          "border-arena-violet/20 border-t-arena-violet/70"
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

Spinner.displayName = "Spinner";

export default Spinner;

// Made with Bob