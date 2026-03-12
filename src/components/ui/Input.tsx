import React, { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { AlertCircle } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const defaultId = React.useId();
    const inputId = id || defaultId;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-[13px] text-text-tertiary font-medium px-1">
            {label}
          </label>
        )}
        <div className="relative w-full">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full bg-bg-surface border border-border-default rounded-md text-text-primary px-4 py-3 placeholder:text-text-disabled outline-none transition-all duration-150 ease-out",
              icon && "pl-11",
              "focus:border-border-accent focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]",
              error && "border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(248,113,113,0.15)]",
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="flex items-center gap-1.5 text-[13px] text-red-400 mt-1 px-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        ) : hint ? (
          <p className="text-[13px] text-text-tertiary mt-1 px-1">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
