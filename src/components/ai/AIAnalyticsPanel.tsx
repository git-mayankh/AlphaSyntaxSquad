"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Lightbulb, TrendingUp, Layers, Loader2, Sparkles, Trophy, Merge, CopyPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Idea {
  id: string;
  title: string;
  description?: string;
  votes?: number;
}

interface Cluster {
  theme: string;
  color: string;
  ideaIndexes: number[];
}

interface AnalyticsResult {
  clusters: Cluster[];
  summary: string;
  topIdeas: number[];
  insight: string;
}

interface AIAnalyticsPanelProps {
  ideas: Idea[];
  onMergeIdeas?: (idea1: Idea, idea2: Idea) => Promise<void>;
}

type Tab = "analytics" | "merge" | "duplicates";

export const AIAnalyticsPanel = ({ ideas, onMergeIdeas }: AIAnalyticsPanelProps) => {
  const [tab, setTab] = useState<Tab>("analytics");
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
  const [mergeIdea1, setMergeIdea1] = useState<string>("");
  const [mergeIdea2, setMergeIdea2] = useState<string>("");
  const [merging, setMerging] = useState(false);
  const [findingDuplicates, setFindingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<{idea1Id: string, idea2Id: string, reason: string, confidenceScore: number}[] | null>(null);

  const runDuplicateSearch = async () => {
    if (ideas.length < 2) {
      toast.error("Need at least 2 ideas to find duplicates.");
      return;
    }
    setFindingDuplicates(true);
    try {
      const res = await fetch("/api/ai/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideas }),
      });
      const result = await res.json();
      setDuplicates(result.duplicates || []);
      if (result.duplicates?.length === 0) {
        toast.success("No duplicates found! Your board is clean.");
      }
    } catch {
      toast.error("Duplicate search failed.");
    } finally {
      setFindingDuplicates(false);
    }
  };

  const runAnalysis = async () => {
    if (ideas.length < 2) {
      toast.error("Need at least 2 ideas to analyze.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideas }),
      });
      const result = await res.json();
      setAnalytics(result);
    } catch {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const runMerge = async () => {
    const i1 = ideas.find(i => i.id === mergeIdea1);
    const i2 = ideas.find(i => i.id === mergeIdea2);
    if (!i1 || !i2 || i1.id === i2.id) {
      toast.error("Select two different ideas to merge.");
      return;
    }
    setMerging(true);
    try {
      await onMergeIdeas?.(i1, i2);
      toast.success("Ideas merged successfully! ✨");
      setMergeIdea1("");
      setMergeIdea2("");
    } catch {
      toast.error("Merge failed. Please try again.");
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-surface">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-text-primary">AI Analytics</span>
        </div>
        {/* Tabs */}
        <div className="flex bg-bg-base rounded-lg p-0.5 border border-border-subtle">
          <button onClick={() => setTab("analytics")} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${tab === "analytics" ? "bg-indigo-500/20 text-indigo-300" : "text-text-secondary hover:text-text-primary"}`}>
            <Layers className="w-3 h-3 inline mr-1" />Clusters
          </button>
          <button onClick={() => setTab("merge")} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${tab === "merge" ? "bg-indigo-500/20 text-indigo-300" : "text-text-secondary hover:text-text-primary"}`}>
            <Merge className="w-3 h-3 inline mr-1" />Merge
          </button>
          <button onClick={() => setTab("duplicates")} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${tab === "duplicates" ? "bg-indigo-500/20 text-indigo-300" : "text-text-secondary hover:text-text-primary"}`}>
            <CopyPlus className="w-3 h-3 inline mr-1" />Dupes
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {tab === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
              <button
                onClick={runAnalysis}
                disabled={loading || ideas.length < 2}
                className="w-full py-2.5 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-sm font-semibold hover:bg-indigo-500/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><Sparkles className="w-4 h-4" />Analyze {ideas.length} Ideas</>}
              </button>

              {analytics && (
                <div className="flex flex-col gap-4">
                  {/* Summary */}
                  <div className="bg-bg-base rounded-xl p-3 border border-border-subtle">
                    <div className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mb-2">Session Summary</div>
                    <p className="text-xs text-text-secondary leading-relaxed">{analytics.summary}</p>
                  </div>

                  {/* Key Insight */}
                  {analytics.insight && (
                    <div className="bg-indigo-500/10 rounded-xl p-3 border border-indigo-500/20">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Lightbulb className="w-3 h-3 text-indigo-400" />
                        <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Key Insight</span>
                      </div>
                      <p className="text-xs text-text-primary leading-relaxed">{analytics.insight}</p>
                    </div>
                  )}

                  {/* Theme Clusters */}
                  {analytics.clusters.length > 0 && (
                    <div>
                      <div className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mb-2">Theme Clusters</div>
                      <div className="flex flex-col gap-2">
                        {analytics.clusters.map((cluster, ci) => (
                          <div key={ci} className="rounded-xl p-3 border" style={{ borderColor: cluster.color + "40", backgroundColor: cluster.color + "0D" }}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cluster.color }} />
                              <span className="text-xs font-semibold text-text-primary">{cluster.theme}</span>
                              <span className="ml-auto text-[10px] text-text-tertiary">{cluster.ideaIndexes.length} ideas</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              {cluster.ideaIndexes.slice(0, 3).map(idx => ideas[idx] && (
                                <div key={idx} className="text-[11px] text-text-secondary truncate pl-3 border-l-2" style={{ borderColor: cluster.color + "60" }}>
                                  {ideas[idx].title}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Ideas */}
                  {analytics.topIdeas.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary font-medium uppercase tracking-wider mb-2">
                        <Trophy className="w-3 h-3 text-amber-400" />Top Ideas
                      </div>
                      {analytics.topIdeas.slice(0, 3).map((idx, rank) => ideas[idx] && (
                        <div key={idx} className="flex items-center gap-2 py-1.5">
                          <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-400">{rank + 1}</div>
                          <span className="text-xs text-text-primary truncate">{ideas[idx].title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!analytics && !loading && (
                <div className="text-center py-8 text-text-disabled">
                  <Brain className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">Run analysis to cluster ideas and generate insights</p>
                </div>
              )}
            </motion.div>
          )}

          {tab === "merge" && (
            <motion.div key="merge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
              <p className="text-xs text-text-secondary">Select two ideas to merge them into one powerful concept using AI.</p>

              {[
                { label: "First Idea", value: mergeIdea1, onChange: setMergeIdea1 },
                { label: "Second Idea", value: mergeIdea2, onChange: setMergeIdea2 },
              ].map(({ label, value, onChange }) => (
                <div key={label}>
                  <label className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mb-1.5 block">{label}</label>
                  <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-bg-base border border-border-default rounded-lg text-xs text-text-primary px-3 py-2 outline-none focus:border-indigo-500/60 appearance-none"
                  >
                    <option value="">Select an idea...</option>
                    {ideas.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
                  </select>
                </div>
              ))}

              <button
                onClick={runMerge}
                disabled={!mergeIdea1 || !mergeIdea2 || merging || mergeIdea1 === mergeIdea2}
                className="w-full py-2.5 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 text-sm font-semibold hover:bg-purple-500/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {merging ? <><Loader2 className="w-4 h-4 animate-spin" />Merging...</> : <><Merge className="w-4 h-4" />Merge Ideas</>}
              </button>
            </motion.div>
          )}

          {tab === "duplicates" && (
            <motion.div key="duplicates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
              <button
                onClick={runDuplicateSearch}
                disabled={findingDuplicates || ideas.length < 2}
                className="w-full py-2.5 rounded-xl bg-orange-500/15 text-orange-300 border border-orange-500/30 text-sm font-semibold hover:bg-orange-500/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {findingDuplicates ? <><Loader2 className="w-4 h-4 animate-spin" />Scanning...</> : <><CopyPlus className="w-4 h-4" />Find Duplicates</>}
              </button>

              {duplicates && duplicates.length > 0 && (
                <div className="flex flex-col gap-3 mt-2">
                  <div className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mb-1">
                    Suspected Duplicates ({duplicates.length})
                  </div>
                  {duplicates.map((dup, i) => {
                    const i1 = ideas.find(i => i.id === dup.idea1Id);
                    const i2 = ideas.find(i => i.id === dup.idea2Id);
                    if (!i1 || !i2) return null;
                    return (
                      <div key={i} className="bg-bg-base border border-orange-500/30 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                            {dup.confidenceScore}% Match
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="bg-bg-elevated p-2 rounded-lg border border-border-subtle hover:border-orange-500/50 transition-colors">
                            <div className="text-xs font-semibold text-text-primary">{i1.title}</div>
                          </div>
                          <div className="flex items-center justify-center -my-1.5 z-10">
                            <Merge className="w-4 h-4 text-text-tertiary rotate-90 bg-bg-base" />
                          </div>
                          <div className="bg-bg-elevated p-2 rounded-lg border border-border-subtle hover:border-orange-500/50 transition-colors">
                            <div className="text-xs font-semibold text-text-primary">{i2.title}</div>
                          </div>
                        </div>
                        <p className="text-[11px] text-text-secondary italic mt-1 leading-snug">
                          <span className="text-orange-300 font-semibold mr-1">AI Reason:</span>
                          {dup.reason}
                        </p>
                        <button
                          onClick={() => { setTab("merge"); setMergeIdea1(i1.id); setMergeIdea2(i2.id); }}
                          className="mt-2 w-full py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Merge className="w-3 h-3" />
                          Send to Merge Tab
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {duplicates && duplicates.length === 0 && (
                <div className="text-center py-8 text-text-disabled">
                  <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-20 text-green-400" />
                  <p className="text-xs text-green-400/70">No duplicates found! Your board is clean.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.2);border-radius:4px}`}} />
    </div>
  );
};
