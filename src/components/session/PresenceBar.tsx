"use client";

import React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { motion, AnimatePresence } from "framer-motion";

export const PresenceBar = () => {
  const members = [
    { name: "Sarah J." },
    { name: "Mike T." },
    { name: "JD" },
    { name: "Alex R." },
    { name: "Priya P." },
    { name: "Chris Evans" },
    { name: "Natasha" },
  ];

  const maxShow = 5;
  const showMembers = members.slice(0, maxShow);
  const extra = members.length - maxShow;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <div className="flex -space-x-2">
        <AnimatePresence>
          {showMembers.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ scale: 0, x: 20 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ type: "spring", damping: 15, delay: i * 0.1 }}
              className="relative z-10 hover:z-20 transition-transform hover:-translate-y-1 group"
            >
              <Avatar name={m.name} size="md" className="border-2 border-bg-surface" />
              {/* Tooltip */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-elevated border border-border-default px-2 py-1 rounded text-[11px] whitespace-nowrap pointer-events-none z-50 shadow-md">
                {m.name}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {extra > 0 && (
          <div className="w-8 h-8 rounded-full border-2 border-bg-surface bg-bg-elevated text-[11px] flex items-center justify-center font-medium relative z-0 text-text-secondary">
            +{extra}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-400/10 border border-green-400/20 text-green-400 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        {members.length} online
      </div>
    </div>
  );
};
