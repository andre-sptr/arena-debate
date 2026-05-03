/**
 * UI Components Index
 * 
 * Central export file for all reusable UI components.
 * Import components from this file for cleaner imports.
 * 
 * @example
 * ```tsx
 * import { Button, Card, Input, Badge, Spinner } from '@/components/ui';
 * ```
 */

// Button Component
export { Button } from "./button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./button";

// Card Component
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
export type {
  CardProps,
  CardVariant,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from "./card";

// Input Component
export { Input, Textarea } from "./input";
export type { InputProps, TextareaProps } from "./input";

// Badge Component
export { Badge, getStatusVariant, getAgentVariant } from "./badge";
export type { BadgeProps, BadgeVariant, BadgeSize } from "./badge";

// Spinner Component
export { Spinner } from "./spinner";
export type { SpinnerProps, SpinnerSize } from "./spinner";

// Made with Bob