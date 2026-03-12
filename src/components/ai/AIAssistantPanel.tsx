"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Command, Lightbulb } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils/cn";

export interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Message = {
  id: string;
  role: "user" | "ai";
  content: React.ReactNode;
};

export const AIAssistantPanel = ({ isOpen, onClose }: AIAssistantPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: (
        <div className="flex flex-col gap-2">
          <span>Hi there! I'm your AI Catalyst. Ready to brainstorm?</span>
          <div className="flex flex-col gap-1.5 mt-2">
            <button className="text-left text-[12px] bg-bg-base border border-border-subtle rounded-md p-2 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-text-secondary transition-colors">
              💡 Generate 5 variations of the top voted idea
            </button>
            <button className="text-left text-[12px] bg-bg-base border border-border-subtle rounded-md p-2 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-text-secondary transition-colors">
              🔍 Summarize the main themes from this session
            </button>
          </div>
        </div>
      )
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    const prompt = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: (
            <div className="whitespace-pre-wrap text-[13px] leading-relaxed">
              {data.text || data.error || "Failed to generate ideas."}
            </div>
          )
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "ai", content: "Network error occurred." }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-[64px] bottom-0 w-[400px] bg-bg-surface/95 backdrop-blur-xl border-l border-border-default shadow-[-10px_0_40px_rgba(0,0,0,0.3)] z-40 flex flex-col"
        >
          {/* HEADER */}
          <div className="h-14 border-b border-border-subtle flex items-center justify-between px-5 shrink-0 bg-bg-surface">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,#6366F1,#A855F7)] flex items-center justify-center p-[1px]">
                <div className="w-full h-full bg-bg-surface rounded-full flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
              </div>
              <h3 className="font-display font-bold text-[15px] bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AI Catalyst
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CHAT AREA */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-6">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                
                {msg.role === "ai" ? (
                  <div className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,#6366F1,#A855F7)] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <Avatar name="Sarah J" size="sm" className="shrink-0" />
                )}

                <div className={cn(
                  "max-w-[85%] text-[14px]", 
                  msg.role === "user" 
                    ? "bg-indigo-500 text-white px-4 py-2.5 rounded-[18px] rounded-tr-[4px] shadow-sm ml-auto" 
                    : "bg-bg-elevated text-text-secondary px-4 py-3 rounded-[18px] rounded-tl-[4px] border border-border-subtle"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,#6366F1,#A855F7)] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-bg-elevated px-4 py-3 rounded-[18px] rounded-tl-[4px] border border-border-subtle flex items-center gap-1.5 h-[42px]">
                  <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} className="h-1" />
          </div>

          {/* INPUT AREA */}
          <div className="p-4 border-t border-border-subtle shrink-0">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask AI to generate ideas..."
                className="w-full bg-bg-elevated border border-border-default rounded-full py-2.5 pl-4 pr-12 text-[14px] text-text-primary placeholder:text-text-disabled outline-none focus:border-indigo-500/50 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)] transition-all"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-1.5 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-bg-surface disabled:text-text-tertiary transition-colors"
                title="Send (Cmd+Enter)"
              >
                <Send className="w-4 h-4 ml-[-1px]" />
              </button>
            </form>
            <div className="flex items-center justify-between mt-2 px-2 text-[11px] text-text-tertiary font-medium">
              <span>Suggestions</span>
              <span className="flex items-center gap-1"><Command className="w-3 h-3" /> J to focus</span>
            </div>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 4px; }
            .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); }
          `}} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
