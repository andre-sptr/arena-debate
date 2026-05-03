/**
 * Card Component — Premium Glassmorphism
 * 
 * A flexible card component with glassmorphism variants.
 * Provides consistent styling and spacing for content containers.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card variant types
 */
export type CardVariant = "glass" | "glass-strong" | "elevated" | "outline";

/**
 * Card container props
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  /**
   * Visual style variant
   * @default "glass"
   */
  variant?: CardVariant;
  /**
   * Whether to show hover effect
   * @default false
   */
  hoverable?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  glass: "bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] shadow-glass",
  "glass-strong": "bg-white/[0.06] backdrop-blur-2xl border border-white/[0.1] shadow-glass-lg",
  elevated: "bg-arena-navy-900/80 backdrop-blur-xl border border-white/[0.08] shadow-glass-lg",
  outline: "bg-transparent border border-white/[0.08]",
};

/**
 * Card component - Main container
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "glass", hoverable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl transition-all duration-300",
          variantStyles[variant],
          hoverable && "card-hover-lift card-hover-glow cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

/**
 * CardHeader props
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

/**
 * CardTitle props
 */
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  children?: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, as: Component = "h3", ...props }, ref) => {
    return (
      <Component
        ref={ref as any}
        className={cn(
          "text-2xl font-semibold leading-none tracking-tight text-white font-heading",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = "CardTitle";

/**
 * CardDescription props
 */
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children?: React.ReactNode;
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-gray-400", className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = "CardDescription";

/**
 * CardContent props
 */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("p-6 pt-0", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";

/**
 * CardFooter props
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

export default Card;

// Made with Bob