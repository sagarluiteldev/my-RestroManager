'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    CurrencyDollar as DollarSign,
    ShoppingBag as ShoppingBag,
    TrendUp as TrendingUp,
    Clock as Clock,
    Fire as Flame,
} from '@phosphor-icons/react';
import { useOrdersStore } from '@/stores/useOrdersStore';

export default function ReportsPage() {
    const orders = useOrdersStore((s) => s.orders);

    const stats = useMemo(() => {
        const completed = orders.filter((o) => o.status === 'completed');
        const totalRevenue = completed.reduce((s, o) => s + o.total, 0);
        const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0;

        // Top selling items
        const itemCounts: Record<string, { name: string; count: number; revenue: number; image: string }> = {};
        orders.forEach((order) => {
            (order.items || []).forEach((item: any) => {
                const key = item.menu_item?.id || item.id || item.name || 'item';
                const name = item.menu_item?.name || item.name || 'Item';
                const image = item.menu_item?.image_url || item.image_url || '';
                const price = item.menu_item?.price || item.price || 0;
                const qty = item.quantity || 1;
                if (!itemCounts[key]) {
                    itemCounts[key] = { name, count: 0, revenue: 0, image };
                }
                itemCounts[key].count += qty;
                itemCounts[key].revenue += price * qty;
            });
        });
        const topItems = Object.values(itemCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        // Orders by table
        const tableCounts: Record<number, number> = {};
        orders.forEach((o) => { tableCounts[o.tableNumber] = (tableCounts[o.tableNumber] || 0) + 1; });
        const busiestTable = Object.entries(tableCounts).sort((a, b) => b[1] - a[1])[0];

        // Peak hours
        const hourCounts: Record<number, number> = {};
        orders.forEach((o) => {
            const hr = new Date(o.createdAt).getHours();
            hourCounts[hr] = (hourCounts[hr] || 0) + 1;
        });
        const maxHourCount = Math.max(...Object.values(hourCounts), 1);

        // All revenue from completed orders with VAT
        const SERVICE_RATE = 0.10;
        const VAT_RATE = 0.13;
        const grossRevenue = completed.reduce((s, o) => {
            const sub = o.total;
            return s + sub + (sub * SERVICE_RATE) + ((sub + sub * SERVICE_RATE) * VAT_RATE);
        }, 0);

        return { totalRevenue, grossRevenue, avgOrderValue, totalOrders: orders.length, completedOrders: completed.length, topItems, busiestTable, hourCounts, maxHourCount };
    }, [orders]);

    const kpiCards = [
        { label: 'Total Revenue', value: `Rs. ${stats.totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'var(--success)', sub: `Gross: Rs. ${stats.grossRevenue.toFixed(0)}` },
        { label: 'Orders', value: `${stats.totalOrders}`, icon: ShoppingBag, color: 'var(--info)', sub: `${stats.completedOrders} completed` },
        { label: 'Avg Order Value', value: `Rs. ${stats.avgOrderValue.toFixed(0)}`, icon: TrendingUp, color: 'var(--accent-text)', sub: 'Per order' },
        { label: 'Busiest Table', value: stats.busiestTable ? `Table ${stats.busiestTable[0]}` : '—', icon: Flame, color: 'var(--warning)', sub: stats.busiestTable ? `${stats.busiestTable[1]} orders` : 'No data' },
    ];

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-lg font-bold font-['Outfit']" style={{ color: 'var(--text-primary)' }}>Reports</h1>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {kpiCards.map((kpi, i) => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-xl p-3.5"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div className="w-7 h-7 rounded-md flex items-center justify-center mb-2"
                            style={{ background: `color-mix(in srgb, ${kpi.color} 12%, transparent)` }}>
                            <kpi.icon className="w-3.5 h-3.5" weight="fill" style={{ color: kpi.color }} />
                        </div>
                        <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: kpi.color }}>{kpi.sub}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Top Selling Items */}
                <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-1.5 font-['Outfit']" style={{ color: 'var(--text-primary)' }}>
                        <Flame className="w-3.5 h-3.5" weight="fill" style={{ color: 'var(--warning)' }} /> Top Selling Items
                    </h3>
                    {stats.topItems.length === 0 ? (
                        <p className="text-[11px] py-4 text-center" style={{ color: 'var(--text-muted)' }}>No data yet</p>
                    ) : (
                        <div className="space-y-1.5">
                            {stats.topItems.map((item, i) => (
                                <div key={item.name} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                                    <span className="text-[10px] font-bold w-4 text-center" style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
                                    <div className="w-7 h-7 rounded-md overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                                        {item.image ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                                                {item.name.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                                        <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{item.count} sold</p>
                                    </div>
                                    <span className="text-[11px] font-bold shrink-0" style={{ color: 'var(--accent-text)' }}>Rs. {item.revenue.toFixed(0)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Peak Hours */}
                <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-1.5 font-['Outfit']" style={{ color: 'var(--text-primary)' }}>
                        <Clock className="w-3.5 h-3.5" weight="bold" style={{ color: 'var(--info)' }} /> Peak Hours
                    </h3>
                    {Object.keys(stats.hourCounts).length === 0 ? (
                        <p className="text-[11px] py-4 text-center" style={{ color: 'var(--text-muted)' }}>No data yet</p>
                    ) : (
                        <div className="flex items-end gap-0.5 h-32">
                            {Array.from({ length: 16 }, (_, i) => i + 7).map((hour) => {
                                const count = stats.hourCounts[hour] || 0;
                                const pct = (count / stats.maxHourCount) * 100;
                                const isPeak = pct >= 70;
                                return (
                                    <div key={hour} className="flex-1 flex flex-col items-center gap-0.5">
                                        <div
                                            className="w-full rounded-t-sm transition-all"
                                            style={{
                                                height: `${Math.max(pct, 4)}%`,
                                                background: isPeak ? 'var(--accent)' : 'var(--bg-elevated)',
                                                minHeight: 3,
                                            }}
                                        />
                                        <span className="text-[7px] font-medium" style={{ color: count > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                                            {hour > 12 ? `${hour - 12}p` : `${hour}a`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* All Orders */}
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-xs font-bold mb-3 font-['Outfit']" style={{ color: 'var(--text-primary)' }}>All Orders Today</h3>
                {orders.length === 0 ? (
                    <p className="text-[11px] py-4 text-center" style={{ color: 'var(--text-muted)' }}>No orders yet</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                    <th className="py-1.5 text-left">Order</th>
                                    <th className="py-1.5 text-left">Table</th>
                                    <th className="py-1.5 text-left">Items</th>
                                    <th className="py-1.5 text-left">Status</th>
                                    <th className="py-1.5 text-left">Waiter</th>
                                    <th className="py-1.5 text-right">Amount</th>
                                    <th className="py-1.5 text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="text-[11px]" style={{ borderTop: '1px solid var(--border)' }}>
                                        <td className="py-2 font-medium" style={{ color: 'var(--text-primary)' }}>#{order.id.slice(-5)}</td>
                                        <td className="py-2" style={{ color: 'var(--text-secondary)' }}>T{order.tableNumber}</td>
                                        <td className="py-2 truncate max-w-37.5" style={{ color: 'var(--text-secondary)' }}>
                                            {(order.items || []).map((i: any) => i.menu_item?.name || i.name || 'Item').join(', ')}
                                        </td>
                                        <td className="py-2">
                                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                                style={{
                                                    background: order.status === 'completed' ? 'var(--bg-input)' :
                                                        order.status === 'preparing' ? 'var(--bg-input)' :
                                                            order.status === 'ready' ? 'var(--accent-light)' : 'var(--bg-input)',
                                                    color: order.status === 'completed' ? 'var(--text-secondary)' :
                                                        order.status === 'preparing' ? 'var(--text-secondary)' :
                                                            order.status === 'ready' ? 'var(--accent-text)' : 'var(--text-muted)',
                                                }}>{order.status}</span>
                                        </td>
                                        <td className="py-2" style={{ color: 'var(--text-muted)' }}>{order.waiterName}</td>
                                        <td className="py-2 text-right font-medium" style={{ color: 'var(--text-primary)' }}>Rs. {order.total.toFixed(0)}</td>
                                        <td className="py-2 text-right" style={{ color: 'var(--text-muted)' }}>
                                            {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
