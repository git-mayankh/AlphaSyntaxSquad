"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface JoinSharedChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinSharedChatModal = ({ isOpen, onClose }: JoinSharedChatModalProps) => {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      toast.error("Please enter an invite code");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be signed in.");
        return;
      }

      // Find the chat by invite code
      const { data: chat, error: findError } = await supabase
        .from("shared_chats")
        .select("id, title")
        .eq("invite_code", trimmedCode)
        .single();

      if (findError || !chat) {
        toast.error("Invalid invite code. Chat not found.");
        setLoading(false);
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from("shared_chat_members")
        .select("chat_id")
        .eq("chat_id", chat.id)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        toast.success(`Already a member! Opening "${chat.title}"...`);
        onClose();
        router.push(`/shared-chat/${chat.id}`);
        return;
      }

      // Join the chat
      const { error: joinError } = await supabase.from("shared_chat_members").insert({
        chat_id: chat.id,
        user_id: user.id,
      });

      if (joinError) throw joinError;

      toast.success(`Joined "${chat.title}"! 🎉`);
      setCode("");
      onClose();
      router.push(`/shared-chat/${chat.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to join chat room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Shared Chat">
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
        <Input
          autoFocus
          label="Invite Code *"
          placeholder="Enter 8-character invite code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={8}
          required
        />
        <p className="text-xs text-text-tertiary -mt-3 px-1">
          Ask the chat creator for their invite code to join the conversation.
        </p>
        <div className="mt-2 flex flex-col gap-3">
          <Button type="submit" className="w-full" loading={loading}>
            Join Chat Room <span className="ml-1">→</span>
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] text-text-tertiary hover:text-text-primary transition-colors text-center w-full"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};
