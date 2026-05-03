/**
 * Button Component — Premium Design
 * 
 * A versatile button component with gradient variants, glow effects, and loading states.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Button variant types
 */
export type ButtonVariant = 
  | "default" 
  | "primary" 
  | "secondary" 
  | "outline" 
  | "ghost" 
  | "destructive";

/**
 * Button size types
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Button component props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Variant styles mapping
 */
const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-white/[0.06] text-gray-200 hover:bg-white/[0.1] active:bg-white/[0.14] border border-white/[0.08]",
  primary:
    "bg-gradient-to-r from-arena-cyan to-arena-violet text-white hover:shadow-glow-cyan active:scale-[0.98] border-0",
  secondary:
    "bg-white/[0.08] text-gray-200 hover:bg-white/[0.12] active:bg-white/[0.16] border border-white/[0.1]",
  outline:
    "border border-white/[0.12] bg-transparent text-gray-300 hover:bg-white/[0.04] hover:border-white/[0.2] active:bg-white/[0.08]",
  ghost:
    "bg-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] active:bg-white/[0.1]",
  destructive:
    "bg-red-500/20 text-red-400 hover:bg-red-500/30 active:bg-red-500/40 border border-red-500/20",
};

/**
 * Size styles mapping
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-base",
};

/**
 * Loading spinner component
 */
const LoadingSpinner: React.FC<{ size?: ButtonSize }> = ({ size = "md" }) => {
  const spinnerSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  
  return (
    <svg
      className={cn("animate-spin", spinnerSize)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * Button component
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
          // Variant styles
          variantStyles[variant],
          // Size styles
          sizeStyles[size],
          // Full width
          fullWidth && "w-full",
          // Disabled styles
          isDisabled && "cursor-not-allowed opacity-40 pointer-events-none",
          // Hover scale for non-primary
          !isDisabled && variant !== "primary" && "hover:scale-[1.01]",
          // Custom className
          className
        )}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && <LoadingSpinner size={size} />}
        {!loading && leftIcon && <span className="inline-flex">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="inline-flex">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

// Made with Bob