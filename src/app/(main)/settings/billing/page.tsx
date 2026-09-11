'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Receipt,
    CreditCard,
    QrCode,
    Money,
    DownloadSimple,
    Printer,
    CheckCircle,
    FloppyDisk,
    ShieldCheck,
    Database,
    X,
} from '@phosphor-icons/react';
import { localDb } from '@/lib/db/localDb';
import toast, { Toaster } from 'react-hot-toast';

interface BillingSettings {
    invoiceTitle: string;
    headerNote: string;
    footerNote: string;
    showQrOnBill: boolean;
    fonepayEnabled: boolean;
    fonepayMerchantId: string;
    esewaEnabled: boolean;
    esewaMerchantCode: string;
    khaltiEnabled: boolean;
    cardPosEnabled: boolean;
    cashEnabled: boolean;
}

const DEFAULT_BILLING_SETTINGS: BillingSettings = {
    invoiceTitle: 'TAX INVOICE',
    headerNote: 'Thank you for dining with Himalayan Flavors!',
    footerNote: 'Wi-Fi: RestroGuest / Key: momo1234\nGoods once sold cannot be returned. Visit again!',
    showQrOnBill: true,
    fonepayEnabled: true,
    fonepayMerchantId: 'MERCHANT-FN-9841',
    esewaEnabled: true,
    esewaMerchantCode: 'EPAYTEST',
    khaltiEnabled: true,
    cardPosEnabled: true,
    cashEnabled: true,
};

export default function SettingsBillingPage() {
    const [settings, setSettings] = useState<BillingSettings>(DEFAULT_BILLING_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('myrestro_billing_settings');
            if (saved) {
                setSettings(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Failed to load billing settings from storage', e);
        }
    }, []);

    const toggle = (field: keyof BillingSettings) => {
        setSettings((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleChange = (field: keyof BillingSettings, value: string) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            try {
                localStorage.setItem('myrestro_billing_settings', JSON.stringify(settings));
                toast.success('Billing & receipt configuration saved!', {
                    style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                });
            } catch (err) {
                console.error('Failed to save billing settings', err);
                toast.error('Failed to save settings');
            } finally {
                setIsSaving(false);
            }
        }, 400);
    };

    const handleExportBackup = async () => {
        try {
            const [categories, items, tables, ingredients, transactions] = await Promise.all([
                localDb.categories.toArray(),
                localDb.menu_items.toArray(),
                localDb.restaurant_tables.toArray(),
                localDb.ingredients.toArray(),
                localDb.transactions.toArray(),
            ]);

            const snapshot = {
                exportedAt: new Date().toISOString(),
                version: 3,
                categories,
                menuItems: items,
                tables,
                ingredients,
                transactions,
            };

            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute('download', `myrestro-backup-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            toast.success('Database backup exported successfully!');
        } catch (err) {
            console.error('Backup export failed', err);
            toast.error('Failed to export backup');
        }
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Billing, Invoices & Payment Gateways
                    </h2>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Configure receipt slips, merchant payment methods, thermal print headers, and database exports.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsPreviewModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-all border border-white/10"
                    >
                        <Printer className="w-4 h-4" />
                        Preview Bill Slip
                    </button>
                    <button
                        type="button"
                        onClick={handleExportBackup}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-all border border-white/10"
                    >
                        <DownloadSimple className="w-4 h-4" />
                        Export Data
                    </button>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* System License & Offline Engine Card */}
                <div
                    className="p-6 rounded-2xl border space-y-4"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <ShieldCheck className="w-4 h-4" weight="bold" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">myRestro Enterprise Pro Edition</h3>
                                <p className="text-[11px] text-emerald-400 font-mono">Active Offline-First License · Dexie v3 Synchronized</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            UNLIMITED SEATS
                        </span>
                    </div>

                    <p className="text-xs text-white/50 leading-relaxed">
                        Your restaurant manager operates on an offline-first resilient architecture. In the event of internet disruption or ISP outages, all orders, KDS tickets, bills, and stock deductions persist securely in local IndexedDB.
                    </p>
                </div>

                {/* Receipt Customization Card */}
                <div
                    className="p-6 rounded-2xl border space-y-5"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                    <div className="flex items-center gap-2.5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 text-white">
                            <Receipt className="w-4 h-4" weight="bold" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                Thermal Receipt & Invoice Print Template
                            </h3>
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                Text and branding displayed on thermal 80mm/58mm printed customer receipts.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Invoice Header Title
                            </label>
                            <input
                                type="text"
                                required
                                value={settings.invoiceTitle}
                                onChange={(e) => handleChange('invoiceTitle', e.target.value)}
                                className="w-full rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-1"
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Subheader Greeting
                            </label>
                            <input
                                type="text"
                                value={settings.headerNote}
                                onChange={(e) => handleChange('headerNote', e.target.value)}
                                className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1"
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Footer Notes, Wi-Fi Passwords & Terms
                            </label>
                            <textarea
                                rows={3}
                                value={settings.footerNote}
                                onChange={(e) => handleChange('footerNote', e.target.value)}
                                className="w-full rounded-xl p-3 text-xs focus:outline-none focus:ring-1 resize-none"
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/8 bg-white/3">
                            <div>
                                <h4 className="text-xs font-bold text-white">Print Digital Payment QR on Slip</h4>
                                <p className="text-[11px] text-white/50">
                                    Prints a scannable dynamic QR code at the bottom of the bill for instant guest checkout.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggle('showQrOnBill')}
                                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                                    settings.showQrOnBill ? 'bg-emerald-500' : 'bg-white/20'
                                }`}
                            >
                                <div
                                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                        settings.showQrOnBill ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Accepted Payment Gateways Card */}
                <div
                    className="p-6 rounded-2xl border space-y-5"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                    <div className="flex items-center gap-2.5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 text-white">
                            <CreditCard className="w-4 h-4" weight="bold" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                Payment Gateways & POS Terminal Methods
                            </h3>
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                Enable or disable payment options presented in Billing settlement and POS checkout.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Fonepay */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/8 bg-white/3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold text-xs">
                                    FP
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white">Fonepay QR Network</h4>
                                    <p className="text-[11px] text-white/50">Nepal inter-bank QR payment scheme</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggle('fonepayEnabled')}
                                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                                    settings.fonepayEnabled ? 'bg-emerald-500' : 'bg-white/20'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.fonepayEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* eSewa */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/8 bg-white/3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-600/20 text-green-400 border border-green-500/30 flex items-center justify-center font-bold text-xs">
                                    eS
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white">eSewa Mobile Wallet</h4>
                                    <p className="text-[11px] text-white/50">Digital wallet integration & direct QR</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggle('esewaEnabled')}
                                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                                    settings.esewaEnabled ? 'bg-emerald-500' : 'bg-white/20'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.esewaEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Card POS */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/8 bg-white/3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white">Physical Card Machine (POS Swiper)</h4>
                                    <p className="text-[11px] text-white/50">Visa, Mastercard, UnionPay, SCT</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggle('cardPosEnabled')}
                                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                                    settings.cardPosEnabled ? 'bg-emerald-500' : 'bg-white/20'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.cardPosEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Cash */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/8 bg-white/3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                                    <Money className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white">Cash Register at Counter</h4>
                                    <p className="text-[11px] text-white/50">Cash tender with automatic change calculation</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggle('cashEnabled')}
                                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                                    settings.cashEnabled ? 'bg-emerald-500' : 'bg-white/20'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.cashEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save CTA */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <motion.button
                        type="submit"
                        disabled={isSaving}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg hover:brightness-105 active:scale-98"
                        style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FloppyDisk className="w-4 h-4" weight="bold" />
                        )}
                        <span>Save Billing Settings</span>
                    </motion.button>
                </div>
            </form>

            {/* Thermal Receipt Preview Modal */}
            <AnimatePresence>
                {isPreviewModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPreviewModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-sm rounded-2xl bg-white text-black p-6 shadow-2xl font-mono text-xs space-y-4"
                        >
                            <button
                                onClick={() => setIsPreviewModalOpen(false)}
                                className="absolute top-3 right-3 text-black/40 hover:text-black"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Slip Header */}
                            <div className="text-center space-y-1 border-b border-black/20 pb-3">
                                <h3 className="font-bold text-sm tracking-wider uppercase">Himalayan Flavors</h3>
                                <p className="text-[10px] text-black/60">Thamel Marg, Ward 26, Kathmandu</p>
                                <p className="text-[10px] text-black/60">PAN: 609182374 · TEL: 01-4412980</p>
                                <p className="font-bold text-xs pt-1">{settings.invoiceTitle}</p>
                            </div>

                            {/* Bill Info */}
                            <div className="text-[10px] flex justify-between text-black/70 border-b border-black/10 pb-2">
                                <div>
                                    <p>Bill: #INV-2026-0842</p>
                                    <p>Table: T3 · Dine-In</p>
                                </div>
                                <div className="text-right">
                                    <p>Date: 2026-09-11</p>
                                    <p>Server: Sunil</p>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="space-y-1 text-[11px] border-b border-black/20 pb-2">
                                <div className="flex justify-between font-bold text-[10px] uppercase border-b border-black/10 pb-1">
                                    <span>Item</span>
                                    <span>Qty × Rate = Amt</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Steam Buff Momo</span>
                                    <span>2 × 220 = 440</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Truffle Pizza (12&quot;)</span>
                                    <span>1 × 680 = 680</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Peach Iced Tea</span>
                                    <span>2 × 180 = 360</span>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="space-y-1 text-[11px] border-b border-black/20 pb-2">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>Rs. 1,480.00</span>
                                </div>
                                <div className="flex justify-between text-black/70">
                                    <span>Service Charge (10%):</span>
                                    <span>Rs. 148.00</span>
                                </div>
                                <div className="flex justify-between text-black/70">
                                    <span>VAT (13%):</span>
                                    <span>Rs. 211.64</span>
                                </div>
                                <div className="flex justify-between font-bold text-sm pt-1 border-t border-black/10">
                                    <span>GRAND TOTAL:</span>
                                    <span>Rs. 1,839.64</span>
                                </div>
                            </div>

                            {/* Slip Footer */}
                            <div className="text-center text-[10px] text-black/60 pt-1 space-y-1">
                                <p className="font-semibold">{settings.headerNote}</p>
                                <p className="whitespace-pre-line text-[9px]">{settings.footerNote}</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
