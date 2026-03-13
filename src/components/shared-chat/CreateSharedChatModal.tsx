"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateSharedChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSharedChatModal = ({ isOpen, onClose }: CreateSharedChatModalProps) => {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");

  const generateInviteCode = () =>
    Math.random().toString(36).substring(2, 10).toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a chat name");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be signed in.");
        return;
      }

      const inviteCode = generateInviteCode();

      const { data, error } = await supabase
        .from("shared_chats")
        .insert({
          title: title.trim(),
          invite_code: inviteCode,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join the creator as a member
      await supabase.from("shared_chat_members").insert({
        chat_id: data.id,
        user_id: user.id,
      });

      toast.success("Chat room created! 🎉");
      setTitle("");
      onClose();
      router.push(`/shared-chat/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create chat room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Shared Chat">
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
        <Input
          autoFocus
          label="Chat Room Name *"
          placeholder="e.g. Team Brainstorm, Design Review..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <p className="text-xs text-text-tertiary -mt-3 px-1">
          A unique invite code will be generated automatically so others can join.
        </p>
        <div className="mt-2 flex flex-col gap-3">
          <Button type="submit" className="w-full" loading={loading}>
            Create Chat Room <span className="ml-1">→</span>
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
