import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Budget } from '@/lib/api';

interface AppState {
  initData: string | null;
  theme: 'light' | 'dark';
  budgets: Budget[];
  setInitData: (data: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setBudget: (categoryId: string, month: string, amount: number) => void;
  removeBudget: (categoryId: string, month: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      initData: null,
      theme: 'light',
      budgets: [],
      setInitData: (data) => set({ initData: data }),
      setTheme: (theme) => set({ theme }),
      setBudget: (categoryId, month, amount) => set((state) => {
        const existing = state.budgets.findIndex(b => b.category_id === categoryId && b.month === month);
        if (existing >= 0) {
          const newBudgets = [...state.budgets];
          newBudgets[existing] = { ...newBudgets[existing], amount };
          return { budgets: newBudgets };
        }
        return { 
          budgets: [...state.budgets, { id: Date.now().toString(), category_id: categoryId, month, amount }] 
        };
      }),
      removeBudget: (categoryId, month) => set((state) => ({
        budgets: state.budgets.filter(b => !(b.category_id === categoryId && b.month === month))
      })),
    }),
    {
      name: 'spen-manager-storage',
      partialize: (state) => ({ budgets: state.budgets }),
    }
  )
);
