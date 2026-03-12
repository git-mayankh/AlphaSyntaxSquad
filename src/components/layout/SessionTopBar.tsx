"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Timer, Mic, MicOff, Brain, Users, Copy, Check, Share2, Link, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import NextLink from "next/link";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Participant {
  id: string;
  name: string;
  avatar_url?: string;
}

interface SessionTopBarProps {
  sessionId: string;
  sessionTitle: string;
  inviteCode?: string;
  onToggleAi: () => void;
  onToggleVoice: () => void;
  isVoiceActive: boolean;
  isAiOpen: boolean;
}

export const SessionTopBar = ({
  sessionId, sessionTitle, inviteCode,
  onToggleAi, onToggleVoice, isVoiceActive, isAiOpen
}: SessionTopBarProps) => {
  const supabase = createSupabaseClient();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [sessionStart] = useState(Date.now());
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("id, name, avatar_url").eq("id", user.id).single();
      if (!profile) return;

      channel = supabase.channel(`session-${sessionId}-presence`, {
        config: { presence: { key: user.id } },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const activeUsers = Object.values(state).map((presenceArray: any) => presenceArray[0]);
          
          // Deduplicate by ID just in case
          const uniqueUsers = Array.from(new Map(activeUsers.map(p => [p.id, p])).values());
          setParticipants(uniqueUsers as Participant[]);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({
              id: profile.id,
              name: profile.name,
              avatar_url: profile.avatar_url,
              online_at: new Date().toISOString(),
            });
          }
        });
    };

    setupPresence();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const copyCode = async () => {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCodeCopied(true);
    toast.success("Invite code copied!");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/join?code=${inviteCode}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-bg-surface/95 backdrop-blur-xl border-b border-border-subtle flex items-center px-5 gap-4">
      {/* Logo */}
      <NextLink href="/dashboard" className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors">
        <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500" />
      </NextLink>

      <div className="h-5 w-px bg-border-subtle" />

      {/* Session Title */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <h1 className="font-display font-semibold text-text-primary text-[15px] truncate max-w-[180px]">{sessionTitle}</h1>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-1.5 text-text-tertiary bg-bg-base border border-border-subtle rounded-md px-2.5 py-1 font-mono text-xs font-semibold tracking-widest">
        <Timer className="w-3 h-3" />
        {formatTime(elapsed)}
      </div>

      <div className="flex-1" />

      {/* INVITE BUTTON */}
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowInvitePopup(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Invite
          {inviteCode && (
            <span className="ml-1 font-mono text-[11px] bg-emerald-500/20 px-1.5 py-0.5 rounded tracking-widest">
              {inviteCode}
            </span>
          )}
        </motion.button>

        {/* Invite Popup */}
        <AnimatePresence>
          {showInvitePopup && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-72 bg-bg-elevated border border-border-default rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-4 z-50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-text-primary">Invite to Session</span>
                <button onClick={() => setShowInvitePopup(false)} className="text-text-tertiary hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Invite Code Block */}
              <div className="bg-bg-base border border-border-subtle rounded-xl p-3 mb-3">
                <div className="text-[10px] text-text-tertiary font-medium uppercase tracking-widest mb-2">Session Code</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-2xl font-bold text-white tracking-[0.25em] select-all">{inviteCode || "——————"}</span>
                  <button
                    onClick={copyCode}
                    className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-500/30 transition-colors shrink-0"
                  >
                    {codeCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Copy Link */}
              <button
                onClick={copyLink}
                className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl bg-bg-base border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:border-indigo-500/40 transition-colors"
              >
                <Link className="w-4 h-4 text-indigo-400" />
                {linkCopied ? "Link copied! ✓" : "Copy invite link"}
              </button>

              <p className="text-[11px] text-text-disabled mt-2.5 text-center">
                Share the code or link with your team to join this session
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Participants */}
      <div className="flex items-center gap-1">
        {participants.slice(0, 5).map((p, i) => (
          <div key={p.id} style={{ zIndex: 5 - i, marginLeft: i > 0 ? "-8px" : 0 }}>
            <Avatar name={p.name} src={p.avatar_url} size="sm" online />
          </div>
        ))}
        <div className="flex items-center gap-1 text-text-secondary text-xs ml-2">
          <Users className="w-3.5 h-3.5" />
          {participants.length}
        </div>
      </div>

      <div className="h-5 w-px bg-border-subtle" />

      {/* Voice button */}
      <motion.button
        onClick={onToggleVoice}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
          isVoiceActive
            ? "bg-green-500/15 text-green-400 border border-green-500/40 shadow-[0_0_12px_rgba(74,222,128,0.2)]"
            : "text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent"
        }`}
      >
        {isVoiceActive ? (
          <>
            <Mic className="w-4 h-4" />
            <span className="flex gap-0.5 items-center">
              {[0, 1, 2].map(i => (
                <motion.span key={i} className="block w-0.5 rounded-full bg-green-400"
                  animate={{ height: ["4px", "10px", "4px"] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
              ))}
            </span>
            In Room
          </>
        ) : (
          <><MicOff className="w-4 h-4" />Voice</>
        )}
      </motion.button>

      {/* AI Button */}
      <motion.button
        onClick={onToggleAi}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
          isAiOpen
            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
            : "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20"
        }`}
      >
        <Brain className="w-4 h-4" />
        AI
      </motion.button>
    </header>
  );
};
