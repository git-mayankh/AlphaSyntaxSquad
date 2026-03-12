"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Terminal, Loader2, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOrganizations } from "@/hooks/useOrganizations";
import { toast } from "react-hot-toast";

export const CreateOrgModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [name, setName] = useState("");
  const [createdOrg, setCreatedOrg] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  const { createOrganization, isCreating } = useOrganizations();

  // Reset state when closing completely
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setName("");
      setCreatedOrg(null);
      setCopied(false);
    }, 300);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    try {
      const org = await createOrganization({ name: name.trim() });
      setCreatedOrg(org);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create organization");
    }
  };

  const copyToClipboard = () => {
    if (!createdOrg) return;
    navigator.clipboard.writeText(createdOrg.share_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                <Building2 className="w-5 h-5 text-cyan-400" />
                {createdOrg ? "Organization Created!" : "Create Organization"}
              </h2>
              <button
                onClick={handleClose}
                className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {!createdOrg ? (
                <form onSubmit={handleCreate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Organization Name
                    </label>
                    <div className="relative">
                      <Terminal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="e.g. Acme Corp..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-bg-base border border-border-default rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-cyan-500/50 transition-colors"
                        disabled={isCreating}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={handleClose} disabled={isCreating}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={!name.trim() || isCreating}
                      className="bg-cyan-500 hover:bg-cyan-600 shadow-glow-cyan"
                    >
                      {isCreating ? (
                        <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating...</div>
                      ) : (
                        <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Create</div>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                    <p className="text-cyan-400 text-sm font-medium mb-3">
                      Your organization is ready! Share this invite code with your team so they can join.
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-bg-base border border-border-default rounded-lg px-4 py-3 font-mono text-text-primary text-center font-bold tracking-widest text-lg select-all">
                        {createdOrg.share_code}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={copyToClipboard}
                        className="px-4 h-[50px] bg-bg-elevated"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button variant="primary" className="w-full bg-cyan-500 hover:bg-cyan-600" onClick={handleClose}>
                    Done
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
