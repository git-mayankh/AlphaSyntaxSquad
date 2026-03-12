"use client";

import { use, useState, useCallback, useMemo, useRef } from "react";
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
import { createSupabaseClient } from "@/lib/supabase/client";
import { Loader2, Plus, MessageCircle, Brain, Sparkles, LayoutList, LayoutGrid, History, Search, TrendingUp, Mic } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

type RightPanelTab = "chat" | "ai" | "analytics" | "transcript";

const categories = [
  { id: "Core Feature", name: "Core Feature", color: "var(--cat-core)" },
  { id: "Monetization", name: "Monetization", color: "var(--cat-money)" },
  { id: "Growth", name: "Growth", color: "var(--cat-growth)" },
  { id: "Other", name: "Other", color: "var(--cat-other)" },
];

export default function SessionBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createSupabaseClient();

  // Reference to canvas for panning
  const canvasRef = useRef<any>(null);

  // UI State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanelTab>("chat");
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [activeCommentIdea, setActiveCommentIdea] = useState<{ id: string; title: string } | null>(null);
  const [activeEvaluateIdea, setActiveEvaluateIdea] = useState<{ id: string; title: string; scores: any } | null>(null);
  const [activeTimelineIdea, setActiveTimelineIdea] = useState<{ id: string; title: string } | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Data
  const { data: session, isLoading: isSessionLoading } = useSessionData(id);
  const { data: ideas = [], isLoading: isIdeasLoading } = useIdeas(id);

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
    }
  };

  // Handlers
  const handleCommentOpen = (ideaId: string, title: string) => setActiveCommentIdea({ id: ideaId, title });
  const handleTimelineOpen = (ideaId: string, title: string) => setActiveTimelineIdea({ id: ideaId, title });
  const handleEvaluateOpen = (idea: any) => setActiveEvaluateIdea({
    id: idea.id, title: idea.title,
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
    timeAgo: new Date(idea.created_at).toLocaleDateString(),
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
    // Canvas position
    position: idea.position || { x: 100 + (i % 3) * 380, y: 60 + Math.floor(i / 3) * 300 },
  }));

  const analyticsIdeas = ideas.map((i: any) => ({
    id: i.id, title: i.title, description: i.description, votes: i.votes_count
  }));

  const rightPanelTabs: { id: RightPanelTab; label: string; icon: React.ElementType }[] = [
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "ai", label: "AI", icon: Sparkles },
    { id: "analytics", label: "Analytics", icon: Brain },
  ];

  return (
    <div className="h-screen w-full bg-bg-base flex flex-col overflow-hidden selection:bg-indigo-500/30">
      
      {/* TOP BAR */}
      <SessionTopBar
        sessionId={id}
        sessionTitle={session?.title || "Loading..."}
        inviteCode={(session as any)?.invite_code}
        onToggleAi={() => { setRightPanel("ai"); setIsRightPanelOpen(true); }}
        onToggleVoice={() => { setRightPanel("transcript"); setIsRightPanelOpen(true); }}
        isVoiceActive={rightPanel === "transcript" && isRightPanelOpen}
        isAiOpen={rightPanel === "ai" && isRightPanelOpen}
      />

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex pt-14 overflow-hidden">

        {/* ===== LEFT SIDEBAR: Idea List ===== */}
        <aside className="w-[280px] shrink-0 bg-bg-surface border-r border-border-subtle flex flex-col overflow-hidden z-10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
          <div className="px-4 py-3 border-b border-border-subtle flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Ideas ({filteredIdeas.length})</span>
            </div>
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-disabled" />
              <input
                type="text"
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-bg-base border border-border-subtle rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary outline-none focus:border-indigo-500/50 transition-colors placeholder:text-text-disabled"
              />
            </div>
            {/* Filters */}
            <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2.5 py-1 rounded-md text-[10px] whitespace-nowrap transition-colors font-medium border ${!selectedCategory ? 'bg-bg-elevated text-text-primary border-border-strong' : 'bg-bg-base text-text-secondary border-border-subtle hover:border-border-default'}`}
              >
                All
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] whitespace-nowrap transition-colors font-medium border ${selectedCategory === c.id ? 'bg-bg-elevated border-border-strong text-text-primary' : 'bg-bg-base text-text-secondary border-border-subtle hover:border-border-default'}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
            {isIdeasLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div>
            ) : filteredIdeas.length === 0 ? (
              <div className="text-center py-8 text-text-disabled text-xs">No ideas found</div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredIdeas.map((idea: any, i: number) => (
                  <motion.button
                    key={idea.id}
                    onClick={() => handlePanToIdea(idea.id)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-transparent hover:bg-bg-hover hover:border-border-subtle transition-all group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: `var(--cat-${(idea.category || "other").toLowerCase()})` }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] font-medium text-text-secondary group-hover:text-text-primary transition-colors leading-snug line-clamp-2 mb-1 block">
                          {idea.title}
                        </span>
                        <div className="flex items-center gap-2">
                          {idea.is_ai_generated && (
                            <span className="text-[9px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> AI
                            </span>
                          )}
                          {(idea.votes_count ?? 0) > 0 && (
                            <span className="text-[10px] font-medium text-text-tertiary flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {idea.votes_count}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ===== CENTER: CANVAS ===== */}
        <main className="flex-1 overflow-hidden relative">
          {isIdeasLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : (
            <IdeaCanvas
              ref={canvasRef}
              ideas={ideaNodes}
              onAddIdea={() => setIsCreateModalOpen(true)}
              onPositionChange={handlePositionChange}
            />
          )}

          {/* Floating Add Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-glow-indigo hover:bg-indigo-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Idea
          </motion.button>
        </main>

        {/* ===== RIGHT PANEL ===== */}
        <AnimatePresence>
          {isRightPanelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="shrink-0 bg-bg-surface border-l border-border-subtle flex flex-col overflow-hidden"
            >
              {/* Panel Tab Bar */}
              <div className="flex border-b border-border-subtle shrink-0">
                {[
                  { id: "chat", label: "Chat", icon: MessageCircle },
                  { id: "ai", label: "AI", icon: Sparkles },
                  { id: "analytics", label: "Analytics", icon: Brain },
                  { id: "transcript", label: "Transcript", icon: Mic },
                ].map((tab: any) => (
                  <button
                    key={tab.id}
                    onClick={() => setRightPanel(tab.id as RightPanelTab)}
                    className={cn(
                      "flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all border-b-2",
                      rightPanel === tab.id
                        ? "border-indigo-500 text-indigo-400"
                        : "border-transparent text-text-tertiary hover:text-text-primary"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                  </button>
                ))}
                <button
                  onClick={() => setIsRightPanelOpen(false)}
                  className="px-3 py-2.5 text-text-disabled hover:text-text-primary transition-colors text-xs border-b-2 border-transparent"
                  title="Close panel"
                >✕</button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {rightPanel === "chat" && (
                    <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <ChatPanel sessionId={id} />
                    </motion.div>
                  )}
                  {rightPanel === "ai" && (
                    <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-auto">
                      <AIAssistantPanel isOpen={true} onClose={() => setRightPanel("chat")} />
                    </motion.div>
                  )}
                  {rightPanel === "analytics" && (
                    <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <AIAnalyticsPanel ideas={analyticsIdeas} sessionTitle={session?.title || "Brainstorming Session"} onMergeIdeas={handleMergeIdeas} />
                    </motion.div>
                  )}
                  {rightPanel === "transcript" && (
                    <motion.div key="transcript" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <VoiceTranscriptTab sessionId={id} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Re-open panel button when closed */}
        {!isRightPanelOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsRightPanelOpen(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-16 bg-bg-elevated border border-border-default rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:border-indigo-500/40 transition-colors shadow-lg"
          >
            <LayoutGrid className="w-4 h-4" />
          </motion.button>
        )}
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
        currentScores={activeEvaluateIdea?.scores}
        onClose={() => setActiveEvaluateIdea(null)}
      />
      <EvolutionTimeline
        isOpen={!!activeTimelineIdea}
        ideaId={activeTimelineIdea?.id || ""}
        ideaTitle={activeTimelineIdea?.title || ""}
        onClose={() => setActiveTimelineIdea(null)}
      />

      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.2);border-radius:4px}`}} />
    </div>
  );
}
