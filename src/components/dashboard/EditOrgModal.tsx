"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Terminal, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOrganizations, Organization } from "@/hooks/useOrganizations";
import { toast } from "react-hot-toast";

export const EditOrgModal = ({ isOpen, onClose, organization }: { isOpen: boolean; onClose: () => void; organization: Organization | null }) => {
  const [name, setName] = useState("");
  
  const { updateOrganization, isUpdating } = useOrganizations();

  useEffect(() => {
    if (organization && isOpen) {
      setName(organization.name);
    }
  }, [organization, isOpen]);

  // Reset state when closing completely
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setName(organization?.name || "");
    }, 300);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !organization) return;
    
    try {
      await updateOrganization({ id: organization.id, name: name.trim() });
      toast.success("Organization updated successfully");
      handleClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update organization");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && organization && (
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
                <Building2 className="w-5 h-5 text-indigo-400" />
                Edit Organization
              </h2>
              <button
                onClick={handleClose}
                className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleUpdate} className="space-y-6">
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
                      className="w-full bg-bg-base border border-border-default rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-indigo-500/50 transition-colors"
                      disabled={isUpdating}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={handleClose} disabled={isUpdating}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={!name.trim() || isUpdating || name.trim() === organization.name}
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
