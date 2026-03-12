"use client";

import React, { useEffect, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

export default function ExportIdeaPage({ params }: { params: Promise<{ id: string, ideaId: string }> }) {
  const { id, ideaId } = use(params);
  const supabase = createSupabaseClient();

  // Fetch Idea Data
  const { data: idea, isLoading: isIdeaLoading } = useQuery({
    queryKey: ["idea", ideaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideas")
        .select("*, author:profiles!ideas_author_id_fkey(*)")
        .eq("id", ideaId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch Session Data
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sessions").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch History
  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["history", ideaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("idea_history").select("*").eq("idea_id", ideaId).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (!isIdeaLoading && !isSessionLoading && !isHistoryLoading && idea && session) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [isIdeaLoading, isSessionLoading, isHistoryLoading, idea, session]);

  if (isIdeaLoading || isSessionLoading || isHistoryLoading) {
    return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  if (!idea) return <div className="p-10 text-center">Idea not found.</div>;

  const authorName = Array.isArray(idea.author) ? idea.author[0]?.name : (idea.author?.name || "Unknown Author");
  const authorAvatar = Array.isArray(idea.author) ? idea.author[0]?.avatar_url : idea.author?.avatar_url;

  return (
    <div className="bg-white min-h-screen text-black font-sans p-10 max-w-4xl mx-auto print:p-0 print:max-w-none">
      {/* HEADER */}
      <div className="border-b border-gray-200 pb-8 mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black font-display tracking-tight text-gray-900 mb-2">{idea.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-2">
              <Avatar name={authorName} src={authorAvatar} size="sm" />
              {authorName}
            </span>
            <span>•</span>
            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">{idea.category}</span>
            <span>•</span>
            <span>{new Date(idea.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold font-display text-indigo-600 mb-1">IdeaForge Concept</div>
          <div className="text-sm text-gray-500 font-medium">Session: {session?.title}</div>
        </div>
      </div>

      {/* BODY */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 font-display text-gray-800 flex items-center gap-2">
          Concept Description
          {idea.is_ai_generated && <Sparkles className="w-5 h-5 text-indigo-500" />}
        </h2>
        <div 
          className="prose prose-indigo max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: idea.description }}
        />
      </div>

      {/* METRICS */}
      {(idea.feasibility_score || idea.market_score || idea.innovation_score) && (
        <div className="mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <h2 className="text-lg font-bold mb-4 font-display text-gray-800">Evaluation Scores</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Feasibility</div>
              <div className="text-3xl font-black text-green-600">{idea.feasibility_score || '-'}<span className="text-lg text-gray-400 font-medium">/10</span></div>
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Market Potential</div>
              <div className="text-3xl font-black text-blue-600">{idea.market_score || '-'}<span className="text-lg text-gray-400 font-medium">/10</span></div>
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Innovation</div>
              <div className="text-3xl font-black text-purple-600">{idea.innovation_score || '-'}<span className="text-lg text-gray-400 font-medium">/10</span></div>
            </div>
          </div>
        </div>
      )}

      {/* TIMELINE */}
      {history && history.length > 0 && (
        <div className="mb-10 break-inside-avoid">
          <h2 className="text-xl font-bold mb-6 font-display text-gray-800">Evolution Timeline</h2>
          <div className="flex flex-col gap-4 pl-4 border-l-2 border-gray-200 ml-2">
            {history.map((h: any) => (
              <div key={h.id} className="relative">
                <div className="absolute -left-[25px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-4 border-white" />
                <div className="mb-1">
                  <span className="font-bold text-sm text-gray-900 capitalize mr-3">{h.action_type.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-500 font-medium">{new Date(h.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{h.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-16 pt-6 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500 font-medium print:fixed print:bottom-10 print:left-10 print:right-10 print:border-t-0 print:pt-0">
        <div>Generated by IdeaForge</div>
        <div>{new Date().toLocaleDateString()}</div>
      </div>
{/* Style overrides for print to hide browser UI tools, buttons, etc. */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1.5cm; }
        }
      `}} />
    </div>
  );
}
