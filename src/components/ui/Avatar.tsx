"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { getAvatarColor, getInitials } from "@/lib/utils/colors";
import Image from "next/image";

export interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}

export const Avatar = ({ src, name, size = "md", online, className }: AvatarProps) => {
  const sizes = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  };

  const bg = !src ? getAvatarColor(name) : undefined;

  return (
    <div className={cn("relative inline-block rounded-full", className)}>
      <div 
        className={cn(
          "rounded-full flex items-center justify-center font-bold text-white overflow-hidden border border-border-default/50",
          sizes[size]
        )}
        style={{ background: bg }}
      >
        {src ? (
          <Image 
            src={src} 
            alt={name} 
            width={40} 
            height={40} 
            className="w-full h-full object-cover"
          />
        ) : (
          getInitials(name)
        )}
      </div>
      
      {online && (
        <span 
          className={cn(
            "absolute bottom-0 right-0 block rounded-full bg-green-400 ring-2 ring-bg-surface",
            size === "sm" ? "w-1.5 h-1.5" : "w-2.5 h-2.5"
          )}
        />
      )}
    </div>
  );
};
