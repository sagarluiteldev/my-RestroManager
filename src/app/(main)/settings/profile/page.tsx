'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Storefront,
    IdentificationBadge,
    Phone,
    EnvelopeSimple,
    MapPin,
    Clock,
    LockKey,
    FloppyDisk,
    CheckCircle,
    Eye,
    EyeSlash,
    Buildings,
    FileText,
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';

interface RestaurantProfile {
    name: string;
    tagline: string;
    panVatNumber: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    openingTime: string;
    closingTime: string;
    managerName: string;
    managerPin: string;
    currency: string;
}

const DEFAULT_PROFILE: RestaurantProfile = {
    name: 'Himalayan Flavors Kitchen & Bar',
    tagline: 'Authentic Himalayan & Continental Fusion Cuisine',
    panVatNumber: 'PAN-609182374',
    phone: '+977 1 4412980',
    email: 'contact@himalayanflavors.com',
    address: 'Thamel Marg, Ward 26',
    city: 'Kathmandu, Nepal',
    openingTime: '08:30',
    closingTime: '23:00',
    managerName: 'Sunil Shakya',
    managerPin: '1234',
    currency: 'Rs. (NPR)',
};

export default function SettingsProfilePage() {
    const [profile, setProfile] = useState<RestaurantProfile>(DEFAULT_PROFILE);
    const [showPin, setShowPin] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load from localStorage if present
    useEffect(() => {
        try {
            const saved = localStorage.getItem('myrestro_restaurant_profile');
            if (saved) {
                setProfile(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Failed to load profile from storage', e);
        }
    }, []);

    const handleChange = (field: keyof RestaurantProfile, value: string) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            try {
                localStorage.setItem('myrestro_restaurant_profile', JSON.stringify(profile));
                toast.success('Restaurant profile updated successfully!', {
                    style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                });
            } catch (err) {
                console.error('Failed to save profile', err);
                toast.error('Failed to save profile');
            } finally {
                setIsSaving(false);
            }
        }, 500);
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />

            {/* Header */}
            <div>
                <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Restaurant Profile & Identity
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Manage legal organization details, tax identifiers, contact info, and manager credentials.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Organization Information Card */}
                <div
                    className="p-6 rounded-2xl border space-y-5"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                    <div className="flex items-center gap-2.5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 text-white">
                            <Storefront className="w-4 h-4" weight="bold" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                Business Information
                            </h3>
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                Appears on customer receipts, invoices, and the digital QR menu.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Restaurant Trade Name *
                            </label>
                            <div className="relative">
                                <Buildings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    required
                                    value={profile.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="w-full rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 transition-all"
                                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Concept / Tagline
                            </label>
                            <input
                                type="text"
                                value={profile.tagline}
                                onChange={(e) => handleChange('tagline', e.target.value)}
                                placeholder="e.g. Fine Dining & Cocktail Bar"
                                className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 transition-all"
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                PAN / VAT Registration Number *
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    required
                                    value={profile.panVatNumber}
                                    onChange={(e) => handleChange('panVatNumber', e.target.value)}
                                    className="w-full rounded-xl pl-9 pr-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 transition-all"
                                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Primary Contact Phone *
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="tel"
                                    required
                                    value={profile.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    className="w-full rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 transition-all"
                                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Official Email Address *
                            </label>
                            <div className="relative">
                                <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    required
                                    value={profile.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className="w-full rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 transition-all"
                                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                City & Region
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    value={profile.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    className="w-full rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 transition-all"
                                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Street Address
                            </label>
                            <input
                                type="text"
                                value={profile.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 transition-all"
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Operating Hours Card */}
                <div
                    className="p-6 rounded-2xl border space-y-4"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                    <div className="flex items-center gap-2.5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 text-white">
                            <Clock className="w-4 h-4" weight="bold" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                Operating Hours
                            </h3>
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                Kitchen service schedule used for order acceptance and digital menu status.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Kitchen Opening Time
                            </label>
                            <input
                                type="time"
                                value={profile.openingTime}
                                onChange={(e) => handleChange('openingTime', e.target.value)}
                                className="w-full rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1"
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Kitchen Closing Time
                            </label>
                            <input
                                type="time"
                                value={profile.closingTime}
                                onChange={(e) => handleChange('closingTime', e.target.value)}
                                className="w-full rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1"
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Manager Credentials & Security Card */}
                <div
                    className="p-6 rounded-2xl border space-y-4"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                    <div className="flex items-center gap-2.5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 text-white">
                            <IdentificationBadge className="w-4 h-4" weight="bold" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                Manager Identity & Security Override PIN
                            </h3>
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                Required to void bill items, authorize discounts, and access sensitive financial settings.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Head Manager Name
                            </label>
                            <input
                                type="text"
                                required
                                value={profile.managerName}
                                onChange={(e) => handleChange('managerName', e.target.value)}
                                className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1"
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Manager 4-Digit Override PIN
                            </label>
                            <div className="relative">
                                <LockKey className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type={showPin ? 'text' : 'password'}
                                    maxLength={4}
                                    pattern="[0-9]{4}"
                                    value={profile.managerPin}
                                    onChange={(e) => handleChange('managerPin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    className="w-full rounded-xl pl-9 pr-10 py-2 text-xs font-mono font-bold tracking-widest focus:outline-none focus:ring-1"
                                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPin(!showPin)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                                >
                                    {showPin ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit CTA */}
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
                        <span>Save Restaurant Profile</span>
                    </motion.button>
                </div>
            </form>
        </div>
    );
}
