"use client";

import { useState, useCallback, useRef } from "react";

export interface IdeaCluster {
  name: string;
  theme: string;
  emoji: string;
  color: string;
  lightColor: string;
  ideaIds: string[];
}

export interface UseIdeaClustersResult {
  clusters: IdeaCluster[];
  isAnalyzing: boolean;
  lastAnalyzed: Date | null;
  analyzeIdeas: (ideas: { id: string; title: string; description?: string }[]) => Promise<void>;
}

export function useIdeaClusters(): UseIdeaClustersResult {
  const [clusters, setClusters] = useState<IdeaCluster[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analyzeIdeas = useCallback(async (ideas: { id: string; title: string; description?: string }[]) => {
    if (ideas.length === 0) {
      setClusters([]);
      return;
    }

    // Debounce so we don't spam the API on every keystroke
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const res = await fetch("/api/ai/cluster-ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ideas }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.clusters && Array.isArray(data.clusters)) {
          setClusters(data.clusters);
          setLastAnalyzed(new Date());
        }
      } catch (err) {
        console.error("Cluster analysis failed:", err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 2000); // 2s debounce — trigger 2s after last idea change
  }, []);

  return { clusters, isAnalyzing, lastAnalyzed, analyzeIdeas };
}
