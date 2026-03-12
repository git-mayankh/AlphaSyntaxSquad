"use client";

import React, { useEffect, use } from "react";
import { ChevronLeft, Trophy, Medal, Star, ArrowUp } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils/cn";

export default function LeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  useEffect(() => {
    // Fire confetti on mount
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const topIdeas = [
    { id: 1, title: "Migrate to Zustand for local state", votes: 56, author: "Mike T.", category: { name: "Tech", color: "var(--cat-tech)" } },
    { id: 2, title: "Implement real-time collaborative cursors", votes: 42, author: "Priya Patel", category: { name: "Product", color: "var(--cat-product)" } },
    { id: 3, title: "Dark mode as default", votes: 38, author: "Alex Rivera", category: { name: "Design", color: "var(--cat-design)" } },
    { id: 4, title: "Launch 'Idea of the Week' newsletter", votes: 19, author: "Sarah J.", category: { name: "Marketing", color: "var(--cat-marketing)" } },
    { id: 5, title: "Automated weekly recap emails", votes: 15, author: "AI Catalyst", category: { name: "Other", color: "var(--cat-other)" }, isAi: true },
  ];

  return (
    <div className="min-h-screen bg-bg-base bg-[radial-gradient(ellipse_at_top_center,rgba(99,102,241,0.15),transparent_50%)] selection:bg-indigo-500/30">
      
      {/* HEADER */}
      <header className="h-16 border-b border-border-subtle flex items-center px-6 sticky top-0 bg-bg-base/80 backdrop-blur-md z-50">
        <Link href={`/session/${id}`} className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors font-medium">
          <ChevronLeft className="w-5 h-5" />
          Back to Board
        </Link>
      </header>

      <main className="max-w-[800px] mx-auto pt-16 pb-24 px-6">
        
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="w-20 h-20 bg-[linear-gradient(135deg,#FBBF24,#F59E0B)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(251,191,36,0.4)] rotate-3"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-display font-bold text-4xl text-white mb-3"
          >
            Session Results
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-text-secondary text-lg"
          >
            The tribe has spoken. Here are the top ideas from Q3 Product Roadmap.
          </motion.p>
        </div>

        <div className="flex flex-col gap-4 relative">
          
          {topIdeas.map((idea, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            return (
              <motion.div
                key={idea.id}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1, type: "spring", stiffness: 200, damping: 20 }}
                className={cn(
                  "relative flex items-center gap-6 p-5 rounded-2xl transition-all hover:-translate-y-1 overflow-hidden group",
                  isFirst ? "bg-[linear-gradient(90deg,rgba(251,191,36,0.1),var(--bg-elevated))] border border-amber-500/30 shadow-[0_8px_32px_rgba(251,191,36,0.15)]" : "glass-card hover:border-border-strong hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                )}
              >
                {/* BG Glow for first place */}
                {isFirst && <div className="absolute top-0 left-0 w-1/2 h-full bg-amber-500/5 blur-3xl pointer-events-none" />}

                {/* Rank Badge */}
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full font-display font-bold text-xl relative z-10">
                  {isFirst && <div className="absolute inset-0 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]" />}
                  {isSecond && <div className="absolute inset-0 bg-slate-400 rounded-full shadow-[0_0_15px_rgba(148,163,184,0.3)]" />}
                  {isThird && <div className="absolute inset-0 bg-amber-700/80 rounded-full shadow-[0_0_15px_rgba(180,83,9,0.3)]" />}
                  {!isFirst && !isSecond && !isThird && <div className="absolute inset-0 text-text-tertiary bg-bg-surface border border-border-default rounded-full" />}
                  
                  <span className={cn(isFirst || isSecond || isThird ? "text-white relative z-10" : "text-text-tertiary")}>
                    {index + 1}
                  </span>
                </div>

                {/* Main Content */}
                <div className="flex-1 relative z-10 min-w-0">
                  <div className="flex items-center gap-2 text-[12px] mb-1 font-medium text-text-tertiary tracking-wide uppercase">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: idea.category.color }} />
                    <span style={{ color: idea.category.color }}>{idea.category.name}</span>
                  </div>
                  <h3 className={cn("font-display font-bold leading-tight truncate mb-1.5", isFirst ? "text-[22px] text-white" : "text-[18px] text-text-primary")}>
                    {idea.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Avatar name={idea.author} size="sm" className="w-5 h-5" />
                    <span className="text-[13px] text-text-secondary">{idea.author}</span>
                  </div>
                </div>

                {/* Votes */}
                <div className="flex flex-col items-end justify-center shrink-0 pr-2">
                  <div className={cn(
                    "flex items-center gap-1.5 font-display font-bold",
                    isFirst ? "text-amber-400 text-3xl" : "text-green-400 text-2xl"
                  )}>
                    {idea.votes}
                  </div>
                  <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-semibold">Votes</span>
                </div>
              </motion.div>
            );
          })}

        </div>
      </main>

    </div>
  );
}
