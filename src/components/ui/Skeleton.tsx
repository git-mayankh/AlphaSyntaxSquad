import React from "react";
import { cn } from "@/lib/utils/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn(
        "rounded-md overflow-hidden",
        className
      )}
      style={{
        background: "linear-gradient(90deg, var(--bg-surface), var(--bg-elevated), var(--bg-surface))",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite"
      }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}} />
    </div>
  );
};
