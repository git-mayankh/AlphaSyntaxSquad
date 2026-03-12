"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export const FilterSidebar = () => {
  const categories = [
    { name: "Product", color: "var(--cat-product)", count: 12 },
    { name: "Tech", color: "var(--cat-tech)", count: 8 },
    { name: "Design", color: "var(--cat-design)", count: 5 },
    { name: "Marketing", color: "var(--cat-marketing)", count: 4 },
    { name: "Operations", color: "var(--cat-operations)", count: 2 },
    { name: "Other", color: "var(--cat-other)", count: 1 },
  ];

  const tags = ["UI/UX", "Performance", "Growth", "Backend", "Onboarding", "Mobile"];

  return (
    <aside className="w-[220px] fixed left-0 top-[120px] bottom-0 bg-bg-surface border-r border-border-subtle overflow-y-auto hidden lg:block custom-scrollbar">
      <div className="p-5 flex flex-col gap-8">
        
        {/* CATEGORIES */}
        <div>
          <h4 className="font-display text-[11px] uppercase tracking-[0.08em] font-semibold text-text-tertiary mb-3">Categories</h4>
          <div className="flex flex-col gap-1">
            {categories.map((cat, i) => (
              <button key={cat.name} className="flex flex-row items-center justify-between py-1.5 px-2 -mx-2 rounded-md hover:bg-bg-hover transition-colors group">
                <span className="flex items-center gap-2 text-[13px] text-text-secondary group-hover:text-text-primary">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </span>
                <span className="bg-bg-elevated border border-border-subtle text-text-tertiary text-[10px] font-medium px-2 py-0.5 rounded-full">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* TAGS */}
        <div>
          <h4 className="font-display text-[11px] uppercase tracking-[0.08em] font-semibold text-text-tertiary mb-3">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button key={tag} className="text-[12px] bg-bg-elevated border border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary px-2.5 py-1 rounded-full transition-colors">
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* STATUS */}
        <div>
          <h4 className="font-display text-[11px] uppercase tracking-[0.08em] font-semibold text-text-tertiary mb-3">Status</h4>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-[14px] h-[14px] rounded-sm bg-bg-base border-border-default text-indigo-500 checked:bg-indigo-500" defaultChecked />
              <span className="text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">Open</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-[14px] h-[14px] rounded-sm bg-bg-base border-border-default text-amber-500 checked:bg-amber-500" />
              <span className="text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">Shortlisted</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-[14px] h-[14px] rounded-sm bg-bg-base border-border-default text-green-500 checked:bg-green-500" />
              <span className="text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">Selected</span>
            </label>
          </div>
        </div>

        <button className="text-[12px] text-text-tertiary hover:text-text-primary text-left transition-colors mt-4">
          Clear Filters
        </button>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 4px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); }
      `}} />
    </aside>
  );
};
