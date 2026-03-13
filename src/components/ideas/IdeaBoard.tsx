"use client";

import React from "react";
import { IdeaCard, IdeaCardProps } from "./IdeaCard";
import { motion } from "framer-motion";

interface IdeaBoardProps {
  ideas: IdeaCardProps[];
}

export const IdeaBoard = ({ ideas }: IdeaBoardProps) => {
  if (ideas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <motion.div 
          animate={{ y: [-10, 10, -10] }} 
          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.3)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </motion.div>
        <h2 className="font-display text-[22px] font-bold text-text-primary mb-2">No ideas yet — be the first!</h2>
        <p className="text-text-secondary text-[15px] mb-8">Add an idea or let AI generate some to get started.</p>
        <div className="flex gap-4">
          <button className="px-6 py-2.5 bg-indigo-500 text-white rounded-full font-semibold font-display shadow-glow-indigo">
            Add Idea
          </button>
          <button className="px-6 py-2.5 bg-bg-surface border border-indigo-500/30 text-indigo-400 rounded-full font-semibold font-display flex items-center gap-1.5">
            ✦ Ask AI
          </button>
        </div>
      </div>
    );
  }

  // CSS Masonry Columns
  return (
    <div className="columns-1 md:columns-2 lg:columns-2 xl:columns-3 gap-6 pb-24">
      {ideas.map((idea, i) => (
        <motion.div
          key={idea.id}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.05, type: "spring", damping: 25, stiffness: 200 }}
          layout
        >
          <IdeaCard {...idea} />
        </motion.div>
      ))}
    </div>
  );
};
