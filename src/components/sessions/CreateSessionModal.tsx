"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrgId?: string | null;
}

export const CreateSessionModal = ({ isOpen, onClose, defaultOrgId }: CreateSessionModalProps) => {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Product");

  const categories = [
    { id: "Product", color: "var(--cat-product)" },
    { id: "Technology", color: "var(--cat-tech)" },
    { id: "Design", color: "var(--cat-design)" },
    { id: "Marketing", color: "var(--cat-marketing)" },
    { id: "Other", color: "var(--cat-other)" },
  ];

  // Generate a random 8-character invite code
  const generateInviteCode = () =>
    Math.random().toString(36).substring(2, 10).toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a session title");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be signed in to create a session.");
        router.push("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("sessions")
        .insert({
          title: title.trim(),
          problem_statement: problemStatement.trim() || null,
          category: selectedCategory,
          status: "active",
          invite_code: generateInviteCode(),
          created_by: user.id,
          organization_id: defaultOrgId || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Session created! 🎉");
      setTitle("");
      setProblemStatement("");
      onClose();
      router.push(`/session/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start a New Session" maxWidth="xl">
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
        
        <Input 
          autoFocus
          label="Session Title *"
          placeholder="e.g. Q1 Product Feature Brainstorm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        
        <div className="w-full flex flex-col gap-1.5 text-left">
          <label className="text-[13px] text-text-tertiary font-medium px-1">
            Topic / Problem Statement
          </label>
          <textarea 
            rows={3} 
            placeholder="What challenge are you trying to solve?"
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            className="w-full bg-bg-surface border border-border-default rounded-md text-text-primary px-4 py-3 placeholder:text-text-disabled outline-none transition-all duration-150 ease-out resize-none focus:border-border-accent focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
          />
        </div>

        <div className="w-full flex flex-col gap-1.5 text-left">
          <label className="text-[13px] text-text-tertiary font-medium px-1">
            Category
          </label>
          <div className="relative">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-bg-surface border border-border-default rounded-md text-text-primary px-4 py-3 appearance-none outline-none focus:border-border-accent focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%239090B0%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[position:calc(100%-12px)_center] bg-no-repeat"
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
            </select>
            <div 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none" 
              style={{ backgroundColor: categories.find(c => c.id === selectedCategory)?.color }}
            />
          </div>
          <style dangerouslySetInnerHTML={{__html: `select { padding-left: 28px !important; text-transform: capitalize; }`}} />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <Button type="submit" className="w-full" loading={loading}>
            Create Session <span className="ml-1">→</span>
          </Button>
          <button type="button" onClick={onClose} className="text-[13px] text-text-tertiary hover:text-text-primary transition-colors text-center w-full">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};
