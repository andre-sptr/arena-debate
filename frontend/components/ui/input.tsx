/**
 * Input Component — Premium Glassmorphism
 * 
 * A flexible input component with glassmorphism styling, glow focus states,
 * and full TypeScript typing.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input component props
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  label?: string;
  error?: string;
  hasError?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Input component
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hasError = false,
      helperText,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      id,
      type = "text",
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${React.useId()}`;
    const isError = hasError || !!error;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium text-gray-300",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative group">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-arena-cyan transition-colors duration-200">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            className={cn(
              // Base styles
              "flex h-11 w-full rounded-lg px-4 py-2 text-sm text-white transition-all duration-200",
              // Glassmorphism bg
              "bg-white/[0.04] backdrop-blur-sm",
              // Border
              "border border-white/[0.08]",
              // Placeholder
              "placeholder:text-gray-500",
              // Focus
              "focus:outline-none focus:border-arena-cyan/40 focus:bg-white/[0.06]",
              "focus:shadow-[0_0_0_3px_hsla(185,95%,55%,0.1),0_0_20px_hsla(185,95%,55%,0.05)]",
              // Disabled
              "disabled:cursor-not-allowed disabled:opacity-40",
              // Error
              isError && "border-red-500/40 focus:border-red-500/60 focus:shadow-[0_0_0_3px_hsla(0,84%,60%,0.1)]",
              // Icon padding
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              // Custom className
              className
            )}
            aria-invalid={isError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/**
 * Textarea component props
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  label?: string;
  error?: string;
  hasError?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}

/**
 * Textarea component - Multi-line text input
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hasError = false,
      helperText,
      fullWidth = false,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${React.useId()}`;
    const isError = hasError || !!error;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              "text-sm font-medium text-gray-300",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {label}
          </label>
        )}

        {/* Textarea Field */}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg px-4 py-3 text-sm text-white transition-all duration-200",
            "bg-white/[0.04] backdrop-blur-sm",
            "border border-white/[0.08]",
            "placeholder:text-gray-500",
            "focus:outline-none focus:border-arena-cyan/40 focus:bg-white/[0.06]",
            "focus:shadow-[0_0_0_3px_hsla(185,95%,55%,0.1)]",
            "disabled:cursor-not-allowed disabled:opacity-40",
            isError && "border-red-500/40 focus:border-red-500/60",
            className
          )}
          aria-invalid={isError}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />

        {/* Error Message */}
        {error && (
          <p
            id={`${textareaId}-error`}
            className="text-sm text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p
            id={`${textareaId}-helper`}
            className="text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Input;

// Made with Bob