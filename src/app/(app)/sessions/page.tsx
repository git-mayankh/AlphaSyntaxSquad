"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Plus, Layers, Lightbulb, ThumbsUp, Users as UsersIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SessionCard } from "@/components/sessions/SessionCard";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";
import { JoinSessionModal } from "@/components/sessions/JoinSessionModal";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

const StatCard = ({ icon: Icon, colorClass, label, value, trend, trendUp, delay }: any) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const end = parseInt(String(value).replace(/,/g, ''), 10) || 0;
    if (end === 0) { setDisplayValue(end); return; }
    
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
      else setDisplayValue(end);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card p-6 rounded-lg relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-text-tertiary text-[13px] font-medium uppercase tracking-wider">
          <div className={`w-8 h-8 rounded-full ${colorClass} bg-opacity-10 border border-current flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
          {label}
        </div>
        {trend && (
          <div className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${trendUp ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
            {trendUp ? '▲' : '▼'} {trend}%
          </div>
        )}
      </div>
      <div className="font-display font-bold text-4xl text-text-primary tracking-tight">
        {displayValue.toLocaleString()}
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const supabase = createSupabaseClient();
  const searchParams = useSearchParams();
  const currentOrgId = searchParams.get("org");

  // Fetch user's sessions
  const { data: sessions, isLoading: isSessionsLoading, refetch } = useQuery({
    queryKey: ["dashboard-sessions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      let query = supabase
        .from("sessions")
        .select(`
          id, title, description, status, category, tags, created_at, invite_code,
          created_by, organization_id,
          ideas:ideas(count),
          idea_votes:ideas(idea_votes(count))
        `)
        .order("created_at", { ascending: false });
        
      if (currentOrgId) {
        query = query.eq("organization_id", currentOrgId);
      } else {
        query = query.eq("created_by", user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Aggregate stats
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { sessions: 0, ideas: 0, votes: 0, members: 0 };

      const [sessionsRes, ideasRes] = await Promise.all([
        currentOrgId 
          ? supabase.from("sessions").select("id", { count: "exact" }).eq("organization_id", currentOrgId)
          : supabase.from("sessions").select("id", { count: "exact" }).eq("created_by", user.id),
        currentOrgId // simplified ideas count for now
          ? supabase.from("ideas").select("id", { count: "exact" }) // would need a join to filter by org accurately
          : supabase.from("ideas").select("id", { count: "exact" }).eq("author_id", user.id),
      ]);
      
      return {
        sessions: sessionsRes.count || 0,
        ideas: ideasRes.count || 0,
        votes: 0,
        members: 1,
      };
    }
  });

  // Map raw Supabase data to SessionCard props
  const mappedSessions = (sessions || []).map((s: any, i: number) => ({
    id: s.id,
    title: s.title,
    description: s.description || "No description provided.",
    status: s.status as "active" | "closed",
    timeAgo: `created ${new Date(s.created_at).toLocaleDateString()}`,
    tags: s.tags || [],
    stats: {
      ideas: s.ideas?.[0]?.count || 0,
      members: 1,
      votes: 0,
    },
    members: [{ name: "You" }],
    colorIndex: i % 5,
    inviteCode: s.invite_code,
  }));

  return (
    <div className="p-8 md:p-10 max-w-[1400px] mx-auto min-h-screen">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-display font-bold text-[28px] text-white tracking-tight">Your Sessions</h1>
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={<LogIn className="w-4 h-4" />} onClick={() => setJoinModalOpen(true)}>
            Join Session
          </Button>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setCreateModalOpen(true)} className="shadow-glow-indigo">
            New Session
          </Button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Layers} colorClass="text-indigo-400" label="Total Sessions" value={stats?.sessions || 0} trend={undefined} trendUp={true} delay={0.08} />
        <StatCard icon={Lightbulb} colorClass="text-cyan-400" label="Total Ideas" value={stats?.ideas || 0} trend={undefined} trendUp={true} delay={0.16} />
        <StatCard icon={ThumbsUp} colorClass="text-green-400" label="Votes Cast" value={stats?.votes || 0} trend={undefined} trendUp={true} delay={0.24} />
        <StatCard icon={UsersIcon} colorClass="text-pink-400" label="Active Members" value={stats?.members || 0} delay={0.32} />
      </div>

      {/* SESSION CARDS GRID */}
      {isSessionsLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : mappedSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mb-6">
            <Layers className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="font-display font-bold text-xl text-white mb-2">No sessions yet</h2>
          <p className="text-text-secondary mb-6">Create your first brainstorming session or join one with an invite code.</p>
          <Button onClick={() => setCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>Create Session</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 auto-rows-fr">
          {mappedSessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ y: 30, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.08, type: "spring", damping: 25 }}
              className="h-full"
            >
              <SessionCard {...session} />
            </motion.div>
          ))}
        </div>
      )}

      {/* MODALS */}
      <CreateSessionModal isOpen={createModalOpen} onClose={() => { setCreateModalOpen(false); refetch(); }} defaultOrgId={currentOrgId} />
      <JoinSessionModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
      
    </div>
  );
}
