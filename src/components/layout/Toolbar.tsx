"use client";

import React, { useState } from "react";
import { Plus, Search, LayoutGrid, List, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export const Toolbar = ({ onAddIdea }: { onAddIdea: () => void }) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const categories = [
    { name: "All", color: "transparent" },
    { name: "Product", color: "var(--cat-product)" },
    { name: "Tech", color: "var(--cat-tech)" },
    { name: "Design", color: "var(--cat-design)" },
    { name: "Marketing", color: "var(--cat-marketing)" },
    { name: "Operations", color: "var(--cat-operations)" },
    { name: "Other", color: "var(--cat-other)" },
  ];

  const sortItems = [
    [{ label: "Trending", onClick: () => {} },
     { label: "Newest", onClick: () => {} },
     { label: "Most Voted", onClick: () => {} }],
    [{ label: "My Ideas", onClick: () => {} }]
  ];

  return (
    <div className="fixed top-16 left-0 right-0 h-14 bg-bg-base/95 backdrop-blur-md border-b border-border-subtle z-40 flex items-center justify-between px-6">
      
      {/* LEFT */}
      <div className="flex-1">
        <Button onClick={onAddIdea} className="shadow-glow-indigo whitespace-nowrap hidden sm:flex">
          <Plus className="w-5 h-5 -ml-1 mr-1" />
          New Idea
        </Button>
        <Button onClick={onAddIdea} className="shadow-glow-indigo sm:hidden w-10 px-0 rounded-full">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* CENTER */}
      <div className="hidden lg:flex flex-1 justify-center max-w-[500px] overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mask-image-edges">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={cn(
                  "relative px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5",
                  isActive ? "text-primary" : "text-text-secondary hover:text-text-primary"
                )}
                style={{ color: isActive && cat.name !== "All" ? cat.color : undefined }}
              >
                {cat.name !== "All" && (
                  <span className="w-2 h-2 rounded-full mb-px" style={{ backgroundColor: cat.color }} />
                )}
                <span className="relative z-10">{cat.name}</span>
                
                {isActive && (
                  <motion.div
                    layoutId="filter-indicator"
                    className="absolute inset-0 rounded-full -z-0"
                    style={{
                      backgroundColor: cat.name === "All" ? 'var(--bg-elevated)' : `${cat.color}33`, // roughly 20% opacity
                      border: `1px solid ${cat.name === "All" ? 'var(--border-default)' : `${cat.color}66`}`
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <style dangerouslySetInnerHTML={{__html:`.no-scrollbar::-webkit-scrollbar{display:none;} .mask-image-edges{mask-image:linear-gradient(to right,transparent,black 5%,black 95%,transparent)}`}}/>
      </div>

      {/* RIGHT */}
      <div className="flex flex-1 justify-end items-center gap-4">
        
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input 
            type="text" 
            placeholder="Search..."
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={cn(
              "bg-bg-elevated border border-border-default rounded-full h-8 pl-9 pr-4 text-[13px] outline-none transition-all placeholder:text-text-disabled",
              isSearchFocused ? "w-[200px] border-indigo-500/50 shadow-[0_0_0_2px_rgba(99,102,241,0.1)]" : "w-[120px] hover:border-border-strong cursor-pointer"
            )}
          />
        </div>

        <div className="hidden md:block w-px h-5 bg-border-subtle" />

        {/* Sort */}
        <Dropdown 
          trigger={
            <button className="flex items-center gap-1 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors">
              Sort: Trending <ChevronDown className="w-3.5 h-3.5" />
            </button>
          }
           items={sortItems}
           align="right"
        />

        <div className="hidden md:block w-px h-5 bg-border-subtle" />

        {/* View Toggle */}
        <div className="flex bg-bg-elevated border border-border-default rounded-full p-0.5">
          <button 
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              viewMode === "grid" ? "bg-bg-hover text-text-primary" : "text-text-tertiary hover:text-text-primary"
            )}
            title="Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              viewMode === "list" ? "bg-bg-hover text-text-primary" : "text-text-tertiary hover:text-text-primary"
            )}
            title="List View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
