import { create } from 'zustand';
import { menuService } from '@/features/menu/services/menuService';
import type { UserMenuItem, UserMenuResponse } from '@/features/menu/types';

interface MenuState {
  // State
  sidebarMenus: UserMenuItem[];
  mobileMenus: UserMenuItem[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;

  // Actions
  fetchMenus: () => Promise<void>;
  setMenus: (response: UserMenuResponse) => void;
  clearMenus: () => void;
  invalidateCache: () => void;
}

// Cache TTL: 15 minutes
const CACHE_TTL = 15 * 60 * 1000;

export const useMenuStore = create<MenuState>((set, get) => ({
  sidebarMenus: [],
  mobileMenus: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,

  fetchMenus: async () => {
    const { lastFetchedAt, isLoading } = get();

    // Skip if already loading
    if (isLoading) return;

    // Check cache validity
    if (lastFetchedAt && Date.now() - lastFetchedAt < CACHE_TTL) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await menuService.getMyMenus();
      set({
        sidebarMenus: response.sidebarMenus,
        mobileMenus: response.mobileMenus,
        isLoading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to fetch menus:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '메뉴를 불러오는데 실패했습니다.',
      });
    }
  },

  setMenus: (response: UserMenuResponse) => {
    set({
      sidebarMenus: response.sidebarMenus,
      mobileMenus: response.mobileMenus,
      lastFetchedAt: Date.now(),
    });
  },

  clearMenus: () => {
    set({
      sidebarMenus: [],
      mobileMenus: [],
      lastFetchedAt: null,
      error: null,
    });
  },

  invalidateCache: () => {
    set({ lastFetchedAt: null });
  },
}));

/**
 * Hook to use menus with automatic fetching.
 */
export function useMenus() {
  const { sidebarMenus, mobileMenus, isLoading, error, fetchMenus } = useMenuStore();

  return {
    sidebarMenus,
    mobileMenus,
    isLoading,
    error,
    fetchMenus,
  };
}
