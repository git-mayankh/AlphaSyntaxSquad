"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Sparkles, X, Bold, Italic, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { IdeaCard } from "./IdeaCard";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export interface CreateIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

const CATEGORIES = [
  { id: "Product", color: "var(--cat-product)", label: "Product" },
  { id: "Tech", color: "var(--cat-tech)", label: "Technology" },
  { id: "Design", color: "var(--cat-design)", label: "Design" },
  { id: "Marketing", color: "var(--cat-marketing)", label: "Marketing" },
  { id: "Operations", color: "var(--cat-operations)", label: "Operations" },
  { id: "Other", color: "var(--cat-other)", label: "Other" },
];

export const CreateIdeaModal = ({ isOpen, onClose, sessionId }: CreateIdeaModalProps) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isAiImproving, setIsAiImproving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createSupabaseClient();
  const queryClient = useQueryClient();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Describe the problem this solves, how it works, potential impact...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[150px]',
      },
    },
  });

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));
  
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^,+|,+$/g, '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleAiImprove = async () => {
    if (!editor) return;
    setIsAiImproving(true);
    try {
      const current = editor.getHTML();
      const res = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: current }),
      });
      
      const data = await res.json();
      if (res.ok && data.text) {
        editor.commands.setContent(data.text);
        toast.success("Idea improved by AI ✨");
      } else {
        toast.error(data.error || "Failed to improve idea");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setIsAiImproving(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !editor) return;
    setIsSubmitting(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast.error("Please sign in to add ideas.");
        setIsSubmitting(false);
        return;
      }

      const { data: newIdeaData, error } = await supabase.from('ideas').insert({
        session_id: sessionId,
        title: title,
        description: editor.getHTML(),
        category: category.id,
        status: 'open',
        author_id: userData.user.id,
        is_ai_generated: false
      }).select().single();
      
      if (error) throw error;

      // Fire-and-forget history log
      void (async () => {
        try {
          await supabase.from('idea_history').insert({
            idea_id: newIdeaData.id,
            action_type: 'created',
            description: `Idea proposed by ${userData.user.user_metadata?.full_name || 'User'}`
          });
        } catch { /* ignore */ }
      })();

      // Reset form state FIRST, then close & show toast
      queryClient.invalidateQueries({ queryKey: ["ideas", sessionId] });
      setIsSubmitting(false);
      setStep(1);
      setTitle("");
      editor.commands.clearContent();
      setTags([]);
      onClose();
      toast.success("Idea added successfully! 🚀");

    } catch (err: any) {
      const msg = (err as any)?.message || "Failed to add idea. Try again.";
      toast.error(msg);
      console.error("CreateIdea error:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={step === 3 ? "Review Idea" : "New Idea"} maxWidth="full" closeOnOutsideClick={false}>
      <div className="flex flex-col h-full bg-bg-base relative">
        
        {/* PROGRESS DOTS */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-2 p-4">
          {[1,2,3].map(s => (
            <div key={s} className={cn("w-2 h-2 rounded-full transition-all duration-300", step >= s ? "bg-indigo-500 w-6" : "bg-border-strong")} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center justify-center max-w-[800px] mx-auto w-full">
          
          {step === 1 && (
            <div className="w-full flex flex-col gap-12 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                  placeholder="Your idea in one line..."
                  className="w-full bg-transparent border-none text-center font-display text-[28px] md:text-[40px] font-bold text-text-primary placeholder:text-text-disabled outline-none"
                />
                <span className="absolute -bottom-6 right-0 text-[13px] text-text-tertiary transition-opacity" style={{ opacity: title ? 1 : 0 }}>
                  {title.length}/80
                </span>
              </div>

              <div className="flex flex-col items-center gap-4">
                <p className="text-text-tertiary text-sm uppercase tracking-wider font-semibold">Select Category</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300",
                        category.id === cat.id 
                          ? "bg-bg-elevated shadow-sm scale-110" 
                          : "border-border-subtle hover:border-border-default hover:bg-bg-hover text-text-secondary opacity-70 hover:opacity-100"
                      )}
                      style={{ 
                        borderColor: category.id === cat.id ? cat.color : '',
                        color: category.id === cat.id ? cat.color : ''
                      }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-[14px] font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="w-full h-full flex flex-col mt-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex-1 bg-bg-surface border border-border-default rounded-2xl overflow-hidden flex flex-col shadow-[var(--shadow-card)]">
                {/* TIPTAP TOOLBAR */}
                <div className="flex items-center gap-1 p-2 border-b border-border-default bg-bg-elevated">
                  <button onClick={() => editor?.chain().focus().toggleBold().run()} className={cn("p-2 rounded hover:bg-bg-hover transition-colors", editor?.isActive('bold') && 'bg-bg-hover text-indigo-600')}><Bold className="w-4 h-4" /></button>
                  <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={cn("p-2 rounded hover:bg-bg-hover transition-colors", editor?.isActive('italic') && 'bg-bg-hover text-indigo-600')}><Italic className="w-4 h-4" /></button>
                  <div className="w-px h-4 bg-border-strong mx-1" />
                  <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={cn("p-2 rounded hover:bg-bg-hover transition-colors", editor?.isActive('bulletList') && 'bg-bg-hover text-indigo-600')}><List className="w-4 h-4" /></button>
                  <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={cn("p-2 rounded hover:bg-bg-hover transition-colors", editor?.isActive('orderedList') && 'bg-bg-hover text-indigo-600')}><ListOrdered className="w-4 h-4" /></button>
                </div>
                
                {/* EDITOR CONTENT */}
                <div className="p-4 flex-1 overflow-y-auto cursor-text" onClick={() => editor?.commands.focus()}>
                  <EditorContent editor={editor} />
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <Button variant="secondary" onClick={handleAiImprove} loading={isAiImproving} className="group !border-indigo-500/30 !text-indigo-400 hover:!bg-indigo-500/10 hover:!border-indigo-500 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Improve ✦
                </Button>
              </div>

              {/* TAGS */}
              <div className="mt-8">
                <label className="text-[13px] text-text-tertiary font-medium mb-2 block">Tags</label>
                <div className="flex flex-wrap items-center gap-2 bg-bg-surface border border-border-default rounded-xl p-2 min-h-[48px] focus-within:border-indigo-500 focus-within:shadow-[0_0_0_2px_rgba(99,102,241,0.15)] transition-all">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-bg-elevated border border-border-subtle px-2 py-1 rounded-md text-[13px] text-text-primary">
                      {tag}
                      <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-text-tertiary hover:text-red-400"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={tags.length === 0 ? "Type tag & enter..." : ""}
                    className="flex-1 bg-transparent border-none outline-none text-[14px] text-text-primary min-w-[120px]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="w-full flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-full max-w-[400px]">
                <IdeaCard
                  id="preview"
                  category={{ id: category.id, name: category.label }}
                  title={title}
                  description={editor?.getText() || ""}
                  author={{ name: "Sarah Jenkins" }}
                  timeAgo="Just now"
                  votes={1}
                  comments={0}
                  hasVoted={true}
                />
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between p-6 bg-bg-surface/50 border-t border-border-subtle shrink-0">
          <button 
            onClick={step === 1 ? onClose : handleBack} 
            className="text-[14px] font-medium text-text-tertiary hover:text-text-primary px-4 py-2 transition-colors"
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          
          <Button 
            onClick={step === 3 ? handleSubmit : handleNext} 
            disabled={(step === 1 && !title.trim()) || isSubmitting}
            loading={isSubmitting}
            className={step === 3 ? "bg-green-500 hover:bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.3)] text-white font-display font-bold w-[160px]" : "w-[140px]"}
          >
            {step === 3 ? (isSubmitting ? "Posting..." : "Post Idea 🚀") : "Continue →"}
          </Button>
        </div>

      </div>
    </Modal>
  );
};
