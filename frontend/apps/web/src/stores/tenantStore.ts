import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Tenant {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  logoUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface TenantBranding {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  loginBackgroundUrl?: string;
}

interface TenantState {
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  branding: TenantBranding | null;
  isLoading: boolean;

  // Actions
  setCurrentTenant: (tenant: Tenant) => void;
  setAvailableTenants: (tenants: Tenant[]) => void;
  setBranding: (branding: TenantBranding) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

const defaultBranding: TenantBranding = {
  primaryColor: '#1a1a2e',
  secondaryColor: '#16213e',
};

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currentTenant: null,
      availableTenants: [],
      branding: defaultBranding,
      isLoading: false,

      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
      setAvailableTenants: (tenants) => set({ availableTenants: tenants }),
      setBranding: (branding) => set({ branding }),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () =>
        set({
          currentTenant: null,
          availableTenants: [],
          branding: defaultBranding,
          isLoading: false,
        }),
    }),
    {
      name: 'hr-platform-tenant',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        availableTenants: state.availableTenants,
      }),
    }
  )
);
