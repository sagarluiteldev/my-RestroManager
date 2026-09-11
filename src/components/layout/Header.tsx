'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MagnifyingGlass as Search,
    Bell,
    Gear,
    CaretDown,
    Check,
    SignOut as LogOut,
    ArrowsClockwise
} from '@phosphor-icons/react';
import { useSidebarStore } from '@/stores/useSidebarStore';
import { useRoleStore, UserRole } from '@/stores/useRoleStore';
import toast from 'react-hot-toast';

interface HeaderProps {
    onCartToggle?: () => void;
    cartRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function Header({}: HeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { toggleMobile } = useSidebarStore();
    const { role, userName, setRole, logout } = useRoleStore();
    const [restaurantOpen, setRestaurantOpen] = useState(false);
    const [restaurantName, setRestaurantName] = useState('French fry restaurent');
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [roleSwitchOpen, setRoleSwitchOpen] = useState(false);

    const isDashboard = pathname === '/dashboard' || pathname === '/';

    const currentRoleLabel = 
        role === 'chef' || role === 'kitchen' ? 'Kitchen / Chef' :
        role === 'waiter' || role === 'staff' ? 'Staff / Waiter' :
        'Manager / Owner';

    const handleSwitchRole = (newRole: UserRole) => {
        setRoleSwitchOpen(false);
        setUserMenuOpen(false);
        
        // Update local role
        setRole(newRole);
        
        const label = newRole === 'chef' ? 'Kitchen (Chef)' : newRole === 'waiter' ? 'Staff (Waiter)' : 'Manager (Owner)';
        toast.success(`Switched account type to ${label}`);

        // Route to the appropriate workspace
        if (newRole === 'chef') {
            router.push('/kds');
        } else if (newRole === 'waiter') {
            router.push('/tables');
        } else {
            router.push('/dashboard');
        }
    };

    const handleLogout = async () => {
        setUserMenuOpen(false);
        try {
            const { createClient } = await import('@/lib/supabase');
            const supabase = createClient();
            await supabase.auth.signOut();
        } catch (err) {
            console.warn("Signout handling:", err);
        } finally {
            logout();
            toast.success('Logged out successfully');
            router.push('/login');
        }
    };

    return (
        <header
            className="sticky top-0 z-30 transition-colors"
            style={{
                background: '#FFFFFF',
                borderBottom: '1px solid #F3F4F6'
            }}
        >
            <div className="flex items-center justify-between h-18 px-6 lg:px-8">
                {/* Left Side: Page Title & Restaurant Subtitle */}
                <div className="flex items-center gap-3">
                    {/* Mobile Hamburger toggle */}
                    <button
                        onClick={toggleMobile}
                        className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-black/5 lg:hidden flex items-center justify-center"
                        aria-label="Toggle Navigation Menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                            <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z" />
                        </svg>
                    </button>

                    {isDashboard ? (
                        <div className="flex flex-col justify-center">
                            <h1 className="text-[24px] font-bold tracking-tight text-gray-900 font-['Outfit'] leading-tight">
                                Dashboard
                            </h1>
                            <div className="relative inline-block mt-0.5">
                                <button
                                    onClick={() => setRestaurantOpen(!restaurantOpen)}
                                    className="flex items-center gap-1.5 text-[13px] font-medium text-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    <span>{restaurantName}</span>
                                    <CaretDown className="w-3.5 h-3.5 text-gray-400" weight="bold" />
                                </button>
                                <AnimatePresence>
                                    {restaurantOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 6 }}
                                            className="absolute left-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-gray-100 py-1.5 z-40"
                                        >
                                            {['French fry restaurent', 'Downtown Bistro', 'Skyline Lounge'].map((r) => (
                                                <button
                                                    key={r}
                                                    onClick={() => {
                                                        setRestaurantName(r);
                                                        setRestaurantOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                                >
                                                    {r}
                                                    {restaurantName === r && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <h1 className="text-[20px] font-bold text-gray-900 font-['Outfit'] capitalize">
                                {pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
                            </h1>
                        </div>
                    )}
                </div>

                {/* Right Side: Search + Switch Account Type + Bell + Settings + User Chip + Logout */}
                <div className="flex items-center gap-2.5 sm:gap-3.5">
                    {/* Search Input Pill */}
                    <div className="relative w-44 xl:w-56 hidden md:block">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" weight="bold" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full rounded-2xl pl-10 pr-4 py-2 text-[13px] bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-400 text-gray-800 transition-all shadow-2xs"
                        />
                    </div>

                    {/* Switch Account Type Pill Button */}
                    <div className="relative">
                        <button
                            onClick={() => setRoleSwitchOpen(!roleSwitchOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/80 transition-all text-xs font-semibold text-gray-700 shadow-2xs cursor-pointer"
                            title="Switch Account Type / Role"
                        >
                            <ArrowsClockwise className="w-3.5 h-3.5 text-[#5c64a4]" weight="bold" />
                            <span className="hidden sm:inline">Role:</span>
                            <span className="text-[#5c64a4] font-bold">{currentRoleLabel.split(' ')[0]}</span>
                            <CaretDown className="w-3 h-3 text-gray-400" weight="bold" />
                        </button>

                        <AnimatePresence>
                            {roleSwitchOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 6 }}
                                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-gray-100 py-2 z-40"
                                >
                                    <div className="px-3.5 pb-2 mb-1 border-b border-gray-100">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Switch Account Type</p>
                                        <p className="text-xs text-gray-600 font-medium mt-0.5">Change your role & view</p>
                                    </div>
                                    {[
                                        { key: 'owner', label: 'Manager / Owner', desc: 'Full restaurant dashboard', route: '/dashboard' },
                                        { key: 'chef', label: 'Kitchen / Chef', desc: 'Order display screen (KDS)', route: '/kds' },
                                        { key: 'waiter', label: 'Staff / Waiter', desc: 'Table POS & quick billing', route: '/tables' }
                                    ].map((acc) => {
                                        const isCurrent = (role === acc.key) || (acc.key === 'owner' && role === 'admin');
                                        return (
                                            <button
                                                key={acc.key}
                                                onClick={() => handleSwitchRole(acc.key as UserRole)}
                                                className={`w-full text-left px-3.5 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer ${
                                                    isCurrent ? 'bg-blue-50/50' : ''
                                                }`}
                                            >
                                                <div>
                                                    <p className="text-xs font-bold text-gray-800">{acc.label}</p>
                                                    <p className="text-[10px] text-gray-400">{acc.desc}</p>
                                                </div>
                                                {isCurrent && <Check className="w-4 h-4 text-blue-600 shrink-0" weight="bold" />}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Notification Bell */}
                    <button
                        className="p-2 text-gray-400 hover:text-gray-700 transition-colors hidden sm:block cursor-pointer"
                        title="Notifications"
                    >
                        <Bell className="w-5 h-5" weight="regular" />
                    </button>

                    {/* Settings Gear */}
                    <Link
                        href="/settings"
                        className="p-2 text-gray-400 hover:text-gray-700 transition-colors hidden sm:block"
                        title="Settings"
                    >
                        <Gear className="w-5 h-5" weight="regular" />
                    </Link>

                    {/* User Profile Chip */}
                    <div className="relative">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-2 pl-1 cursor-pointer group"
                        >
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200 shadow-2xs">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                                    alt={userName || "Account"}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-[13px] font-semibold text-gray-800 hidden md:inline">
                                {userName || 'Anna Cat'}
                            </span>
                            <CaretDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" weight="bold" />
                        </button>

                        <AnimatePresence>
                            {userMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 6 }}
                                    className="absolute right-0 mt-2 w-52 rounded-2xl bg-white shadow-xl border border-gray-100 py-1.5 z-40"
                                >
                                    <div className="px-4 py-2.5 border-b border-gray-100">
                                        <p className="text-xs font-bold text-gray-900 truncate">{userName || 'Anna Cat'}</p>
                                        <p className="text-[10px] font-medium text-gray-400 mt-0.5 capitalize">{currentRoleLabel}</p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            setRoleSwitchOpen(true);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2">
                                            <ArrowsClockwise className="w-3.5 h-3.5 text-gray-400" weight="bold" />
                                            Switch Account Type
                                        </span>
                                    </button>

                                    <Link
                                        href="/settings/profile"
                                        onClick={() => setUserMenuOpen(false)}
                                        className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Profile Settings
                                    </Link>
                                    <Link
                                        href="/pricing"
                                        onClick={() => setUserMenuOpen(false)}
                                        className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Upgrade Plan
                                    </Link>

                                    <div className="border-t border-gray-100 my-1" />

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4" weight="bold" />
                                        Log Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Quick Logout Button directly in Header */}
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-all cursor-pointer"
                        title="Log Out"
                        aria-label="Log Out"
                    >
                        <LogOut className="w-4.5 h-4.5" weight="bold" />
                    </button>
                </div>
            </div>
        </header>
    );
}
