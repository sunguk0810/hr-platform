import { useTenantStore, TenantBranding } from '@/stores/tenantStore';

const defaultBranding: TenantBranding = {
  primaryColor: '#1a1a2e',
  secondaryColor: '#16213e',
};

export function useBranding() {
  const { branding } = useTenantStore();
  return branding || defaultBranding;
}

export function applyBrandingStyles(branding: TenantBranding) {
  const root = document.documentElement;

  if (branding.primaryColor) {
    root.style.setProperty('--primary', hexToHsl(branding.primaryColor));
  }

  if (branding.secondaryColor) {
    root.style.setProperty('--secondary', hexToHsl(branding.secondaryColor));
  }
}

function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex to RGB
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
