'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MagnifyingGlass as Search, Plus as Plus, GridFour as Grid3X3, List as List,
    EyeClosed as EyeOff, Fire as Flame, QrCode as QrCode,
    DownloadSimple as Download, X as X, Check as Check, Trash as Trash2,
    CubeFocus, Sparkle
} from '@phosphor-icons/react';
import { useSearchParams } from 'next/navigation';
import QRCodeLib from 'qrcode';
import { categories as defaultCategories, menuItems as defaultMenuItems } from '@/data/menuData';
import { useCartStore } from '@/stores/useCartStore';
import { useRoleStore } from '@/stores/useRoleStore';
import { useDataStore } from '@/stores/useDataStore';
import toast from 'react-hot-toast';

export default function MenuPage() {
    return (
        <Suspense fallback={<div className="space-y-4 page-enter"><div className="h-6 w-32 animate-pulse rounded-lg" style={{ background: 'var(--bg-input)' }} /></div>}>
            <MenuPageInner />
        </Suspense>
    );
}

function MenuPageInner() {
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get('category');
    const [activeCategory, setActiveCategory] = useState(categoryParam || 'all');
    const [search, setSearch] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [showQR, setShowQR] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [showAddDish, setShowAddDish] = useState(false);

    // Form state for adding dish
    const [dishForm, setDishForm] = useState({
        name: '',
        category: 'Momo',
        price: '',
        description: '',
        image_url: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&q=80',
        ar_model_url: '/pizza.glb',
        calories: '350',
        prep_time_minutes: '15',
        is_vegetarian: false,
    });

    const { addItem, items: cartItems } = useCartStore();
    const { role } = useRoleStore();
    const {
        menuItems: liveMenuItems,
        categories: liveCategories,
        addMenuItem,
        toggleMenuItemAvailability,
        deleteMenuItem,
        initData
    } = useDataStore();

    useEffect(() => {
        initData();
    }, [initData]);

    useEffect(() => {
        if (categoryParam) {
            setTimeout(() => setActiveCategory(categoryParam), 0);
        }
    }, [categoryParam]);

    // Use live store if populated, fallback to default mock items
    const availableCategories = useMemo(() => {
        if (liveCategories && liveCategories.length > 0) {
            return [{ id: 'all', label: 'All' }, ...liveCategories.map(c => ({ id: c.id, label: c.label || c.name }))];
        }
        return defaultCategories;
    }, [liveCategories]);

    const allItems = useMemo(() => {
        if (liveMenuItems && liveMenuItems.length > 0) {
            return liveMenuItems;
        }
        return defaultMenuItems;
    }, [liveMenuItems]);

    const generateQR = useCallback(() => {
        const url = typeof window !== 'undefined' ? `${window.location.origin}/customer-menu` : '';
        if (url) {
            QRCodeLib.toDataURL(url, { width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' }, errorCorrectionLevel: 'H' })
                .then(setQrDataUrl);
        }
        setShowQR(true);
    }, []);

    const downloadQR = useCallback(() => {
        if (!qrDataUrl) return;
        const link = document.createElement('a');
        link.download = 'myrestromanager-Menu-QR.png';
        link.href = qrDataUrl;
        link.click();
    }, [qrDataUrl]);

    const filteredItems = useMemo(() => {
        let items = allItems;
        if (activeCategory !== 'all') {
            items = items.filter((item) => {
                const normCat = item.category.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-');
                const normId = activeCategory.toLowerCase();
                return normCat === normId ||
                    item.category.toLowerCase().includes(normId) ||
                    normId.includes(item.category.toLowerCase().replace(/\s+/g, '-'));
            });
        }
        if (search) {
            items = items.filter((item) =>
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.description.toLowerCase().includes(search.toLowerCase())
            );
        }
        return items;
    }, [allItems, activeCategory, search]);

    const handleAddToCart = (item: any) => {
        addItem(item);
        toast.success(`${item.name} added`, { duration: 1500 });
    };

    const handleCreateDish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dishForm.name || !dishForm.price) {
            toast.error('Please provide a dish name and price');
            return;
        }

        const normCatId = dishForm.category.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-');
        await addMenuItem({
            category_id: normCatId,
            category: dishForm.category,
            name: dishForm.name,
            description: dishForm.description || 'Delicious freshly prepared Himalayan specialty.',
            price: parseFloat(dishForm.price) || 200,
            type: dishForm.category.toLowerCase().includes('drink') ? 'beverage' : 'food',
            image: dishForm.image_url,
            image_url: dishForm.image_url,
            is_available: true,
            calories: parseInt(dishForm.calories, 10) || 300,
            prep_time_minutes: parseInt(dishForm.prep_time_minutes, 10) || 15,
            is_vegetarian: dishForm.is_vegetarian,
            ar_model_url: dishForm.ar_model_url || undefined,
            spice_levels: ['Mild', 'Medium', 'Hot'],
        });

        toast.success(`"${dishForm.name}" created and synced!`);
        setShowAddDish(false);
        setDishForm({
            name: '',
            category: 'Momo',
            price: '',
            description: '',
            image_url: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&q=80',
            ar_model_url: '/pizza.glb',
            calories: '350',
            prep_time_minutes: '15',
            is_vegetarian: false,
        });
    };

    const cartCount = (id: string) => cartItems.find((i) => i.menu_item.id === id)?.quantity || 0;

    return (
        <div className="space-y-6 page-enter pb-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Menu</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage your digital menu items, live pricing, and 3D preview assets.</p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="relative flex-1 min-w-35 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" weight="bold" style={{ color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="rounded-xl pl-9 pr-4 py-2 text-sm w-full sm:w-60 focus:outline-none focus:ring-2 transition-shadow"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                    </div>
                    <div className="flex rounded-xl overflow-hidden shrink-0" style={{ border: '1px solid var(--border)' }}>
                        <button onClick={() => setView('grid')} className="p-2"
                            style={{ background: view === 'grid' ? 'var(--bg-card)' : 'transparent', color: view === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            <Grid3X3 className="w-4 h-4" weight="fill" />
                        </button>
                        <button onClick={() => setView('list')} className="p-2"
                            style={{ background: view === 'list' ? 'var(--bg-card)' : 'transparent', color: view === 'list' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            <List className="w-4 h-4" weight="bold" />
                        </button>
                    </div>

                    <button
                        onClick={() => setShowAddDish(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95"
                        style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                    >
                        <Plus className="w-4 h-4" weight="bold" /> Add Dish
                    </button>

                    <button onClick={generateQR}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95"
                        style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
                        <QrCode className="w-4 h-4" weight="bold" /> Customer QR
                    </button>
                </div>
            </div>

            {/* QR Modal */}
            <AnimatePresence>
                {showQR && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowQR(false)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="rounded-2xl p-6 text-center max-w-sm w-full mx-4"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Customer Menu QR</h3>
                                <button onClick={() => setShowQR(false)} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                                    <X className="w-4 h-4" weight="bold" />
                                </button>
                            </div>
                            {qrDataUrl && (
                                <div className="bg-white rounded-xl p-4 mb-4 inline-block shadow-md">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrDataUrl} alt="Menu QR" className="w-56 h-56" />
                                </div>
                            )}
                            <p className="text-[10px] mb-4" style={{ color: 'var(--text-muted)' }}>
                                Customers can scan this QR code to view your digital menu and 3D AR models on their phones.
                            </p>
                            <button onClick={downloadQR}
                                className="flex items-center gap-1.5 mx-auto px-4 py-2 rounded-lg text-xs font-medium"
                                style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                                <Download className="w-3.5 h-3.5" weight="bold" /> Download QR as PNG
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Dish Modal */}
            <AnimatePresence>
                {showAddDish && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
                        onClick={() => setShowAddDish(false)}>
                        <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
                            className="rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                                        <Sparkle className="w-4 h-4" weight="fill" />
                                    </div>
                                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Add New Dish</h3>
                                </div>
                                <button onClick={() => setShowAddDish(false)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                                    <X className="w-4 h-4" weight="bold" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateDish} className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Dish Name *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Kothey Buff Momo"
                                            value={dishForm.name}
                                            onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                                            className="w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1"
                                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Price (Rs.) *</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="250"
                                            value={dishForm.price}
                                            onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                                            className="w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1"
                                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
                                        <select
                                            value={dishForm.category}
                                            onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                                            className="w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1"
                                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        >
                                            {availableCategories.filter(c => c.id !== 'all').map(cat => (
                                                <option key={cat.id} value={cat.label}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Dietary</label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setDishForm({ ...dishForm, is_vegetarian: false })}
                                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${!dishForm.is_vegetarian ? 'shadow-sm' : ''}`}
                                                style={{
                                                    background: !dishForm.is_vegetarian ? 'var(--accent)' : 'var(--bg-input)',
                                                    borderColor: !dishForm.is_vegetarian ? 'var(--accent)' : 'var(--border)',
                                                    color: !dishForm.is_vegetarian ? 'var(--accent-fg)' : 'var(--text-secondary)'
                                                }}
                                            >
                                                Non-Veg
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDishForm({ ...dishForm, is_vegetarian: true })}
                                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${dishForm.is_vegetarian ? 'shadow-sm' : ''}`}
                                                style={{
                                                    background: dishForm.is_vegetarian ? 'var(--success)' : 'var(--bg-input)',
                                                    borderColor: dishForm.is_vegetarian ? 'var(--success)' : 'var(--border)',
                                                    color: dishForm.is_vegetarian ? '#fff' : 'var(--text-secondary)'
                                                }}
                                            >
                                                Veg
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Describe ingredients, taste profile, and preparation style..."
                                        value={dishForm.description}
                                        onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                                        className="w-full rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1"
                                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Image URL</label>
                                        <input
                                            type="url"
                                            value={dishForm.image_url}
                                            onChange={(e) => setDishForm({ ...dishForm, image_url: e.target.value })}
                                            className="w-full rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1"
                                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>3D Model (.glb path)</label>
                                        <input
                                            type="text"
                                            placeholder="/pizza.glb"
                                            value={dishForm.ar_model_url}
                                            onChange={(e) => setDishForm({ ...dishForm, ar_model_url: e.target.value })}
                                            className="w-full rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1"
                                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Calories (kcal)</label>
                                        <input
                                            type="number"
                                            value={dishForm.calories}
                                            onChange={(e) => setDishForm({ ...dishForm, calories: e.target.value })}
                                            className="w-full rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1"
                                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Prep Time (mins)</label>
                                        <input
                                            type="number"
                                            value={dishForm.prep_time_minutes}
                                            onChange={(e) => setDishForm({ ...dishForm, prep_time_minutes: e.target.value })}
                                            className="w-full rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1"
                                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddDish(false)}
                                        className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors"
                                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-transform active:scale-95 shadow-md"
                                        style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                                    >
                                        Save Dish
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Category Tabs */}
            <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-0.5">
                {availableCategories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    const count = cat.id === 'all' ? allItems.length : allItems.filter((item) => {
                        const normCat = item.category.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-');
                        return normCat === cat.id || item.category.toLowerCase().includes(cat.id) || cat.id.includes(item.category.toLowerCase().replace(/\s+/g, '-'));
                    }).length;
                    return (
                        <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all relative"
                            style={{
                                background: isActive ? 'var(--accent)' : 'var(--bg-input)',
                                color: isActive ? 'var(--accent-fg)' : 'var(--text-secondary)',
                                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                            }}>
                            {cat.label}
                            <span className="ml-1 opacity-60">{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Items Counter */}
            <div className="flex items-center justify-between text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                <p>
                    {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                    {search && <span> matching &quot;{search}&quot;</span>}
                </p>
                <p className="text-[9px]">Tap toggle switch on card to 86/Sold Out dishes</p>
            </div>

            {/* Grid View */}
            <AnimatePresence mode="wait">
                {view === 'grid' ? (
                    <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
                        {filteredItems.map((item, i) => {
                            const inCart = cartCount(item.id);
                            return (
                                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.02, type: 'spring', stiffness: 300, damping: 25 }}
                                    className="group relative rounded-3xl p-4 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                                    
                                    {/* Image */}
                                    <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-4 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                                        {(item.image_url || (item as any).image) ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={item.image_url || (item as any).image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <span className="text-3xl opacity-30">🍽️</span>
                                        )}
                                        {!item.is_available && (
                                            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-1">
                                                <EyeOff className="w-5 h-5 text-red-400" weight="bold" />
                                                <span className="text-[10px] font-black tracking-wider uppercase text-red-400">Sold Out (86)</span>
                                            </div>
                                        )}
                                        {inCart > 0 && (
                                            <span className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white badge-pop"
                                                style={{ background: 'var(--accent)' }}>{inCart}</span>
                                        )}
                                        {item.ar_model_url && (
                                            <span className="absolute top-2 left-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black"
                                                style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                                                <CubeFocus className="w-3 h-3 text-cyan-400" weight="fill" /> AR
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="px-1 flex flex-col flex-1">
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div>
                                                <h3 className="text-base font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{item.name}</h3>
                                                <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                                            <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Rs. {item.price}</span>
                                            <div className="flex items-center gap-1.5">
                                                {/* 86 Toggle */}
                                                <button
                                                    onClick={() => {
                                                        toggleMenuItemAvailability(item.id);
                                                        toast.success(`${item.name} is now ${item.is_available ? 'marked Sold Out' : 'available'}`);
                                                    }}
                                                    title={item.is_available ? 'Mark as Sold Out (86)' : 'Mark as Available'}
                                                    className="px-2 py-1 rounded-lg text-[10px] font-bold transition-transform active:scale-95"
                                                    style={{
                                                        background: item.is_available ? 'var(--bg-input)' : 'rgba(239, 68, 68, 0.15)',
                                                        color: item.is_available ? 'var(--text-muted)' : 'var(--danger)',
                                                        border: `1px solid ${item.is_available ? 'var(--border)' : 'var(--danger)'}`
                                                    }}
                                                >
                                                    {item.is_available ? 'In Stock' : '86'}
                                                </button>

                                                {/* Add to Waiter Cart */}
                                                {item.is_available && (
                                                    <button onClick={() => handleAddToCart(item)}
                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-transform active:scale-95"
                                                        style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
                                                        <Plus className="w-3.5 h-3.5" weight="bold" /> Add
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    /* List View */
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="rounded-3xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                        {filteredItems.map((item, i) => {
                            const inCart = cartCount(item.id);
                            return (
                                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    style={{ borderBottom: i < filteredItems.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-black/5 dark:border-white/5 relative bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                                        {(item.image_url || (item as any).image) ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={item.image_url || (item as any).image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl opacity-30">🍽️</span>
                                        )}
                                        {!item.is_available && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <EyeOff className="w-4 h-4 text-red-400" weight="bold" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                                            {!item.is_available && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--danger) 15%, transparent)', color: 'var(--danger)' }}>
                                                    <EyeOff className="w-3 h-3 inline mr-1" weight="bold" />Out
                                                </span>
                                            )}
                                            {inCart > 0 && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded badge-pop"
                                                    style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>×{inCart}</span>
                                            )}
                                        </div>
                                        <p className="text-xs truncate font-medium" style={{ color: 'var(--text-muted)' }}>{item.category} · {item.description}</p>
                                    </div>
                                    <span className="text-sm font-black shrink-0" style={{ color: 'var(--text-primary)' }}>Rs. {item.price}</span>
                                    
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => {
                                                toggleMenuItemAvailability(item.id);
                                                toast.success(`${item.name} is now ${item.is_available ? 'marked Sold Out' : 'available'}`);
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold border"
                                            style={{
                                                background: item.is_available ? 'var(--bg-input)' : 'rgba(239, 68, 68, 0.15)',
                                                color: item.is_available ? 'var(--text-muted)' : 'var(--danger)',
                                                borderColor: item.is_available ? 'var(--border)' : 'var(--danger)'
                                            }}
                                        >
                                            {item.is_available ? 'In Stock' : '86'}
                                        </button>

                                        {item.is_available && (
                                            <button onClick={() => handleAddToCart(item)}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-transform active:scale-95 shadow-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                                <Plus className="w-4 h-4" weight="bold" style={{ color: 'var(--text-primary)' }} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
