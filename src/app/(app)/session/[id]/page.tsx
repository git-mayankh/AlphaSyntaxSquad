"use client";
import { use } from "react";

import React, { useState } from "react";
import { SessionHeader } from "@/components/layout/SessionHeader";
import { Toolbar } from "@/components/layout/Toolbar";
import { FilterSidebar } from "@/components/layout/FilterSidebar";
import { IdeaBoard } from "@/components/ideas/IdeaBoard";
import { IdeaCardProps } from "@/components/ideas/IdeaCard";
import { CreateIdeaModal } from "@/components/ideas/CreateIdeaModal";
import { CommentDrawer } from "@/components/ideas/CommentDrawer";
import { EvaluationModal } from "@/components/ideas/EvaluationModal";
import { EvolutionTimeline } from "@/components/ideas/EvolutionTimeline";
import { cn } from "@/lib/utils/cn";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { useIdeas } from "@/hooks/useIdeas";
import { useSessionData } from "@/hooks/useSessionData";
import { Loader2 } from "lucide-react";

export default function SessionBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCommentIdea, setActiveCommentIdea] = useState<{ id: string, title: string } | null>(null);
  const [activeEvaluateIdea, setActiveEvaluateIdea] = useState<{ id: string, title: string, scores: any } | null>(null);
  const [activeTimelineIdea, setActiveTimelineIdea] = useState<{ id: string, title: string } | null>(null);

  const { data: session, isLoading: isSessionLoading } = useSessionData(id);
  const { data: ideas, isLoading: isIdeasLoading } = useIdeas(id);

  const handleCommentOpen = (ideaId: string, title: string) => setActiveCommentIdea({ id: ideaId, title });
  const handleTimelineOpen = (ideaId: string, title: string) => setActiveTimelineIdea({ id: ideaId, title });
  const handleEvaluateOpen = (idea: any) => setActiveEvaluateIdea({ 
    id: idea.id, title: idea.title, 
    scores: { feasibility: idea.feasibility_score, market: idea.market_score, innovation: idea.innovation_score } 
  });

  const mappedIdeas = (ideas || []).map(idea => ({
    id: idea.id,
    title: idea.title,
    description: idea.description || "",
    category: {
      id: idea.category || "Other",
      name: idea.category || "Other",
      color: `var(--cat-${(idea.category || "other").toLowerCase()})`
    },
    status: (idea.status as "open" | "shortlisted" | "selected") || "open",
    tags: [],
    author: idea.author ? { name: idea.author.name || "Unknown", avatar: idea.author.avatar_url || undefined } : { name: "Unknown" },
    timeAgo: new Date(idea.created_at).toLocaleDateString(),
    votes: idea.votes_count,
    comments: 0,
    reactions: 0,
    isAiGenerated: idea.is_ai_generated || false,
    scores: { feasibility: idea.feasibility_score, market: idea.market_score, innovation: idea.innovation_score },
    onComment: () => handleCommentOpen(idea.id, idea.title),
    onEvaluate: () => handleEvaluateOpen(idea),
    onTimeline: () => handleTimelineOpen(idea.id, idea.title),
    onExport: () => window.open(`/session/${id}/export/${idea.id}`, "_blank")
  }));

  return (
    <div className="h-screen w-full bg-bg-base bg-grid flex flex-col relative overflow-hidden selection:bg-indigo-500/30">
      
      <SessionHeader onToggleAi={() => setIsAiPanelOpen(!isAiPanelOpen)} />
      
      <Toolbar onAddIdea={() => setIsCreateModalOpen(true)} />

      <div className="flex-1 mt-[120px] flex relative">
        <FilterSidebar />
        
        <main className={cn(
          "flex-1 overflow-y-auto lg:ml-[220px] relative custom-scrollbar transition-all duration-300",
          isAiPanelOpen ? "mr-[400px]" : "mr-0"
        )}>
          <div className="p-6 md:p-8">
            {isIdeasLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <IdeaBoard ideas={mappedIdeas} />
            )}
          </div>
        </main>
      </div>

      <AIAssistantPanel isOpen={isAiPanelOpen} onClose={() => setIsAiPanelOpen(false)} />

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

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 6px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); }
      `}} />

    </div>
  );
}
