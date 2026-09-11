'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    SlidersHorizontal,
    Receipt,
    SpeakerHigh,
    Package,
    ForkKnife,
    FloppyDisk,
    Bell,
    CheckCircle,
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';

interface OperationalPreferences {
    vatEnabled: boolean;
    vatRate: number;
    serviceChargeEnabled: boolean;
    serviceChargeRate: number;
    currencySymbol: string;
    kdsSoundEnabled: boolean;
    ticketAlertMinutes: number;
    autoDepleteInventory: boolean;
    lowStockThreshold: number;
    channelDineIn: boolean;
    channelTakeaway: boolean;
    channelDelivery: boolean;
}

const DEFAULT_PREFERENCES: OperationalPreferences = {
    vatEnabled: true,
    vatRate: 13,
    serviceChargeEnabled: true,
    serviceChargeRate: 10,
    currencySymbol: 'Rs.',
    kdsSoundEnabled: true,
    ticketAlertMinutes: 15,
    autoDepleteInventory: true,
    lowStockThreshold: 5,
    channelDineIn: true,
    channelTakeaway: true,
    channelDelivery: true,
};

function playAudioChime() {
    try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
        console.warn('Audio preview not supported', e);
    }
}

export default function SettingsPreferencesPage() {
    const [prefs, setPrefs] = useState<OperationalPreferences>(DEFAULT_PREFERENCES);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('myrestro_operational_preferences');
            if (saved) {
                setPrefs(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Failed to load preferences from storage', e);
        }
    }, []);

    const toggle = (field: keyof OperationalPreferences) => {
        setPrefs((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const setNumber = (field: keyof OperationalPreferences, val: number) => {
        setPrefs((prev) => ({ ...prev, [field]: val }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            try {
                localStorage.setItem('myrestro_operational_preferences', JSON.stringify(prefs));
                toast.success('Operational preferences updated!', {
                    style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                });
            } catch (err) {
                console.error('Failed to save preferences', err);
                toast.error('Failed to save preferences');
            } finally {
                setIsSaving(false);
            }
        }, 400);
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />

            <div>
                <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Operational & Tax Preferences
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Configure automated government VAT calculations, service surcharges, KDS audio notifications, and inventory rules.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Tax & Surcharges Card */}
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
                                Taxation & Surcharges
                            </h3>
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                Applied automatically to customer bills, POS checkout, and table settlements.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* VAT Toggle & Rate */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/8 bg-white/3">
                            <div>
                                <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                                    Government VAT (Value Added Tax)
                                </h4>
                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                    Standard statutory VAT applied across all taxable food & beverage items.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={prefs.vatRate}
                                        onChange={(e) => setNumber('vatRate', parseFloat(e.target.value) || 0)}
                                        className="w-10 text-center text-xs font-bold font-mono bg-transparent text-white focus:outline-none"
                                    />
                                    <span className="text-xs text-white/50 font-bold">%</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggle('vatEnabled')}
                                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                                        prefs.vatEnabled ? 'bg-emerald-500' : 'bg-white/20'
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                            prefs.vatEnabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Service Charge Toggle & Rate */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/8 bg-white/3">
                            <div>
                                <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                                    Restaurant Service Charge
                                </h4>
                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                    Discretionary staff hospitality service fee computed prior to VAT.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={prefs.serviceChargeRate}
                                        onChange={(e) => setNumber('serviceChargeRate', parseFloat(e.target.value) || 0)}
                                        className="w-10 text-center text-xs font-bold font-mono bg-transparent text-white focus:outline-none"
                                    />
                                    <span className="text-xs text-white/50 font-bold">%</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggle('serviceChargeEnabled')}
                                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                                        prefs.serviceChargeEnabled ? 'bg-emerald-500' : 'bg-white/20'
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                            prefs.serviceChargeEnabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kitchen Display (KDS) & Audio Preferences */}
                <div
                    className="p-6 rounded-2xl border space-y-5"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                    <div className="flex items-center gap-2.5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 text-white">
                            <SpeakerHigh className="w-4 h-4" weight="bold" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                Kitchen Display Screen (KDS) & Audio Chimes
                            </h3>
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                Manage kitchen alert frequencies and sound triggers for incoming tickets.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/8 bg-white/3">
                            <div>
                                <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                                    Kitchen Chime on New Order
                                </h4>
                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                    Plays an audible acoustic chime when a customer or waiter submits a ticket.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={playAudioChime}
                                    className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 transition-all"
                                >
                                    <Bell className="w-3.5 h-3.5" />
                                    Test Chime
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggle('kdsSoundEnabled')}
                                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                                        prefs.kdsSoundEnabled ? 'bg-emerald-500' : 'bg-white/20'
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                            prefs.kdsSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/8 bg-white/3">
                            <div>
                                <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                                    Delayed Ticket Warning Threshold
                                </h4>
                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                    Highlights kitchen ticket cards in red if pending longer than this duration.
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                                <input
                                    type="number"
                                    min="3"
                                    max="60"
                                    value={prefs.ticketAlertMinutes}
                                    onChange={(e) => setNumber('ticketAlertMinutes', parseInt(e.target.value, 10) || 15)}
                                    className="w-10 text-center text-xs font-bold font-mono bg-transparent text-white focus:outline-none"
                                />
                                <span className="text-xs text-white/50">minutes</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventory Automation Rules */}
                <div
                    className="p-6 rounded-2xl border space-y-5"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                    <div className="flex items-center gap-2.5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 text-white">
                            <Package className="w-4 h-4" weight="bold" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                Inventory Automation & Depletion Rules
                            </h3>
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                Coordinates stock level deductions automatically with kitchen dish completions.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/8 bg-white/3">
                            <div>
                                <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                                    Real-time Recipe Ingredient Depletion
                                </h4>
                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                    Automatically deducts flour, cheese, meat, and spices from raw inventory whenever an order is marked Complete.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggle('autoDepleteInventory')}
                                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                                    prefs.autoDepleteInventory ? 'bg-emerald-500' : 'bg-white/20'
                                }`}
                            >
                                <div
                                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                        prefs.autoDepleteInventory ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/8 bg-white/3">
                            <div>
                                <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                                    Low Stock Alert Trigger
                                </h4>
                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                    Displays amber alert banners on the inventory and menu pages when stock falls below this quantity.
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={prefs.lowStockThreshold}
                                    onChange={(e) => setNumber('lowStockThreshold', parseInt(e.target.value, 10) || 5)}
                                    className="w-10 text-center text-xs font-bold font-mono bg-transparent text-white focus:outline-none"
                                />
                                <span className="text-xs text-white/50">units</span>
                            </div>
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
                        <span>Save Preferences</span>
                    </motion.button>
                </div>
            </form>
        </div>
    );
}
