"use client";

import { HTMLMotionProps, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import React, { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
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
    const baseStyles =
      "inline-flex items-center justify-center relative font-display font-semibold transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base overflow-hidden";

    const variants = {
      primary:
        "bg-indigo-500 text-white rounded-full hover:bg-indigo-600 hover:shadow-[var(--shadow-glow-indigo)]",
      secondary:
        "glass-card border border-border-default text-text-primary rounded-full hover:border-border-strong hover:bg-bg-hover",
      ghost:
        "bg-transparent text-text-primary rounded-full hover:bg-bg-hover",
      danger:
        "bg-red-500/10 text-red-500 border border-red-500/20 rounded-full hover:bg-red-500/20 hover:border-red-500/40",
    };

    const sizes = {
      sm: "h-8 px-4 text-sm gap-1.5",
      md: "h-11 px-6 text-base gap-2",
      lg: "h-14 px-8 text-lg gap-3",
    };

    const content = loading ? (
      <>
        <Loader2 className="animate-spin w-4 h-4 mr-2" />
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
        whileTap={{ scale: 0.97 }}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          (disabled || loading) && "opacity-60 cursor-not-allowed",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {content}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
