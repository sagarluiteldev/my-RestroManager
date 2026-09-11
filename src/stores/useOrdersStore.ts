import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';
import { useNotificationStore } from './useNotificationStore';
import { useTableStore } from './useTableStore';
import { useDataStore } from './useDataStore';
import { localDb } from '@/lib/db/localDb';

export interface KitchenOrder {
    id: string;
    tableNumber: number;
    items: CartItem[];
    specialNotes: string;
    status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    type?: 'Dine-In' | 'Takeaway' | 'Delivery' | 'Room-Service';
    total: number;
    createdAt: string;
    waiterName: string;
}

interface OrdersState {
    orders: KitchenOrder[];
    addOrder: (order: Omit<KitchenOrder, 'id' | 'createdAt' | 'status'> & { total: number }) => void;
    updateOrderStatus: (id: string, status: KitchenOrder['status']) => void;
    removeOrder: (id: string) => void;

    // Remote Sync Helpers
    setOrders: (orders: KitchenOrder[]) => void;
    addOrderLocal: (order: KitchenOrder) => void;
    updateOrderStatusLocal: (id: string, status: KitchenOrder['status']) => void;
}

export const useOrdersStore = create<OrdersState>()(
    persist(
        (set, get) => ({
            orders: [],

            addOrder: async (order) => {
                const newOrder: KitchenOrder = {
                    ...order,
                    id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                    status: 'pending',
                    type: order.type || 'Dine-In',
                    createdAt: new Date().toISOString(),
                };

                // 1. Optimistic UI update
                set((state) => ({ orders: [newOrder, ...state.orders] }));

                // 2. Mark table as occupied in both stores
                if (order.tableNumber) {
                    const guestCount = order.items.reduce((s, i) => s + i.quantity, 0);
                    useTableStore.getState().occupyTable(order.tableNumber, newOrder.id, guestCount);
                    useDataStore.getState().occupyTable(order.tableNumber.toString(), newOrder.id, guestCount);
                }

                // 3. Queue into Dexie sync_queue for persistent offline-first resilience
                try {
                    await localDb.sync_queue.add({
                        type: newOrder.type || 'Dine-In',
                        status: 'pending',
                        table_number: newOrder.tableNumber.toString(),
                        subtotal: newOrder.total,
                        tax: 0,
                        discount: 0,
                        total: newOrder.total,
                        items: (newOrder.items || []).map((i) => ({
                            menu_item_id: i.menu_item?.id || (i as any).id || '',
                            name: i.menu_item?.name || (i as any).name || 'Item',
                            quantity: i.quantity,
                            price_at_time: i.menu_item?.price || (i as any).price || 0,
                            notes: newOrder.specialNotes,
                        })),
                        created_at: newOrder.createdAt,
                        sync_status: 'pending',
                    });
                } catch (dexieErr) {
                    console.warn('Could not enqueue order to Dexie sync_queue:', dexieErr);
                }

                // 4. Fire to Supabase in background (fail-safe)
                try {
                    const { createClient } = await import('@/lib/supabase');
                    const { useRoleStore } = await import('@/stores/useRoleStore');
                    const restaurantId = useRoleStore.getState().restaurantId;

                    if (restaurantId && restaurantId !== 'demo-restro-id') {
                        createClient().from('orders').insert({
                            id: newOrder.id,
                            restaurant_id: restaurantId,
                            table_number: newOrder.tableNumber,
                            items: newOrder.items,
                            status: newOrder.status,
                            notes: newOrder.specialNotes,
                            total: newOrder.total,
                            type: newOrder.type,
                        }).then(({ error }) => {
                            if (error) console.warn('Supabase order insert notice:', error.message);
                        });
                    }
                } catch (e) {
                    console.warn('Supabase client unreachable, order saved locally:', e);
                }

                // 5. Notify chef and manager
                useNotificationStore.getState().addNotification({
                    message: `New order for Table ${order.tableNumber} — ${order.items.length} item${order.items.length > 1 ? 's' : ''}`,
                    type: 'order_new',
                    forRole: 'chef',
                    tableNumber: order.tableNumber,
                    orderId: newOrder.id,
                });

                useNotificationStore.getState().addNotification({
                    message: `Table ${order.tableNumber} placed an order (Rs. ${order.total.toFixed(0)})`,
                    type: 'order_new',
                    forRole: 'owner',
                    tableNumber: order.tableNumber,
                    orderId: newOrder.id,
                });
            },

            updateOrderStatus: (id, status) => {
                const targetOrder = get().orders.find((o) => o.id === id);

                set((state) => {
                    const order = state.orders.find((o) => o.id === id);
                    if (order) {
                        if (status === 'preparing') {
                            useNotificationStore.getState().addNotification({
                                message: `Table ${order.tableNumber} — order is now being prepared`,
                                type: 'order_status',
                                forRole: 'waiter',
                                tableNumber: order.tableNumber,
                                orderId: id,
                            });
                        } else if (status === 'ready') {
                            useNotificationStore.getState().addNotification({
                                message: `Table ${order.tableNumber} — food is READY for pickup!`,
                                type: 'order_status',
                                forRole: 'waiter',
                                tableNumber: order.tableNumber,
                                orderId: id,
                            });
                            useNotificationStore.getState().addNotification({
                                message: `Table ${order.tableNumber} order ready for service`,
                                type: 'order_status',
                                forRole: 'owner',
                                tableNumber: order.tableNumber,
                                orderId: id,
                            });
                        } else if (status === 'completed') {
                            useNotificationStore.getState().addNotification({
                                message: `Table ${order.tableNumber} — order completed & paid`,
                                type: 'order_status',
                                forRole: 'all',
                                tableNumber: order.tableNumber,
                                orderId: id,
                            });

                            // Liberate table on completion
                            if (order.tableNumber) {
                                useTableStore.getState().vacateTable(order.tableNumber);
                                useDataStore.getState().vacateTable(order.tableNumber.toString());
                            }

                            // Auto-deduct ingredients from inventory
                            useDataStore.getState().deductIngredientsForOrder(
                                (order.items || []).map((i) => ({ name: i.menu_item?.name || (i as any).name || 'Item', quantity: i.quantity }))
                            );
                        }
                    }
                    return {
                        orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
                    };
                });

                // Fire background update to Supabase
                import('@/lib/supabase').then(({ createClient }) => {
                    createClient().from('orders').update({ status }).eq('id', id).then(() => {});
                }).catch(() => {});
            },

            removeOrder: (id) => {
                set((state) => ({
                    orders: state.orders.filter((o) => o.id !== id),
                }));
                import('@/lib/supabase').then(({ createClient }) => {
                    createClient().from('orders').delete().eq('id', id).then(() => {});
                }).catch(() => {});
            },

            // --- LOCAL SYNC ACTIONS ---
            setOrders: (orders) => set({ orders }),

            addOrderLocal: (order) => set((state) => {
                if (state.orders.find((o) => o.id === order.id)) return state;
                return { orders: [order, ...state.orders] };
            }),

            updateOrderStatusLocal: (id, status) => set((state) => ({
                orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
            })),
        }),
        { name: 'restaurant-orders' }
    )
);
