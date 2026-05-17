import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
      initTheme: () => {
        set((state) => {
          document.documentElement.setAttribute('data-theme', state.theme);
          return {};
        });
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
