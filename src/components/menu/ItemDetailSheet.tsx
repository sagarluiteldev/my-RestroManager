'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Fire as Flame,
    Timer,
    Leaf,
    CubeFocus,
    Plus,
    Minus,
    ShoppingCartSimple,
    Warning,
} from '@phosphor-icons/react';
import { MenuItem } from '@/types';

interface ItemDetailSheetProps {
    item: MenuItem | null;
    onClose: () => void;
    onAddToCart: (item: MenuItem, quantity: number, options: { size?: string; variation?: string; spice?: string }) => void;
    onViewAR?: (item: MenuItem) => void;
}

export default function ItemDetailSheet({ item, onClose, onAddToCart, onViewAR }: ItemDetailSheetProps) {
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedVariation, setSelectedVariation] = useState('');
    const [selectedSpice, setSelectedSpice] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Reset selections when item changes
    const resetSelections = () => {
        if (item) {
            setSelectedSize(item.sizes?.[0] || '');
            setSelectedVariation(item.variations?.[0] || '');
            setSelectedSpice(item.spice_levels?.[1] || item.spice_levels?.[0] || '');
            setQuantity(1);
        }
    };

    // Call reset when item becomes visible
    if (item && selectedSize === '' && item.sizes?.[0]) {
        resetSelections();
    }

    const handleAdd = () => {
        if (!item) return;
        onAddToCart(item, quantity, {
            size: selectedSize,
            variation: selectedVariation,
            spice: selectedSpice,
        });
        onClose();
    };

    const spiceColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'mild': return '#22c55e';
            case 'medium': return '#f59e0b';
            case 'hot': return '#ef4444';
            case 'extra hot': return '#dc2626';
            default: return '#a1a1aa';
        }
    };

    return (
        <AnimatePresence>
            {item && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] flex flex-col"
                        style={{ background: '#0a0a0f' }}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto hide-scrollbar">
                            {/* Hero Image */}
                            <div className="relative h-64 overflow-hidden flex items-center justify-center bg-zinc-900">
                                {item.image_url ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-6xl opacity-30">🍽️</div>
                                )}
                                <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0f] via-transparent to-transparent" />

                                {/* Close button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" weight="bold" />
                                </button>

                                {/* Badges */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    {item.is_vegetarian && (
                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 backdrop-blur-md border border-emerald-500/20">
                                            <Leaf className="w-3 h-3" weight="fill" /> Veg
                                        </span>
                                    )}
                                    {item.ar_model_url && (
                                        <button
                                            onClick={() => onViewAR?.(item)}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/15 text-white backdrop-blur-md border border-white/10 active:scale-95 transition-transform"
                                        >
                                            <CubeFocus className="w-3.5 h-3.5" weight="fill" /> View in AR
                                        </button>
                                    )}
                                </div>

                                {/* Title overlay */}
                                <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
                                    <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] leading-tight">
                                        {item.name}
                                    </h2>
                                    <p className="text-white/50 text-xs mt-1.5 leading-relaxed max-w-[90%]">
                                        {item.description}
                                    </p>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="px-5 py-4">
                                <div className="grid grid-cols-3 gap-2">
                                    {item.calories !== undefined && (
                                        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <div className="text-white/40 text-[9px] uppercase tracking-wider font-bold mb-1">Calories</div>
                                            <div className="text-white font-bold text-sm font-mono">{item.calories}</div>
                                            <div className="text-white/30 text-[9px]">kcal</div>
                                        </div>
                                    )}
                                    {item.prep_time_minutes !== undefined && (
                                        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <div className="text-white/40 text-[9px] uppercase tracking-wider font-bold mb-1">Prep Time</div>
                                            <div className="text-white font-bold text-sm font-mono flex items-center justify-center gap-1">
                                                <Timer className="w-3.5 h-3.5 text-white/50" weight="fill" />
                                                {item.prep_time_minutes}
                                            </div>
                                            <div className="text-white/30 text-[9px]">min</div>
                                        </div>
                                    )}
                                    <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div className="text-white/40 text-[9px] uppercase tracking-wider font-bold mb-1">Price</div>
                                        <div className="text-white font-bold text-sm font-mono">Rs. {item.price}</div>
                                        <div className="text-white/30 text-[9px]">per serving</div>
                                    </div>
                                </div>

                                {/* Allergens */}
                                {item.allergens && item.allergens.length > 0 && (
                                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                                        <Warning className="w-3.5 h-3.5 text-amber-400 shrink-0" weight="fill" />
                                        <span className="text-[10px] text-amber-300/80">
                                            <span className="font-bold">Allergens:</span> {item.allergens.join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Customization Options */}
                            <div className="px-5 pb-6 space-y-5">
                                {/* Size */}
                                {item.sizes && item.sizes.length > 0 && (
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2.5 block">
                                            Size
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {item.sizes.map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => setSelectedSize(s)}
                                                    className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                                                    style={{
                                                        background: selectedSize === s ? '#fff' : 'rgba(255,255,255,0.06)',
                                                        color: selectedSize === s ? '#000' : 'rgba(255,255,255,0.6)',
                                                        border: `1px solid ${selectedSize === s ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                                                    }}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Variation */}
                                {item.variations && item.variations.length > 0 && (
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2.5 block">
                                            Style
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {item.variations.map((v) => (
                                                <button
                                                    key={v}
                                                    onClick={() => setSelectedVariation(v)}
                                                    className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                                                    style={{
                                                        background: selectedVariation === v ? '#fff' : 'rgba(255,255,255,0.06)',
                                                        color: selectedVariation === v ? '#000' : 'rgba(255,255,255,0.6)',
                                                        border: `1px solid ${selectedVariation === v ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                                                    }}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Spice Level */}
                                {item.spice_levels && item.spice_levels.length > 0 && (
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2.5 block">
                                            Spice Level
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {item.spice_levels.map((l) => (
                                                <button
                                                    key={l}
                                                    onClick={() => setSelectedSpice(l)}
                                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                                                    style={{
                                                        background: selectedSpice === l ? spiceColor(l) + '22' : 'rgba(255,255,255,0.06)',
                                                        color: selectedSpice === l ? spiceColor(l) : 'rgba(255,255,255,0.6)',
                                                        border: `1px solid ${selectedSpice === l ? spiceColor(l) + '44' : 'rgba(255,255,255,0.1)'}`,
                                                    }}
                                                >
                                                    <Flame className="w-3.5 h-3.5" weight="fill" style={{ color: spiceColor(l) }} />
                                                    {l}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sticky Footer: Quantity + Add to Cart */}
                        <div className="px-5 py-4 border-t border-white/10" style={{ background: '#0a0a0f' }}>
                            <div className="flex items-center gap-3">
                                {/* Quantity */}
                                <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition-all"
                                    >
                                        <Minus className="w-4 h-4" weight="bold" />
                                    </button>
                                    <span className="text-white font-bold text-base w-8 text-center font-mono">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition-all"
                                    >
                                        <Plus className="w-4 h-4" weight="bold" />
                                    </button>
                                </div>

                                {/* Add button */}
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleAdd}
                                    className="flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 text-sm shadow-lg active:shadow-none transition-shadow"
                                    style={{ background: '#fff', color: '#000' }}
                                >
                                    <ShoppingCartSimple className="w-4.5 h-4.5" weight="bold" />
                                    <span>Add to Order</span>
                                    <span className="opacity-40">·</span>
                                    <span className="font-mono">Rs. {(item.price * quantity).toFixed(0)}</span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
