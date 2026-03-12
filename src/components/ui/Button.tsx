"use client";

import { HTMLMotionProps, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import React, { forwardRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "google";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = useState(false);

    const baseStyles =
      "inline-flex items-center justify-center relative font-medium transition-all duration-200 outline-none overflow-hidden cursor-pointer";

    // Inline style objects for precise control matching the Linear design system
    const variants: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: isHovered ? "#000000" : "#111111",
        color: "#FFFFFF",
        border: "1px solid transparent",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.1)",
      },
      secondary: {
        backgroundColor: isHovered ? "#F9F9FB" : "#FFFFFF",
        color: "#111111",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
      },
      ghost: {
        backgroundColor: isHovered ? "#F4F4F6" : "transparent",
        color: "#6E6E73",
        border: "1px solid transparent",
      },
      danger: {
        backgroundColor: isHovered ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
        color: "#EF4444",
        border: "1px solid rgba(239,68,68,0.2)",
      },
      google: {
        backgroundColor: isHovered ? "#F9F9FB" : "#FFFFFF",
        color: "#111111",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        fontWeight: 600,
      }
    };

    const sizes = {
      sm: { height: 32, padding: "0 12px", fontSize: 13, gap: 6, borderRadius: 6 },
      md: { height: 40, padding: "0 16px", fontSize: 14, gap: 8, borderRadius: 8 },
      lg: { height: 48, padding: "0 20px", fontSize: 15, gap: 10, borderRadius: 10 },
    };

    const content = loading ? (
      <>
        <Loader2 className="animate-spin w-4 h-4" style={{ marginRight: sizes[size].gap / 2 }} />
        {typeof children === "string" ? "Loading..." : children}
      </>
    ) : (
      <>
        {icon && iconPosition === "left" && icon}
        {children}
        {icon && iconPosition === "right" && icon}
      </>
    );

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, (disabled || loading) && "opacity-60 cursor-not-allowed", className)}
        disabled={disabled || loading}
        onMouseEnter={(e) => { setIsHovered(true); props.onMouseEnter?.(e); }}
        onMouseLeave={(e) => { setIsHovered(false); props.onMouseLeave?.(e); }}
        style={{
          fontFamily: "Inter, sans-serif",
          ...variants[variant],
          ...sizes[size],
          ...(props.style as React.CSSProperties),
        }}
        {...props}
      >
        {content}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
