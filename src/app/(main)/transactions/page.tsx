'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowDownLeft as ArrowDownLeft, ArrowUpRight as ArrowUpRight,
    Plus as Plus, CreditCard as CreditCard, Money as Banknote,
    QrCode as QrCode, Wallet as Wallet,
} from '@phosphor-icons/react';
import { useOrdersStore } from '@/stores/useOrdersStore';
import { useDataStore } from '@/stores/useDataStore';

/* eslint-disable react-hooks/purity */

type TxnType = 'income' | 'expense';

interface Transaction {
    id: string;
    type: TxnType;
    category: string;
    description: string;
    amount: number;
    method: string;
    date: string;
}

export default function TransactionsPage() {
    const orders = useOrdersStore((s) => s.orders);
    const { transactions: storedTxns, initData } = useDataStore();
    const [filter, setFilter] = useState<'all' | TxnType>('all');

    useEffect(() => {
        initData();
    }, [initData]);

    // Generate transactions from orders + persisted transactions + expenses
    const transactions: Transaction[] = useMemo(() => {
        const orderIncome: Transaction[] = orders
            .filter((o) => o.status === 'completed')
            .map((o) => ({
                id: `TXN-${o.id}`,
                type: 'income' as TxnType,
                category: o.type || 'Dine-In',
                description: `Table ${o.tableNumber} bill settlement`,
                amount: o.total,
                method: 'Cash',
                date: o.createdAt,
            }));

        const combined = [...storedTxns, ...orderIncome];
        // Deduplicate by ID
        const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
        return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, storedTxns]);

    const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);
    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const methodIcons: Record<string, React.ElementType> = {
        Cash: Banknote,
        Bank: CreditCard,
        eSewa: QrCode,
        Khalti: Wallet,
        Fonepay: QrCode,
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-lg font-bold font-['Outfit']" style={{ color: 'var(--text-primary)' }}>Transactions</h1>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Day book · {transactions.length} entries</p>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                    style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                    <Plus className="w-3.5 h-3.5" weight="bold" /> Add Transaction
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="rounded-xl p-3.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <ArrowDownLeft className="w-3.5 h-3.5" weight="bold" style={{ color: 'var(--success)' }} />
                        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Income</span>
                    </div>
                    <p className="text-base font-bold" style={{ color: 'var(--success)' }}>Rs. {totalIncome.toFixed(0)}</p>
                </div>
                <div className="rounded-xl p-3.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <ArrowUpRight className="w-3.5 h-3.5" weight="bold" style={{ color: 'var(--danger)' }} />
                        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Expenses</span>
                    </div>
                    <p className="text-base font-bold" style={{ color: 'var(--danger)' }}>Rs. {totalExpense.toFixed(0)}</p>
                </div>
                <div className="rounded-xl p-3.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <Wallet className="w-3.5 h-3.5" weight="fill" style={{ color: 'var(--accent-text)' }} />
                        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Net Profit</span>
                    </div>
                    <p className="text-base font-bold" style={{ color: totalIncome - totalExpense >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        Rs. {(totalIncome - totalExpense).toFixed(0)}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                {(['all', 'income', 'expense'] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all capitalize"
                        style={{
                            background: filter === f ? 'var(--accent)' : 'var(--bg-input)',
                            color: filter === f ? 'var(--accent-fg)' : 'var(--text-secondary)',
                            border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
                        }}>{f}</button>
                ))}
            </div>

            {/* Transaction List */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {filtered.map((txn, i) => {
                    const MethodIcon = methodIcons[txn.method] || Banknote;
                    return (
                        <motion.div key={txn.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                            className="flex items-center gap-3 px-4 py-3 transition-colors row-hover"
                            style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{
                                    background: txn.type === 'income' ? 'rgba(46,204,113,0.08)' : 'rgba(231,76,60,0.08)',
                                }}>
                                {txn.type === 'income'
                                    ? <ArrowDownLeft className="w-3.5 h-3.5" weight="bold" style={{ color: 'var(--success)' }} />
                                    : <ArrowUpRight className="w-3.5 h-3.5" weight="bold" style={{ color: 'var(--danger)' }} />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{txn.description}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider"
                                        style={{
                                            background: 'var(--bg-elevated)',
                                            borderColor: 'var(--border)',
                                            color: 'var(--text-primary)',
                                        }}>{txn.category}</span>
                                    <span className="flex items-center gap-0.5 text-[9px]" style={{ color: 'var(--text-muted)' }}>
                                        <MethodIcon className="w-2.5 h-2.5" weight="fill" /> {txn.method}
                                    </span>
                                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                                        {new Date(txn.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                            <span className="text-xs font-bold shrink-0" style={{ color: txn.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                                {txn.type === 'income' ? '+' : '-'} Rs. {txn.amount.toFixed(0)}
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
