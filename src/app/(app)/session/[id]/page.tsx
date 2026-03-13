"use client";

import { use, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IdeaCanvas } from "@/components/ideas/IdeaCanvas";
import { IdeaCardProps } from "@/components/ideas/IdeaCard";
import { CreateIdeaModal } from "@/components/ideas/CreateIdeaModal";
import { CommentDrawer } from "@/components/ideas/CommentDrawer";
import { EvaluationModal } from "@/components/ideas/EvaluationModal";
import { EvolutionTimeline } from "@/components/ideas/EvolutionTimeline";
import { SessionTopBar } from "@/components/layout/SessionTopBar";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { AIAnalyticsPanel } from "@/components/ai/AIAnalyticsPanel";
import { ChatPanel } from "@/components/session/ChatPanel";
import { VoiceTranscriptTab } from "@/components/session/VoiceTranscriptTab";
import { useIdeas } from "@/hooks/useIdeas";
import { useSessionData } from "@/hooks/useSessionData";
import { useIdeaClusters } from "@/hooks/useIdeaClusters";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  Loader2, Plus, MessageCircle, Brain, Sparkles, LayoutList,
  TrendingUp, Mic, StickyNote, Search, X, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

type BottomTab = "ideas" | "chat" | "ai" | "analytics" | "transcript";

const categories = [
  { id: "Core Feature", name: "Core Feature", color: "#6366f1" },
  { id: "Monetization", name: "Monetization", color: "#10b981" },
  { id: "Growth", name: "Growth", color: "#f59e0b" },
  { id: "Other", name: "Other", color: "#8b5cf6" },
];

export default function SessionBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createSupabaseClient();

  const canvasRef = useRef<any>(null);

  // UI State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<BottomTab | null>(null);
  const [activeCommentIdea, setActiveCommentIdea] = useState<{ id: string; title: string } | null>(null);
  const [activeEvaluateIdea, setActiveEvaluateIdea] = useState<any>(null);
  const [activeTimelineIdea, setActiveTimelineIdea] = useState<{ id: string; title: string } | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Data
  const { data: session, isLoading: isSessionLoading } = useSessionData(id);
  const { data: ideas = [], isLoading: isIdeasLoading } = useIdeas(id);

  // AI clustering — auto-triggered whenever ideas change
  const { clusters, isAnalyzing, analyzeIdeas } = useIdeaClusters();
  useEffect(() => {
    if (ideas.length >= 2) {
      analyzeIdeas(
        ideas.map((i: any) => ({ id: i.id, title: i.title, description: i.description || "" }))
      );
    }
  }, [ideas]);

  // Filter ideas
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea: any) => {
      const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (idea.description && idea.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = selectedCategory ? idea.category === selectedCategory : true;
      return matchesSearch && matchesCat;
    });
  }, [ideas, searchQuery, selectedCategory]);

  const handlePanToIdea = (ideaId: string) => {
    if (canvasRef.current) {
      canvasRef.current.panToIdea(ideaId);
      setActivePanel(null); // Close panel to reveal canvas
    }
  };

  const handleCommentOpen = (ideaId: string, title: string) => setActiveCommentIdea({ id: ideaId, title });
  const handleTimelineOpen = (ideaId: string, title: string) => setActiveTimelineIdea({ id: ideaId, title });
  const handleEvaluateOpen = (idea: any) => setActiveEvaluateIdea({
    id: idea.id, title: idea.title, description: idea.description,
    scores: { feasibility: idea.feasibility_score, market: idea.market_score, innovation: idea.innovation_score }
  });

  const handlePositionChange = useCallback(async (ideaId: string, x: number, y: number) => {
    await supabase.from("idea_positions").upsert({ idea_id: ideaId, x, y }, { onConflict: "idea_id" });
  }, []);

  const handleMergeIdeas = async (idea1: any, idea2: any) => {
    const res = await fetch("/api/ai/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea1, idea2 }),
    });
    const merged = await res.json();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: newIdea, error } = await supabase.from("ideas").insert({
      session_id: id,
      title: merged.title,
      description: merged.description,
      category: idea1.category || "Other",
      author_id: user.id,
      is_ai_generated: true,
    }).select().single();
    if (!error && newIdea) {
      await supabase.from("idea_history").insert({
        idea_id: newIdea.id,
        action_type: "merged",
        description: `Merged from "${idea1.title}" and "${idea2.title}" using AI`,
      });
    }
  };

  const handleVoiceIdea = useCallback(async (detectedIdea: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: newIdea } = await supabase.from("ideas").insert({
      session_id: id,
      title: detectedIdea,
      description: "Captured from voice discussion",
      category: "Other",
      author_id: user.id,
      is_ai_generated: true,
    }).select().single();
    if (newIdea) {
      await supabase.from("idea_history").insert({
        idea_id: newIdea.id, action_type: "created",
        description: "Automatically captured from voice discussion by AI",
      });
      toast.success("💡 Voice idea captured!", { description: detectedIdea });
    }
  }, [id]);

  // Map ideas to canvas nodes with positions
  const ideaNodes = ideas.map((idea: any, i: number) => ({
    id: idea.id,
    title: idea.title,
    description: idea.description || "",
    category: {
      id: idea.category || "Other",
      name: idea.category || "Other",
      color: `var(--cat-${(idea.category || "other").toLowerCase()})`,
    },
    status: (idea.status as "open" | "shortlisted" | "selected") || "open",
    tags: [],
    author: idea.author
      ? { name: idea.author.name || "Unknown", avatar: idea.author.avatar_url || undefined }
      : { name: "Unknown" },
    timeAgo: new Date(idea.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
    votes: idea.votes_count ?? 0,
    comments: idea.comments_count ?? 0,
    reactions: idea.reactions_count ?? 0,
    userReaction: idea.user_reaction_emoji,
    isAiGenerated: idea.is_ai_generated || false,
    scores: { feasibility: idea.feasibility_score, market: idea.market_score, innovation: idea.innovation_score },
    onComment: () => handleCommentOpen(idea.id, idea.title),
    onEvaluate: () => handleEvaluateOpen(idea),
    onTimeline: () => handleTimelineOpen(idea.id, idea.title),
    onExport: () => window.open(`/session/${id}/export/${idea.id}`, "_blank"),
    position: idea.position || { x: 80 + (i % 4) * 340, y: 60 + Math.floor(i / 4) * 300 },
    colorVariant: i % 8,
  }));

  const analyticsIdeas = ideas.map((i: any) => ({
    id: i.id, title: i.title, description: i.description, votes: i.votes_count
  }));

  const bottomTabs = [
    { id: "ideas" as BottomTab, label: "Ideas", icon: LayoutList, count: ideas.length },
    { id: "chat" as BottomTab, label: "Chat", icon: MessageCircle },
    { id: "ai" as BottomTab, label: "AI", icon: Sparkles },
    { id: "analytics" as BottomTab, label: "Analyze", icon: Brain },
    { id: "transcript" as BottomTab, label: "Transcript", icon: Mic },
  ];

  const togglePanel = (tab: BottomTab) => {
    setActivePanel(prev => prev === tab ? null : tab);
  };

  const panelHeight = "420px";

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden" style={{ backgroundColor: "#f5f0eb" }}>

      {/* TOP BAR */}
      <SessionTopBar
        sessionId={id}
        sessionTitle={session?.title || "Loading..."}
        inviteCode={(session as any)?.invite_code}
        onToggleAi={() => togglePanel("ai")}
        onToggleVoice={() => togglePanel("transcript")}
        isVoiceActive={activePanel === "transcript"}
        isAiOpen={activePanel === "ai"}
      />

      {/* MAIN WORKSPACE (below topbar) */}
      <div className="flex-1 relative pt-14 overflow-hidden">

        {/* FULL-SCREEN CANVAS */}
        {isIdeasLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-700/50" />
              <p className="text-amber-900/50 text-sm">Loading your whiteboard...</p>
            </div>
          </div>
        ) : (
          <IdeaCanvas
            ref={canvasRef}
            ideas={ideaNodes}
            clusters={clusters}
            isAnalyzing={isAnalyzing}
            onAddIdea={() => setIsCreateModalOpen(true)}
            onPositionChange={handlePositionChange}
          />
        )}

        {/* FLOATING ADD BUTTON (top-left overlay) */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="absolute top-[calc(3.5rem+16px)] left-4 z-20 flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-2xl text-sm font-semibold shadow-lg hover:bg-indigo-600 transition-colors shadow-indigo-500/30"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </motion.button>

        {/* SLIDING BOTTOM PANEL */}
        <AnimatePresence>
          {activePanel && (
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute bottom-16 left-0 right-0 z-30 mx-4 mb-2 rounded-2xl overflow-hidden shadow-2xl"
              style={{ maxHeight: panelHeight, backgroundColor: "#1a1825", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
                <span className="text-sm font-semibold text-white/80 capitalize">
                  {activePanel === "ideas" ? `Ideas (${filteredIdeas.length})` :
                   activePanel === "chat" ? "Session Chat" :
                   activePanel === "ai" ? "AI Assistant" :
                   activePanel === "analytics" ? "Analytics" : "Voice Transcript"}
                </span>
                <button onClick={() => setActivePanel(null)} className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Panel content */}
              <div className="overflow-auto" style={{ height: `calc(${panelHeight} - 52px)` }}>
                <AnimatePresence mode="wait">
                  {activePanel === "ideas" && (
                    <motion.div key="ideas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
                      {/* Category filters */}
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[180px]">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                          <input
                            type="text"
                            placeholder="Search ideas..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white/80 outline-none focus:border-indigo-500/50 placeholder:text-white/30 transition-colors"
                          />
                        </div>
                        {[{ id: null, name: "All" }, ...categories].map((c: any) => (
                          <button
                            key={c.id ?? "all"}
                            onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                              selectedCategory === c.id || (!selectedCategory && !c.id)
                                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                                : "bg-white/5 border-white/10 text-white/40 hover:border-white/25"
                            )}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                      {/* Ideas grid */}
                      {filteredIdeas.length === 0 ? (
                        <div className="text-center py-8 text-white/30 text-sm">No ideas found</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                          {filteredIdeas.map((idea: any, i: number) => (
                            <motion.button
                              key={idea.id}
                              onClick={() => handlePanToIdea(idea.id)}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.02 }}
                              className="text-left p-3 rounded-xl border border-white/8 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition-all group"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categories.find(c => c.id === idea.category)?.color || "#8b5cf6" }} />
                                <span className="text-[10px] text-white/40 font-medium uppercase tracking-wide truncate">{idea.category || "Other"}</span>
                              </div>
                              <div className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors line-clamp-2">{idea.title}</div>
                              {(idea.votes_count ?? 0) > 0 && (
                                <div className="flex items-center gap-1 mt-2 text-green-400 text-[10px] font-medium">
                                  <ChevronUp className="w-3 h-3" />{idea.votes_count}
                                </div>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                  {activePanel === "chat" && (
                    <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <ChatPanel sessionId={id} />
                    </motion.div>
                  )}
                  {activePanel === "ai" && (
                    <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-auto">
                      <AIAssistantPanel isOpen={true} onClose={() => setActivePanel(null)} />
                    </motion.div>
                  )}
                  {activePanel === "analytics" && (
                    <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-auto">
                      <AIAnalyticsPanel ideas={analyticsIdeas} sessionTitle={session?.title || "Brainstorming Session"} onMergeIdeas={handleMergeIdeas} />
                    </motion.div>
                  )}
                  {activePanel === "transcript" && (
                    <motion.div key="transcript" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <VoiceTranscriptTab sessionId={id} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BOTTOM TOOLBAR */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", damping: 20 }}
            className="flex items-center gap-1 px-2 py-2 rounded-2xl shadow-2xl border border-white/15"
            style={{ backgroundColor: "rgba(26,24,37,0.95)", backdropFilter: "blur(20px)" }}
          >
            {bottomTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activePanel === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => togglePanel(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                    isActive
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      : "text-white/50 hover:text-white/80 hover:bg-white/8"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block">{tab.label}</span>
                  {tab.id === "ideas" && ideas.length > 0 && (
                    <span className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                      {ideas.length}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-indigo-500/10 rounded-xl"
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      <CreateIdeaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        sessionId={id}
      />
      <CommentDrawer
        isOpen={!!activeCommentIdea}
        ideaId={activeCommentIdea?.id || ""}
        ideaTitle={activeCommentIdea?.title || ""}
        onClose={() => setActiveCommentIdea(null)}
      />
      <EvaluationModal
        isOpen={!!activeEvaluateIdea}
        ideaId={activeEvaluateIdea?.id || ""}
        ideaTitle={activeEvaluateIdea?.title || ""}
        ideaDescription={activeEvaluateIdea?.description || ""}
        currentScores={activeEvaluateIdea?.scores}
        onClose={() => setActiveEvaluateIdea(null)}
      />
      <EvolutionTimeline
        isOpen={!!activeTimelineIdea}
        ideaId={activeTimelineIdea?.id || ""}
        ideaTitle={activeTimelineIdea?.title || ""}
        onClose={() => setActiveTimelineIdea(null)}
      />
    </div>
  );
}
