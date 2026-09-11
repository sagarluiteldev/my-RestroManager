import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StockItem {
    id: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    minStock: number;
    costPerUnit: number;
    lastRestocked: string;
}

const initialStockData: StockItem[] = [
    { id: 'INV-001', name: 'Buff (Buffalo Meat)', category: 'Meat', unit: 'kg', currentStock: 12, minStock: 5, costPerUnit: 700, lastRestocked: '2026-02-18' },
    { id: 'INV-002', name: 'Chicken', category: 'Meat', unit: 'kg', currentStock: 8, minStock: 5, costPerUnit: 400, lastRestocked: '2026-02-18' },
    { id: 'INV-003', name: 'All-Purpose Flour', category: 'Grains', unit: 'kg', currentStock: 25, minStock: 10, costPerUnit: 90, lastRestocked: '2026-02-15' },
    { id: 'INV-004', name: 'Rice (Basmati)', category: 'Grains', unit: 'kg', currentStock: 40, minStock: 20, costPerUnit: 120, lastRestocked: '2026-02-14' },
    { id: 'INV-005', name: 'Cooking Oil', category: 'Oil', unit: 'ltr', currentStock: 15, minStock: 8, costPerUnit: 250, lastRestocked: '2026-02-16' },
    { id: 'INV-006', name: 'Onion', category: 'Vegetables', unit: 'kg', currentStock: 3, minStock: 10, costPerUnit: 80, lastRestocked: '2026-02-17' },
    { id: 'INV-007', name: 'Tomato', category: 'Vegetables', unit: 'kg', currentStock: 5, minStock: 8, costPerUnit: 60, lastRestocked: '2026-02-17' },
    { id: 'INV-008', name: 'Ginger Garlic Paste', category: 'Spices', unit: 'kg', currentStock: 2, minStock: 3, costPerUnit: 300, lastRestocked: '2026-02-16' },
    { id: 'INV-009', name: 'Masala Tea Leaves', category: 'Beverages', unit: 'kg', currentStock: 4, minStock: 2, costPerUnit: 800, lastRestocked: '2026-02-13' },
    { id: 'INV-010', name: 'Ghee', category: 'Dairy', unit: 'ltr', currentStock: 6, minStock: 3, costPerUnit: 650, lastRestocked: '2026-02-17' },
    { id: 'INV-011', name: 'Paneer', category: 'Dairy', unit: 'kg', currentStock: 1, minStock: 3, costPerUnit: 500, lastRestocked: '2026-02-18' },
    { id: 'INV-012', name: 'Lentils (Dal)', category: 'Grains', unit: 'kg', currentStock: 18, minStock: 10, costPerUnit: 180, lastRestocked: '2026-02-14' },
];

interface InventoryState {
    items: StockItem[];
    addItem: (item: Omit<StockItem, 'id' | 'lastRestocked'>) => void;
    updateItem: (id: string, item: Partial<StockItem>) => void;
    removeItem: (id: string) => void;
}

export const useInventoryStore = create<InventoryState>()(
    persist(
        (set) => ({
            items: initialStockData,
            addItem: (item) => set((state) => {
                const timestamp = new Date().toISOString().split('T')[0];
                const newId = `INV-${(state.items.length + 1).toString().padStart(3, '0')}`;
                return {
                    items: [{ ...item, id: newId, lastRestocked: timestamp }, ...state.items]
                };
            }),
            updateItem: (id, updatedFields) => set((state) => ({
                items: state.items.map((i) => i.id === id ? { ...i, ...updatedFields } : i)
            })),
            removeItem: (id) => set((state) => ({
                items: state.items.filter((i) => i.id !== id)
            })),
        }),
        { name: 'restaurant-inventory' }
    )
);
