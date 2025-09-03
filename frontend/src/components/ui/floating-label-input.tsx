/**
 * FloatingLabelInput Component
 * Modern input with floating label animation
 * Maintains SewaBazaar's design system while providing enhanced UX
 */

'use client';

import { cn } from "@/lib/utils";
import { forwardRef, useState, useRef } from "react";

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, error, helperText, className, type = "text", onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value !== '');
      onBlur?.(e);
    };

    const isLabelFloating = isFocused || hasValue;

    return (
      <div className="relative">
        <div className="relative">
          <input
            ref={ref || inputRef}
            type={type}
            className={cn(
              // Base input styling matching existing design system
              "w-full px-4 py-3 border rounded-lg transition-all duration-200",
              "bg-white dark:bg-[#1E2433]", 
              "border-[#E9E5FF]/20 dark:border-indigo-950",
              "text-foreground dark:text-white",
              "placeholder:text-transparent",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              // Error styles
              error && "border-destructive focus:border-destructive focus:ring-destructive/20",
              // Animation for smooth interactions
              "peer",
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          
          {/* Floating Label */}
          <label
            className={cn(
              "absolute left-4 transition-all duration-200 ease-out cursor-text",
              "text-muted-foreground dark:text-indigo-200/60",
              isLabelFloating
                ? "top-0 -translate-y-1/2 text-xs px-1 bg-background dark:bg-[#1E2433] text-primary dark:text-indigo-400"
                : "top-1/2 -translate-y-1/2 text-base",
              error && isLabelFloating && "text-destructive"
            )}
            onClick={() => inputRef.current?.focus()}
          >
            {label}
          </label>
        </div>
        
        {/* Helper text or error message */}
        {(error || helperText) && (
          <p className={cn(
            "mt-1 text-xs transition-all duration-200",
            error ? "text-destructive" : "text-muted-foreground dark:text-indigo-200/60"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";

/**
 * FloatingLabelTextarea Component
 * Floating label textarea variant
 */
interface FloatingLabelTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const FloatingLabelTextarea = forwardRef<HTMLTextAreaElement, FloatingLabelTextareaProps>(
  ({ label, error, helperText, className, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value !== '');
      onBlur?.(e);
    };

    const isLabelFloating = isFocused || hasValue;

    return (
      <div className="relative">
        <div className="relative">
          <textarea
            ref={ref || textareaRef}
            className={cn(
              // Base textarea styling
              "w-full px-4 py-3 border rounded-lg transition-all duration-200 resize-none",
              "bg-white dark:bg-[#1E2433]",
              "border-[#E9E5FF]/20 dark:border-indigo-950", 
              "text-foreground dark:text-white",
              "placeholder:text-transparent",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              // Error styles
              error && "border-destructive focus:border-destructive focus:ring-destructive/20",
              "peer",
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          
          {/* Floating Label */}
          <label
            className={cn(
              "absolute left-4 transition-all duration-200 ease-out cursor-text",
              "text-muted-foreground dark:text-indigo-200/60",
              isLabelFloating
                ? "top-0 -translate-y-1/2 text-xs px-1 bg-background dark:bg-[#1E2433] text-primary dark:text-indigo-400"
                : "top-6 text-base",
              error && isLabelFloating && "text-destructive"
            )}
            onClick={() => textareaRef.current?.focus()}
          >
            {label}
          </label>
        </div>
        
        {/* Helper text or error message */}
        {(error || helperText) && (
          <p className={cn(
            "mt-1 text-xs transition-all duration-200",
            error ? "text-destructive" : "text-muted-foreground dark:text-indigo-200/60"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

FloatingLabelTextarea.displayName = "FloatingLabelTextarea";