"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Copy,
  Check,
  ArrowLeft,
  Users,
  Loader2,
  Bot,
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { toast } from "sonner";

interface Message {
  id: string;
  chat_id: string;
  author_id: string | null;
  content: string;
  is_ai: boolean;
  created_at: string;
  author?: { name: string; avatar_url: string | null } | null;
}

interface ChatMember {
  user_id: string;
  profile?: { name: string; avatar_url: string | null };
}

export default function SharedChatRoomPage() {
  const params = useParams();
  const chatId = params.id as string;
  const router = useRouter();
  const supabase = createSupabaseClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profilesMap, setProfilesMap] = useState<Record<string, { name: string; avatar_url: string | null }>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load chat info, members, messages
  useEffect(() => {
    const loadChat = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setCurrentUser(user);

      // Get chat info
      const { data: chat } = await supabase
        .from("shared_chats")
        .select("*")
        .eq("id", chatId)
        .single();

      if (!chat) {
        toast.error("Chat not found");
        router.push("/shared-chat");
        return;
      }
      setChatInfo(chat);

      // Get members
      const { data: membersData } = await supabase
        .from("shared_chat_members")
        .select("user_id")
        .eq("chat_id", chatId);

      if (membersData) {
        setMembers(membersData);
        // Load profiles for all members
        const userIds = membersData.map((m) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", userIds);

        if (profiles) {
          const map: Record<string, { name: string; avatar_url: string | null }> = {};
          profiles.forEach((p) => { map[p.id] = { name: p.name || "User", avatar_url: p.avatar_url }; });
          setProfilesMap(map);
        }
      }

      // Get messages
      const { data: messagesData } = await supabase
        .from("shared_chat_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (messagesData) {
        setMessages(messagesData);
      }

      setLoading(false);
    };

    loadChat();
  }, [chatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`shared-chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shared_chat_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Load profile if we don't have it
          if (newMsg.author_id && !profilesMap[newMsg.author_id]) {
            supabase
              .from("profiles")
              .select("id, name, avatar_url")
              .eq("id", newMsg.author_id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setProfilesMap((prev) => ({
                    ...prev,
                    [data.id]: { name: data.name || "User", avatar_url: data.avatar_url },
                  }));
                }
              });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shared_chat_members",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMember = payload.new as ChatMember;
          setMembers((prev) => {
            if (prev.find((m) => m.user_id === newMember.user_id)) return prev;
            return [...prev, newMember];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, profilesMap]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !currentUser) return;

    const isAiRequest = trimmed.toLowerCase().startsWith("@ai ");
    const userMessage = isAiRequest ? trimmed : trimmed;
    const aiPrompt = isAiRequest ? trimmed.slice(4).trim() : null;

    setSending(true);
    setInput("");

    try {
      // Send the user message
      const { error } = await supabase.from("shared_chat_messages").insert({
        chat_id: chatId,
        author_id: currentUser.id,
        content: userMessage,
        is_ai: false,
      });

      if (error) throw error;

      // If it's an AI request, call the AI endpoint
      if (aiPrompt) {
        setAiThinking(true);
        try {
          const historyForAI = [...messages.slice(-20), { content: userMessage, is_ai: false, author_name: profilesMap[currentUser.id]?.name || "User" }];

          const res = await fetch("/api/ai/shared-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatId,
              prompt: aiPrompt,
              history: historyForAI.map((m: any) => ({
                content: m.content,
                is_ai: m.is_ai,
                author_name: m.author_id ? (profilesMap[m.author_id]?.name || "User") : "AI",
              })),
            }),
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "AI failed to respond");
          }
        } catch (aiErr: any) {
          toast.error(aiErr.message || "AI failed to respond");
        } finally {
          setAiThinking(false);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyInviteCode = () => {
    if (chatInfo?.invite_code) {
      navigator.clipboard.writeText(chatInfo.invite_code);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-white/70 backdrop-blur-xl border-b border-border-default px-6 py-3.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/shared-chat")}
            className="p-2 -ml-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-bold text-lg text-text-primary leading-tight">
              {chatInfo?.title || "Chat Room"}
            </h1>
            <p className="text-xs text-text-tertiary flex items-center gap-1.5 mt-0.5">
              <Users className="w-3 h-3" />
              {members.length} {members.length === 1 ? "member" : "members"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Members Avatars */}
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((m) => (
              <Avatar
                key={m.user_id}
                name={profilesMap[m.user_id]?.name || "User"}
                src={profilesMap[m.user_id]?.avatar_url || undefined}
                size="sm"
                className="ring-2 ring-white"
              />
            ))}
            {members.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center text-[9px] font-bold text-text-tertiary ring-2 ring-white">
                +{members.length - 5}
              </div>
            )}
          </div>

          {/* Invite Code Button */}
          <button
            onClick={copyInviteCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-600 hover:bg-indigo-500/20 transition-colors tracking-wider"
          >
            {copied ? (
              <><Check className="w-3.5 h-3.5" /> Copied!</>
            ) : (
              <><Copy className="w-3.5 h-3.5" /> {chatInfo?.invite_code}</>
            )}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-text-primary mb-2">
              Welcome to the chat!
            </h3>
            <p className="text-text-secondary text-sm max-w-md mb-3">
              Start typing to chat with your team. Prefix any message with{" "}
              <code className="bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded text-xs font-bold">@ai</code>
              {" "}to get AI-powered responses.
            </p>
            <p className="text-text-tertiary text-xs">
              Share the invite code <span className="font-bold text-indigo-500">{chatInfo?.invite_code}</span> with your team to invite them.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isOwn = msg.author_id === currentUser?.id;
              const isAI = msg.is_ai;
              const authorName = isAI
                ? "AI Assistant"
                : msg.author_id
                  ? profilesMap[msg.author_id]?.name || "User"
                  : "Unknown";

              // Group consecutive same-author messages
              const prevMsg = i > 0 ? messages[i - 1] : null;
              const isSameAuthor = prevMsg && prevMsg.author_id === msg.author_id && prevMsg.is_ai === msg.is_ai;
              const timeDiff = prevMsg
                ? (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) / 60000
                : Infinity;
              const showHeader = !isSameAuthor || timeDiff > 5;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isOwn && !isAI ? "justify-end" : "justify-start"} ${showHeader ? "mt-4" : "mt-0.5"}`}
                >
                  <div className={`max-w-[75%] ${isOwn && !isAI ? "items-end" : "items-start"} flex flex-col`}>
                    {showHeader && (
                      <div className={`flex items-center gap-2 mb-1 ${isOwn && !isAI ? "flex-row-reverse" : ""}`}>
                        {isAI ? (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <Bot className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <Avatar
                            name={authorName}
                            src={msg.author_id ? profilesMap[msg.author_id]?.avatar_url || undefined : undefined}
                            size="sm"
                          />
                        )}
                        <span className="text-[11px] font-semibold text-text-tertiary">
                          {isOwn && !isAI ? "You" : authorName}
                        </span>
                        <span className="text-[10px] text-text-disabled">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    )}

                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        isAI
                          ? "bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-text-primary rounded-tl-md"
                          : isOwn
                            ? "bg-indigo-500 text-white rounded-tr-md"
                            : "bg-bg-elevated border border-border-subtle text-text-primary rounded-tl-md"
                      }`}
                    >
                      {isAI && (
                        <div className="flex items-center gap-1 mb-1.5 text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                          <Sparkles className="w-3 h-3" /> AI Response
                        </div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* AI Thinking Indicator */}
            <AnimatePresence>
              {aiThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start mt-4"
                >
                  <div className="max-w-[75%] flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-semibold text-text-tertiary">AI Assistant</span>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span className="text-sm text-indigo-600 font-medium">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-border-default bg-white/70 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (prefix with @ai for AI response)"
              className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 pr-12 text-sm text-text-primary placeholder:text-text-disabled outline-none focus:border-border-accent focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all"
              disabled={sending}
            />
            {input.toLowerCase().startsWith("@ai") && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
              </div>
            )}
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-indigo"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-text-disabled mt-2">
          Type <code className="bg-indigo-500/10 text-indigo-600 px-1 py-0.5 rounded font-bold">@ai your question</code> to ask AI • Press Enter to send
        </p>
      </div>
    </div>
  );
}
