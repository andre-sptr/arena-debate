/**
 * Badge Component — Premium Design
 * 
 * Displays status and category badges with glassmorphism styling and glow effects.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Badge variant types
 */
export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "analyst"
  | "optimist"
  | "devil"
  | "mediator"
  | "outline";

/**
 * Badge size types
 */
export type BadgeSize = "sm" | "md" | "lg";

/**
 * Badge component props
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Variant styles mapping
 */
const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-white/[0.06] text-gray-300 border-white/[0.08]",
  primary: "bg-arena-cyan/10 text-arena-cyan border-arena-cyan/20",
  secondary: "bg-white/[0.06] text-gray-300 border-white/[0.08]",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  destructive: "bg-red-500/10 text-red-400 border-red-500/20",
  analyst: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  optimist: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  devil: "bg-red-500/10 text-red-400 border-red-500/20",
  mediator: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  outline: "bg-transparent text-gray-400 border-white/[0.12]",
};

/**
 * Size styles mapping
 */
const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1 text-sm",
};

/**
 * Gets badge variant for debate status
 */
export function getStatusVariant(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case "completed": return "success";
    case "in_progress": return "primary";
    case "failed": return "destructive";
    case "pending": return "warning";
    default: return "default";
  }
}

/**
 * Gets badge variant for agent type
 */
export function getAgentVariant(agentName: string): BadgeVariant {
  switch (agentName.toLowerCase()) {
    case "devils_advocate": return "devil";
    case "optimist": return "optimist";
    case "data_analyst": return "analyst";
    case "mediator": return "mediator";
    default: return "default";
  }
}

/**
 * Badge component
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", size = "md", className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-md border font-medium transition-colors duration-200",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;

// Made with Bob