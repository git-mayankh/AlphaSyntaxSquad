import React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "category" | "status" | "count";
  colorHex?: string; // used for category badge custom colors
  size?: "sm" | "md";
}

export const Badge = ({
  children,
  className,
  variant = "status",
  colorHex,
  size = "md",
  ...props
}: BadgeProps) => {
  const customStyle = variant === "category" && colorHex ? {
    backgroundColor: `${colorHex}26`, // 15% opacity hex
    color: colorHex
  } : {};

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        variant === "category" && "uppercase tracking-[0.06em] text-xs font-semibold",
        variant === "status" && "bg-bg-elevated border border-border-subtle text-text-tertiary",
        variant === "count" && "bg-bg-elevated text-text-tertiary text-xs px-2 py-0.5",
        className
      )}
      style={customStyle}
      {...props}
    >
      {children}
    </div>
  );
};
