'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus as Plus, Minus as Minus } from '@phosphor-icons/react';
import { MenuItem } from '@/types';
import { useCartStore } from '@/stores/useCartStore';
import toast from 'react-hot-toast';

interface FeaturedItemProps { item: MenuItem; }

export default function FeaturedItem({ item }: FeaturedItemProps) {
    const [selectedSize, setSelectedSize] = useState(item.sizes?.[0] || '');
    const [selectedVariation, setSelectedVariation] = useState(item.variations?.[0] || '');
    const [selectedSpice, setSelectedSpice] = useState(item.spice_levels?.[1] || '');
    const [quantity, setQuantity] = useState(1);
    const addItem = useCartStore((s) => s.addItem);

    const handleAdd = () => {
        for (let i = 0; i < quantity; i++) {
            addItem(item, { size: selectedSize, variation: selectedVariation, spice: selectedSpice });
        }
        toast.success(`${quantity}× ${item.name} added`);
        setQuantity(1);
    };

    const Pill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
        <button onClick={onClick} className="px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all"
            style={{
                background: active ? 'var(--accent)' : 'var(--bg-input)',
                color: active ? 'var(--accent-fg)' : 'var(--text-secondary)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
            }}>{label}</button>
    );

    return (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex flex-col lg:flex-row">
                <div className="relative lg:w-[320px] h-48 lg:h-auto shrink-0 overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                    {item.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-4xl opacity-30">🍽️</div>
                    )}
                </div>
                <div className="flex-1 p-4 lg:p-5 space-y-3.5">
                    <div>
                        <h2 className="text-xl font-bold font-['Outfit']" style={{ color: 'var(--text-primary)' }}>{item.name}</h2>
                        <p className="text-xs mt-1.5 leading-relaxed max-w-lg" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                    </div>

                    {item.sizes && item.sizes.length > 0 && (
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Size</label>
                            <div className="flex gap-1">{item.sizes.map((s) => <Pill key={s} label={s} active={selectedSize === s} onClick={() => setSelectedSize(s)} />)}</div>
                        </div>
                    )}

                    {item.variations && item.variations.length > 0 && (
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Style</label>
                            <div className="flex gap-1 flex-wrap">{item.variations.map((v) => <Pill key={v} label={v} active={selectedVariation === v} onClick={() => setSelectedVariation(v)} />)}</div>
                        </div>
                    )}

                    {item.spice_levels && item.spice_levels.length > 0 && (
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Spice</label>
                            <div className="flex gap-1 flex-wrap">{item.spice_levels.map((l) => <Pill key={l} label={l} active={selectedSpice === l} onClick={() => setSelectedSpice(l)} />)}</div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                        <div className="flex items-center gap-0.5 rounded-lg p-0.5"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-7 h-7 rounded flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                                <Minus className="w-3 h-3" weight="bold" />
                            </button>
                            <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--text-primary)' }}>{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)}
                                className="w-7 h-7 rounded flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                                <Plus className="w-3 h-3" weight="bold" />
                            </button>
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-xs"
                            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                            <span>Rs. {(item.price * quantity).toFixed(0)}</span>
                            <span className="opacity-50">·</span>
                            <span>Add to order</span>
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}
