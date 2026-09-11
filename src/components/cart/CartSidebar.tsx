'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    X as X,
    Minus as Minus,
    Plus as Plus,
    Trash as Trash2,
    Tag as Tag,
    ArrowRight as ArrowRight,
    ChatCircle as MessageSquare,
    Hash as Hash,
    ForkKnife as ForkKnife
} from '@phosphor-icons/react';
import { useCartStore } from '@/stores/useCartStore';
import { useOrdersStore } from '@/stores/useOrdersStore';
import { useRoleStore } from '@/stores/useRoleStore';
import toast from 'react-hot-toast';

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isMobile?: boolean;
}

const TABLE_COUNT = 12;

export default function CartSidebar({ isOpen, onClose, isMobile }: CartSidebarProps) {
    const {
        items, promoCode, tableNumber, specialNotes,
        incrementQty, decrementQty, clearCart,
        setPromoCode, setTableNumber, setSpecialNotes, getTotal,
    } = useCartStore();
    const addOrder = useOrdersStore((s) => s.addOrder);
    const userName = useRoleStore((s) => s.userName);

    const subtotal = items.reduce((sum, ci: any) => sum + (ci.menu_item?.price ?? ci.price ?? 0) * (ci.quantity || 1), 0);
    const discount = promoCode ? subtotal * 0.1 : 0;
    const total = getTotal();

    const handleSubmitOrder = () => {
        if (items.length === 0) { toast.error('Cart is empty'); return; }
        if (!tableNumber) { toast.error('Please select a table number'); return; }

        addOrder({
            tableNumber, items: [...items], specialNotes, total,
            waiterName: userName || 'Waiter',
        });

        toast.success(`Order sent to kitchen — Table ${tableNumber}`);
        clearCart();
        onClose();
    };

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                    <h2 className="text-sm font-bold font-['Outfit']" style={{ color: 'var(--text-primary)' }}>Current Order</h2>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {items.length} item{items.length !== 1 ? 's' : ''}{tableNumber ? ` · Table ${tableNumber}` : ''}
                    </p>
                </div>
                <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                    <X className="w-4 h-4" weight="bold" />
                </button>
            </div>

            {/* Table Grid */}
            <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <label className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Hash className="w-3 h-3" weight="bold" /> Table
                </label>
                <div className="grid grid-cols-6 gap-1">
                    {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((n) => (
                        <button key={n} onClick={() => setTableNumber(tableNumber === n ? null : n)}
                            className="py-1.5 rounded text-[11px] font-semibold transition-all"
                            style={{
                                background: tableNumber === n ? 'var(--accent)' : 'var(--bg-input)',
                                color: tableNumber === n ? 'var(--accent-fg)' : 'var(--text-secondary)',
                                border: `1px solid ${tableNumber === n ? 'var(--accent)' : 'var(--border)'}`,
                            }}
                        >{n}</button>
                    ))}
                </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-2.5 space-y-1.5">
                <AnimatePresence mode="popLayout">
                    {items.map((item: any) => {
                        const mItem = item.menu_item || item;
                        const itemId = mItem.id || item.id || 'item';
                        const itemName = mItem.name || item.name || 'Item';
                        const itemPrice = mItem.price || item.price || 0;
                        const itemImage = mItem.image_url || item.image_url || '';

                        return (
                            <motion.div
                                key={itemId + (item.selected_size || '') + (item.selected_variation || '')}
                                layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20, height: 0 }} transition={{ duration: 0.15 }}
                                className="flex items-center gap-2 p-2 rounded-lg"
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}
                            >
                                <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                                    {itemImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={itemImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <ForkKnife className="w-4 h-4 opacity-40" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{itemName}</h4>
                                    <p className="text-[10px] font-bold" style={{ color: 'var(--accent-text)' }}>Rs. {itemPrice}</p>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    <button onClick={() => decrementQty(itemId)}
                                        className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                                        {item.quantity === 1 ? <Trash2 className="w-2.5 h-2.5" weight="fill" style={{ color: 'var(--danger)' }} /> : <Minus className="w-2.5 h-2.5" weight="bold" />}
                                    </button>
                                    <span className="text-[11px] font-bold w-4 text-center" style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                                    <button onClick={() => incrementQty(itemId)}
                                        className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                                        <Plus className="w-2.5 h-2.5" weight="bold" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No items yet</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
                <div className="px-4 py-3 space-y-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                    <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 mb-1"
                            style={{ color: 'var(--text-muted)' }}>
                            <MessageSquare className="w-3 h-3" weight="fill" /> Notes
                        </label>
                        <textarea value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)}
                            placeholder="Extra spicy, no onion, allergies..." rows={2}
                            className="w-full rounded-lg px-2.5 py-1.5 text-[11px] resize-none focus:outline-none focus:ring-1 transition-all"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                    </div>

                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                            <Tag className="w-3 h-3" weight="fill" style={{ color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Promo code" value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                className="flex-1 bg-transparent text-[11px] focus:outline-none font-medium tracking-wider"
                                style={{ color: 'var(--text-primary)' }} />
                        </div>
                    </div>

                    <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                            <span>Subtotal</span><span>Rs. {subtotal.toFixed(0)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between" style={{ color: 'var(--success)' }}>
                                <span>Discount</span><span>-Rs. {discount.toFixed(0)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-xs pt-1" style={{ color: 'var(--text-primary)', borderTop: '1px solid var(--border)' }}>
                            <span>Total</span><span>Rs. {total.toFixed(0)}</span>
                        </div>
                    </div>

                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmitOrder}
                        className="w-full py-2.5 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors text-xs"
                        style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                        <span>Send to Kitchen</span><ArrowRight className="w-3.5 h-3.5" weight="bold" />
                    </motion.button>
                </div>
            )}
        </div>
    );

    if (isMobile) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={onClose} className="fixed inset-0 bg-black/50 z-50" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl z-50 overflow-hidden flex flex-col"
                            style={{ background: 'var(--bg-secondary)' }}>
                            <div className="flex justify-center py-2">
                                <div className="w-8 h-1 rounded-full" style={{ background: 'var(--border-hover)' }} />
                            </div>
                            {sidebarContent}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    className="h-[calc(100vh-56px)] sticky top-14 overflow-hidden"
                    style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)' }}>
                    {sidebarContent}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
