"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface ChatPanelProps {
  sessionId: string;
}

export const ChatPanel = ({ sessionId }: ChatPanelProps) => {
  const supabase = createSupabaseClient();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar_url?: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load current user
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("id, name, avatar_url").eq("id", user.id).single();
      if (data) setCurrentUser(data);
    };
    load();
  }, []);

  // Fetch messages with author profiles
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, author:profiles!messages_author_id_fkey(id, name, avatar_url)")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: false,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `session_id=eq.${sessionId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", sessionId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !currentUser || sending) return;
    setSending(true);
    try {
      await supabase.from("messages").insert({
        session_id: sessionId,
        author_id: currentUser.id,
        content: message.trim(),
      });
      setMessage("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-surface">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-semibold text-text-primary">Session Chat</span>
        <span className="ml-auto text-xs text-text-tertiary">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-text-disabled">
            <MessageCircle className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg: any) => {
              const isMe = msg.author_id === currentUser?.id;
              const author = Array.isArray(msg.author) ? msg.author[0] : msg.author;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar name={author?.name || "?"} src={author?.avatar_url} size="sm" />
                  <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                    <span className="text-[10px] text-text-tertiary px-1">
                      {isMe ? "You" : author?.name}
                    </span>
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-indigo-500 text-white rounded-tr-sm"
                        : "bg-bg-elevated border border-border-subtle text-text-primary rounded-tl-sm"
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-text-disabled px-1">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border-subtle">
        <div className="flex items-center gap-2 bg-bg-base border border-border-default rounded-xl px-3 py-2 focus-within:border-indigo-500/60 transition-colors">
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Message..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-disabled outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center disabled:opacity-40 hover:bg-indigo-600 transition-colors"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.2);border-radius:4px}`}} />
    </div>
  );
};
