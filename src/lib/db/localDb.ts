import Dexie, { Table } from 'dexie';
import { categories as defaultCategories, menuItems as defaultMenuItems } from '@/data/menuData';

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

export interface LocalCategory {
  id: string;
  name: string;
  label: string;
  sort_order: number;
}

export interface LocalMenuItem {
  id: string;
  category_id: string;
  category: string;
  name: string;
  name_np?: string;
  description: string;
  price: number;
  type: string; // 'food' | 'beverage' | 'other'
  image: string | null;
  image_url: string;
  is_available: boolean;
  sizes?: string[];
  variations?: string[];
  spice_levels?: string[];
  calories?: number;
  prep_time_minutes?: number;
  allergens?: string[];
  is_vegetarian?: boolean;
  ar_model_url?: string;
  ar_model_ios?: string;
}

export interface LocalTable {
  id: string; // "1", "2", etc.
  table_number: string; // "T1", "T2"
  label: string;
  capacity: number;
  seats: number;
  status: 'vacant' | 'occupied' | 'needs_attention' | 'reserved';
  section?: string; // 'Window' | 'Center' | 'Family' | 'Patio'
  order_id?: string;
  guest_count?: number;
  occupied_since?: string;
}

export interface LocalHotelRoom {
  id: string;
  room_number: string;
  status: string;
}

export interface LocalIngredient {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number;
  last_restocked?: string;
}

export interface LocalTransaction {
  id: string;
  order_id?: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  method: 'Cash' | 'Card' | 'eSewa' | 'Khalti' | 'Fonepay' | 'Bank';
  date: string;
}

export interface SyncQueueOrder {
  local_id?: number;
  type: 'Dine-In' | 'Takeaway' | 'Delivery' | 'Room-Service';
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  table_number?: string;
  customer_info?: Record<string, unknown>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method?: string;
  items: Array<{
    menu_item_id: string;
    name?: string;
    quantity: number;
    price_at_time: number;
    notes?: string;
  }>;
  created_at: string;
  sync_status: 'pending' | 'synced' | 'failed';
  error_message?: string;
}

// ---------------------------------------------------------
// DATABASE DEFINITION
// ---------------------------------------------------------

export class RestaurantLocalDB extends Dexie {
  categories!: Table<LocalCategory, string>;
  menu_items!: Table<LocalMenuItem, string>;
  restaurant_tables!: Table<LocalTable, string>;
  hotel_rooms!: Table<LocalHotelRoom, string>;
  ingredients!: Table<LocalIngredient, string>;
  transactions!: Table<LocalTransaction, string>;
  sync_queue!: Table<SyncQueueOrder, number>;

  constructor() {
    super('RestaurantManagementDB');

    this.version(3).stores({
      categories: 'id, sort_order, name',
      menu_items: 'id, category_id, category, type, is_available',
      restaurant_tables: 'id, status, table_number, section',
      hotel_rooms: 'id, status',
      ingredients: 'id, category, name',
      transactions: 'id, type, method, date, order_id',
      sync_queue: '++local_id, sync_status, created_at'
    });
  }
}

// Export singleton instance
export const localDb = new RestaurantLocalDB();

// ---------------------------------------------------------
// AUTOMATIC SEEDER FOR OFFLINE / INITIAL RUN
// ---------------------------------------------------------

export async function seedLocalDbIfEmpty(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const categoryCount = await localDb.categories.count();
    if (categoryCount === 0) {
      const catsToInsert: LocalCategory[] = defaultCategories
        .filter((c) => c.id !== 'all')
        .map((c, idx) => ({
          id: c.id,
          name: c.label,
          label: c.label,
          sort_order: idx + 1,
        }));
      await localDb.categories.bulkPut(catsToInsert);
    }

    const itemCount = await localDb.menu_items.count();
    if (itemCount === 0) {
      const itemsToInsert: LocalMenuItem[] = defaultMenuItems.map((item) => {
        const normCatId = item.category.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-');
        return {
          id: item.id,
          category_id: normCatId,
          category: item.category,
          name: item.name,
          name_np: item.name_np,
          description: item.description,
          price: item.price,
          type: item.category.toLowerCase().includes('drink') ? 'beverage' : 'food',
          image: item.image_url,
          image_url: item.image_url,
          is_available: item.is_available,
          sizes: item.sizes,
          variations: item.variations,
          spice_levels: item.spice_levels,
          calories: item.calories,
          prep_time_minutes: item.prep_time_minutes,
          allergens: item.allergens,
          is_vegetarian: item.is_vegetarian,
          ar_model_url: item.ar_model_url,
          ar_model_ios: item.ar_model_ios,
        };
      });
      await localDb.menu_items.bulkPut(itemsToInsert);
    }

    const tableCount = await localDb.restaurant_tables.count();
    if (tableCount === 0) {
      const defaultTables: LocalTable[] = Array.from({ length: 12 }, (_, i) => {
        const id = (i + 1).toString();
        const seats = i < 4 ? 2 : i < 8 ? 4 : 6;
        const section = i < 4 ? 'Window' : i < 8 ? 'Center' : 'Family';
        return {
          id,
          table_number: `T${id}`,
          label: `T${id}`,
          capacity: seats,
          seats,
          status: 'vacant' as const,
          section,
        };
      });
      await localDb.restaurant_tables.bulkPut(defaultTables);
    }

    const ingredientCount = await localDb.ingredients.count();
    if (ingredientCount === 0) {
      const defaultIngredients: LocalIngredient[] = [
        { id: 'INV-001', name: 'Buff (Buffalo Meat)', category: 'Meat', unit: 'kg', current_stock: 12, min_stock: 5, cost_per_unit: 700, last_restocked: '2026-02-18' },
        { id: 'INV-002', name: 'Chicken', category: 'Meat', unit: 'kg', current_stock: 8, min_stock: 5, cost_per_unit: 400, last_restocked: '2026-02-18' },
        { id: 'INV-003', name: 'All-Purpose Flour', category: 'Grains', unit: 'kg', current_stock: 25, min_stock: 10, cost_per_unit: 90, last_restocked: '2026-02-15' },
        { id: 'INV-004', name: 'Rice (Basmati)', category: 'Grains', unit: 'kg', current_stock: 40, min_stock: 20, cost_per_unit: 120, last_restocked: '2026-02-14' },
        { id: 'INV-005', name: 'Cooking Oil', category: 'Oil', unit: 'ltr', current_stock: 15, min_stock: 8, cost_per_unit: 250, last_restocked: '2026-02-16' },
        { id: 'INV-006', name: 'Onion', category: 'Vegetables', unit: 'kg', current_stock: 3, min_stock: 10, cost_per_unit: 80, last_restocked: '2026-02-17' },
        { id: 'INV-007', name: 'Tomato', category: 'Vegetables', unit: 'kg', current_stock: 5, min_stock: 8, cost_per_unit: 60, last_restocked: '2026-02-17' },
        { id: 'INV-008', name: 'Ginger Garlic Paste', category: 'Spices', unit: 'kg', current_stock: 2, min_stock: 3, cost_per_unit: 300, last_restocked: '2026-02-16' },
        { id: 'INV-009', name: 'Masala Tea Leaves', category: 'Beverages', unit: 'kg', current_stock: 4, min_stock: 2, cost_per_unit: 800, last_restocked: '2026-02-13' },
        { id: 'INV-010', name: 'Ghee', category: 'Dairy', unit: 'ltr', current_stock: 6, min_stock: 3, cost_per_unit: 650, last_restocked: '2026-02-17' },
        { id: 'INV-011', name: 'Paneer', category: 'Dairy', unit: 'kg', current_stock: 1, min_stock: 3, cost_per_unit: 500, last_restocked: '2026-02-18' },
        { id: 'INV-012', name: 'Lentils (Dal)', category: 'Grains', unit: 'kg', current_stock: 18, min_stock: 10, cost_per_unit: 180, last_restocked: '2026-02-14' },
      ];
      await localDb.ingredients.bulkPut(defaultIngredients);
    }

    const txnCount = await localDb.transactions.count();
    if (txnCount === 0) {
      const defaultTxns: LocalTransaction[] = [
        { id: 'EXP-001', type: 'expense', category: 'Ingredients', description: 'Vegetable market — weekly purchase', amount: 4500, method: 'Cash', date: new Date(Date.now() - 3600000).toISOString() },
        { id: 'EXP-002', type: 'expense', category: 'Salary', description: 'Staff salary — Ram Sharma (Chef)', amount: 25000, method: 'Bank', date: new Date(Date.now() - 86400000).toISOString() },
        { id: 'EXP-003', type: 'expense', category: 'Utilities', description: 'NEA electricity bill', amount: 3200, method: 'eSewa', date: new Date(Date.now() - 172800000).toISOString() },
        { id: 'EXP-004', type: 'expense', category: 'Rent', description: 'Monthly shop rent', amount: 45000, method: 'Bank', date: new Date(Date.now() - 86400000 * 3).toISOString() },
      ];
      await localDb.transactions.bulkPut(defaultTxns);
    }
  } catch (err) {
    console.error('Failed to seed localDb:', err);
  }
}
