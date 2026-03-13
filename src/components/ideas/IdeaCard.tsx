"use client";

import React, { useState, useEffect } from "react";
import { ChevronUp, MessageCircle, MoreHorizontal, Sparkles, Trash2, Star, GripVertical } from "lucide-react";
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
  userReaction?: string | null;
  isAiGenerated?: boolean;
  source?: "user" | "ai" | "voice";
  scores?: { feasibility: number | null; market: number | null; innovation: number | null };
  hasVoted?: boolean;
  colorVariant?: number; // 0-7 for different sticky note colors
  onVote?: () => void;
  onComment?: () => void;
  onEvaluate?: () => void;
  onTimeline?: () => void;
  onExport?: () => void;
}

// Sticky note color palettes — warm light tones
const STICKY_COLORS = [
  { bg: "#fef9c3", border: "#fde047", accent: "#854d0e", headerBg: "#fde047" },  // Yellow
  { bg: "#fce7f3", border: "#f9a8d4", accent: "#9d174d", headerBg: "#fbcfe8" },  // Pink
  { bg: "#dbeafe", border: "#93c5fd", accent: "#1e40af", headerBg: "#bfdbfe" },  // Blue
  { bg: "#d1fae5", border: "#6ee7b7", accent: "#065f46", headerBg: "#a7f3d0" },  // Green
  { bg: "#ede9fe", border: "#c4b5fd", accent: "#4c1d95", headerBg: "#ddd6fe" },  // Purple
  { bg: "#ffedd5", border: "#fdba74", accent: "#7c2d12", headerBg: "#fed7aa" },  // Orange
  { bg: "#e0f2fe", border: "#7dd3fc", accent: "#0c4a6e", headerBg: "#bae6fd" },  // Sky
  { bg: "#fdf2f8", border: "#f0abfc", accent: "#701a75", headerBg: "#f5d0fe" },  // Fuchsia
];

export const IdeaCard = ({
  id, category, status, title, description, tags, author, timeAgo,
  votes, comments, reactions, userReaction, isAiGenerated, source = "user", scores, 
  hasVoted: initialVoted = false, colorVariant = 0,
  onComment, onEvaluate, onTimeline, onExport
}: IdeaCardProps) => {

  const [hasVoted, setHasVoted] = useState(initialVoted);
  const [voteCount, setVoteCount] = useState(votes);
  const [showEmojis, setShowEmojis] = useState(false);
  const supabase = createSupabaseClient();

  useEffect(() => {
    setHasVoted(initialVoted);
    setVoteCount(votes);
  }, [initialVoted, votes]);

  const color = STICKY_COLORS[colorVariant % STICKY_COLORS.length];
  const hasScores = scores && (scores.feasibility || scores.market || scores.innovation);
  const avgScore = hasScores ? Math.round(((scores.feasibility || 0) + (scores.market || 0) + (scores.innovation || 0)) / 3) : null;

  const handleVote = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Cache rect synchronously BEFORE any awaits — currentTarget becomes null after async ops
    const rect = e.currentTarget.getBoundingClientRect();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast.error("Sign in to vote.");
      return;
    }

    if (!hasVoted) {
      setHasVoted(true);
      setVoteCount(c => c + 1);
      confetti({
        particleCount: 10,
        spread: 360,
        startVelocity: 18,
        colors: ['#4ADE80', '#22c55e', '#bbf7d0'],
        ticks: 35,
        origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight }
      });
      toast.success("✓ Upvoted!", { position: "bottom-center" });
      void supabase.from("idea_votes").insert({ idea_id: id, user_id: userData.user.id });
    } else {
      setHasVoted(false);
      setVoteCount(c => c - 1);
      void supabase.from("idea_votes").delete().match({ idea_id: id, user_id: userData.user.id });
    }
  };

  const handleReact = async (e: React.MouseEvent, emoji: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEmojis(false);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    // Try insert; if it fails (duplicate), remove instead (toggle)
    const { error } = await supabase.from("idea_reactions").insert({ idea_id: id, user_id: userData.user.id, emoji });
    if (error) {
      void supabase.from("idea_reactions").delete().match({ idea_id: id, user_id: userData.user.id, emoji });
    }
  };

  const menuItems = [
    [
      { label: "✦ Evaluate", onClick: onEvaluate || (() => {}) },
      { label: "⏱ Timeline", onClick: onTimeline || (() => {}) },
      { label: "⬆ Export", onClick: onExport || (() => {}) },
    ],
    [{ label: "🗑 Delete", onClick: () => {}, danger: true }]
  ];

  return (
    <div
      className="relative rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.13)] group select-none overflow-visible"
      style={{ backgroundColor: color.bg, border: `1.5px solid ${color.border}` }}
    >
      {/* Sticky Note header tape/fold accent */}
      <div
        className="h-[6px] w-full rounded-t-2xl"
        style={{ backgroundColor: color.headerBg }}
      />

      {/* Drag handle (decorative) */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-40 transition-opacity text-gray-500">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* HEADER */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color.border}60`, color: color.accent }}
          >
            {category.name}
          </span>
          {source === "ai" && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-violet-100 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded-full">
              <Sparkles className="w-2.5 h-2.5" /> AI
            </span>
          )}
          {source === "voice" && (
            <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">🎙 Voice</span>
          )}
          {status === "shortlisted" && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">⭐ Shortlisted</span>
          )}
          {status === "selected" && (
            <span className="text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">✓ Selected</span>
          )}
        </div>

        <Dropdown
          align="right"
          items={menuItems}
          trigger={
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-700 hover:bg-black/5 rounded-full">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          }
        />
      </div>

      {/* BODY */}
      <div className="px-4 pb-3">
        <h3
          className="font-bold text-[15px] leading-snug mb-1.5 line-clamp-2"
          style={{ color: color.accent }}
        >
          {title}
        </h3>
        <p className="text-[13px] leading-relaxed line-clamp-3" style={{ color: `${color.accent}aa` }}>
          {description || "No description."}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {tags.map(tag => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${color.border}55`, color: color.accent }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {avgScore !== null && (
          <div
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color.border}55`, color: color.accent }}
          >
            <Star className="w-3 h-3" fill={color.accent} /> {avgScore}/10 Score
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div
        className="px-4 py-2.5 rounded-b-2xl flex items-center justify-between"
        style={{ backgroundColor: `${color.headerBg}70`, borderTop: `1px solid ${color.border}80` }}
      >
        <div className="flex items-center gap-2">
          <Avatar name={author.name} src={author.avatar} size="sm" />
          <span className="text-[12px] font-medium" style={{ color: `${color.accent}bb` }}>
            {author.name.split(" ")[0]}
          </span>
          <span className="text-[11px]" style={{ color: `${color.accent}66` }}>{timeAgo}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Emoji reaction */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowEmojis(v => !v); }}
              className="text-[14px] p-1 rounded-full hover:bg-black/5 transition-colors"
              title="React"
            >
              {userReaction || "😊"}
              {reactions > 0 && <span className="text-[11px] ml-0.5" style={{ color: color.accent }}>{reactions}</span>}
            </button>
            <AnimatePresence>
              {showEmojis && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.9 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-full shadow-xl border border-gray-100 p-1.5 flex items-center gap-1 z-50"
                >
                  {["👍", "❤️", "🔥", "🚀", "💡"].map(emoji => (
                    <button
                      key={emoji}
                      onClick={(e) => handleReact(e, emoji)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-transform hover:scale-125 text-base"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Comment */}
          <button
            onClick={(e) => { e.stopPropagation(); onComment?.(); }}
            className="flex items-center gap-1 p-1 rounded-full hover:bg-black/5 transition-colors"
            style={{ color: `${color.accent}88` }}
            title="Comment"
          >
            <MessageCircle className="w-4 h-4" />
            {comments > 0 && <span className="text-[11px]">{comments}</span>}
          </button>

          {/* Vote */}
          <motion.button
            whileTap={{ scale: 1.1 }}
            onClick={handleVote}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full border font-bold text-[12px] transition-all",
              hasVoted
                ? "border-green-400 bg-green-50 text-green-700"
                : "border-transparent hover:border-current bg-black/5"
            )}
            style={!hasVoted ? { color: color.accent } : {}}
            title="Upvote"
          >
            <motion.div animate={hasVoted ? { scale: [1, 1.4, 1] } : { scale: 1 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
              <ChevronUp className="w-4 h-4" strokeWidth={hasVoted ? 3 : 2} />
            </motion.div>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={voteCount}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {voteCount}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
