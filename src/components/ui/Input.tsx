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
          <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 500, color: "#6E6E73", paddingLeft: 4 }}>
            {label}
          </label>
        )}
        <div className="relative w-full">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1A6] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full outline-none transition-all duration-200",
              icon ? "pl-10 pr-4 py-2.5" : "px-4 py-2.5",
              className
            )}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              color: "#111111",
              fontSize: "14px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              ...props.style,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#7B6CF6";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(123,108,246,0.15)";
              if (error) {
                e.currentTarget.style.borderColor = "#EF4444";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.15)";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? "#EF4444" : "#E5E7EB";
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)";
            }}
            {...props}
          />
        </div>
        {error ? (
          <p className="flex items-center gap-1.5 mt-1 px-1" style={{ fontSize: 13, color: "#EF4444" }}>
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        ) : hint ? (
          <p className="mt-1 px-1" style={{ fontSize: 13, color: "#6E6E73" }}>{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
