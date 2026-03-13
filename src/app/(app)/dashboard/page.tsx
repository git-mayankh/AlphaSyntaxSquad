"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, LogIn, Users as UsersIcon, Building2, ChevronRight, Loader2, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOrganizations, Organization } from "@/hooks/useOrganizations";
import { CreateOrgModal } from "@/components/dashboard/CreateOrgModal";
import { JoinOrgModal } from "@/components/dashboard/JoinOrgModal";
import { EditOrgModal } from "@/components/dashboard/EditOrgModal";
import { DeleteOrgModal } from "@/components/dashboard/DeleteOrgModal";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function DashboardOrganizations() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  
  const { data: organizations, isLoading, deleteOrganization, isDeleting } = useOrganizations();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await createSupabaseClient().auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, org: Organization) => {
    e.stopPropagation();
    setSelectedOrg(org);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrg) return;
    try {
      await deleteOrganization(selectedOrg.id);
      setDeleteModalOpen(false);
      setSelectedOrg(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleEditClick = (e: React.MouseEvent, org: Organization) => {
    e.stopPropagation();
    setSelectedOrg(org);
    setEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center pt-24 pb-12 px-6">
      
      {/* HEADER SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl mx-auto mb-16"
      >
        <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
          <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" />
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-text-primary tracking-tight mb-4">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">IdeaForge</span>
        </h1>
        <p className="text-text-secondary text-lg">
          Collaborate on ideas through organizations. Start by creating a new workspace or joining an existing one.
        </p>
      </motion.div>

      {/* ACTION HERO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mb-16">
        
        {/* Join Organization */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => setJoinModalOpen(true)}
          className="group glass-card p-8 rounded-2xl cursor-pointer hover:border-indigo-500/50 hover:shadow-glow-indigo transition-all duration-300 relative overflow-hidden flex flex-col items-start"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="w-14 h-14 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors relative z-10">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-text-primary mb-2 relative z-10">Join Organization</h2>
          <p className="text-text-secondary leading-relaxed mb-8 flex-1 relative z-10">
            Have an invite code? Enter it here to join your team's workspace and start collaborating on sessions.
          </p>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm group-hover:translate-x-2 transition-transform relative z-10">
            Join Now <ChevronRight className="w-4 h-4" />
          </div>
        </motion.div>

        {/* Create Organization */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => setCreateModalOpen(true)}
          className="group glass-card p-8 rounded-2xl cursor-pointer hover:border-cyan-500/50 hover:shadow-glow-cyan transition-all duration-300 relative overflow-hidden flex flex-col items-start bg-gradient-to-br from-bg-surface to-bg-surface/50"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="w-14 h-14 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-6 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors relative z-10">
            <Plus className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-text-primary mb-2 relative z-10">Create Organization</h2>
          <p className="text-text-secondary leading-relaxed mb-8 flex-1 relative z-10">
            Set up a brand new workspace for your team. You'll get a unique code to invite others immediately.
          </p>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm group-hover:translate-x-2 transition-transform relative z-10">
            Create Workspace <ChevronRight className="w-4 h-4" />
          </div>
        </motion.div>

      </div>

      {/* YOUR ORGANIZATIONS LIST */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-default">
          <h3 className="font-display text-xl font-bold text-text-primary flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-text-tertiary" />
            Your Organizations
          </h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : organizations && organizations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org: any, i) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + (i * 0.05) }}
                onClick={() => router.push(`/sessions?org=${org.id}`)}
                className="cursor-pointer glass-card p-5 rounded-xl hover:border-border-strong hover:-translate-y-1 transition-all text-left group flex flex-col"
              >
                <div className="flex items-start justify-between mb-4 w-full">
                  <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border-default flex items-center justify-center text-text-primary font-bold font-display text-lg">
                    {org.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-text-tertiary bg-bg-base px-2 py-1 rounded-md border border-border-subtle group-hover:border-indigo-500/30 group-hover:text-indigo-400 transition-colors">
                      {org.share_code}
                    </span>
                    {userId && org.created_by === userId && (
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                        <button 
                          onClick={(e) => handleEditClick(e, org)}
                          className="p-1.5 text-text-tertiary hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteClick(e, org)}
                          className="p-1.5 text-text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h4 className="font-display font-bold text-text-primary text-lg mb-1 truncate">{org.name}</h4>
                <p className="text-text-secondary text-sm flex items-center gap-1.5 mt-auto">
                  <UsersIcon className="w-3.5 h-3.5" />
                  {org.member_count} {org.member_count === 1 ? 'member' : 'members'}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 glass-card rounded-xl border border-dashed border-border-default">
            <p className="text-text-tertiary mb-2">You aren't a part of any organizations yet.</p>
            <p className="text-sm text-text-disabled">Join one using a code, or create your own above.</p>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <CreateOrgModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
      <JoinOrgModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
      <EditOrgModal isOpen={editModalOpen} onClose={() => {setEditModalOpen(false); setSelectedOrg(null);}} organization={selectedOrg} />
      <DeleteOrgModal 
        isOpen={deleteModalOpen} 
        onClose={() => {setDeleteModalOpen(false); setSelectedOrg(null);}} 
        onConfirm={confirmDelete}
        organization={selectedOrg} 
        isDeleting={isDeleting}
      />

    </div>
  );
}
