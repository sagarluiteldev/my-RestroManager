'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrdersStore } from '@/stores/useOrdersStore';
import {
    Receipt,
    Wallet,
    TrendUp,
    DotsThree,
    CaretDown,
    ArrowRight,
    Star,
    Percent,
} from '@phosphor-icons/react';

export default function DashboardPage() {
    const router = useRouter();
    const orders = useOrdersStore((s) => s.orders);

    // Live metrics calculation with fallback to reference screenshot values
    const todayOrders = orders.filter(
        (o) => new Date(o.createdAt).toDateString() === new Date().toDateString()
    );
    const todaysRevenue = todayOrders
        .filter((o) => o.status === 'completed')
        .reduce((sum, o) => sum + o.total, 0);

    const formattedSales = todaysRevenue > 0 ? `$ ${todaysRevenue.toLocaleString()}` : '$ 1,231';
    const formattedExpense = todaysRevenue > 0 ? `$ ${Math.round(todaysRevenue * 0.35).toLocaleString()}` : '$ 4,231';
    const formattedRevenue = todaysRevenue > 0 ? `$ ${Math.round(todaysRevenue * 0.65).toLocaleString()}` : '$ 2,221';
    const formattedTicker = todaysRevenue > 0 ? `$ ${(todaysRevenue * 0.77).toFixed(2)}` : '$ 950.00';

    // Interactive controls
    const [timeRange, setTimeRange] = useState('Weekly');
    const [timeRangeOpen, setTimeRangeOpen] = useState(false);
    const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string; val: number } | null>(null);

    // Heatmap data exactly matching reference screenshot
    const heatDays = ['Fri', 'Sun', 'Mon', 'Tue'];
    const heatHours = ['1 am', '2 am', '3 am', '4 am', '5 am'];
    const heatmapValues: Record<string, number[]> = {
        Fri: [12, 22, 38, 48, 20],
        Sun: [8, 16, 36, 52, 22],
        Mon: [14, 34, 50, 88, 30], // Mon 4 am is highlighted with "88"
        Tue: [10, 20, 38, 46, 24]
    };

    const getCellBg = (val: number, isHighlight: boolean) => {
        if (isHighlight) return '#3B82F6';
        if (val > 45) return '#93C5FD';
        if (val > 30) return '#BAE6FD';
        if (val > 15) return '#E0F2FE';
        return '#F0F9FF';
    };

    // Employee List exactly matching reference screenshot
    const employees = [
        {
            name: 'Adam Smith',
            role: 'Sales manager',
            rating: '5',
            hours: '35 hr/Week',
            avatarImg: '/images/avatar_emp_1.png'
        },
        {
            name: 'MC Carthy',
            role: 'Cash manager',
            rating: '5',
            hours: '45 hr/Week',
            avatarImg: '/images/avatar_emp_2.png'
        },
        {
            name: 'Will Hunger',
            role: 'Sales man',
            rating: '4.5',
            hours: '34 hr/Week',
            avatarImg: '/images/avatar_emp_3.png'
        },
        {
            name: 'Jack Sulivan',
            role: 'Manager',
            rating: '5',
            hours: '5 hr/Week',
            avatarImg: '/images/avatar_emp_4.png'
        }
    ];

    // Recent Order Table items exactly matching reference screenshot
    const foodItems = [
        {
            name: 'Pizza',
            price: '$ 32.23',
            iconImg: '/images/food_icon_1.png',
            totalItem: '12 k PC',
            totalSale: '$ 9.6 k',
            remaining: '11.11 k'
        },
        {
            name: 'Burger',
            price: '$ 12.87',
            iconImg: '/images/food_icon_2.png',
            totalItem: '23 k PC',
            totalSale: '$ 11.12 k',
            remaining: '12.12 k'
        },
        {
            name: 'Cake',
            price: '$ 32.87',
            iconImg: '/images/food_icon_3.png',
            totalItem: '1.23 k PC',
            totalSale: '$ 1.2 k',
            remaining: '43.54 k'
        },
        {
            name: 'Salad',
            price: '$ 43.87',
            iconImg: '/images/food_icon_4.png',
            totalItem: '2 k PC',
            totalSale: '$ 9.3 k',
            remaining: '12.12 k'
        }
    ];

    const cardAnim = (delay = 0) => ({
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { delay, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }
    });

    return (
        <div className="w-full px-2 sm:px-4 lg:px-6 pb-6 select-none flex flex-col justify-between min-h-[calc(100vh-105px)]">
            {/* ─── TWO-COLUMN MASTER GRID (Left: Overview+Employee | Right: CustomerStats+Banner+RecentOrder) ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-7 items-stretch flex-1">
                {/* ══════════════ LEFT COLUMN: Overview (Top) + Employee (Bottom) ══════════════ */}
                <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between space-y-6">
                    {/* 1. Overview Section */}
                    <motion.div {...cardAnim(0.04)} className="flex flex-col">
                        <div className="flex items-center justify-between mb-3.5">
                            <h2 className="text-[22px] xl:text-[24px] font-bold text-gray-900 font-['Outfit'] tracking-tight">
                                Overview
                            </h2>
                            <button
                                onClick={() => router.push('/reports')}
                                className="px-3.5 py-1.5 text-[12px] xl:text-[13px] font-medium text-gray-500 hover:text-gray-900 bg-white border border-gray-200/90 rounded-xl hover:border-gray-300 transition-colors shadow-2xs cursor-pointer"
                            >
                                View All
                            </button>
                        </div>

                        {/* 3 Pastel Stat Cards */}
                        <div className="grid grid-cols-3 gap-3.5 xl:gap-4">
                            {/* Card 1: Total Sales (Soft Baby Blue #DEF0FF) */}
                            <div
                                className="rounded-3xl p-4 xl:p-5 flex flex-col justify-between min-h-35 xl:min-h-38.75 transition-transform hover:-translate-y-0.5 shadow-2xs"
                                style={{ background: '#DEF0FF' }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="w-9 h-9 rounded-full bg-[#111827] text-white flex items-center justify-center shadow-xs">
                                        <Receipt className="w-4.5 h-4.5" weight="fill" />
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-700 transition-colors p-1">
                                        <DotsThree className="w-6 h-6" weight="bold" />
                                    </button>
                                </div>
                                <div>
                                    <p className="text-[12px] xl:text-[13px] font-medium text-gray-500 mb-1">Total Sales</p>
                                    <p className="text-[22px] xl:text-[26px] font-extrabold text-gray-900 tracking-tight leading-none">
                                        {formattedSales}
                                    </p>
                                </div>
                            </div>

                            {/* Card 2: Expense (Soft Pastel Peach #FFE8DB) */}
                            <div
                                className="rounded-3xl p-4 xl:p-5 flex flex-col justify-between min-h-35 xl:min-h-38.75 transition-transform hover:-translate-y-0.5 shadow-2xs"
                                style={{ background: '#FFE8DB' }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="w-9 h-9 rounded-full bg-[#111827] text-white flex items-center justify-center shadow-xs">
                                        <Wallet className="w-4.5 h-4.5" weight="fill" />
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-700 transition-colors p-1">
                                        <DotsThree className="w-6 h-6" weight="bold" />
                                    </button>
                                </div>
                                <div>
                                    <p className="text-[12px] xl:text-[13px] font-medium text-gray-500 mb-1">Expense</p>
                                    <p className="text-[22px] xl:text-[26px] font-extrabold text-gray-900 tracking-tight leading-none">
                                        {formattedExpense}
                                    </p>
                                </div>
                            </div>

                            {/* Card 3: Revenue (Soft Butter Yellow #FFFAC7) */}
                            <div
                                className="rounded-3xl p-4 xl:p-5 flex flex-col justify-between min-h-35 xl:min-h-38.75 transition-transform hover:-translate-y-0.5 shadow-2xs"
                                style={{ background: '#FFFAC7' }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="w-9 h-9 rounded-full bg-[#111827] text-white flex items-center justify-center shadow-xs">
                                        <TrendUp className="w-4.5 h-4.5" weight="bold" />
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-700 transition-colors p-1">
                                        <DotsThree className="w-6 h-6" weight="bold" />
                                    </button>
                                </div>
                                <div>
                                    <p className="text-[12px] xl:text-[13px] font-medium text-gray-500 mb-1">Revenue</p>
                                    <p className="text-[22px] xl:text-[26px] font-extrabold text-gray-900 tracking-tight leading-none">
                                        {formattedRevenue}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sales Sparkline Card */}
                        <div className="mt-4 bg-white rounded-3xl border border-gray-100 p-4 px-6 flex items-center justify-between shadow-2xs relative overflow-hidden h-22 xl:h-24">
                            <div className="flex items-center gap-3.5 shrink-0 z-10">
                                <div className="w-3 h-3 rounded-full bg-[#10B981] shrink-0 shadow-sm" />
                                <div>
                                    <p className="text-[18px] xl:text-[21px] font-bold text-gray-900 tracking-tight leading-tight">
                                        {formattedTicker}
                                    </p>
                                    <p className="text-[12px] xl:text-[13px] font-medium text-gray-400 leading-tight">Sales</p>
                                </div>
                            </div>

                            {/* SVG Bezier curve line matching reference screenshot */}
                            <div className="flex-1 ml-6 h-full relative">
                                <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="greenSparkGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d="M 0,24 C 25,14 55,30 85,24 C 115,18 140,8 170,16 C 185,20 195,14 200,12 L 200,40 L 0,40 Z"
                                        fill="url(#greenSparkGrad)"
                                    />
                                    <path
                                        d="M 0,24 C 25,14 55,30 85,24 C 115,18 140,8 170,16 C 185,20 195,14 200,12"
                                        fill="none"
                                        stroke="#10B981"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                    <circle cx="200" cy="12" r="3.5" fill="#10B981" />
                                </svg>
                            </div>
                        </div>
                    </motion.div>

                    {/* 2. Employee Section (Directly under Overview) */}
                    <motion.div {...cardAnim(0.08)} className="flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-3.5">
                            <h2 className="text-[22px] xl:text-[24px] font-bold text-gray-900 font-['Outfit'] tracking-tight">
                                Employee
                            </h2>
                            <button
                                onClick={() => router.push('/staff')}
                                className="px-3.5 py-1.5 text-[12px] xl:text-[13px] font-medium text-gray-500 hover:text-gray-900 bg-white border border-gray-200/90 rounded-xl hover:border-gray-300 transition-colors shadow-2xs cursor-pointer"
                            >
                                View All
                            </button>
                        </div>

                        {/* Employee Card */}
                        <div className="bg-white rounded-3xl border border-gray-100 p-5 xl:p-6 shadow-2xs space-y-4 xl:space-y-5 flex-1 flex flex-col justify-around">
                            {employees.map((emp, idx) => (
                                <div
                                    key={emp.name}
                                    className={`flex items-center justify-between py-1.5 xl:py-2 ${
                                        idx !== employees.length - 1 ? 'border-b border-gray-50 pb-3 xl:pb-4' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5 xl:gap-4">
                                        <div className="w-11 h-11 xl:w-12 xl:h-12 rounded-full overflow-hidden shrink-0 border border-gray-100 shadow-2xs">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={emp.avatarImg}
                                                alt={emp.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[14px] xl:text-[15px] font-bold text-gray-900">
                                                    {emp.name}
                                                </span>
                                                <span className="text-[13px] xl:text-[14px] font-bold text-gray-700 ml-0.5">
                                                    {emp.rating}
                                                </span>
                                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" weight="fill" />
                                            </div>
                                            <p className="text-[12px] xl:text-[13px] font-medium text-gray-400 mt-0.5">
                                                {emp.role}
                                            </p>
                                        </div>
                                    </div>

                                    <span className="text-[13px] xl:text-[14px] font-bold text-gray-600">
                                        {emp.hours}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* ══════════════ RIGHT COLUMN: (Customer Stat's + Banner) Top + Recent Order Bottom ══════════════ */}
                <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between space-y-6">
                    {/* Top Pair: Customer Stat's (left) + Try premium version (right) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 xl:gap-6 items-start">
                        {/* 3. Customer Stat's */}
                        <motion.div {...cardAnim(0.1)} className="flex flex-col">
                            <div className="flex items-center justify-between mb-3.5 h-8.5">
                                <h2 className="text-[22px] xl:text-[24px] font-bold text-gray-900 font-['Outfit'] tracking-tight">
                                    Customer Stat&apos;s
                                </h2>
                                <div className="relative">
                                    <button
                                        onClick={() => setTimeRangeOpen(!timeRangeOpen)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] xl:text-[13px] font-medium text-gray-500 hover:text-gray-900 bg-white border border-gray-200/90 rounded-xl hover:border-gray-300 transition-colors shadow-2xs cursor-pointer"
                                    >
                                        <span>{timeRange}</span>
                                        <CaretDown className="w-3.5 h-3.5 text-gray-400" weight="bold" />
                                    </button>
                                    <AnimatePresence>
                                        {timeRangeOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 6 }}
                                                className="absolute right-0 mt-1.5 w-32 rounded-xl bg-white shadow-xl border border-gray-100 py-1.5 z-30"
                                            >
                                                {['Daily', 'Weekly', 'Monthly'].map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => {
                                                            setTimeRange(t);
                                                            setTimeRangeOpen(false);
                                                        }}
                                                        className="w-full text-left px-3.5 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50"
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Customer Heatmap Card */}
                            <div className="bg-white rounded-3xl border border-gray-100 p-5 xl:p-6 shadow-2xs flex flex-col justify-between min-h-62.5 xl:min-h-68.75">
                                <div className="space-y-3 xl:space-y-3.5">
                                    {heatDays.map((day) => (
                                        <div key={day} className="flex items-center gap-3">
                                            <span className="w-8 text-[12px] xl:text-[13px] font-medium text-gray-400 text-right shrink-0">
                                                {day}
                                            </span>
                                            <div className="grid grid-cols-5 gap-2 xl:gap-2.5 flex-1">
                                                {heatHours.map((hour, hIdx) => {
                                                    const val = heatmapValues[day][hIdx];
                                                    const isHighlighted = day === 'Mon' && hour === '4 am';
                                                    const bg = getCellBg(val, isHighlighted);

                                                    return (
                                                        <div
                                                            key={`${day}-${hour}`}
                                                            onMouseEnter={() => setHoveredCell({ row: day, col: hour, val })}
                                                            onMouseLeave={() => setHoveredCell(null)}
                                                            className={`h-8.5 xl:h-9.5 rounded-[7px] flex items-center justify-center transition-all duration-150 cursor-pointer ${
                                                                isHighlighted
                                                                    ? 'bg-[#3B82F6] text-white shadow-xs font-extrabold text-[13px] xl:text-[14px]'
                                                                    : 'hover:opacity-80'
                                                            }`}
                                                            style={{ background: bg }}
                                                        >
                                                            {isHighlighted ? '88' : null}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Hour labels along bottom */}
                                <div className="flex items-center gap-3 pt-2">
                                    <span className="w-8 shrink-0" />
                                    <div className="grid grid-cols-5 gap-2 xl:gap-2.5 flex-1 text-center">
                                        {heatHours.map((hour) => (
                                            <span key={hour} className="text-[11px] xl:text-[12px] font-medium text-gray-400">
                                                {hour}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {hoveredCell && (
                                    <div className="text-[11px] text-gray-500 text-center font-medium mt-1">
                                        {hoveredCell.row} {hoveredCell.col}: {hoveredCell.val} customers
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* 4. Try premium version Card */}
                        <motion.div {...cardAnim(0.14)} className="flex flex-col">
                            <div className="h-8.5 mb-3.5" /> {/* Aligns card top with Customer Stat's */}
                            <div className="bg-white rounded-3xl border border-gray-100 p-4 xl:p-5 shadow-2xs flex flex-col justify-between min-h-62.5 xl:min-h-68.75 relative overflow-hidden group">
                                {/* Real Chef Illustration from reference mockup */}
                                <div className="relative w-full h-36.25 xl:h-41.25 flex items-center justify-center overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src="/images/dashboard-chef-real.png"
                                        alt="Chef Tasting Food"
                                        className="h-full max-h-36.25 xl:max-h-41.25 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>

                                {/* Bottom Yellow CTA Strip (#FFFAC7) */}
                                <div
                                    onClick={() => router.push('/pricing')}
                                    className="rounded-[20px] p-3 xl:p-3.5 px-4 flex items-center justify-between cursor-pointer transition-all hover:brightness-95 active:scale-[0.98]"
                                    style={{ background: '#FFFAC7' }}
                                >
                                    <div className="pr-1.5 min-w-0">
                                        <p className="text-[13px] xl:text-[14px] font-bold text-gray-900 leading-tight truncate">
                                            Try premium version
                                        </p>
                                        <p className="text-[11px] xl:text-[12px] font-medium text-gray-600 leading-tight mt-0.5 truncate">
                                            You will get more feature here.
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#111827] text-white flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:translate-x-0.5">
                                        <ArrowRight className="w-4 h-4" weight="bold" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* 5. Recent Order Table (Directly under Customer Stats & Banner) */}
                    <motion.div {...cardAnim(0.18)} className="flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-3.5">
                            <h2 className="text-[22px] xl:text-[24px] font-bold text-gray-900 font-['Outfit'] tracking-tight">
                                Recent Order
                            </h2>
                            <button
                                onClick={() => router.push('/billing')}
                                className="px-3.5 py-1.5 text-[12px] xl:text-[13px] font-medium text-gray-500 hover:text-gray-900 bg-white border border-gray-200/90 rounded-xl hover:border-gray-300 transition-colors shadow-2xs cursor-pointer"
                            >
                                View All
                            </button>
                        </div>

                        {/* Food-centric Table Card */}
                        <div className="bg-white rounded-3xl border border-gray-100 p-5 xl:p-6 shadow-2xs overflow-x-auto hide-scrollbar flex-1 flex flex-col justify-around">
                            <table className="w-full text-left border-collapse min-w-125">
                                <thead>
                                    <tr className="text-[12px] xl:text-[13px] font-normal text-gray-400 border-b border-gray-100">
                                        <th className="pb-3.5 xl:pb-4 font-normal">Food name</th>
                                        <th className="pb-3.5 xl:pb-4 font-normal">Total Iteam</th>
                                        <th className="pb-3.5 xl:pb-4 font-normal">Total sale</th>
                                        <th className="pb-3.5 xl:pb-4 font-normal text-right pr-2">Remaining Iteam</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {foodItems.map((item) => (
                                        <tr
                                            key={item.name}
                                            className="text-[14px] xl:text-[15px] hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="py-3 xl:py-3.5">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-full overflow-hidden shrink-0 border border-gray-100 shadow-2xs">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={item.iconImg}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 leading-tight text-[14px] xl:text-[15px]">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-[12px] xl:text-[13px] font-medium text-gray-400 leading-tight mt-0.5">
                                                            {item.price}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3 xl:py-3.5 font-bold text-gray-900 text-[14px] xl:text-[15px]">
                                                {item.totalItem}
                                            </td>

                                            <td className="py-3 xl:py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] shrink-0 font-bold">
                                                        <Percent className="w-3 h-3" weight="bold" />
                                                    </div>
                                                    <span className="font-bold text-gray-900 text-[14px] xl:text-[15px]">
                                                        {item.totalSale}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-3 xl:py-3.5 font-bold text-gray-900 text-[14px] xl:text-[15px] text-right pr-2">
                                                {item.remaining}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
