"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "blue";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-linear-to-br from-orange-500 to-orange-600 text-white hover:from-orange-400 hover:to-orange-500 active:from-orange-600 active:to-orange-700 shadow-sm shadow-orange-500/30 hover:shadow-md hover:shadow-orange-500/30",
  secondary:
    "bg-[var(--color-surface-3)] text-[var(--color-foreground)] hover:bg-[var(--color-border)] dark:bg-[var(--color-surface-3)] dark:hover:bg-[var(--color-border)]",
  ghost:
    "text-[var(--color-foreground)] hover:bg-[var(--color-surface-3)] active:bg-[var(--color-border)]",
  danger:
    "bg-linear-to-br from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 active:from-red-600 active:to-red-700 shadow-sm",
  outline:
    "border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-3)] hover:border-[var(--color-muted)]/50",
  blue:
    "bg-[#7A5020] text-[#FCF1E3] hover:bg-[#8B5C25] active:bg-[#6A4418] shadow-sm shadow-[#7A5020]/30 hover:shadow-md hover:shadow-[#7A5020]/30 dark:bg-[#FCF1E3]/15 dark:text-[#FCF1E3] dark:hover:bg-[#FCF1E3]/22 dark:active:bg-[#FCF1E3]/10 dark:shadow-[#FCF1E3]/10",
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
          "inline-flex items-center justify-center rounded-lg font-medium",
          "transition-all duration-150 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
          variant === "primary" && "btn-shine",
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
