import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const sizePx = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 };

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full font-semibold",
        "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 shrink-0",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={sizePx[size]}
          height={sizePx[size]}
          className="rounded-full object-cover w-full h-full"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
