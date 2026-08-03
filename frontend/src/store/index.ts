import { create } from 'zustand';

interface AppState {
  initData: string | null;
  theme: 'light' | 'dark';
  setInitData: (data: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>((set) => ({
  initData: null,
  theme: 'light',
  setInitData: (data) => set({ initData: data }),
  setTheme: (theme) => set({ theme }),
}));
