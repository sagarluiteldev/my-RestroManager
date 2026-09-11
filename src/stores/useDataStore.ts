'use client';

import { create } from 'zustand';
import {
  localDb,
  LocalCategory,
  LocalMenuItem,
  LocalTable,
  LocalIngredient,
  LocalTransaction,
  seedLocalDbIfEmpty,
} from '@/lib/db/localDb';

interface DataState {
  isInitialized: boolean;
  categories: LocalCategory[];
  menuItems: LocalMenuItem[];
  tables: LocalTable[];
  ingredients: LocalIngredient[];
  transactions: LocalTransaction[];

  // Initialization
  initData: () => Promise<void>;

  // Menu Items CRUD
  addMenuItem: (item: Omit<LocalMenuItem, 'id'>) => Promise<LocalMenuItem>;
  updateMenuItem: (id: string, updates: Partial<LocalMenuItem>) => Promise<void>;
  toggleMenuItemAvailability: (id: string) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;

  // Categories CRUD
  addCategory: (name: string, label?: string) => Promise<LocalCategory>;
  deleteCategory: (id: string) => Promise<void>;

  // Tables CRUD & Lifecycle
  addTable: (table: Omit<LocalTable, 'id'>) => Promise<LocalTable>;
  updateTable: (id: string, updates: Partial<LocalTable>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  setTableStatus: (id: string, status: LocalTable['status'], orderId?: string, guestCount?: number) => Promise<void>;
  occupyTable: (id: string, orderId: string, guestCount?: number) => Promise<void>;
  vacateTable: (id: string) => Promise<void>;

  // Inventory & Recipes
  adjustStock: (id: string, currentStock: number) => Promise<void>;
  addIngredient: (ingredient: Omit<LocalIngredient, 'id'>) => Promise<void>;
  deductIngredientsForOrder: (items: Array<{ name: string; quantity: number }>) => Promise<void>;

  // Transactions & Accounting
  addTransaction: (txn: Omit<LocalTransaction, 'id'>) => Promise<LocalTransaction>;
}

export const useDataStore = create<DataState>((set, get) => ({
  isInitialized: false,
  categories: [],
  menuItems: [],
  tables: [],
  ingredients: [],
  transactions: [],

  initData: async () => {
    if (typeof window === 'undefined') return;

    try {
      await seedLocalDbIfEmpty();

      const [categories, menuItems, tables, ingredients, transactions] = await Promise.all([
        localDb.categories.orderBy('sort_order').toArray(),
        localDb.menu_items.toArray(),
        localDb.restaurant_tables.toArray(),
        localDb.ingredients.toArray(),
        localDb.transactions.reverse().sortBy('date'),
      ]);

      set({
        isInitialized: true,
        categories,
        menuItems,
        tables,
        ingredients,
        transactions,
      });
    } catch (err) {
      console.error('Failed to initialize useDataStore from localDb:', err);
    }
  },

  // ---------------------------------------------------------
  // MENU ITEMS
  // ---------------------------------------------------------
  addMenuItem: async (itemData) => {
    const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newItem: LocalMenuItem = {
      ...itemData,
      id,
    };

    await localDb.menu_items.put(newItem);
    set((state) => ({ menuItems: [newItem, ...state.menuItems] }));
    return newItem;
  },

  updateMenuItem: async (id, updates) => {
    await localDb.menu_items.update(id, updates);
    set((state) => ({
      menuItems: state.menuItems.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }));
  },

  toggleMenuItemAvailability: async (id) => {
    const current = get().menuItems.find((i) => i.id === id);
    if (!current) return;
    const newStatus = !current.is_available;
    await localDb.menu_items.update(id, { is_available: newStatus });
    set((state) => ({
      menuItems: state.menuItems.map((item) => (item.id === id ? { ...item, is_available: newStatus } : item)),
    }));
  },

  deleteMenuItem: async (id) => {
    await localDb.menu_items.delete(id);
    set((state) => ({
      menuItems: state.menuItems.filter((i) => i.id !== id),
    }));
  },

  // ---------------------------------------------------------
  // CATEGORIES
  // ---------------------------------------------------------
  addCategory: async (name, label) => {
    const id = name.toLowerCase().trim().replace(/\s+/g, '-');
    const displayLabel = label || name;
    const maxOrder = get().categories.reduce((max, c) => Math.max(max, c.sort_order), 0);
    const newCat: LocalCategory = {
      id,
      name: displayLabel,
      label: displayLabel,
      sort_order: maxOrder + 1,
    };

    await localDb.categories.put(newCat);
    set((state) => ({ categories: [...state.categories, newCat] }));
    return newCat;
  },

  deleteCategory: async (id) => {
    await localDb.categories.delete(id);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },

  // ---------------------------------------------------------
  // TABLES
  // ---------------------------------------------------------
  addTable: async (tableData) => {
    const maxId = get().tables.reduce((max, t) => Math.max(max, parseInt(t.id, 10) || 0), 0);
    const id = (maxId + 1).toString();
    const newTable: LocalTable = {
      ...tableData,
      id,
    };

    await localDb.restaurant_tables.put(newTable);
    set((state) => ({ tables: [...state.tables, newTable] }));
    return newTable;
  },

  updateTable: async (id, updates) => {
    await localDb.restaurant_tables.update(id, updates);
    set((state) => ({
      tables: state.tables.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  deleteTable: async (id) => {
    await localDb.restaurant_tables.delete(id);
    set((state) => ({
      tables: state.tables.filter((t) => t.id !== id),
    }));
  },

  setTableStatus: async (id, status, orderId, guestCount) => {
    const updates: Partial<LocalTable> = {
      status,
      order_id: orderId,
      guest_count: guestCount,
      occupied_since: status === 'occupied' ? new Date().toISOString() : undefined,
    };

    await localDb.restaurant_tables.update(id, updates);
    set((state) => ({
      tables: state.tables.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  occupyTable: async (id, orderId, guestCount = 2) => {
    const updates: Partial<LocalTable> = {
      status: 'occupied',
      order_id: orderId,
      guest_count: guestCount,
      occupied_since: new Date().toISOString(),
    };

    await localDb.restaurant_tables.update(id, updates);
    set((state) => ({
      tables: state.tables.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  vacateTable: async (id) => {
    const updates: Partial<LocalTable> = {
      status: 'vacant',
      order_id: undefined,
      guest_count: undefined,
      occupied_since: undefined,
    };

    await localDb.restaurant_tables.update(id, updates);
    set((state) => ({
      tables: state.tables.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  // ---------------------------------------------------------
  // INVENTORY & RECIPES
  // ---------------------------------------------------------
  adjustStock: async (id, currentStock) => {
    const lastRestocked = new Date().toISOString().split('T')[0];
    await localDb.ingredients.update(id, { current_stock: currentStock, last_restocked: lastRestocked });
    set((state) => ({
      ingredients: state.ingredients.map((i) =>
        i.id === id ? { ...i, current_stock: currentStock, last_restocked: lastRestocked } : i
      ),
    }));
  },

  addIngredient: async (ingredientData) => {
    const id = `INV-${Date.now().toString().slice(-4)}`;
    const newIngredient: LocalIngredient = {
      ...ingredientData,
      id,
      last_restocked: new Date().toISOString().split('T')[0],
    };
    await localDb.ingredients.put(newIngredient);
    set((state) => ({ ingredients: [newIngredient, ...state.ingredients] }));
  },

  deductIngredientsForOrder: async (items) => {
    // Recipe depletion heuristics for restaurant menu items
    const deductions: Record<string, number> = {};

    for (const item of items) {
      const name = item.name.toLowerCase();
      const qty = item.quantity;

      if (name.includes('buff') || name.includes('momo')) {
        deductions['INV-001'] = (deductions['INV-001'] || 0) + 0.15 * qty; // 150g buff
        deductions['INV-003'] = (deductions['INV-003'] || 0) + 0.1 * qty; // 100g flour
        deductions['INV-006'] = (deductions['INV-006'] || 0) + 0.05 * qty; // 50g onion
      } else if (name.includes('chicken')) {
        deductions['INV-002'] = (deductions['INV-002'] || 0) + 0.2 * qty; // 200g chicken
      } else if (name.includes('dal') || name.includes('bhat')) {
        deductions['INV-004'] = (deductions['INV-004'] || 0) + 0.25 * qty; // 250g rice
        deductions['INV-012'] = (deductions['INV-012'] || 0) + 0.1 * qty; // 100g lentils
      } else if (name.includes('tea')) {
        deductions['INV-009'] = (deductions['INV-009'] || 0) + 0.02 * qty; // 20g tea leaves
      }
    }

    const currentIngredients = [...get().ingredients];
    for (const [invId, amount] of Object.entries(deductions)) {
      const target = currentIngredients.find((i) => i.id === invId);
      if (target) {
        const updatedStock = Math.max(0, parseFloat((target.current_stock - amount).toFixed(2)));
        await localDb.ingredients.update(invId, { current_stock: updatedStock });
        target.current_stock = updatedStock;
      }
    }
    set({ ingredients: currentIngredients });
  },

  // ---------------------------------------------------------
  // TRANSACTIONS
  // ---------------------------------------------------------
  addTransaction: async (txnData) => {
    const id = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const newTxn: LocalTransaction = {
      ...txnData,
      id,
    };

    await localDb.transactions.put(newTxn);
    set((state) => ({ transactions: [newTxn, ...state.transactions] }));
    return newTxn;
  },
}));
