"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogIn, Key, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOrganizations } from "@/hooks/useOrganizations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const JoinOrgModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [code, setCode] = useState("");
  const router = useRouter();
  
  const { joinOrganization, isJoining } = useOrganizations();

  // Reset state when closing
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setCode("");
    }, 300);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    try {
      const org = await joinOrganization({ shareCode: code });
      toast.success(`Successfully joined ${org.name}!`);
      handleClose();
      // Redirect to that org's sessions
      router.push(`/sessions?org=${org.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to join organization. Check your code.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-bg-surface border border-border-default rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-bg-base/50">
              <h2 className="font-display font-bold text-xl text-text-primary flex items-center gap-2">
                <LogIn className="w-5 h-5 text-indigo-400" />
                Join Organization
              </h2>
              <button
                onClick={handleClose}
                className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleJoin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Enter Invite Code (e.g. ORG-ABCDEF)
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="ORG-XXXXXX"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full bg-bg-base border border-border-default rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary font-mono tracking-widest uppercase placeholder:text-text-disabled focus:outline-none focus:border-indigo-500/50 transition-colors"
                      disabled={isJoining}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={handleClose} disabled={isJoining}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={!code.trim() || isJoining}
                    className="bg-indigo-500 rounded-xl"
                  >
                    {isJoining ? (
                      <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Joining...</div>
                    ) : (
                      <div className="flex items-center gap-2">Join <Play className="w-4 h-4" /></div>
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
