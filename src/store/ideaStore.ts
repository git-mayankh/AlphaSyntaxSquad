import { create } from "zustand";
import { IdeaCardProps } from "@/components/ideas/IdeaCard";

interface IdeaState {
  ideas: IdeaCardProps[];
  isLoading: boolean;
  filter: string;
  sortBy: "trending" | "newest" | "votes";
  setIdeas: (ideas: IdeaCardProps[]) => void;
  addIdea: (idea: IdeaCardProps) => void;
  updateIdea: (id: string, updates: Partial<IdeaCardProps>) => void;
  removeIdea: (id: string) => void;
  setFilter: (filter: string) => void;
  setSortBy: (sortBy: "trending" | "newest" | "votes") => void;
}

export const useIdeaStore = create<IdeaState>((set) => ({
  ideas: [],
  isLoading: false,
  filter: "All",
  sortBy: "trending",
  setIdeas: (ideas) => set({ ideas }),
  addIdea: (idea) => set((state) => ({ ideas: [idea, ...state.ideas] })),
  updateIdea: (id, updates) => set((state) => ({
    ideas: state.ideas.map((idea) => idea.id === id ? { ...idea, ...updates } : idea)
  })),
  removeIdea: (id) => set((state) => ({
    ideas: state.ideas.filter((idea) => idea.id !== id)
  })),
  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set({ sortBy }),
}));
