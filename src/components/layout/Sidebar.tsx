'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    House,
    Pizza,
    User,
    Percent,
    Storefront,
    ArrowLineRight,
    ArrowLineLeft,
    CaretDown,
    SignOut as LogOut,
} from '@phosphor-icons/react';
import { LogoIcon } from '@/components/Logo';
import toast from 'react-hot-toast';
import { useRoleStore } from '@/stores/useRoleStore';
import { useSidebarStore } from '@/stores/useSidebarStore';
import { useSubscriptionStore } from '@/stores/useSubscriptionStore';
import { useState } from 'react';

type NavChild = { label: string; href: string; isPremium?: boolean };

interface NavGroup {
    label: string;
    icon: React.ElementType;
    roles: string[];
    href?: string;
    children?: NavChild[];
}

const navGroups: NavGroup[] = [
    { label: 'Dashboard', icon: House, roles: ['owner', 'admin', 'waiter', 'chef'], href: '/dashboard' },
    {
        label: 'Menu',
        icon: Pizza,
        roles: ['owner', 'waiter'],
        children: [
            { label: 'Dishes', href: '/menu' },
            { label: 'Categories', href: '/categories' },
            { label: 'QR Builder', href: '/qr-menu' },
        ],
    },
    { label: 'Staff', icon: User, roles: ['owner', 'admin'], href: '/staff' },
    {
        label: 'Finance',
        icon: Percent,
        roles: ['owner', 'admin'],
        children: [
            { label: 'Billing / Invoices', href: '/billing' },
            { label: 'Reports', href: '/reports' },
            { label: 'Transactions', href: '/transactions' },
        ],
    },
    {
        label: 'Orders',
        icon: Storefront,
        roles: ['owner', 'waiter'],
        children: [
            { label: 'POS Terminal', href: '/pos' },
            { label: 'Tables', href: '/tables' },
            { label: 'KDS', href: '/kds' },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { role, logout } = useRoleStore();
    const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebarStore();
    const { subscription } = useSubscriptionStore();
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Menu: true, Finance: false, Orders: false });

    const hasPremium = subscription?.limits?.hasPrioritySupport || false;

    const filteredGroups = navGroups.map(g => {
        if (!g.children) return g;
        return {
            ...g,
            children: g.children.filter(c => !c.isPremium || hasPremium)
        };
    }).filter((g) => {
        if (!role) return true;
        if (role === 'owner' || role === 'admin') return true;
        return g.roles.includes(role);
    });

    const toggleGroup = (label: string) => {
        setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    const isGroupActive = (group: NavGroup) => {
        if (group.href) return pathname === group.href || pathname.startsWith(group.href + '/');
        return group.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + '/')) || false;
    };

    const handleSignOut = async () => {
        try {
            const { createClient } = await import('@/lib/supabase');
            const supabase = createClient();
            await supabase.auth.signOut();
        } catch (err) {
            console.warn("Sign out handling:", err);
        } finally {
            logout();
            toast.success('Signed out');
            router.push('/login');
        }
    };

    const sidebarWidth = collapsed ? 72 : 230;

    const renderSidebarContent = (isMobileContext: boolean) => (
        <div className="flex flex-col w-full h-full overflow-hidden bg-black text-white justify-between select-none">
            {/* Top Area: Logo + Nav Items */}
            <div className="flex flex-col w-full">
                {/* Logo (Original R logo - white) */}
                <div className={`flex items-center h-19 shrink-0 ${collapsed && !isMobileContext ? 'justify-center' : 'px-5 justify-between'}`}>
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-105">
                            <LogoIcon size={26} className="text-white" />
                        </div>
                        {(!collapsed || isMobileContext) && (
                            <span className="text-[17px] font-bold tracking-tight font-['Outfit'] text-white">
                                myRestro
                            </span>
                        )}
                    </Link>
                    {isMobileContext && (
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="p-2 text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Vertical Navigation Tabs */}
                <nav className={`py-4 ${collapsed && !isMobileContext ? 'space-y-6 px-0' : 'space-y-2 px-3'}`}>
                    {filteredGroups.map((group) => {
                        const active = isGroupActive(group);
                        const isOpen = openGroups[group.label];
                        const hasChildren = group.children && group.children.length > 0;
                        const showLabels = !collapsed || isMobileContext;

                        // Collapsed view (Icon only with left blue pill indicator on active)
                        if (!showLabels) {
                            return (
                                <div key={group.label} className="relative flex items-center justify-center w-full">
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-md bg-[#3B82F6] shadow-sm" />
                                    )}
                                    <button
                                        onClick={() => {
                                            if (group.href) router.push(group.href);
                                            else if (group.children?.length) router.push(group.children[0].href);
                                        }}
                                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                                            active
                                                ? 'text-white'
                                                : 'text-gray-500 hover:text-gray-200'
                                        }`}
                                        title={group.label}
                                    >
                                        <group.icon className="w-6 h-6" weight={active ? 'fill' : 'regular'} />
                                    </button>
                                </div>
                            );
                        }

                        // Expanded view
                        if (group.href && !hasChildren) {
                            return (
                                <Link key={group.label} href={group.href} className="block w-full" onClick={() => isMobileContext && setMobileOpen(false)}>
                                    <div
                                        className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-colors ${
                                            active ? 'bg-zinc-900 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-zinc-900/50'
                                        }`}
                                    >
                                        <group.icon className="w-5 h-5 shrink-0" weight={active ? 'fill' : 'regular'} />
                                        <span className="text-sm">{group.label}</span>
                                    </div>
                                </Link>
                            );
                        }

                        return (
                            <div key={group.label}>
                                <button
                                    onClick={() => toggleGroup(group.label)}
                                    className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl transition-colors ${
                                        active ? 'text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-zinc-900/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <group.icon className="w-5 h-5 shrink-0" weight={active ? 'fill' : 'regular'} />
                                        <span className="text-sm">{group.label}</span>
                                    </div>
                                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
                                        <CaretDown className="w-3.5 h-3.5 opacity-50" weight="bold" />
                                    </motion.div>
                                </button>
                                <AnimatePresence>
                                    {isOpen && group.children && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="ml-7 pl-3 space-y-1 border-l border-zinc-800 my-1">
                                                {group.children.map((child) => {
                                                    const childActive = pathname === child.href;
                                                    return (
                                                        <Link key={child.href} href={child.href} onClick={() => isMobileContext && setMobileOpen(false)}>
                                                            <div
                                                                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                                                    childActive ? 'text-white font-bold bg-zinc-900' : 'text-gray-400 hover:text-white'
                                                                }`}
                                                            >
                                                                {child.label}
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Area: Collapse Toggle & Log Out */}
            <div className={`pb-6 ${collapsed && !isMobileContext ? 'flex flex-col items-center gap-4' : 'px-4 space-y-2'}`}>
                {(!collapsed || isMobileContext) ? (
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Log Out</span>
                    </button>
                ) : (
                    <button
                        onClick={handleSignOut}
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                        title="Log Out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                )}

                {/* Bottom Collapse / Expand Button (matching the arrow in the screenshot) */}
                <button
                    onClick={toggleCollapsed}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? (
                        <ArrowLineRight className="w-5 h-5" weight="bold" />
                    ) : (
                        <ArrowLineLeft className="w-5 h-5" weight="bold" />
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.div
                animate={{ width: sidebarWidth }}
                transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
                className="hidden lg:flex fixed left-0 top-0 h-screen z-40 overflow-hidden flex-col shadow-xl"
                style={{ background: '#000000' }}
            >
                {renderSidebarContent(false)}
            </motion.div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
                            className="fixed left-0 top-0 h-screen z-50 flex flex-col lg:hidden w-64 bg-black"
                        >
                            {renderSidebarContent(true)}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
