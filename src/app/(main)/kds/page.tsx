'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock as Clock,
    CheckCircle as CheckCircle,
    ChefHat as ChefHat,
    WarningCircle as AlertCircle,
    Trash as Trash2,
    ArrowRight as ArrowRight,
    ChatTeardropText as MessageSquare
} from '@phosphor-icons/react';
import { useOrdersStore, KitchenOrder } from '@/stores/useOrdersStore';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import toast from 'react-hot-toast';

/* eslint-disable react-hooks/purity */

const statusConfig: Record<KitchenOrder['status'], { label: string; color: string; bg: string; icon: React.ElementType }> = {
    pending: { label: 'Pending', color: 'var(--warning)', bg: 'rgba(232,168,56,0.1)', icon: AlertCircle },
    preparing: { label: 'Preparing', color: 'var(--info)', bg: 'rgba(91,155,213,0.1)', icon: ChefHat },
    ready: { label: 'Ready', color: 'var(--success)', bg: 'rgba(46,204,113,0.1)', icon: CheckCircle },
    completed: { label: 'Done', color: 'var(--text-muted)', bg: 'rgba(77,84,102,0.08)', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)', icon: AlertCircle },
};

const statusFlow: KitchenOrder['status'][] = ['pending', 'preparing', 'ready', 'completed'];

function playBeep() {
    try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.value = 880; // A5
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 300);
    } catch (e) { console.error('Audio beep failed', e); }
}

export default function KitchenPage() {
    const { isOnline } = useRealtimeOrders(); // Mount WebSockets listener
    const { orders, updateOrderStatus, removeOrder } = useOrdersStore();
    const [filter, setFilter] = useState<'all' | KitchenOrder['status']>('all');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
    const activeOrders = orders.filter((o) => o.status !== 'completed');

    const prevCountRef = useRef(activeOrders.length);
    useEffect(() => {
        if (activeOrders.length > prevCountRef.current) {
            playBeep();
        }
        prevCountRef.current = activeOrders.length;
    }, [activeOrders.length]);

    const advanceStatus = (order: KitchenOrder) => {
        const idx = statusFlow.indexOf(order.status);
        if (idx < statusFlow.length - 1) {
            const next = statusFlow[idx + 1];
            updateOrderStatus(order.id, next);
            toast.success(`Table ${order.tableNumber} → ${statusConfig[next].label}`);
        }
    };

    const getTime = (iso: string) => {
        const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
        if (m < 1) return 'Just now';
        if (m < 60) return `${m}m ago`;
        return `${Math.floor(m / 60)}h ${m % 60}m`;
    };

    return (
        <div className="space-y-6 page-enter pb-8">
            {mounted && !isOnline && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3 mb-4">
                    <AlertCircle className="w-5 h-5" weight="fill" />
                    <div>
                        <p className="text-sm font-bold">Offline Mode</p>
                        <p className="text-xs">Live updates paused. Polling every 15s for new orders.</p>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Kitchen Display</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{activeOrders.length} active orders pending prep.</p>
                </div>
                <div className="flex gap-2">
                    {(['all', 'pending', 'preparing', 'ready', 'completed'] as const).map((s) => (
                        <button key={s} onClick={() => setFilter(s)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                            style={{
                                background: filter === s ? 'var(--text-primary)' : 'var(--bg-input)',
                                color: filter === s ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                border: `1px solid ${filter === s ? 'var(--text-primary)' : 'var(--border)'}`,
                            }}>
                            {s === 'all' ? 'All' : statusConfig[s].label}
                            {s !== 'all' && <span className="ml-1 opacity-60">({orders.filter((o) => o.status === s).length})</span>}
                        </button>
                    ))}
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center py-20">
                    <ChefHat className="w-12 h-12 mb-3" weight="fill" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                        {filter === 'all' ? 'No incoming orders' : `No ${filter} orders`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    <AnimatePresence>
                        {filteredOrders.map((order) => {
                            const cfg = statusConfig[order.status];
                            const Icon = cfg.icon;
                            return (
                                <motion.div key={order.id} layout
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                    className="rounded-3xl overflow-hidden flex flex-col"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>

                                    <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm"
                                                style={{ background: cfg.bg, color: cfg.color }}>T{order.tableNumber}</div>
                                            <div>
                                                <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Table {order.tableNumber}</p>
                                                <div className="flex items-center gap-1.5 text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                    <Clock className="w-3.5 h-3.5" weight="bold" />{getTime(order.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border"
                                            style={{ background: cfg.bg, color: cfg.color, borderColor: 'var(--border)' }}>
                                            <Icon className="w-3.5 h-3.5" weight="fill" />{cfg.label}
                                        </span>
                                    </div>

                                    <div className="px-6 py-5 space-y-3 flex-1">
                                        {(order.items || []).map((item: any, i: number) => {
                                            const itemName = item.menu_item?.name || item.name || 'Menu Item';
                                            const itemImage = item.menu_item?.image_url || item.image_url || (item.menu_item as any)?.image || '';
                                            return (
                                                <div key={i} className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-sm border flex items-center justify-center" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                                                        {itemImage ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={itemImage} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ChefHat className="w-5 h-5 opacity-40" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-bold flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{itemName}</p>
                                                    <span className="text-sm font-black shrink-0 px-2.5 py-1 rounded-md" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>×{item.quantity}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {order.specialNotes && (
                                        <div className="mx-6 mb-4 px-4 py-3 rounded-xl flex items-start gap-2 shadow-sm" style={{ background: 'color-mix(in srgb, var(--warning) 10%, transparent)' }}>
                                            <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" weight="fill" style={{ color: 'var(--warning)' }} />
                                            <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--warning)' }}>{order.specialNotes}</p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between px-6 py-5" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                                        <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Rs. {order.total.toFixed(0)}</p>
                                        {order.status === 'completed' ? (
                                            <button onClick={() => removeOrder(order.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 shadow-sm"
                                                style={{ color: 'var(--danger)', background: 'var(--bg-card)', border: '1px solid rgba(231,76,60,0.2)' }}>
                                                <Trash2 className="w-3.5 h-3.5" weight="fill" />Clear
                                            </button>
                                        ) : (
                                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => advanceStatus(order)}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95"
                                                style={{ background: order.status === 'preparing' ? 'var(--success)' : 'var(--text-primary)', color: order.status === 'preparing' ? '#fff' : 'var(--bg-primary)' }}>
                                                {order.status === 'pending' ? 'Start Cooking' :
                                                    order.status === 'preparing' ? 'Mark Ready' : 'Complete'}
                                                <ArrowRight className="w-4 h-4" weight="bold" />
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
