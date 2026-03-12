"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closeOnOutsideClick?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  closeOnOutsideClick = true,
  maxWidth = "md",
}: ModalProps) => {
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const maxWs = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-[90vw] h-[90vh]",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-[6px]"
            onClick={closeOnOutsideClick ? onClose : undefined}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.93 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full ${maxWs[maxWidth]} bg-bg-elevated/90 backdrop-blur-2xl border border-border-default rounded-2xl shadow-[var(--shadow-modal)] flex flex-col overflow-hidden`}
          >
            {title && (
              <div className="flex items-center justify-between p-6 pb-4 border-b border-border-subtle shrink-0">
                <h2 className="font-display text-2xl font-semibold text-text-primary">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto outline-none" tabIndex={-1}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
