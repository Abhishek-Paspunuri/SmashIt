"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm",
  secondary:
    "bg-[var(--color-surface-3)] text-[var(--color-foreground)] hover:bg-[var(--color-border)] dark:bg-[var(--color-surface-3)] dark:hover:bg-[var(--color-border)]",
  ghost:
    "text-[var(--color-foreground)] hover:bg-[var(--color-surface-3)] active:bg-[var(--color-border)]",
  danger:
    "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm",
  outline:
    "border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-3)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
