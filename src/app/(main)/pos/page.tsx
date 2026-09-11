'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MagnifyingGlass,
    List,
    GridFour,
    Plus,
    Minus,
    Trash,
    Receipt,
    ArrowsSplit,
    Printer,
    CheckCircle,
    CaretDown,
    User,
    Storefront,
    Motorcycle,
    Armchair,
    Bed,
} from '@phosphor-icons/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDb } from '@/lib/db/localDb';
import { useSync } from '@/hooks/useSync';
import toast from 'react-hot-toast';
import { PrintOrder } from '@/components/ReceiptPrinter';
import { printReceipt, printKOT } from '@/lib/printUtils';
import { ManagerPinModal } from '@/components/ManagerPinModal';
import { CheckoutModal } from '@/components/CheckoutModal';
import { useOrdersStore } from '@/stores/useOrdersStore';

type OrderType = 'Dine-In' | 'Takeaway' | 'Delivery' | 'Room-Service';
type CartItem = { id: string; name: string; price: number; quantity: number; type: string };

export default function POSPage() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [orderType, setOrderType] = useState<OrderType>('Dine-In');
    const [cart, setCart] = useState<CartItem[]>([]);
    
    // Selection state
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    
    const [isMenuList, setIsMenuList] = useState(false); // Grid vs List view
    const [isProcessing, setIsProcessing] = useState(false);
    const [kotNumber, setKotNumber] = useState(1); // Mock KOT auto-increment

    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingItemToRemove, setPendingItemToRemove] = useState<string | null>(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    const { enqueueOrder } = useSync();

    const categories = useLiveQuery(() => localDb.categories.orderBy('sort_order').toArray()) || [];
    const menuItems = useLiveQuery(() => localDb.menu_items.toArray()) || [];
    const tables = useLiveQuery(() => localDb.restaurant_tables.toArray()) || [];
    const rooms = useLiveQuery(() => localDb.hotel_rooms.toArray()) || [];


    const filteredItems = menuItems.filter(item =>
        (activeCategory === 'All' || item.category_id === activeCategory) &&
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const addToCart = (item: typeof menuItems[0]) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, type: item.type }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQ = item.quantity + delta;
                return newQ > 0 ? { ...item, quantity: newQ } : item;
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const initiateRemoveItem = (id: string) => {
        setPendingItemToRemove(id);
        setShowPinModal(true);
    };

    const handlePinSuccess = () => {
        if (pendingItemToRemove) {
            removeItem(pendingItemToRemove);
        }
        setShowPinModal(false);
        setPendingItemToRemove(null);
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.13; // 13% VAT
    const discount = 0; // Hook up dynamic pricing here if happy hour
    const total = subtotal + tax - discount;

    const itemsForKOT = cart.filter(i => i.type === 'food').length;
    const itemsForBOT = cart.filter(i => i.type === 'beverage').length;

    const initiateCheckout = () => {
        if (cart.length === 0) return;
        setShowCheckoutModal(true);
    };

    const handleConfirmOrder = async (method: 'cash' | 'card' | 'room_charge', tendered?: number) => {
        setIsProcessing(true);
        try {
            const table = tables.find(t => t.id === selectedTableId);
            const room = rooms.find(r => r.id === selectedRoomId);
            
            const newOrderPayload = {
                type: orderType,
                status: 'pending' as const,
                table_id: selectedTableId,
                room_id: selectedRoomId,
                table_number: table?.table_number,  // Optional depending on if we still need raw string somewhere
                subtotal,
                tax,
                discount,
                total,
                payment_method: method,
                amount_tendered: tendered,
                items: cart.map(item => ({
                    menu_item_id: item.id,
                    quantity: item.quantity,
                    price_at_time: item.price
                }))
            };
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const localId = await enqueueOrder(newOrderPayload as any);

            // Sync to real-time KDS and Billing
            const tableNumInt = parseInt(table?.table_number?.replace(/\D/g, '') || selectedTableId || '1', 10);
            useOrdersStore.getState().addOrder({
                tableNumber: isNaN(tableNumInt) ? 1 : tableNumInt,
                items: cart.map(item => ({
                    menu_item: {
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        category: item.type === 'beverage' ? 'Drinks' : 'Food',
                        image_url: '',
                        is_available: true,
                        description: '',
                    },
                    quantity: item.quantity,
                })),
                specialNotes: `${orderType}${tendered ? ` · Tendered: Rs. ${tendered}` : ''}`,
                type: orderType as any,
                total,
                waiterName: 'POS Cashier',
            });
            
            // Generate print payload for the receipt printer
            const printPayload: PrintOrder = {
                id: localId.toString(),
                type: orderType,
                table_number: table?.table_number || room?.room_number || undefined,
                items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
                subtotal, tax, discount, total,
                date: new Date()
            };
            
            toast.success('Order placed and sent to Kitchen!');
            setCart([]);
            setOrderType('Dine-In');
            setSelectedTableId(null);
            setSelectedRoomId(null);
            setShowCheckoutModal(false);
            
            // Trigger print automatically
            printReceipt(printPayload);

        } catch {
            toast.error('Failed to place order.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrintKOT = () => {
        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }
        
        // Mock print payload just for KOT
        const table = tables.find(t => t.id === selectedTableId);
        const room = rooms.find(r => r.id === selectedRoomId);
        
        const printPayload: PrintOrder = {
            id: 'KOT',
            type: orderType,
            table_number: table?.table_number || room?.room_number || undefined,
            items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
            subtotal, tax, discount, total,
            date: new Date()
        };
        
        printKOT(printPayload, kotNumber);
        setKotNumber(prev => prev + 1);
    };

    return (
        <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-100px)] overflow-auto lg:overflow-hidden rounded-3xl" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>

            {/* TOP/LEFT: Menu Selection */}
            <div className="flex-1 flex flex-col min-w-0 lg:overflow-hidden w-full" style={{ borderRight: 'none' }}>
                {/* Header / Search */}
                <div className="p-5 w-full min-w-0 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-4 justify-between w-full min-w-0">
                        <div className="relative flex-1 max-w-md">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-shadow focus:ring-1 focus:ring-gray-400"
                                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsMenuList(false)} className="p-2.5 rounded-lg transition-colors" 
                                style={{ background: !isMenuList ? 'var(--text-primary)' : 'transparent', color: !isMenuList ? 'var(--bg-primary)' : 'var(--text-muted)' }}>
                                <GridFour className="w-5 h-5" weight={!isMenuList ? 'fill' : 'regular'} />
                            </button>
                            <button onClick={() => setIsMenuList(true)} className="p-2.5 rounded-lg transition-colors"
                                style={{ background: isMenuList ? 'var(--text-primary)' : 'transparent', color: isMenuList ? 'var(--bg-primary)' : 'var(--text-muted)' }}>
                                <List className="w-5 h-5" weight={isMenuList ? 'bold' : 'regular'} />
                            </button>
                        </div>
                    </div>

                    {/* Categories Scroll */}
                    <div className="flex items-center gap-2 mt-5 overflow-x-auto hide-scrollbar pb-1 w-full min-w-0">
                        <button
                            onClick={() => setActiveCategory('All')}
                            className="px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all"
                            style={{
                                background: activeCategory === 'All' ? 'var(--accent)' : 'transparent',
                                color: activeCategory === 'All' ? 'var(--accent-fg)' : 'var(--text-secondary)',
                                border: `1px solid ${activeCategory === 'All' ? 'transparent' : 'var(--border)'}`
                            }}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className="px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all"
                                style={{
                                    background: activeCategory === cat.id ? 'var(--accent)' : 'transparent',
                                    color: activeCategory === cat.id ? 'var(--accent-fg)' : 'var(--text-secondary)',
                                    border: `1px solid ${activeCategory === cat.id ? 'transparent' : 'var(--border)'}`
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid/List */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 hide-scrollbar relative w-full min-w-0">
                    {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--bg-card)' }}>
                                <span className="text-2xl opacity-50">🍽️</span>
                            </div>
                            <p className="text-gray-500 font-medium font-sm">No items found.</p>
                        </div>
                    ) : (
                        <div className={`grid gap-4 sm:gap-5 ${isMenuList ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
                            {filteredItems.map(item => (
                                <motion.div
                                    layoutId={`item-${item.id}`}
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    className={`group cursor-pointer rounded-2xl p-3 flex transition-all hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] ${isMenuList ? 'flex-row items-center gap-4' : 'flex-col justify-between'}`}
                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                                >
                                    <div className={`${isMenuList ? 'w-24 h-24 shrink-0' : 'w-full h-32'} rounded-xl bg-gray-200 overflow-hidden relative ${!isMenuList ? 'mb-3' : ''}`}>
                                        {item.image ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                                                <span className="text-2xl opacity-30">🍽️</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`px-1 flex flex-col ${isMenuList ? 'flex-1 min-w-0 justify-center' : ''}`}>
                                        <h3 className="text-sm font-bold truncate leading-tight mb-1" style={{ color: 'var(--text-primary)' }}>{item.name}</h3>
                                        <div className={`flex items-center justify-between mt-2 ${isMenuList ? 'pr-2' : ''}`}>
                                            <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>NPR {item.price}</span>
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0" style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
                                                <Plus className="w-4 h-4" weight="bold" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* BOTTOM/RIGHT: Active Order Panel */}
            <div className="w-full lg:max-w-100 flex flex-col shrink-0 lg:border-l" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', borderLeftColor: 'var(--border)' }}>

                {/* Order Type Tabs */}
                <div className="p-5 pb-0 w-full min-w-0 shrink-0">
                    <div className="flex items-center justify-between p-1 rounded-xl mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        {[
                            { id: 'Dine-In', icon: Armchair },
                            { id: 'Takeaway', icon: Storefront },
                            { id: 'Delivery', icon: Motorcycle },
                            { id: 'Room-Service', icon: Bed }
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setOrderType(type.id as OrderType)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all relative"
                                style={{
                                    color: orderType === type.id ? 'var(--accent-fg)' : 'var(--text-muted)',
                                }}
                            >
                                {orderType === type.id && (
                                    <motion.div layoutId="orderTypeBg" className="absolute inset-0 rounded-lg shadow-sm" style={{ background: 'var(--accent)' }} />
                                )}
                                <type.icon className="w-4 h-4 relative z-10" weight={orderType === type.id ? "fill" : "regular"} />
                                <span className="relative z-10">{type.id}</span>
                            </button>
                        ))}
                    </div>

                    {/* Meta Selectors */}
                    <div className="flex items-center gap-3">
                        <button className="flex-1 flex items-center justify-between p-3 rounded-xl border border-dashed transition-colors hover:opacity-80" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Walk-in Client</span>
                            </div>
                            <CaretDown className="w-3 h-3 text-gray-400" strokeWidth={3} />
                        </button>

                        {orderType === 'Dine-In' && (
                            <div className="flex-1 flex items-center justify-between p-3 rounded-xl border transition-colors shadow-sm hover:opacity-80 relative" style={{ borderColor: 'var(--border)', background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                                <select 
                                    className="bg-transparent outline-none w-full appearance-none text-xs font-bold cursor-pointer pr-4"
                                    value={selectedTableId || ''}
                                    onChange={(e) => setSelectedTableId(e.target.value)}
                                >
                                    <option value="" disabled>Select Table</option>
                                    {tables.map(t => <option key={t.id} value={t.id}>Table {t.table_number}</option>)}
                                </select>
                                <CaretDown className="w-3 h-3 opacity-60 pointer-events-none absolute right-3" strokeWidth={3} />
                            </div>
                        )}
                        
                        {orderType === 'Room-Service' && (
                            <div className="flex-1 flex items-center justify-between p-3 rounded-xl border transition-colors shadow-sm hover:opacity-80 relative" style={{ borderColor: 'var(--border)', background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                                <select 
                                    className="bg-transparent outline-none w-full appearance-none text-xs font-bold cursor-pointer pr-4"
                                    value={selectedRoomId || ''}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                >
                                    <option value="" disabled>Select Room</option>
                                    {rooms.map(r => <option key={r.id} value={r.id}>Room {r.room_number}</option>)}
                                </select>
                                <CaretDown className="w-3 h-3 opacity-60 pointer-events-none absolute right-3" strokeWidth={3} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 relative hide-scrollbar w-full min-w-0">
                    {cart.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 opacity-60">
                            <Receipt className="w-16 h-16 mb-4 text-gray-400" weight="thin" />
                            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cart is empty. Add items to start a new order.</p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {cart.map(item => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                    className="flex items-center justify-between group"
                                >
                                    <div className="flex-1 pr-3">
                                        <h4 className="text-sm font-bold leading-tight mb-1" style={{ color: 'var(--text-primary)' }}>{item.name}</h4>
                                        <p className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>NPR {item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-sm flex items-center justify-center transition-colors hover:opacity-80" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                            <Minus className="w-3 h-3 w-bold" />
                                        </button>
                                        <span className="w-5 text-center text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-sm flex items-center justify-center transition-colors hover:opacity-80" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                            <Plus className="w-3 h-3 w-bold" />
                                        </button>
                                        <button onClick={() => initiateRemoveItem(item.id)} className="w-7 h-7 rounded-md flex items-center justify-center ml-1 text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer / Checkout Box */}
                <div className="p-5 pt-6" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>

                    {/* Routing Indicators (KOT/BOT) */}
                    {cart.length > 0 && (
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-dashed" style={{ borderBottomColor: 'var(--border)' }}>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Routing</span>
                            <div className="flex gap-2 text-[10px] font-bold">
                                {itemsForKOT > 0 && <span className="px-2 py-1 rounded-md" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>KOT ({itemsForKOT})</span>}
                                {itemsForBOT > 0 && <span className="px-2 py-1 rounded-md" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>BOT ({itemsForBOT})</span>}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            <span>Subtotal</span>
                            <span>NPR {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            <span>VAT (13%)</span>
                            <span>NPR {tax.toLocaleString()}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-xs font-semibold text-green-500">
                                <span>Discount</span>
                                <span>- NPR {discount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-end pt-2 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
                            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Total</span>
                            <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>NPR {total.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex gap-1.5 sm:gap-2">
                        <button className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2 sm:py-3 rounded-xl border hover:opacity-80 transition-colors" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                            <ArrowsSplit className="w-5 h-5 shrink-0" />
                            <span className="text-[9px] sm:text-[10px] font-bold truncate px-1 max-w-full">Split</span>
                        </button>
                        <button onClick={handlePrintKOT} className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2 sm:py-3 rounded-xl border hover:opacity-80 transition-colors" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                            <Printer className="w-5 h-5 shrink-0" />
                            <span className="text-[9px] sm:text-[10px] font-bold truncate px-1 max-w-full">Print KOT</span>
                        </button>
                        <button 
                            disabled={isProcessing || cart.length === 0}
                            onClick={initiateCheckout}
                            className="flex-[1.5] sm:flex-2 min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50" 
                            style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                        >
                            <span className="text-xs sm:text-sm font-bold truncate px-1 max-w-full">
                                {isProcessing ? 'Processing' : 'Charge'}
                            </span>
                            {!isProcessing && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" weight="bold" />}
                        </button>
                    </div>
                </div>
            </div>

            <ManagerPinModal 
                isOpen={showPinModal} 
                onClose={() => {
                    setShowPinModal(false);
                    setPendingItemToRemove(null);
                }} 
                onSuccess={handlePinSuccess} 
            />

            <CheckoutModal
                isOpen={showCheckoutModal}
                onClose={() => setShowCheckoutModal(false)}
                total={total}
                onConfirm={handleConfirmOrder}
                isProcessing={isProcessing}
            />
        </div>
    );
}
