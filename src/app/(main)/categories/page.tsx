'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ForkKnife as Utensils, ArrowRight as ArrowRight, ChefHat as ChefHat, Plus, X, Sparkle } from '@phosphor-icons/react';
import { categories as defaultCategories, menuItems as defaultMenuItems } from '@/data/menuData';
import { useDataStore } from '@/stores/useDataStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
    const router = useRouter();
    const { categories: liveCategories, menuItems: liveMenuItems, addCategory, initData } = useDataStore();
    const [showAddModal, setShowAddModal] = useState(false);
    const [catName, setCatName] = useState('');

    useEffect(() => {
        initData();
    }, [initData]);

    const activeCategories = useMemo(() => {
        if (liveCategories && liveCategories.length > 0) {
            return liveCategories;
        }
        return defaultCategories.filter(c => c.id !== 'all').map((c, i) => ({ id: c.id, name: c.label, label: c.label, sort_order: i + 1 }));
    }, [liveCategories]);

    const activeMenuItems = useMemo(() => {
        if (liveMenuItems && liveMenuItems.length > 0) {
            return liveMenuItems;
        }
        return defaultMenuItems;
    }, [liveMenuItems]);

    const categoryData = useMemo(() => {
        return activeCategories.map((cat) => {
            const items = activeMenuItems.filter((item) => {
                const normCat = item.category.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-');
                return normCat === cat.id || item.category.toLowerCase().includes(cat.id) || cat.id.includes(item.category.toLowerCase().replace(/\s+/g, '-'));
            });
            const available = items.filter((i) => i.is_available).length;
            const avgPrice = items.length > 0 ? Math.round(items.reduce((s, i) => s + i.price, 0) / items.length) : 0;
            return { ...cat, items, total: items.length, available, avgPrice };
        });
    }, [activeCategories, activeMenuItems]);

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!catName.trim()) return;

        await addCategory(catName.trim());
        toast.success(`Category "${catName}" added!`);
        setCatName('');
        setShowAddModal(false);
    };

    const anim = (i: number) => ({
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: i * 0.05, type: 'spring' as const, stiffness: 300, damping: 25 },
    });

    return (
        <div className="space-y-5 page-enter">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Categories</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {categoryData.length} categories · {activeMenuItems.length} total dishes
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95"
                    style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                >
                    <Plus className="w-4 h-4" weight="bold" /> Add Category
                </button>
            </div>

            {/* Add Category Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
                        onClick={() => setShowAddModal(false)}>
                        <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
                            className="rounded-3xl p-6 max-w-sm w-full"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                                        <Sparkle className="w-3.5 h-3.5" weight="fill" />
                                    </div>
                                    <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>New Category</h3>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                                    <X className="w-4 h-4" weight="bold" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCategory} className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Category Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Traditional Newari, Pastas, Mocktails"
                                        value={catName}
                                        onChange={(e) => setCatName(e.target.value)}
                                        className="w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1"
                                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-2.5 rounded-xl text-xs font-bold border"
                                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 rounded-xl text-xs font-bold shadow-md active:scale-95"
                                        style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {categoryData.map((cat, i) => (
                    <motion.div key={cat.id} {...anim(i)}
                        onClick={() => router.push(`/menu?category=${cat.id}`)}
                        className="group flex flex-col rounded-3xl p-6 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

                        {/* Icon */}
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border shadow-sm shrink-0"
                            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                            <Utensils className="w-6 h-6" weight="fill" style={{ color: 'var(--text-primary)' }} />
                        </div>

                        {/* Info */}
                        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{cat.label || cat.name}</h3>
                        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                            {cat.total} dish{cat.total !== 1 ? 'es' : ''}
                        </p>

                        {/* Preview items */}
                        <div className="flex -space-x-2 mb-5">
                            {cat.items.slice(0, 4).map((item) => (
                                <div key={item.id} className="w-10 h-10 rounded-xl overflow-hidden border-2 shrink-0 shadow-sm flex items-center justify-center"
                                    style={{ borderColor: 'var(--bg-card)', background: 'var(--bg-elevated)' }}>
                                    {(item.image_url || (item as any).image) ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={item.image_url || (item as any).image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                                            {item.name?.charAt(0) || '•'}
                                        </span>
                                    )}
                                </div>
                            ))}
                            {cat.items.length > 4 && (
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold border-2 shrink-0 shadow-sm"
                                    style={{ borderColor: 'var(--bg-card)', background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                                    +{cat.items.length - 4}
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between mt-auto pt-2">
                            <div className="flex gap-2 items-center">
                                <span className="text-[10px] px-2 py-1 rounded-md border font-bold uppercase tracking-wider"
                                    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                                    {cat.available} available
                                </span>
                                <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                                    ~Rs. {cat.avgPrice}
                                </span>
                            </div>
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" weight="bold"
                                style={{ color: 'var(--text-primary)' }} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {categoryData.length === 0 && (
                <div className="text-center py-16">
                    <ChefHat className="w-10 h-10 mx-auto mb-2" weight="fill" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No categories yet</p>
                </div>
            )}
        </div>
    );
}
