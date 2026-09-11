'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CircleNotch as Loader2,
    Eye,
    EyeClosed as EyeOff,
} from '@phosphor-icons/react';
import { LogoIcon } from '@/components/Logo';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useRoleStore, UserRole } from '@/stores/useRoleStore';
import { seedDemoData } from '@/lib/demoSeeder';

type AuthMode = 'signin' | 'signup';

export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ email: '', password: '', fullName: '', restaurantName: '' });
    const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
    const router = useRouter();
    const supabase = createClient();
    const { setRole } = useRoleStore();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'signup') {
                if (!form.email || !form.password || !form.fullName || !form.restaurantName) {
                    throw new Error('Please fill in all fields');
                }

                // 1. Sign up user
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: {
                        data: {
                            full_name: form.fullName,
                        },
                    },
                });

                if (authError) throw authError;

                if (authData.session) {
                    // Create restaurant immediately
                    const { error: rpcError } = await supabase.rpc('create_restaurant_and_link', {
                        restaurant_name: form.restaurantName
                    });

                    if (rpcError) throw rpcError;

                    toast.success('Restaurant created successfully! Welcome owner.');
                    router.push('/dashboard');
                } else if (authData.user) {
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('pending_restaurant_name', form.restaurantName);
                    }
                    toast.success('Account created! Please check your email to verify before logging in.');
                    setMode('signin');
                }
            } else {
                if (!form.email || !form.password) {
                    throw new Error('Please enter email and password');
                }

                const { error, data } = await supabase.auth.signInWithPassword({
                    email: form.email,
                    password: form.password,
                });

                if (error) throw error;

                // Fetch profile to get restaurantId
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('restaurant_id')
                    .eq('id', data.user.id)
                    .maybeSingle();

                let finalRestaurantId = profile?.restaurant_id;

                if (!finalRestaurantId && selectedRole === 'owner') {
                    const pendingRestro = typeof window !== 'undefined' ? localStorage.getItem('pending_restaurant_name') : null;
                    if (pendingRestro) {
                        const { error: rpcError } = await supabase.rpc('create_restaurant_and_link', {
                            restaurant_name: pendingRestro
                        });

                        if (!rpcError) {
                            if (typeof window !== 'undefined') localStorage.removeItem('pending_restaurant_name');
                            toast.success(`Restaurant "${pendingRestro}" created!`);

                            const { data: newProfile } = await supabase.from('profiles').select('restaurant_id').eq('id', data.user.id).maybeSingle();
                            finalRestaurantId = newProfile?.restaurant_id;
                        } else {
                            toast.error('Failed to create restaurant. Please try setting it up again.');
                        }
                    }
                }

                // Set role in store based on selection
                setRole(selectedRole, data.user?.user_metadata?.full_name || undefined, finalRestaurantId);

                toast.success('Welcome back!');
                if (selectedRole === 'chef') {
                    router.push('/kds');
                } else if (selectedRole === 'waiter') {
                    router.push('/tables');
                } else {
                    router.push('/dashboard');
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async (r: UserRole) => {
        setLoading(true);
        try {
            // 1. Set Ghost Demo Cookie (Middleware bypass)
            document.cookie = 'myrestro_demo_session=true; path=/; max-age=86400;';

            // 2. Set Local Role Store
            useRoleStore.getState().setDemo(r);

            // 3. Seed initial data
            seedDemoData();

            toast.success(`Welcome to ${r === 'chef' ? 'Kitchen' : r === 'waiter' ? 'Staff' : 'Manager'} Demo!`);

            // 4. Redirect
            router.push(r === 'chef' || r === 'kitchen' ? '/kds' : r === 'waiter' ? '/tables' : '/dashboard');
        } catch (err) {
            console.error('Demo login failed:', err);
            toast.error('Demo access failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[#F4F5F7]">
            {/* Main Auth Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-265 rounded-3xl overflow-hidden bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] flex flex-col-reverse md:flex-row border border-gray-200/80"
            >
                {/* ─── LEFT COLUMN: Login Forms & Actions ─── */}
                <div className="w-full md:w-[54%] lg:w-[52%] p-7 sm:p-9 lg:p-11 flex flex-col justify-between">
                    <div>
                        {/* Brand Logo Header */}
                        <div className="flex items-center gap-3 mb-7">
                            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 shadow-xs">
                                <LogoIcon size={24} className="text-white" />
                            </div>
                            <div>
                                <span className="text-[19px] font-extrabold tracking-tight font-['Outfit'] text-gray-900 block leading-none">
                                    myRestro
                                </span>
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mt-0.5">
                                    Restaurant Manager
                                </span>
                            </div>
                        </div>

                        {/* Title & Subtitle */}
                        <div className="mb-6">
                            <h1 className="text-[24px] sm:text-[27px] font-extrabold text-gray-900 font-['Outfit'] tracking-tight">
                                {mode === 'signin' ? 'Welcome back' : 'Create an account'}
                            </h1>
                            <p className="text-[13px] text-gray-500 mt-1 font-normal">
                                {mode === 'signin'
                                    ? 'Sign in to access your dashboard, POS, and kitchen operations.'
                                    : 'Start managing your restaurant tables, orders, and staff today.'}
                            </p>
                        </div>

                        <form onSubmit={handleAuth} className="space-y-3.5">
                            {/* Signup extra fields */}
                            <AnimatePresence mode="popLayout">
                                {mode === 'signup' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-3.5"
                                    >
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                                Restaurant Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Bistro Royale"
                                                value={form.restaurantName}
                                                onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                                                className="w-full rounded-xl py-3 px-4 text-[13px] bg-gray-50/70 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none text-gray-900 transition-all placeholder:text-gray-400"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. John Doe"
                                                value={form.fullName}
                                                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                                className="w-full rounded-xl py-3 px-4 text-[13px] bg-gray-50/70 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none text-gray-900 transition-all placeholder:text-gray-400"
                                                disabled={loading}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Email Input */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="manager@myrestro.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full rounded-xl py-3 px-4 text-[13px] bg-gray-50/70 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none text-gray-900 transition-all placeholder:text-gray-400"
                                    disabled={loading}
                                />
                            </div>

                            {/* Password Input with Eye Toggle */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••••••"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="w-full rounded-xl py-3 pl-4 pr-11 text-[13px] bg-gray-50/70 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none text-gray-900 transition-all placeholder:text-gray-400"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                                        disabled={loading}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" weight="bold" /> : <Eye className="w-4 h-4" weight="bold" />}
                                    </button>
                                </div>
                            </div>

                            {/* Sub-links row: Sign Up toggle & Forgot Password */}
                            <div className="flex items-center justify-between text-[12px] pt-1">
                                <div>
                                    {mode === 'signin' ? (
                                        <span className="text-gray-500">
                                            Don&apos;t have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => setMode('signup')}
                                                className="font-bold text-gray-900 hover:underline cursor-pointer"
                                            >
                                                Sign up
                                            </button>
                                        </span>
                                    ) : (
                                        <span className="text-gray-500">
                                            Already have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => setMode('signin')}
                                                className="font-bold text-gray-900 hover:underline cursor-pointer"
                                            >
                                                Sign in
                                            </button>
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toast('Please contact your restaurant administrator to reset your password.')}
                                    className="text-gray-500 hover:text-gray-800 transition-colors cursor-pointer text-[12px]"
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            {/* Role Selection Chips (When in signin mode) */}
                            {mode === 'signin' && (
                                <div className="pt-2">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                        Account Role
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['owner', 'chef', 'waiter'] as UserRole[]).map((r) => {
                                            const isSelected = selectedRole === r;
                                            return (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    onClick={() => setSelectedRole(r)}
                                                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                                                        isSelected
                                                            ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                                                            : 'bg-gray-50/70 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {r === 'owner' ? 'Manager' : r === 'chef' ? 'Kitchen' : 'Staff'}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="pt-3">
                                <motion.button
                                    type="submit"
                                    disabled={loading || (!form.email || !form.password || (mode === 'signup' && (!form.restaurantName || !form.fullName)))}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full py-3.5 px-6 rounded-xl bg-gray-900 hover:bg-black active:scale-[0.99] text-white font-bold text-[13px] tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </div>

                    {/* Bottom Area: Quick Demo Access & Contact Support */}
                    <div className="pt-6 mt-6 border-t border-gray-100 space-y-4">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                                Quick Demo Access
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {([
                                    { role: 'owner', label: 'Owner Setup' },
                                    { role: 'chef', label: 'Chef Demo' },
                                    { role: 'waiter', label: 'Waiter Demo' },
                                ] as const).map(({ role: r, label }) => (
                                    <button
                                        key={`demo-${r}`}
                                        type="button"
                                        onClick={() => handleDemoLogin(r)}
                                        disabled={loading}
                                        className="py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all border border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-900 hover:text-gray-900 text-gray-700 shadow-2xs cursor-pointer text-center truncate"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Contact Support */}
                        <div className="text-center pt-1 text-[12px] text-gray-500">
                            Having trouble?{' '}
                            <a
                                href="mailto:support@myrestro.com"
                                className="font-semibold text-gray-900 hover:underline"
                            >
                                Contact support@myrestro.com
                            </a>
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT COLUMN: Restaurant Illustration Image ─── */}
                <div className="w-full md:w-[46%] lg:w-[48%] relative min-h-80 md:min-h-160 bg-[#dfd7cc] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/login-illustration.png"
                        alt="Restaurant Waiter & Dining Experience"
                        className="w-full h-full object-cover object-center absolute inset-0"
                    />
                    {/* Subtle gradient vignette at the base with sleek info overlay on desktop */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent hidden md:flex flex-col justify-end p-8 text-white">
                        <span className="text-[11px] uppercase tracking-widest font-extrabold text-amber-200/90 drop-shadow-xs">
                            Modern Restaurant Operations
                        </span>
                        <h2 className="text-[20px] font-extrabold font-['Outfit'] tracking-tight mt-1 text-white leading-tight drop-shadow-sm">
                            Seamless table service, kitchen flow & real-time analytics.
                        </h2>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
