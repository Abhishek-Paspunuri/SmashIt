import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-foreground)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]",
            "px-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]",
            "transition-colors focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--color-muted)]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
