"use client";

import React, { useState } from "react";
import { ChevronLeft, Link2, Copy, Check, Download, Settings2, Sparkles } from "lucide-react";
import Link from "next/link";
import { PresenceBar } from "@/components/session/PresenceBar";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export interface SessionHeaderProps {
  onToggleAi?: () => void;
}

export const SessionHeader = ({ onToggleAi }: SessionHeaderProps) => {
  const [copied, setCopied] = useState(false);
  const inviteCode = "A1B2C3D4";

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success("Invite code copied! 📋", { icon: "📋" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-bg-surface/90 backdrop-blur-md border-b border-border-subtle z-50 flex items-center justify-between px-6">
      
      {/* LEFT */}
      <div className="flex items-center gap-4 flex-1">
        <Link href="/dashboard" className="p-2 -ml-2 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3 border-l border-border-subtle pl-4">
          <h1 className="font-display font-semibold text-text-primary text-[18px] max-w-[240px] truncate">
            Q3 Product Roadmap
          </h1>
          <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)] animate-pulse" />
        </div>
      </div>

      {/* CENTER */}
      <div className="hidden lg:flex items-center justify-center flex-1">
        <PresenceBar />
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-end gap-3 flex-1">
        
        {/* Invite Code Chip */}
        <div className="hidden sm:flex items-center gap-2 bg-bg-elevated border border-border-subtle rounded-full h-8 pl-3 pr-1 text-[13px] text-text-secondary mr-2">
          <Link2 className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="font-mono tracking-wider font-medium text-text-primary">{inviteCode}</span>
          <button 
            onClick={handleCopy}
            className="w-6 h-6 rounded-full hover:bg-bg-hover text-text-tertiary hover:text-text-primary flex items-center justify-center transition-colors ml-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="hidden sm:block w-px h-6 bg-border-subtle mx-1" />

        <button onClick={onToggleAi} className="hidden sm:flex items-center gap-1.5 px-4 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-500 hover:bg-indigo-500 hover:text-white hover:shadow-glow-indigo transition-all font-medium text-[13px]">
          <Sparkles className="w-3.5 h-3.5" />
          AI Assistant
        </button>

        <Button variant="ghost" size="sm" className="w-10 px-0 h-10 rounded-full">
          <Download className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="sm" className="w-10 px-0 h-10 rounded-full">
          <Settings2 className="w-5 h-5" />
        </Button>
      </div>

    </header>
  );
};
