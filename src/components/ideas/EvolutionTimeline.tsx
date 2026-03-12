"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { useQuery } from "@tanstack/react-query";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Loader2, Sparkles, Plus, CheckCircle2, MessageSquare } from "lucide-react";

export const EvolutionTimeline = ({ isOpen, onClose, ideaId, ideaTitle }: { isOpen: boolean; onClose: () => void; ideaId: string; ideaTitle: string }) => {
  const supabase = createSupabaseClient();

  const { data: history, isLoading } = useQuery({
    queryKey: ["history", ideaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("idea_history")
        .select("*")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!ideaId
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'created': return <Plus className="w-3.5 h-3.5" />;
      case 'ai_improved': return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
      case 'merged': return <MessageSquare className="w-3.5 h-3.5 text-blue-400" />;
      case 'finalized': return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
      default: return <div className="w-2 h-2 rounded-full bg-text-tertiary" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Evolution Timeline">
      <div className="p-6 bg-bg-base flex flex-col gap-6">
        <div>
          <h3 className="font-bold text-text-primary line-clamp-2 md:text-[16px]">{ideaTitle}</h3>
          <p className="text-[13px] text-text-tertiary mt-1">Journey from concept to final idea.</p>
        </div>

        {isLoading ? (
          <div className="h-32 flex justify-center items-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
        ) : (
          <div className="flex flex-col gap-5 relative pl-4 border-l border-border-default ml-2 mt-4 pb-4">
            {!history || history.length === 0 ? (
               <div className="text-sm text-text-secondary py-4 italic">No history recorded yet.</div>
            ) : (
               history.map((h: any, i: number) => (
                 <div key={h.id} className="relative">
                   <div className="absolute -left-[29px] top-1 w-7 h-7 rounded-full bg-bg-base border border-border-strong shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center z-10">
                     {getIcon(h.action_type)}
                   </div>
                   <div className="bg-bg-surface p-3 md:p-4 rounded-xl border border-border-subtle shadow-[var(--shadow-card)]">
                     <div className="flex justify-between items-center mb-1.5">
                       <span className="font-semibold text-[13px] md:text-[14px] text-text-primary capitalize tracking-tight">{h.action_type.replace('_', ' ')}</span>
                       <span className="text-[11px] text-text-tertiary font-medium">{new Date(h.created_at).toLocaleDateString()}</span>
                     </div>
                     <p className="text-[13px] leading-relaxed text-text-secondary">{h.description}</p>
                   </div>
                 </div>
               ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
