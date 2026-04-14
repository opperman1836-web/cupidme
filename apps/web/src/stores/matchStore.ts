import { create } from 'zustand';

interface MatchState {
  matches: any[];
  setMatches: (matches: any[]) => void;
  updateMatch: (matchId: string, updates: any) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],
  setMatches: (matches) => set({ matches }),
  updateMatch: (matchId, updates) =>
    set((state) => ({
      matches: state.matches.map((m) =>
        m.id === matchId ? { ...m, ...updates } : m
      ),
    })),
}));
