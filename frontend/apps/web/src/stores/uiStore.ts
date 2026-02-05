import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import i18n from '@/lib/i18n';

type Theme = 'light' | 'dark' | 'system';
type Language = 'ko' | 'en';

interface UIState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Mobile menu
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Language
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Theme
      theme: 'system',
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Mobile menu
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

      // Language
      language: 'ko',
      setLanguage: (language) => {
        i18n.changeLanguage(language);
        set({ language });
      },
    }),
    {
      name: 'hr-platform-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        language: state.language,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
          if (state.language) {
            i18n.changeLanguage(state.language);
          }
        }
      },
    }
  )
);

function applyTheme(theme: Theme) {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}

// Initialize theme on load
if (typeof window !== 'undefined') {
  const storedState = localStorage.getItem('hr-platform-ui');
  if (storedState) {
    try {
      const parsed = JSON.parse(storedState);
      applyTheme(parsed.state?.theme || 'system');
    } catch {
      applyTheme('system');
    }
  }
}
