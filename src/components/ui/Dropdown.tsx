"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[][]; // array of groups, separated by dividers
  align?: "left" | "right";
  className?: string;
}

export const Dropdown = ({ trigger, items, align = "right", className }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 mt-2 w-48 origin-top glass-card shadow-[var(--shadow-modal)] rounded-lg py-1",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {items.map((group, groupIdx) => (
              <React.Fragment key={groupIdx}>
                <div className="px-1 py-1">
                  {group.map((item, itemIdx) => (
                    <button
                      key={itemIdx}
                      onClick={() => {
                        item.onClick();
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                        item.danger 
                          ? "text-red-400 hover:bg-red-500/10" 
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                      )}
                    >
                      {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
                      {item.label}
                    </button>
                  ))}
                </div>
                {groupIdx < items.length - 1 && (
                  <div className="h-px bg-border-subtle my-1 w-full" />
                )}
              </React.Fragment>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
