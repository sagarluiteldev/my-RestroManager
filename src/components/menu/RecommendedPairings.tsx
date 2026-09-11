'use client';

import { Plus as Plus } from '@phosphor-icons/react';
import { MenuItem } from '@/types';
import { useCartStore } from '@/stores/useCartStore';
import toast from 'react-hot-toast';

interface RecommendedPairingsProps { items: MenuItem[] }

export default function RecommendedPairings({ items }: RecommendedPairingsProps) {
    const addItem = useCartStore((s) => s.addItem);
    const handleAdd = (item: MenuItem) => {
        addItem(item, { size: item.sizes?.[0] });
        toast.success(`${item.name} added`);
    };

    return (
        <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Goes well with</h3>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 min-w-45 p-2 rounded-lg"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                            {item.image_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{item.name.charAt(0)}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</h4>
                            <p className="text-[11px] font-bold" style={{ color: 'var(--accent-text)' }}>Rs. {item.price}</p>
                        </div>
                        <button onClick={() => handleAdd(item)}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                            style={{ background: 'var(--accent)' }}>
                            <Plus className="w-3 h-3" weight="bold" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
