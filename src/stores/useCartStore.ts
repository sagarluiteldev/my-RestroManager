import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem } from '@/types';

interface CartState {
    items: CartItem[];
    promoCode: string;
    tableNumber: number | null;
    specialNotes: string;
    addItem: (item: MenuItem, options?: { size?: string; variation?: string; spice?: string; extras?: string[] }) => void;
    removeItem: (itemId: string) => void;
    incrementQty: (itemId: string) => void;
    decrementQty: (itemId: string) => void;
    clearCart: () => void;
    setPromoCode: (code: string) => void;
    setTableNumber: (table: number | null) => void;
    setSpecialNotes: (notes: string) => void;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            promoCode: '',
            tableNumber: null,
            specialNotes: '',

            addItem: (item, options) => {
                set((state) => {
                    const existingIndex = state.items.findIndex(
                        (ci) =>
                            ci.menu_item.id === item.id &&
                            ci.selected_size === options?.size &&
                            ci.selected_variation === options?.variation
                    );

                    if (existingIndex > -1) {
                        const updated = [...state.items];
                        updated[existingIndex] = {
                            ...updated[existingIndex],
                            quantity: updated[existingIndex].quantity + 1,
                        };
                        return { items: updated };
                    }

                    return {
                        items: [
                            ...state.items,
                            {
                                menu_item: item,
                                quantity: 1,
                                selected_size: options?.size,
                                selected_variation: options?.variation,
                                selected_spice: options?.spice,
                                extras: options?.extras,
                            },
                        ],
                    };
                });
            },

            removeItem: (itemId) => {
                set((state) => ({
                    items: state.items.filter((ci) => ci.menu_item.id !== itemId),
                }));
            },

            incrementQty: (itemId) => {
                set((state) => ({
                    items: state.items.map((ci) =>
                        ci.menu_item.id === itemId ? { ...ci, quantity: ci.quantity + 1 } : ci
                    ),
                }));
            },

            decrementQty: (itemId) => {
                set((state) => ({
                    items: state.items
                        .map((ci) =>
                            ci.menu_item.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci
                        )
                        .filter((ci) => ci.quantity > 0),
                }));
            },

            clearCart: () => set({ items: [], promoCode: '', tableNumber: null, specialNotes: '' }),

            setPromoCode: (code) => set({ promoCode: code }),
            setTableNumber: (table) => set({ tableNumber: table }),
            setSpecialNotes: (notes) => set({ specialNotes: notes }),

            getTotal: () => {
                const { items, promoCode } = get();
                const subtotal = items.reduce(
                    (sum, ci: any) => sum + (ci.menu_item?.price ?? ci.price ?? 0) * (ci.quantity || 1),
                    0
                );
                const discount = promoCode ? subtotal * 0.1 : 0;
                return subtotal - discount;
            },

            getItemCount: () => {
                return get().items.reduce((sum, ci) => sum + ci.quantity, 0);
            },
        }),
        {
            name: 'restaurant-cart',
        }
    )
);
