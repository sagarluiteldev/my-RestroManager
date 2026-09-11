'use client';

import { motion } from 'framer-motion';
import { Plus as Plus } from '@phosphor-icons/react';
import { MenuItem } from '@/types';
import { useCartStore } from '@/stores/useCartStore';
import toast from 'react-hot-toast';

interface MenuGridProps {
    items: MenuItem[];
}

export default function MenuGrid({ items }: MenuGridProps) {
    const addItem = useCartStore((s) => s.addItem);

    const handleAdd = (item: MenuItem) => {
        addItem(item, { size: item.sizes?.[0] });
        toast.success(`${item.name} added`);
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {items.map((item, i) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.25 }}
                    className="group rounded-xl overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-lg"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    onClick={() => handleAdd(item)}
                >
                    <div className="relative h-28 sm:h-32 overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                        {item.image_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={item.image_url} alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                            />
                        ) : (
                            <span className="text-3xl opacity-30">🍽️</span>
                        )}
                        {!item.is_available && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(231,76,60,0.2)', color: 'var(--danger)' }}>Sold Out</span>
                            </div>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleAdd(item); }}
                            className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 shadow"
                            style={{ background: 'var(--accent)' }}
                        >
                            <Plus className="w-3 h-3" weight="bold" />
                        </button>
                    </div>
                    <div className="p-2.5">
                        <h3 className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</h3>
                        <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[11px] font-bold" style={{ color: 'var(--accent-text)' }}>Rs. {item.price}</span>
                            {item.sizes && item.sizes[0] && (
                                <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{item.sizes[0]}</span>
                            )}
                        </div>
                        {item.variations && item.variations.length > 0 && (
                            <div className="flex gap-0.5 mt-1.5 flex-wrap">
                                {item.variations.slice(0, 3).map((v) => (
                                    <span key={v} className="text-[8px] px-1 py-0.5 rounded"
                                        style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{v}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
