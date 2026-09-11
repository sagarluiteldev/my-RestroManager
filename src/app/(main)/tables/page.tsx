'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock as Clock,
    ChefHat as ChefHat,
    X as X,
    Hash as Hash,
    ArrowRight as ArrowRight,
    UserPlus as UserPlus,
    Armchair as Armchair,
    QrCode as QrCode,
    DownloadSimple as Download,
} from '@phosphor-icons/react';
import { useTableStore, TableStatus, RestaurantTable } from '@/stores/useTableStore';
import { useOrdersStore } from '@/stores/useOrdersStore';
import { useDataStore } from '@/stores/useDataStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import QRCodeLib from 'qrcode';

/* eslint-disable react-hooks/purity */

const statusConfig: Record<TableStatus, { label: string; color: string; bg: string; ring: string }> = {
    vacant: { label: 'Vacant', color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 15%, transparent)', ring: 'rgba(46,204,113,0.3)' },
    occupied: { label: 'Occupied', color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 15%, transparent)', ring: 'rgba(231,76,60,0.3)' },
    needs_attention: { label: 'Needs Attention', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 15%, transparent)', ring: 'rgba(232,168,56,0.3)' },
    reserved: { label: 'Reserved', color: 'var(--info)', bg: 'color-mix(in srgb, var(--info) 15%, transparent)', ring: 'rgba(59,130,246,0.3)' },
};

export default function TablesPage() {
    const { tables, setTableStatus, vacateTable } = useTableStore();
    const orders = useOrdersStore((s) => s.orders);
    const router = useRouter();
    const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
    const [showQR, setShowQR] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState('');

    const counts = {
        vacant: tables.filter((t) => t.status === 'vacant').length,
        occupied: tables.filter((t) => t.status === 'occupied').length,
        needs_attention: tables.filter((t) => t.status === 'needs_attention').length,
        reserved: tables.filter((t) => t.status === 'reserved').length,
    };

    const getTimeSince = (iso?: string) => {
        if (!iso) return '—';
        const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
        if (m < 1) return 'Just now';
        if (m < 60) return `${m}m`;
        return `${Math.floor(m / 60)}h ${m % 60}m`;
    };

    const tableOrder = (t: RestaurantTable) => {
        if (!t.orderId) return null;
        return orders.find((o) => o.id === t.orderId) || null;
    };

    const handleNewOrder = (table: RestaurantTable) => {
        router.push('/menu');
        toast.success(`Starting order for Table ${table.id}`);
        setSelectedTable(null);
    };

    const generateTableQR = (tableId: number) => {
        const url = typeof window !== 'undefined' ? `${window.location.origin}/customer-menu?table=${tableId}` : '';
        if (url) {
            QRCodeLib.toDataURL(url, { width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' }, errorCorrectionLevel: 'H' })
                .then(setQrDataUrl);
        }
        setShowQR(true);
    };

    const downloadQR = () => {
        if (!qrDataUrl) return;
        const link = document.createElement('a');
        link.download = `myrestromanager-Table-${selectedTable?.id}-QR.png`;
        link.href = qrDataUrl;
        link.click();
    };

    // Grid layout: simulate a floor plan with 3 rows
    const rows = [
        tables.slice(0, 4),   // Front row (2-seaters / window tables)
        tables.slice(4, 8),   // Middle row (4-seaters)
        tables.slice(8, 12),  // Back row (6-seaters / family)
    ];
    const rowLabels = ['Window', 'Center', 'Family'];

    return (
        <div className="space-y-6 page-enter pb-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Tables</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Floor plan and live status of {tables.length} tables.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {(['vacant', 'occupied', 'needs_attention', 'reserved'] as TableStatus[]).map((s) => {
                        const cfg = statusConfig[s];
                        return (
                            <div key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                                style={{ background: cfg.bg, color: cfg.color }}>
                                <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                                {cfg.label} ({counts[s]})
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floor Plan */}
            <div className="space-y-4">
                {rows.map((row, ri) => (
                    <div key={ri}>
                        <p className="text-[9px] font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
                            {rowLabels[ri]} Section
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {row.map((table) => {
                                const cfg = statusConfig[table.status];
                                const order = tableOrder(table);
                                return (
                                    <motion.button
                                        key={table.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setSelectedTable(table)}
                                        className="relative rounded-3xl p-6 text-left transition-all group"
                                        style={{
                                            background: 'var(--bg-card)',
                                            border: `2px solid var(--text-primary)`,
                                            boxShadow: table.status === 'needs_attention' ? `0 0 16px ${cfg.ring}` : 'var(--shadow-card)',
                                        }}
                                    >
                                        {/* Status badge */}
                                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: cfg.bg, color: cfg.color }}>
                                            <span className="w-2.5 h-2.5 rounded-full relative">
                                                <span className="absolute inset-0 rounded-full" style={{ background: cfg.color }} />
                                                {table.status === 'needs_attention' && (
                                                    <span className="absolute inset-0 rounded-full animate-ping" style={{ background: cfg.color, opacity: 0.4 }} />
                                                )}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider">{cfg.label}</span>
                                        </div>

                                        {/* Table number */}
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold mb-3 shadow-sm"
                                            style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
                                            {table.id}
                                        </div>

                                        <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                                            Table {table.id}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                                            <Armchair className="w-3.5 h-3.5" weight="fill" />
                                            <span>{table.seats} seats</span>
                                            {table.guestCount && (
                                                <>
                                                    <span className="opacity-30">·</span>
                                                    <UserPlus className="w-3.5 h-3.5" weight="fill" />
                                                    <span>{table.guestCount}</span>
                                                </>
                                            )}
                                        </div>

                                        {table.status === 'occupied' && (
                                            <div className="flex items-center gap-1 mt-1.5 text-[9px]" style={{ color: cfg.color }}>
                                                <Clock className="w-2.5 h-2.5" weight="bold" />
                                                <span>{getTimeSince(table.occupiedSince)}</span>
                                                {order && (
                                                    <>
                                                        <span className="opacity-30">·</span>
                                                        <span className="font-semibold">Rs. {order.total.toFixed(0)}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {table.status === 'reserved' && (
                                            <p className="text-[9px] mt-1.5 font-medium" style={{ color: cfg.color }}>Reserved</p>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Detail Drawer */}
            <AnimatePresence>
                {selectedTable && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedTable(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed right-0 top-0 bottom-0 w-80 z-50 overflow-y-auto"
                            style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)' }}
                        >
                            <div className="p-4 space-y-4">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                                            style={{ background: statusConfig[selectedTable.status].bg, color: statusConfig[selectedTable.status].color }}>
                                            {selectedTable.id}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Table {selectedTable.id}</h3>
                                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{selectedTable.seats} seats · {statusConfig[selectedTable.status].label}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedTable(null)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                                        <X className="w-4 h-4" weight="bold" />
                                    </button>
                                </div>

                                {/* Status Change */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                        Change Status
                                    </label>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {(['vacant', 'occupied', 'reserved', 'needs_attention'] as TableStatus[]).map((s) => {
                                            const cfg = statusConfig[s];
                                            const isActive = selectedTable.status === s;
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => {
                                                        setTableStatus(selectedTable.id, s);
                                                        setSelectedTable({ ...selectedTable, status: s });
                                                        toast.success(`Table ${selectedTable.id} → ${cfg.label}`);
                                                    }}
                                                    className="py-2 rounded-lg text-[10px] font-semibold transition-all"
                                                    style={{
                                                        background: isActive ? cfg.bg : 'var(--bg-input)',
                                                        color: isActive ? cfg.color : 'var(--text-secondary)',
                                                        border: `1px solid ${isActive ? cfg.color : 'var(--border)'}`,
                                                    }}
                                                >{cfg.label}</button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Active Order */}
                                {(() => {
                                    const order = tableOrder(selectedTable);
                                    if (!order) return (
                                        <div className="rounded-lg p-4 text-center" style={{ background: 'var(--bg-input)' }}>
                                            <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>No active order</p>
                                            <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleNewOrder(selectedTable)}
                                                className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-lg text-[11px] font-medium"
                                                style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                                                <Hash className="w-3 h-3" weight="bold" /> New Order <ArrowRight className="w-3 h-3" weight="bold" />
                                            </motion.button>
                                        </div>
                                    );
                                    return (
                                        <div className="rounded-lg p-3" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>Active Order</p>
                                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                                    style={{
                                                        background: order.status === 'ready' ? 'rgba(46,204,113,0.1)' : 'rgba(232,168,56,0.1)',
                                                        color: order.status === 'ready' ? 'var(--success)' : 'var(--warning)',
                                                    }}>{order.status}</span>
                                            </div>
                                            {(order.items || []).map((item: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between py-1 text-[11px]"
                                                    style={{ color: 'var(--text-secondary)' }}>
                                                    <span>{item.menu_item?.name || item.name || 'Item'}</span>
                                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>×{item.quantity}</span>
                                                </div>
                                            ))}
                                            <div className="flex items-center justify-between mt-2 pt-2 text-xs font-bold"
                                                style={{ borderTop: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                                <span>Total</span>
                                                <span>Rs. {order.total.toFixed(0)}</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Quick Actions */}
                                <div className="space-y-1.5">
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleNewOrder(selectedTable)}
                                        className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                                        style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                                        <ChefHat className="w-3.5 h-3.5" weight="fill" /> New Order
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => generateTableQR(selectedTable.id)}
                                        className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                                        <QrCode className="w-3.5 h-3.5" weight="bold" /> Show Table QR
                                    </motion.button>
                                    {selectedTable.status === 'occupied' && (
                                        <button
                                            onClick={() => {
                                                vacateTable(selectedTable.id);
                                                useDataStore.getState().vacateTable(selectedTable.id.toString());
                                                setSelectedTable({ ...selectedTable, status: 'vacant', orderId: undefined, guestCount: undefined });
                                                toast.success(`Table ${selectedTable.id} cleared`);
                                            }}
                                            className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                                            style={{ background: 'rgba(231,76,60,0.08)', color: 'var(--danger)', border: '1px solid rgba(231,76,60,0.15)' }}>
                                            Clear Table
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* QR Modal */}
            <AnimatePresence>
                {showQR && selectedTable && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowQR(false)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="rounded-2xl p-6 text-center max-w-sm w-full mx-4"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Table {selectedTable.id} QR</h3>
                                <button onClick={() => setShowQR(false)} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                                    <X className="w-4 h-4" weight="bold" />
                                </button>
                            </div>
                            {qrDataUrl && (
                                <div className="bg-white rounded-xl p-4 mb-4 inline-block">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrDataUrl} alt={`Table ${selectedTable.id} QR`} className="w-56 h-56" />
                                </div>
                            )}
                            <p className="text-[10px] mb-4" style={{ color: 'var(--text-muted)' }}>
                                Scanning this code will open the menu directly on Table {selectedTable.id}. Guests can place orders seamlessly.
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
        </div>
    );
}
