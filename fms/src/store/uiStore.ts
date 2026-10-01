import { create } from 'zustand';

interface UiState {
  /** Desktop sidebar collapse (plan.md §2.0). */
  sidebarCollapsed: boolean;
  /** Mobile drawer open state (transient — never persisted). */
  mobileNavOpen: boolean;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
}

/**
 * Minimal UI store. Server data lives in TanStack Query, auth in Context —
 * this holds only cross-cutting UI flags (plan.md §1.3).
 */
export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
