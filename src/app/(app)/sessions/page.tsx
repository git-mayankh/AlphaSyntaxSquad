"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, Plus, Layers, Users as UsersIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SessionCard } from "@/components/sessions/SessionCard";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";
import { JoinSessionModal } from "@/components/sessions/JoinSessionModal";
import { EditSessionModal } from "@/components/sessions/EditSessionModal";
import { DeleteSessionModal } from "@/components/sessions/DeleteSessionModal";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useOrganizations } from "@/hooks/useOrganizations";

export default function Dashboard() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const supabase = createSupabaseClient();
  const searchParams = useSearchParams();
  const currentOrgId = searchParams.get("org");
  const { data: orgs, isLoading: isOrgsLoading } = useOrganizations();
  const hasOrgs = orgs && orgs.length > 0;

  // Fetch current user separately so we can do ownership checks synchronously within the UI mapping
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  // Fetch all sessions belonging to the user's organizations
  const { data: sessions, isLoading: isSessionsLoading, refetch } = useQuery({
    queryKey: ["dashboard-sessions", hasOrgs, currentOrgId],
    enabled: !isOrgsLoading,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || (!currentOrgId && !hasOrgs)) return [];
      
      let query = supabase
        .from("sessions")
        .select(`
          id, title, description, status, category, tags, created_at, invite_code,
          created_by, organization_id,
          organizations(name),
          ideas(count),
          idea_votes:ideas(idea_votes(count))
        `)
        .order("created_at", { ascending: false });
        
      if (currentOrgId) {
        query = query.eq("organization_id", currentOrgId);
      } else {
        const orgIds = orgs?.map((o: any) => o.id) || [];
        if (orgIds.length > 0) {
          query = query.or(`organization_id.in.(${orgIds.join(',')}),and(organization_id.is.null,created_by.eq.${user.id})`);
        } else {
          // If no orgs, STILL allow fetching orphaned sessions they created
          query = query.is("organization_id", null).eq("created_by", user.id);
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Deduplicate sessions (since left join can return multiple rows if not handled nicely by Postgrest mapped arrays)
  const uniqueSessions = Array.from(new Map((sessions || []).map((s: any) => [s.id, s])).values());

  // Map raw Supabase data to SessionCard props
  const mappedSessions = uniqueSessions.map((s: any, i: number) => {
    // calculate idea count - if it's an array, it's length (left join) or if it's got count, use that.
    const ideaCount = Array.isArray(s.ideas) ? s.ideas.length : (s.ideas?.[0]?.count || s.ideas?.count || 0);

    return {
      id: s.id,
      title: s.title,
      description: s.description || "No description provided.",
      status: s.status as "active" | "closed",
      organizationName: s.organizations?.name || undefined,
      organizationId: s.organization_id,
      timeAgo: `created ${new Date(s.created_at).toLocaleDateString()}`,
      tags: s.tags || [],
      stats: {
        ideas: ideaCount,
        members: 1,
        votes: 0,
      },
      members: [{ name: "You" }],
      colorIndex: i % 5,
      inviteCode: s.invite_code,
      createdBy: s.created_by,
      currentUserId: currentUser?.id,
      onEditClick: () => {
        setSelectedSession(s);
        setEditModalOpen(true);
      },
      onDeleteClick: () => {
        setSelectedSession(s);
        setDeleteModalOpen(true);
      },
    };
  });

  const displayOrgs = orgs?.filter((org: any) => !currentOrgId || org.id === currentOrgId) || [];
  const orphanedSessions = mappedSessions.filter((s: any) => !s.organizationId);

  return (
    <div className="p-8 md:p-10 max-w-[1400px] mx-auto min-h-screen">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="font-display font-bold text-[32px] text-white tracking-tight mb-2">Workspace Sessions</h1>
          <p className="text-text-secondary">Explore active sessions across your organizations, or dive in and create your own.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="group relative">
            <Button variant="secondary" icon={<LogIn className="w-4 h-4" />} onClick={() => setJoinModalOpen(true)} disabled={!hasOrgs && !isOrgsLoading}>
              Join Session
            </Button>
            {!hasOrgs && !isOrgsLoading && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-bg-elevated border border-border-strong rounded-lg text-xs text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                Join an organization first
              </div>
            )}
          </div>
          <div className="group relative">
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setCreateModalOpen(true)} disabled={!hasOrgs && !isOrgsLoading} className="shadow-glow-indigo disabled:shadow-none">
              New Session
            </Button>
            {!hasOrgs && !isOrgsLoading && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-bg-elevated border border-border-strong rounded-lg text-xs text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                Join an organization first
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RENDER ORGS & SESSIONS */}
      {isSessionsLoading || isOrgsLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : !hasOrgs ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl max-w-2xl mx-auto border-dashed border-border-default">
          <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mb-6">
            <UsersIcon className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="font-display font-bold text-xl text-white mb-2">You don't belong to any organizations</h2>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">You need to join or create a team workspace first before you can participate in brainstorming sessions.</p>
          <Button onClick={() => window.location.href = '/dashboard'} icon={<UsersIcon className="w-4 h-4" />}>Go to Dashboard</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {displayOrgs.map((org: any) => {
            const orgSessions = mappedSessions.filter((s: any) => s.organizationId === org.id);
            
            return (
              <div key={org.id} className="flex flex-col">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-default/50">
                  <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg text-indigo-400">
                      {org.name[0]?.toUpperCase()}
                    </div>
                    {org.name}
                    <span className="text-xs font-semibold text-indigo-400/80 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 ml-2">
                      {orgSessions.length} {orgSessions.length === 1 ? 'session' : 'sessions'}
                    </span>
                  </h2>
                </div>
                
                {orgSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center glass-card rounded-2xl border-dashed border-border-default/60">
                    <Layers className="w-8 h-8 text-text-tertiary mb-3 opacity-50" />
                    <p className="text-text-secondary">No sessions in {org.name} yet.</p>
                    <button onClick={() => setCreateModalOpen(true)} className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm mt-2 font-medium">Create the first one</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 auto-rows-fr">
                    {orgSessions.map((session, i) => (
                      <motion.div
                        key={session.id}
                        initial={{ y: 30, opacity: 0, scale: 0.96 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08, type: "spring", damping: 25 }}
                        className="h-full"
                      >
                        <SessionCard 
                          id={session.id}
                          title={session.title}
                          description={session.description}
                          status={session.status}
                          organizationName={session.organizationName}
                          timeAgo={session.timeAgo}
                          tags={session.tags}
                          stats={session.stats}
                          members={session.members}
                          colorIndex={session.colorIndex}
                          createdBy={session.createdBy}
                          currentUserId={session.currentUserId}
                          onEditClick={session.onEditClick}
                          onDeleteClick={session.onDeleteClick}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* RENDER ORPHANED SESSIONS if any */}
          {orphanedSessions.length > 0 && (!currentOrgId) && (
            <div className="flex flex-col mt-4">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-default/50">
                <h2 className="text-2xl font-display font-bold text-text-secondary flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center text-lg text-text-tertiary">
                    ?
                  </div>
                  Uncategorized Sessions
                  <span className="text-xs font-semibold text-text-tertiary bg-bg-elevated px-2.5 py-1 rounded-full border border-border-subtle ml-2">
                    {orphanedSessions.length} {orphanedSessions.length === 1 ? 'session' : 'sessions'}
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 auto-rows-fr opacity-80 hover:opacity-100 transition-opacity">
                {orphanedSessions.map((session, i) => (
                  <motion.div
                    key={session.id}
                    initial={{ y: 30, opacity: 0, scale: 0.96 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08, type: "spring", damping: 25 }}
                    className="h-full"
                  >
                    <SessionCard 
                      id={session.id}
                      title={session.title}
                      description={session.description}
                      status={session.status}
                      organizationName="Personal / Unknown"
                      timeAgo={session.timeAgo}
                      tags={session.tags}
                      stats={session.stats}
                      members={session.members}
                      colorIndex={session.colorIndex}
                      createdBy={session.createdBy}
                      currentUserId={session.currentUserId}
                      onEditClick={session.onEditClick}
                      onDeleteClick={session.onDeleteClick}
                    />
                  </motion.div>
                ))}
              </div>
              <p className="text-xs text-text-tertiary mt-4 px-2">
                These sessions were created before organizations were required. You can manage or delete them above.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <CreateSessionModal isOpen={createModalOpen} onClose={() => { setCreateModalOpen(false); refetch(); }} defaultOrgId={currentOrgId || undefined} />
      <JoinSessionModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
      <EditSessionModal isOpen={editModalOpen} onClose={() => { setEditModalOpen(false); setSelectedSession(null); }} session={selectedSession} onSuccess={refetch} />
      <DeleteSessionModal isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setSelectedSession(null); }} session={selectedSession} onSuccess={refetch} />
      
    </div>
  );
}
