import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
    collapsed: boolean;
    toggleCollapsed: () => void;
    setCollapsed: (collapsed: boolean) => void;
    mobileOpen: boolean;
    toggleMobile: () => void;
    setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
    persist(
        (set) => ({
            collapsed: true,
            toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
            setCollapsed: (collapsed) => set({ collapsed }),
            mobileOpen: false,
            toggleMobile: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
            setMobileOpen: (mobileOpen) => set({ mobileOpen }),
        }),
        { name: 'restaurant-sidebar' }
    )
);
