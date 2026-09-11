'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCartSimple,
    X,
    Plus,
    Minus,
    Trash,
    ArrowRight,
    CircleNotch,
    CheckCircle,
    NoteBlank,
} from '@phosphor-icons/react';
import { MenuItem } from '@/types';

export interface CustomerCartItem {
    item: MenuItem;
    quantity: number;
    selectedSize?: string;
    selectedVariation?: string;
    selectedSpice?: string;
}

interface CustomerCartProps {
    items: CustomerCartItem[];
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    onUpdateQuantity: (itemId: string, delta: number) => void;
    onRemoveItem: (itemId: string) => void;
    onPlaceOrder: (notes: string) => Promise<void>;
    tableNumber: string;
    restaurantName: string;
}

export default function CustomerCart({
    items,
    isOpen,
    onOpen,
    onClose,
    onUpdateQuantity,
    onRemoveItem,
    onPlaceOrder,
    tableNumber,
    restaurantName,
}: CustomerCartProps) {
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);

    const itemCount = items.reduce((sum, ci) => sum + ci.quantity, 0);
    const subtotal = items.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
    const tax = subtotal * 0.13;
    const total = subtotal + tax;

    const handlePlaceOrder = async () => {
        setIsProcessing(true);
        try {
            await onPlaceOrder(notes);
            setOrderPlaced(true);
            setNotes('');
            setTimeout(() => {
                setOrderPlaced(false);
                onClose();
            }, 2500);
        } catch {
            // Error handled by parent
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            {/* Floating Cart Bar */}
            <AnimatePresence>
                {itemCount > 0 && !isOpen && (
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        className="fixed bottom-5 left-4 right-4 z-40"
                    >
                        <button
                            onClick={onOpen}
                            className="w-full py-4 px-5 rounded-2xl font-bold flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.4)] active:scale-[0.98] transition-transform"
                            style={{ background: '#fff', color: '#000' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <ShoppingCartSimple className="w-5 h-5" weight="bold" />
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center">
                                        {itemCount}
                                    </span>
                                </div>
                                <span className="text-sm">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono">Rs. {subtotal.toLocaleString()}</span>
                                <ArrowRight className="w-4 h-4" weight="bold" />
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full Cart Sheet */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />

                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] flex flex-col rounded-t-[28px] overflow-hidden"
                            style={{ background: '#0a0a0f' }}
                        >
                            {/* Header */}
                            <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
                                <div>
                                    <h2 className="text-lg font-black text-white font-['Outfit']">Your Order</h2>
                                    <p className="text-[10px] text-white/40 mt-0.5">
                                        {restaurantName} · Table {tableNumber}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                                    style={{ background: 'rgba(255,255,255,0.08)' }}
                                >
                                    <X className="w-4 h-4" weight="bold" />
                                </button>
                            </div>

                            {/* Order Success Overlay */}
                            <AnimatePresence>
                                {orderPlaced && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="absolute inset-0 z-10 flex flex-col items-center justify-center"
                                        style={{ background: '#0a0a0f' }}
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                                        >
                                            <CheckCircle className="w-20 h-20 text-emerald-400" weight="fill" />
                                        </motion.div>
                                        <motion.h3
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-xl font-black text-white mt-6 font-['Outfit']"
                                        >
                                            Order Sent!
                                        </motion.h3>
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="text-white/40 text-xs mt-2"
                                        >
                                            Your food is being prepared by the kitchen
                                        </motion.p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-4 space-y-3">
                                {items.length === 0 ? (
                                    <div className="text-center py-16">
                                        <ShoppingCartSimple className="w-10 h-10 mx-auto text-white/15 mb-3" weight="fill" />
                                        <p className="text-white/30 text-sm font-medium">Your cart is empty</p>
                                    </div>
                                ) : (
                                    items.map((ci) => (
                                        <motion.div
                                            key={ci.item.id}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="flex items-center gap-3 p-3 rounded-xl"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                                        >
                                            {/* Thumbnail */}
                                            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-white/5">
                                                {ci.item.image_url ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={ci.item.image_url} alt={ci.item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xl opacity-40">🍽️</span>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-white truncate">{ci.item.name}</h4>
                                                <div className="flex gap-1.5 mt-1 flex-wrap">
                                                    {ci.selectedSize && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/8 text-white/40 border border-white/8">
                                                            {ci.selectedSize}
                                                        </span>
                                                    )}
                                                    {ci.selectedVariation && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/8 text-white/40 border border-white/8">
                                                            {ci.selectedVariation}
                                                        </span>
                                                    )}
                                                    {ci.selectedSpice && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/8 text-white/40 border border-white/8">
                                                            {ci.selectedSpice}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-white/60 mt-1 font-mono">
                                                    Rs. {(ci.item.price * ci.quantity).toLocaleString()}
                                                </p>
                                            </div>

                                            {/* Quantity / Remove */}
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <button
                                                    onClick={() => onRemoveItem(ci.item.id)}
                                                    className="text-white/20 hover:text-red-400 transition-colors p-1"
                                                >
                                                    <Trash className="w-3.5 h-3.5" weight="bold" />
                                                </button>
                                                <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                                    <button
                                                        onClick={() => onUpdateQuantity(ci.item.id, -1)}
                                                        className="w-7 h-7 rounded-md flex items-center justify-center text-white/50 active:scale-90 transition-transform"
                                                    >
                                                        <Minus className="w-3 h-3" weight="bold" />
                                                    </button>
                                                    <span className="text-xs font-bold text-white w-5 text-center font-mono">{ci.quantity}</span>
                                                    <button
                                                        onClick={() => onUpdateQuantity(ci.item.id, 1)}
                                                        className="w-7 h-7 rounded-md flex items-center justify-center text-white/50 active:scale-90 transition-transform"
                                                    >
                                                        <Plus className="w-3 h-3" weight="bold" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}

                                {/* Notes */}
                                {items.length > 0 && (
                                    <div className="pt-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2 flex items-center gap-1.5">
                                            <NoteBlank className="w-3 h-3" /> Special Instructions
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Any allergies, preferences, or special requests..."
                                            className="w-full rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/20 resize-none focus:outline-none focus:ring-1 focus:ring-white/20"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                                            rows={2}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Footer: Pricing + Place Order */}
                            {items.length > 0 && (
                                <div className="px-5 py-4 border-t border-white/10 space-y-3" style={{ background: '#0a0a0f' }}>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-white/40">Subtotal</span>
                                            <span className="text-white/60 font-mono">Rs. {subtotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-white/40">VAT (13%)</span>
                                            <span className="text-white/60 font-mono">Rs. {tax.toFixed(0)}</span>
                                        </div>
                                        <div className="flex justify-between items-end pt-2 border-t border-white/8">
                                            <span className="text-white/70 text-sm font-bold">Total</span>
                                            <span className="text-white text-xl font-black font-mono">Rs. {total.toFixed(0)}</span>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        disabled={isProcessing || items.length === 0}
                                        onClick={handlePlaceOrder}
                                        className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-50 transition-all shadow-lg"
                                        style={{ background: '#fff', color: '#000' }}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <CircleNotch className="w-5 h-5 animate-spin" /> Sending to Kitchen...
                                            </>
                                        ) : (
                                            <>
                                                <span>Place Order</span>
                                                <span className="opacity-30">·</span>
                                                <span className="font-mono">Rs. {total.toFixed(0)}</span>
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
