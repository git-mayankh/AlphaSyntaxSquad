"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Layers, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any | null;
  onSuccess: () => void;
}

export const EditSessionModal = ({ isOpen, onClose, session, onSuccess }: EditSessionModalProps) => {
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (session && isOpen) {
      setTitle(session.title || "");
      setProblemStatement(session.description || "");
    }
  }, [session, isOpen]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setTitle(session?.title || "");
      setProblemStatement(session?.description || "");
    }, 300);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !session) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ 
          title: title.trim(),
          problem_statement: problemStatement.trim() || null
        })
        .eq("id", session.id);

      if (error) throw error;
      
      toast.success("Session updated successfully");
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update session");
    } finally {
      setIsUpdating(false);
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
            onClick={!isUpdating ? handleClose : undefined}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-xl bg-bg-surface border border-border-default rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-bg-base/50">
              <h2 className="font-display font-bold text-xl text-text-primary flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Edit Session
              </h2>
              <button
                onClick={handleClose}
                disabled={isUpdating}
                className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleUpdate} className="space-y-6">
                <Input 
                  label="Session Title"
                  placeholder="e.g. Q1 Product Feature Brainstorm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUpdating}
                  required
                />
                
                <div className="w-full flex flex-col gap-1.5 text-left">
                  <label className="text-[13px] text-text-tertiary font-medium px-1">
                    Topic / Problem Statement
                  </label>
                  <textarea 
                    rows={4} 
                    placeholder="What challenge are you trying to solve?"
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    disabled={isUpdating}
                    className="w-full bg-bg-base border border-border-default rounded-xl text-text-primary px-4 py-3 placeholder:text-text-disabled outline-none transition-all duration-150 ease-out resize-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={handleClose} disabled={isUpdating}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={!title.trim() || isUpdating || (title.trim() === session.title && problemStatement.trim() === session.description)}
                    className="bg-indigo-500 hover:bg-indigo-600 shadow-glow-indigo"
                  >
                    {isUpdating ? (
                      <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</div>
                    ) : (
                      <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Save Changes</div>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
