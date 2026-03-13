"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface DeleteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any | null;
  onSuccess: () => void;
}

export const DeleteSessionModal = ({ isOpen, onClose, session, onSuccess }: DeleteSessionModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createSupabaseClient();

  const handleConfirm = async () => {
    if (!session) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", session.id);

      if (error) throw error;
      
      toast.success("Session deleted successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete session");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isDeleting ? onClose : undefined}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-start p-6 pb-0">
              <div className="w-12 h-12 rounded-full bg-red-400/10 border border-red-400/20 flex items-center justify-center mb-4 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pb-6">
              <h2 className="font-display font-bold text-xl text-text-primary mb-2">
                Delete Session?
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-8">
                Are you sure you want to permanently delete {" "}
                <strong className="text-text-primary font-semibold">"{session.title}"</strong>? 
                This will also delete all ideas and votes inside it. This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={onClose} 
                  disabled={isDeleting}
                  className="px-6"
                >
                  Keep It
                </Button>
                <Button 
                  type="button" 
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] border-none px-6"
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</div>
                  ) : (
                    "Yes, Delete"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
