import { create } from "zustand";

interface Session {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  category: string;
}

interface SessionState {
  currentSession: Session | null;
  activeMembers: Array<{ id: string; name: string; avatar?: string }>;
  setCurrentSession: (session: Session | null) => void;
  setMembers: (members: SessionState['activeMembers']) => void;
  addMember: (member: SessionState['activeMembers'][0]) => void;
  removeMember: (id: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  activeMembers: [],
  setCurrentSession: (session) => set({ currentSession: session }),
  setMembers: (members) => set({ activeMembers: members }),
  addMember: (member) => set((state) => ({ 
    activeMembers: state.activeMembers.find(m => m.id === member.id) 
      ? state.activeMembers 
      : [...state.activeMembers, member] 
  })),
  removeMember: (id) => set((state) => ({
    activeMembers: state.activeMembers.filter(m => m.id !== id)
  })),
}));
