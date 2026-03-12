"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, Send, Heart } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils/cn";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ideaId: string;
  ideaTitle: string;
}

export const CommentDrawer = ({ isOpen, onClose, ideaId, ideaTitle }: CommentDrawerProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createSupabaseClient();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", ideaId],
    queryFn: async () => {
      if (!ideaId) return [];
      const { data, error } = await supabase
        .from("idea_comments")
        .select(`
          id, text, created_at,
          author:profiles!idea_comments_author_id_fkey(name, avatar_url)
        `)
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: true });
        
      if (error) throw error;
      
      return data.map((c: any) => ({
         id: c.id,
         text: c.text,
         timeAgo: new Date(c.created_at).toLocaleDateString(),
         author: Array.isArray(c.author) ? c.author[0]?.name : (c.author?.name || "Unknown"),
         avatar: Array.isArray(c.author) ? c.author[0]?.avatar_url : c.author?.avatar_url
      }));
    },
    enabled: !!ideaId && isOpen,
  });

  useEffect(() => {
    if (!ideaId || !isOpen) return;
    const channel = supabase.channel(`comments-${ideaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "idea_comments", filter: `idea_id=eq.${ideaId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["comments", ideaId] });
        queryClient.invalidateQueries({ queryKey: ["ideas"] }); // update comments count in board
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [ideaId, isOpen, queryClient, supabase]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || !ideaId) return;
    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast.error("Please sign in to comment.");
        return;
      }
      
      const { error } = await supabase.from("idea_comments").insert({
        idea_id: ideaId,
        author_id: userData.user.id,
        text: inputValue.trim()
      });
      
      if (error) throw error;
      setInputValue("");
      queryClient.invalidateQueries({ queryKey: ["comments", ideaId] });
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] lg:w-[340px] bg-bg-surface border-l border-border-default shadow-[var(--shadow-modal)] z-50 flex flex-col"
          >
            {/* HEADER */}
            <div className="p-5 border-b border-border-default flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-[18px] font-bold text-text-primary">Discussion</h3>
                <button 
                  onClick={onClose}
                  className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[13px] text-text-secondary line-clamp-1 mt-1 font-medium">{ideaTitle}</p>
            </div>

            {/* COMMENTS LIST */}
            <div className="flex-1 overflow-y-auto p-5 pb-24">
              <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-6">
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  </div>
                ) : (comments?.length === 0) ? (
                  <div className="text-center text-text-tertiary text-sm py-4">
                    No comments yet. Be the first to start the discussion!
                  </div>
                ) : (
                  (comments || []).map((c: any) => (
                    <div key={c.id} className="flex gap-3 relative group">
                      <Avatar name={c.author} src={c.avatar} size="md" className="shrink-0 group-hover:scale-105 transition-transform" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-sans font-bold text-[14px] text-text-primary">{c.author}</span>
                          <span className="text-[12px] text-text-tertiary">{c.timeAgo}</span>
                        </div>
                        <p className="text-[14px] text-text-secondary leading-relaxed">{c.text}</p>
                        <div className="flex items-center gap-3 mt-2 text-[12px] font-medium text-text-tertiary">
                          <button className="hover:text-indigo-400 transition-colors">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              </div>
            </div>

            {/* INPUT AREA */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg-surface/95 backdrop-blur-md border-t border-border-subtle">
              <div className="flex gap-3 items-end">
                <Avatar name="Sarah J" size="md" className="mb-px shrink-0" />
                <div className="relative flex-1">
                  <textarea
                    rows={1}
                    placeholder="Write a comment..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    className="w-full bg-bg-elevated border border-border-default rounded-[20px] py-2.5 pl-4 pr-12 text-[14px] text-text-primary placeholder:text-text-disabled outline-none focus:border-indigo-500/50 resize-none min-h-[44px] max-h-[120px] transition-colors overflow-hidden flex items-center"
                  />
                  <button 
                    onClick={handleSubmit}
                    className={cn(
                      "absolute right-1.5 top-1.5 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      inputValue.trim() && !isSubmitting
                        ? "bg-indigo-500 text-white shadow-glow-indigo hover:bg-indigo-600 hover:scale-105" 
                        : "bg-bg-elevated text-text-tertiary cursor-not-allowed opacity-50"
                    )}
                    disabled={!inputValue.trim() || isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-[-1px]" />}
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
