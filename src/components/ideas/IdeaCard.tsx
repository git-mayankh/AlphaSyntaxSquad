"use client";

import React, { useState } from "react";
import { ChevronUp, MessageCircle, MoreHorizontal, Smile, Maximize2, Sparkles, CheckCircle2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown } from "@/components/ui/Dropdown";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { createSupabaseClient } from "@/lib/supabase/client";

export interface IdeaCardProps {
  id: string;
  category: { id: string; name: string; color: string };
  status: "open" | "shortlisted" | "selected";
  title: string;
  description: string;
  tags: string[];
  author: { name: string; avatar?: string };
  timeAgo: string;
  votes: number;
  comments: number;
  reactions: number;
  isAiGenerated?: boolean;
  source?: "user" | "ai" | "voice";
  scores?: { feasibility: number | null; market: number | null; innovation: number | null };
  hasVoted?: boolean;
  onVote?: () => void;
  onComment?: () => void;
  onEvaluate?: () => void;
  onTimeline?: () => void;
  onExport?: () => void;
}

export const IdeaCard = ({
  id, category, status, title, description, tags, author, timeAgo, 
  votes, comments, reactions, isAiGenerated, source = "user", scores, hasVoted: initialVoted = false,
  onComment, onEvaluate, onTimeline, onExport
}: IdeaCardProps) => {

  const [hasVoted, setHasVoted] = useState(initialVoted);
  const [voteCount, setVoteCount] = useState(votes);
  const supabase = createSupabaseClient();

  const handleVote = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast.error("Sign in to vote and comment.");
      return;
    }

    if (!hasVoted) {
      setHasVoted(true);
      setVoteCount(c => c + 1);
      
      // Fire particles
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      
      confetti({
        particleCount: 8,
        spread: 360,
        startVelocity: 15,
        colors: ['#4ADE80', '#22c55e'],
        ticks: 30,
        origin: { x, y }
      });
      
      toast("✓ Voted!", {
        position: "bottom-center",
        className: "!border-l-green-400 font-medium",
      });
      
      await supabase.from("idea_votes").insert({ idea_id: id, user_id: userData.user.id });
    } else {
      setHasVoted(false);
      setVoteCount(c => c - 1);
      await supabase.from("idea_votes").delete().match({ idea_id: id, user_id: userData.user.id });
    }
  };

  const menuItems = [
    [
      { label: "Evaluate Idea", onClick: onEvaluate || (() => {}) },
      { label: "View Timeline", onClick: onTimeline || (() => {}) },
      { label: "Export to PDF", onClick: onExport || (() => {}) },
      { label: "Edit Idea", onClick: () => {} }, 
      { label: "Shortlist", onClick: () => {} }
    ],
    [{ label: "Delete", onClick: () => {}, danger: true }]
  ];
  
  const hasScores = scores && (scores.feasibility || scores.market || scores.innovation);
  const avgScore = hasScores ? Math.round(((scores.feasibility || 0) + (scores.market || 0) + (scores.innovation || 0)) / 3) : null;

  return (
    <div className="glass-card rounded-[24px] overflow-hidden group pb-0 relative break-inside-avoid mb-6 transition-[transform,shadow,border] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-[6px] hover:border-border-strong hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
      
      {/* Quick expand glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      {/* Expand Icon */}
      <div className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-text-tertiary">
        <Maximize2 className="w-3.5 h-3.5" />
      </div>

      {/* TOP STRIPE */}
      <div className="h-1 w-full" style={{ backgroundColor: category.color }} />

      {/* HEADER */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between">
          <div 
            className="text-[12px] uppercase tracking-[0.06em] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${category.color}26`, color: category.color }}
          >
            {category.name}
          </div>
          
          <Dropdown
            align="right"
            items={menuItems}
            trigger={
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-full">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            }
          />
        </div>

        {status !== "open" && (
          <div className="mt-2.5 flex">
            {status === "shortlisted" && <span className="text-[11px] font-bold bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-full">⭐ Shortlisted</span>}
            {status === "selected" && <span className="text-[11px] font-bold bg-green-500/15 text-green-500 px-2 py-0.5 rounded-full">✓ Selected</span>}
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="px-5 pt-4 pb-4 border-b border-transparent group-hover:border-border-subtle/50 transition-colors">
        <h3 className="font-display font-bold text-[16px] text-text-primary leading-tight line-clamp-2">
          {title}
        </h3>
        
        <p className="mt-2 text-[14px] text-text-secondary leading-relaxed line-clamp-3">
          {description}
          {description.length > 100 && <span className="inline-block text-indigo-400 hover:text-indigo-300 ml-1 cursor-pointer">... more</span>}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map(tag => (
            <span key={tag} className="text-[11px] font-medium bg-bg-elevated text-text-tertiary px-2.5 py-0.5 rounded-full hover:text-text-primary hover:border-border-default border border-transparent transition-colors cursor-pointer">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* AI BADGE OVERLAY & SCORE OVERLAY */}
      <div className="mx-5 mb-1 flex items-center gap-2">
            {source === "voice" && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold tracking-wide uppercase border border-indigo-500/20 backdrop-blur-sm self-start">
                <Sparkles className="w-3 h-3" />
                Voice Gen
              </div>
            )}
            
            {source === "ai" && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-bold tracking-wide uppercase border border-purple-500/20 backdrop-blur-sm self-start">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </div>
            )}

            {(isAiGenerated && source !== "ai" && source !== "voice") && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold tracking-wide uppercase border border-indigo-500/20 backdrop-blur-sm self-start">
                <Sparkles className="w-3 h-3" />
                AI Assist
              </div>
            )}
        {hasScores && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-medium rounded-full" title={`Feas: ${scores.feasibility}, Mkt: ${scores.market}, Inn: ${scores.innovation}`}>
            ★ {avgScore}/10 Score
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-between bg-bg-surface/30">
        
        <div className="flex items-center gap-2">
          <Avatar name={author.name} src={author.avatar} size="sm" />
          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="font-medium text-text-secondary">{author.name.split(" ")[0]}</span>
            <span className="text-text-tertiary">·</span>
            <span className="text-text-tertiary">{timeAgo}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            className="flex items-center gap-1 text-text-tertiary hover:text-indigo-400 transition-colors p-1"
            onClick={onComment}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-[13px] font-medium">{comments}</span>
          </button>
          
          <button className="flex items-center gap-1 text-text-tertiary hover:text-pink-400 transition-colors p-1 group/react">
            <Smile className="w-4 h-4" />
            {reactions > 0 && <span className="text-[13px] font-medium">{reactions}</span>}
          </button>

          <motion.button
            whileTap={{ scale: 1.05 }}
            onClick={handleVote}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300 relative overflow-hidden",
              hasVoted 
                ? "bg-green-400/12 border-green-400/30 text-green-400" 
                : "bg-transparent border-border-subtle text-text-tertiary hover:border-border-default hover:text-text-primary"
            )}
          >
            <motion.div animate={hasVoted ? { scale: [1, 1.4, 1] } : {}} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
              <ChevronUp className={cn("w-4 h-4", hasVoted && "fill-green-400")} strokeWidth={hasVoted ? 3 : 2} />
            </motion.div>
            <div className="font-display font-bold text-[14px] leading-none relative h-[14px] w-[18px] overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={voteCount}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {voteCount}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
