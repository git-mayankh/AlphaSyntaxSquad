"use client";

import React from "react";
import { ArrowRight, Lightbulb, Users, ThumbsUp, Edit2, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export interface SessionCardProps {
  id: string;
  title: string;
  description: string;
  status: "active" | "closed";
  organizationName?: string;
  timeAgo: string;
  tags: string[];
  stats: {
    ideas: number;
    members: number;
    votes: number;
  };
  members: Array<{ name: string; avatar?: string }>;
  colorIndex: number;
  createdBy?: string;
  currentUserId?: string;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
}

export const SessionCard = ({ 
  id, title, description, status, organizationName, timeAgo, tags, stats, members, colorIndex, 
  createdBy, currentUserId, onEditClick, onDeleteClick 
}: SessionCardProps) => {
  const colors = [
    "bg-indigo-400", "bg-cyan-400", "bg-pink-400", "bg-amber-400", "bg-green-400"
  ];
  const topColor = colors[colorIndex % colors.length];

  return (
    <div className="glass-card rounded-[24px] overflow-hidden hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-[transform,shadow] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group flex flex-col h-full bg-bg-surface/50">
      
      {/* TOP COLOR BAR */}
      <div className={`h-1 w-full ${topColor}`} />
      
      <div className="p-6 flex flex-col flex-1">
        {/* ROW 1 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {organizationName && (
              <div className="bg-bg-elevated border border-border-subtle text-text-primary px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                {organizationName}
              </div>
            )}
            {status === "active" ? (
              <div className="bg-green-400/10 border border-green-400/20 text-green-400 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Active
              </div>
            ) : (
              <div className="bg-bg-elevated border border-border-subtle text-text-tertiary px-2.5 py-0.5 rounded-full text-xs font-semibold">
                Closed
              </div>
            )}
          </div>
          <span className="text-[13px] text-text-tertiary">{timeAgo}</span>
        </div>
        
        <h3 className="font-display text-[18px] font-bold text-text-primary line-clamp-2 mt-2">
          {title}
        </h3>
        
        <p className="text-text-secondary text-[14px] line-clamp-2 mt-1 mb-4 flex-1">
          {description}
        </p>
        
        {/* TAGS ROW */}
        <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
          {tags.map(tag => (
            <span key={tag} className="text-[12px] bg-bg-elevated border border-border-subtle px-2 py-0.5 rounded-full text-text-tertiary">
              {tag}
            </span>
          ))}
        </div>
        
        {/* STATS ROW */}
        <div className="border-t border-border-subtle pt-4 flex items-center justify-between text-text-secondary text-[13px]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5" title="Ideas">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400/70" /> {stats.ideas}
            </span>
            <span className="flex items-center gap-1.5" title="Members">
              <Users className="w-3.5 h-3.5 text-cyan-400/70" /> {stats.members}
            </span>
            <span className="flex items-center gap-1.5" title="Votes">
              <ThumbsUp className="w-3.5 h-3.5 text-green-400/70" /> {stats.votes}
            </span>
          </div>
        </div>
        
        {/* FOOTER ROW */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((m, i) => (
              <Avatar key={i} name={m.name} src={m.avatar} size="sm" className={`border-2 border-bg-surface relative z-[${3 - i}]`} />
            ))}
            {members.length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-bg-surface bg-bg-elevated text-[10px] flex items-center justify-center font-medium relative z-0">
                +{members.length - 3}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {currentUserId === createdBy && currentUserId && (
              <div className="flex bg-bg-elevated border border-border-subtle rounded-lg opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 pointer-events-none group-hover:pointer-events-auto">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditClick?.(); }}
                  className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-l-md transition-colors border-r border-border-subtle"
                  title="Edit Session"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteClick?.(); }}
                  className="p-1.5 text-text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded-r-md transition-colors"
                  title="Delete Session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
            <Link href={`/session/${id}`} className="text-[14px] text-indigo-400 font-medium flex items-center gap-1 hover:text-indigo-300 transition-colors group-hover:underline decoration-1 underline-offset-4 ml-2">
              Open
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
