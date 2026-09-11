'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MagnifyingGlass as Search,
    ChefHat,
    Fire as Flame,
    CubeFocus,
    ShoppingCartSimple,
    Plus,
    Minus,
    Trash,
    CheckCircle,
    ForkKnife,
    Timer,
    CaretRight,
    X,
} from '@phosphor-icons/react';
import dynamic from 'next/dynamic';
import { categories as defaultCategories, menuItems as defaultMenuItems } from '@/data/menuData';
import { LogoIcon } from '@/components/Logo';
import { useDataStore } from '@/stores/useDataStore';
import { useOrdersStore } from '@/stores/useOrdersStore';
import { MenuItem, CartItem } from '@/types';
import toast, { Toaster } from 'react-hot-toast';

// Dynamic import for Web Component compatibility
const ARViewer = dynamic(() => import('@/components/menu/ARViewer').then(mod => mod.ARViewer), { ssr: false });

function CustomerMenuContent() {
    const searchParams = useSearchParams();
    const tableParam = searchParams.get('table');

    // Parse initial table number (e.g. 'T3' -> 3, '5' -> 5, default 1)
    const initialTable = useMemo(() => {
        if (!tableParam) return 1;
        const parsed = parseInt(tableParam.replace(/\D/g, ''), 10);
        return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
    }, [tableParam]);

    const [tableNumber, setTableNumber] = useState<number>(initialTable);
    const [isEditingTable, setIsEditingTable] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [arItem, setArItem] = useState<MenuItem | null>(null);

    // Cart and order states
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [orderNotes, setOrderNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recentTicketId, setRecentTicketId] = useState<string | null>(null);

    // Dynamic data store
    const { menuItems: storeItems, categories: storeCategories, initData } = useDataStore();

    useEffect(() => {
        initData();
    }, [initData]);

    // Categories source
    const categoriesList = useMemo(() => {
        if (storeCategories && storeCategories.length > 0) {
            return [
                { id: 'all', label: 'All Dishes' },
                ...storeCategories.map(c => ({ id: c.id, label: c.name }))
            ];
        }
        return defaultCategories;
    }, [storeCategories]);

    // Menu items source
    const allDishes: MenuItem[] = useMemo(() => {
        if (storeItems && storeItems.length > 0) {
            return storeItems;
        }
        return defaultMenuItems;
    }, [storeItems]);

    // Filter available dishes
    const filteredItems = useMemo(() => {
        let items = allDishes.filter((i) => i.is_available !== false);
        if (activeCategory !== 'all') {
            items = items.filter((item) => {
                const normCat = item.category.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-');
                return normCat === activeCategory || item.category.toLowerCase().includes(activeCategory.toLowerCase());
            });
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            items = items.filter((item) =>
                item.name.toLowerCase().includes(q) ||
                (item.name_np && item.name_np.includes(q)) ||
                item.description.toLowerCase().includes(q)
            );
        }
        return items;
    }, [allDishes, activeCategory, search]);

    // Group items by category
    const groupedItems = useMemo(() => {
        const groups: Record<string, MenuItem[]> = {};
        filteredItems.forEach((item) => {
            const cat = item.category;
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        return groups;
    }, [filteredItems]);

    // Cart calculations
    const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
    const cartSubtotal = useMemo(() => cart.reduce((sum, item: any) => sum + ((item.menu_item?.price ?? item.price ?? 0) * (item.quantity || 1)), 0), [cart]);

    const addToCart = (dish: MenuItem, size?: string) => {
        setCart((prev) => {
            const existingIndex = prev.findIndex((i) => i.menu_item.id === dish.id && i.selected_size === size);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex].quantity += 1;
                return updated;
            }
            return [...prev, { menu_item: dish, quantity: 1, selected_size: size }];
        });
        toast.success(`Added ${dish.name} to order`, {
            duration: 1800,
            style: { background: '#18181b', color: '#fff', fontSize: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }
        });
    };

    const updateQuantity = (dishId: string, size: string | undefined, delta: number) => {
        setCart((prev) => {
            return prev.map((item) => {
                if (item.menu_item.id === dishId && item.selected_size === size) {
                    const newQty = item.quantity + delta;
                    return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
            }).filter(Boolean) as CartItem[];
        });
    };

    const handleSendOrder = async () => {
        if (cart.length === 0) return;
        setIsSubmitting(true);

        try {
            const orderPayload = {
                tableNumber: tableNumber,
                items: cart,
                specialNotes: orderNotes.trim(),
                total: cartSubtotal,
                waiterName: `Guest QR (Table ${tableNumber})`,
                type: 'Dine-In' as const,
            };

            await useOrdersStore.getState().addOrder(orderPayload);
            const ticketId = `T${tableNumber}-${Math.floor(100 + Math.random() * 900)}`;
            setRecentTicketId(ticketId);
            setCart([]);
            setOrderNotes('');
            setIsCartOpen(false);

            toast.custom((t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-emerald-950/90 border border-emerald-500/30 text-white shadow-2xl rounded-2xl pointer-events-auto flex p-4`}
                >
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" weight="fill" />
                        <div>
                            <p className="text-xs font-bold font-['Outfit']">Order Sent to Kitchen!</p>
                            <p className="text-[11px] text-emerald-200/80">Table {tableNumber} · Ticket #{ticketId}. Chef is preparing your dishes.</p>
                        </div>
                    </div>
                </div>
            ), { duration: 5000 });
        } catch (err) {
            console.error('Failed to submit order:', err);
            toast.error('Failed to send order. Please notify a waiter.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen text-white relative pb-28" style={{ background: '#09090b' }}>
            <Toaster position="top-center" />

            {/* Top Navigation Header */}
            <div className="sticky top-0 z-30 px-4 py-3 border-b border-white/10 backdrop-blur-xl" style={{ background: 'rgba(9, 9, 11, 0.88)' }}>
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg bg-white text-black">
                                <LogoIcon size={18} />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold font-['Outfit'] tracking-tight text-white flex items-center gap-1.5">
                                    myRestro
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                                        Live
                                    </span>
                                </h1>
                                <p className="text-[10px] text-white/50">Digital & AR Interactive Menu</p>
                            </div>
                        </div>

                        {/* Table Selector Chip */}
                        <div className="flex items-center gap-2">
                            {isEditingTable ? (
                                <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/20">
                                    <span className="text-[10px] text-white/60 pl-1 font-mono">T-</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="99"
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(parseInt(e.target.value, 10) || 1)}
                                        className="w-10 text-center font-bold text-xs bg-white/15 text-white rounded focus:outline-none"
                                        autoFocus
                                        onBlur={() => setIsEditingTable(false)}
                                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingTable(false)}
                                    />
                                    <button
                                        onClick={() => setIsEditingTable(false)}
                                        className="text-[10px] font-bold px-1.5 py-0.5 bg-white text-black rounded hover:bg-white/90"
                                    >
                                        Set
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsEditingTable(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/8 hover:bg-white/15 border border-white/15 transition-all text-white/90 active:scale-95"
                                >
                                    <ForkKnife className="w-3.5 h-3.5 text-emerald-400" weight="bold" />
                                    <span>Table {tableNumber}</span>
                                    <span className="text-[9px] text-white/40 underline ml-0.5">change</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" weight="bold" />
                        <input
                            type="text"
                            placeholder="Search momos, pizza, burgers, beverages..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-white/30 bg-white/5 border border-white/10 text-white placeholder:text-white/40 transition-colors"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Active Ticket Banner */}
            {recentTicketId && (
                <div className="max-w-lg mx-auto px-4 mt-3">
                    <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <div>
                                <p className="text-xs font-bold text-emerald-300">Kitchen Preparing Ticket #{recentTicketId}</p>
                                <p className="text-[10px] text-emerald-400/70">Table {tableNumber} · Dishes will arrive at your table shortly</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setRecentTicketId(null)}
                            className="text-[10px] text-emerald-400/80 hover:text-emerald-200 px-2 py-1"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Category Pills */}
            <div className="px-4 py-3 overflow-x-auto hide-scrollbar sticky top-24.5 z-20 backdrop-blur-md" style={{ background: 'rgba(9, 9, 11, 0.75)' }}>
                <div className="max-w-lg mx-auto flex gap-1.5">
                    {categoriesList.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                    isActive
                                        ? 'bg-white text-black shadow-lg font-bold scale-102'
                                        : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/8'
                                }`}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Menu Items List */}
            <div className="px-4 pt-1">
                <div className="max-w-lg mx-auto space-y-7">
                    {Object.entries(groupedItems).map(([category, items]) => (
                        <div key={category}>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-white/50 font-mono">
                                    {category}
                                </h2>
                                <span className="text-[10px] text-white/30 font-mono">{items.length} items</span>
                            </div>

                            <div className="space-y-3">
                                {items.map((item) => {
                                    const cartItem = cart.find((c) => c.menu_item.id === item.id);
                                    const qtyInCart = cartItem ? cartItem.quantity : 0;

                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3.5 rounded-2xl flex gap-3.5 bg-white/4 border border-white/8 shadow-md hover:border-white/15 transition-all relative overflow-hidden"
                                        >
                                            {/* Dish Thumbnail */}
                                            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-white/5 relative border border-white/5">
                                                {item.image_url ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xl opacity-30">
                                                        🍽️
                                                    </div>
                                                )}
                                                {item.spice_levels && item.spice_levels.length >= 2 && (
                                                    <span className="absolute bottom-1 right-1 flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/75 text-[8px] font-bold text-red-400 border border-red-500/20">
                                                        <Flame className="w-2.5 h-2.5" weight="fill" />
                                                    </span>
                                                )}
                                                {item.is_vegetarian && (
                                                    <span className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-black" />
                                                )}
                                            </div>

                                            {/* Dish Info */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-start justify-between gap-1">
                                                        <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                                                            {item.name}
                                                        </h3>
                                                    </div>
                                                    {item.name_np && (
                                                        <p className="text-[10px] text-white/40 font-serif">{item.name_np}</p>
                                                    )}
                                                    <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2 mt-1">
                                                        {item.description}
                                                    </p>
                                                </div>

                                                {/* Metadata & Actions */}
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-sm font-black font-mono text-white">
                                                            Rs. {item.price}
                                                        </span>
                                                        {item.calories && (
                                                            <span className="text-[9px] text-white/40 font-mono">
                                                                · {item.calories} kcal
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        {/* AR 3D View Button */}
                                                        {item.ar_model_url && (
                                                            <button
                                                                onClick={() => setArItem(item)}
                                                                className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all active:scale-95 shadow-sm"
                                                            >
                                                                <CubeFocus className="w-3.5 h-3.5 text-emerald-400" weight="fill" />
                                                                AR 3D
                                                            </button>
                                                        )}

                                                        {/* Add / Quantity Control */}
                                                        {qtyInCart > 0 ? (
                                                            <div className="flex items-center gap-1 bg-white/10 rounded-full p-0.5 border border-white/15">
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, undefined, -1)}
                                                                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs transition-colors"
                                                                >
                                                                    <Minus className="w-3 h-3" />
                                                                </button>
                                                                <span className="text-xs font-bold font-mono px-1.5 text-white">
                                                                    {qtyInCart}
                                                                </span>
                                                                <button
                                                                    onClick={() => addToCart(item)}
                                                                    className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold transition-transform active:scale-90"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => addToCart(item)}
                                                                className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-white text-black hover:bg-white/90 transition-all active:scale-95 shadow-md"
                                                            >
                                                                <Plus className="w-3 h-3" weight="bold" />
                                                                Add
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {filteredItems.length === 0 && (
                        <div className="text-center py-16">
                            <ChefHat className="w-10 h-10 mx-auto mb-2 text-white/30" weight="duotone" />
                            <h3 className="text-sm font-bold text-white/70">No dishes match your search</h3>
                            <p className="text-xs text-white/40 mt-1">Try searching for other ingredients or categories.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Bottom Cart Bar */}
            <AnimatePresence>
                {cartCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-4 inset-x-4 z-40 max-w-lg mx-auto"
                    >
                        <div
                            onClick={() => setIsCartOpen(true)}
                            className="p-3.5 rounded-2xl flex items-center justify-between cursor-pointer shadow-2xl transition-all hover:scale-101 border border-white/20 active:scale-99"
                            style={{
                                background: 'rgba(255, 255, 255, 0.98)',
                                color: '#09090b',
                                backdropFilter: 'blur(16px)',
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center relative font-bold text-xs shadow-md">
                                    <ShoppingCartSimple className="w-4.5 h-4.5" weight="bold" />
                                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 text-black text-[9px] flex items-center justify-center font-black">
                                        {cartCount}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold leading-tight">Table {tableNumber} Order</p>
                                    <p className="text-[11px] text-black/60 font-mono">
                                        {cartCount} {cartCount === 1 ? 'item' : 'items'} · Rs. {cartSubtotal}
                                    </p>
                                </div>
                            </div>

                            <button className="flex items-center gap-1 text-xs font-black px-4 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 transition-colors shadow">
                                <span>Review & Send</span>
                                <CaretRight className="w-3 h-3" weight="bold" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Order Review Modal / Drawer */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center isolate">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
                            className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 flex flex-col max-h-[88vh] overflow-hidden"
                            style={{
                                background: '#121216',
                                border: '1px solid rgba(255,255,255,0.12)',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                            }}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                <div>
                                    <h2 className="text-base font-bold font-['Outfit'] text-white flex items-center gap-2">
                                        Review Your Order
                                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                                            Table {tableNumber}
                                        </span>
                                    </h2>
                                    <p className="text-xs text-white/50">Ticket will be sent directly to the kitchen display</p>
                                </div>
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Cart Items List */}
                            <div className="flex-1 overflow-y-auto hide-scrollbar py-4 space-y-3">
                                {cart.map((item: any) => {
                                    const mItem = item.menu_item || item;
                                    const itemId = mItem.id || item.id || 'item';
                                    const itemName = mItem.name || item.name || 'Item';
                                    const itemPrice = mItem.price || item.price || 0;
                                    return (
                                        <div
                                            key={itemId + (item.selected_size || '')}
                                            className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/6"
                                        >
                                            <div className="min-w-0 flex-1 mr-3">
                                                <h4 className="text-xs font-bold text-white truncate">{itemName}</h4>
                                                <p className="text-[11px] text-white/50 font-mono">
                                                    Rs. {itemPrice} × {item.quantity} = Rs. {itemPrice * (item.quantity || 1)}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => updateQuantity(item.menu_item.id, item.selected_size, -1)}
                                                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs"
                                                >
                                                    {item.quantity === 1 ? <Trash className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3" />}
                                                </button>
                                                <span className="w-6 text-center font-bold text-xs font-mono text-white">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.menu_item.id, item.selected_size, 1)}
                                                    className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center text-xs font-bold"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Kitchen Special Notes */}
                                <div className="pt-2">
                                    <label className="text-[11px] font-semibold text-white/60 block mb-1.5">
                                        Special Instructions / Dietary Notes (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={orderNotes}
                                        onChange={(e) => setOrderNotes(e.target.value)}
                                        placeholder="e.g. Less spicy, dressing on the side, no peanuts..."
                                        className="w-full text-xs rounded-xl p-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer / Checkout */}
                            <div className="pt-4 border-t border-white/10 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/60">Estimated Total</span>
                                    <span className="font-mono font-black text-lg text-white">Rs. {cartSubtotal}</span>
                                </div>

                                <button
                                    disabled={isSubmitting || cart.length === 0}
                                    onClick={handleSendOrder}
                                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-white text-black hover:bg-white/95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-98"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Timer className="w-4 h-4 animate-spin" />
                                            Transmitting to Kitchen...
                                        </>
                                    ) : (
                                        <>
                                            <ChefHat className="w-4.5 h-4.5" weight="fill" />
                                            Send Order to Kitchen
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AR Modal Overlay */}
            {arItem && (
                <ARViewer
                    isOpen={!!arItem}
                    onClose={() => setArItem(null)}
                    modelSrc={arItem.ar_model_url || '/pizza.glb'}
                    iosSrc={arItem.ar_model_ios}
                    thumbnail={arItem.image_url}
                    itemName={arItem.name}
                    itemPrice={itemPriceSafe(arItem)}
                    itemDescription={arItem.description}
                    calories={arItem.calories}
                    prepTime={arItem.prep_time_minutes}
                    spiceLevels={arItem.spice_levels}
                    allergens={arItem.allergens}
                    isVegetarian={arItem.is_vegetarian}
                    onAddToCart={() => addToCart(arItem)}
                />
            )}
        </div>
    );
}

function itemPriceSafe(item: MenuItem): number {
    return typeof item.price === 'number' ? item.price : 0;
}

export default function CustomerMenuPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-xs text-white/50 font-mono">Loading Menu...</p>
                </div>
            </div>
        }>
            <CustomerMenuContent />
        </Suspense>
    );
}
