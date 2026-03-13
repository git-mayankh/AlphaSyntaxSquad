"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, LogIn, MessageSquare, Users, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CreateSharedChatModal } from "@/components/shared-chat/CreateSharedChatModal";
import { JoinSharedChatModal } from "@/components/shared-chat/JoinSharedChatModal";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SharedChatListPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const supabase = createSupabaseClient();
  const router = useRouter();

  const { data: chats, isLoading } = useQuery({
    queryKey: ["shared-chats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all chat IDs the user is a member of
      const { data: memberships } = await supabase
        .from("shared_chat_members")
        .select("chat_id")
        .eq("user_id", user.id);

      if (!memberships || memberships.length === 0) return [];

      const chatIds = memberships.map((m) => m.chat_id);

      // Get the chats with member counts
      const { data: chatData, error } = await supabase
        .from("shared_chats")
        .select(`
          id, title, invite_code, created_by, created_at,
          shared_chat_members(count),
          shared_chat_messages(content, is_ai, created_at)
        `)
        .in("id", chatIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return chatData || [];
    },
  });

  const copyCode = (code: string, chatId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(chatId);
    toast.success("Invite code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const colorPalette = [
    "from-indigo-500/20 to-purple-500/20 border-indigo-500/25",
    "from-cyan-500/20 to-blue-500/20 border-cyan-500/25",
    "from-amber-500/20 to-orange-500/20 border-amber-500/25",
    "from-green-500/20 to-emerald-500/20 border-green-500/25",
    "from-pink-500/20 to-rose-500/20 border-pink-500/25",
  ];

  return (
    <div className="p-8 md:p-10 max-w-[1400px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="font-display font-bold text-[32px] text-text-primary tracking-tight mb-2">
            Shared AI Chat
          </h1>
          <p className="text-text-secondary">
            Collaborate with your team in real-time AI-powered chat rooms.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<LogIn className="w-4 h-4" />}
            onClick={() => setJoinModalOpen(true)}
          >
            Join Chat
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateModalOpen(true)}
            className="shadow-glow-indigo"
          >
            New Chat Room
          </Button>
        </div>
      </div>

      {/* Chat List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : chats && chats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {chats.map((chat: any, i: number) => {
            const memberCount = Array.isArray(chat.shared_chat_members)
              ? chat.shared_chat_members.length
              : chat.shared_chat_members?.[0]?.count || 0;

            // Get the last message
            const messages = Array.isArray(chat.shared_chat_messages) ? chat.shared_chat_messages : [];
            const lastMessage = messages.sort(
              (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];

            return (
              <motion.div
                key={chat.id}
                initial={{ y: 30, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06, type: "spring", damping: 25 }}
              >
                <div
                  onClick={() => router.push(`/shared-chat/${chat.id}`)}
                  className={`group glass-card rounded-2xl p-5 cursor-pointer hover:border-border-strong hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 h-full relative overflow-hidden`}
                >
                  {/* Decorative gradient */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorPalette[i % colorPalette.length].split(' ').slice(0, 2).join(' ')} opacity-60`} />

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorPalette[i % colorPalette.length]} flex items-center justify-center`}>
                        <MessageSquare className="w-5 h-5 text-text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-text-primary text-lg leading-tight">
                          {chat.title}
                        </h3>
                        <p className="text-xs text-text-tertiary mt-0.5 flex items-center gap-1.5">
                          <Users className="w-3 h-3" />
                          {memberCount} {memberCount === 1 ? "member" : "members"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Last message preview */}
                  {lastMessage ? (
                    <div className="bg-bg-base/60 rounded-lg p-3 border border-border-subtle">
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {lastMessage.is_ai && (
                          <span className="text-indigo-500 font-semibold mr-1">AI:</span>
                        )}
                        {lastMessage.content}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-bg-base/60 rounded-lg p-3 border border-border-subtle border-dashed">
                      <p className="text-xs text-text-disabled italic">No messages yet. Start chatting!</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="text-[10px] text-text-disabled">
                      Created {new Date(chat.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyCode(chat.invite_code, chat.id);
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-text-tertiary bg-bg-base px-2.5 py-1 rounded-md border border-border-subtle hover:border-indigo-500/30 hover:text-indigo-500 transition-colors"
                    >
                      {copiedId === chat.id ? (
                        <><Check className="w-3 h-3" /> Copied</>
                      ) : (
                        <><Copy className="w-3 h-3" /> {chat.invite_code}</>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl max-w-2xl mx-auto border-dashed border-border-default">
          <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mb-6">
            <MessageSquare className="w-10 h-10 text-indigo-500" />
          </div>
          <h2 className="font-display font-bold text-xl text-text-primary mb-2">
            No shared chats yet
          </h2>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">
            Create a new chat room or join an existing one with an invite code to start collaborating with AI.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              icon={<LogIn className="w-4 h-4" />}
              onClick={() => setJoinModalOpen(true)}
            >
              Join with Code
            </Button>
            <Button
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setCreateModalOpen(true)}
            >
              Create Chat Room
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateSharedChatModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
      <JoinSharedChatModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
    </div>
  );
}
