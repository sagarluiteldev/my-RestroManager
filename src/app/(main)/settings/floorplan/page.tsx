'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GridFour,
    Plus,
    Users,
    Trash,
    PencilSimple,
    Clock,
    X,
    ArrowCounterClockwise,
} from '@phosphor-icons/react';
import { useDataStore } from '@/stores/useDataStore';
import { LocalTable } from '@/lib/db/localDb';
import toast, { Toaster } from 'react-hot-toast';

export default function SettingsFloorplanPage() {
    const { tables, addTable, updateTable, deleteTable, vacateTable, initData } = useDataStore();

    useEffect(() => {
        initData();
    }, [initData]);

    const [selectedSection, setSelectedSection] = useState<string>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<LocalTable | null>(null);

    // Compute highest existing table integer
    const nextTableInt = useMemo(() => {
        if (tables.length === 0) return 1;
        const nums = tables.map((t) => parseInt(t.table_number.replace(/\D/g, ''), 10) || 0);
        return Math.max(...nums) + 1;
    }, [tables]);

    // Add Form State
    const [newTableNumber, setNewTableNumber] = useState<number>(nextTableInt);
    const [newCapacity, setNewCapacity] = useState<number>(4);
    const [newSection, setNewSection] = useState<string>('Main Dining');
    const [customSection, setCustomSection] = useState<string>('');

    // Available sections
    const sections = useMemo(() => {
        const set = new Set<string>();
        tables.forEach((t) => {
            if (t.section) set.add(t.section);
        });
        return Array.from(set);
    }, [tables]);

    // Filtered tables
    const filteredTables = useMemo(() => {
        if (selectedSection === 'all') return tables;
        return tables.filter((t) => t.section === selectedSection);
    }, [tables, selectedSection]);

    // Statistics
    const totalCapacity = useMemo(() => tables.reduce((sum, t) => sum + (t.capacity || t.seats || 2), 0), [tables]);
    const occupiedCount = useMemo(() => tables.filter((t) => t.status === 'occupied').length, [tables]);
    const availableCount = useMemo(() => tables.filter((t) => t.status === 'vacant').length, [tables]);

    const handleCreateTable = async (e: React.FormEvent) => {
        e.preventDefault();
        const sectionFinal = newSection === 'custom' ? customSection.trim() || 'General' : newSection;
        const formattedTableNum = `T${newTableNumber}`;

        // Check if table number already exists
        if (tables.some((t) => t.table_number === formattedTableNum || t.table_number === newTableNumber.toString())) {
            toast.error(`Table ${newTableNumber} already exists.`);
            return;
        }

        try {
            await addTable({
                table_number: formattedTableNum,
                label: `Table ${newTableNumber}`,
                capacity: newCapacity,
                seats: newCapacity,
                section: sectionFinal,
                status: 'vacant',
            });
            toast.success(`Table ${formattedTableNum} added to floorplan!`);
            setIsAddModalOpen(false);
            setNewTableNumber(newTableNumber + 1);
            setCustomSection('');
        } catch (err) {
            console.error('Failed to add table', err);
            toast.error('Failed to create table');
        }
    };

    const handleUpdateTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTable) return;

        try {
            await updateTable(editingTable.id, {
                capacity: editingTable.capacity,
                seats: editingTable.capacity,
                section: editingTable.section,
            });
            toast.success(`Table ${editingTable.table_number} updated!`);
            setEditingTable(null);
        } catch (err) {
            console.error('Failed to update table', err);
            toast.error('Failed to update table');
        }
    };

    const handleDelete = async (id: string, num: string) => {
        if (confirm(`Are you sure you want to remove Table ${num}?`)) {
            await deleteTable(id);
            toast.success(`Table ${num} removed`);
        }
    };

    const handleVacate = async (id: string, num: string) => {
        await vacateTable(id);
        toast.success(`Table ${num} liberated and marked vacant`);
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Floorplan & Dining Room Layout
                    </h2>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Manage dining tables, seating capacity, sections, and live occupancy status.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setNewTableNumber(nextTableInt);
                        setIsAddModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:brightness-105 active:scale-98 transition-all shrink-0"
                    style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                >
                    <Plus className="w-4 h-4" weight="bold" />
                    <span>Add New Table</span>
                </button>
            </div>

            {/* Metrics Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Total Tables</span>
                        <GridFour className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="text-2xl font-black font-mono mt-2" style={{ color: 'var(--text-primary)' }}>
                        {tables.length}
                    </div>
                </div>

                <div className="p-4 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Total Seating</span>
                        <Users className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="text-2xl font-black font-mono mt-2 text-white">
                        {totalCapacity} <span className="text-xs text-white/50 font-normal">guests</span>
                    </div>
                </div>

                <div className="p-4 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Available (Vacant)</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="text-2xl font-black font-mono mt-2 text-emerald-400">
                        {availableCount}
                    </div>
                </div>

                <div className="p-4 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Occupied</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    </div>
                    <div className="text-2xl font-black font-mono mt-2 text-amber-400">
                        {occupiedCount}
                    </div>
                </div>
            </div>

            {/* Section Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                <button
                    onClick={() => setSelectedSection('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedSection === 'all'
                            ? 'bg-white text-black font-bold shadow'
                            : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                    }`}
                >
                    All Sections ({tables.length})
                </button>
                {sections.map((sec) => (
                    <button
                        key={sec}
                        onClick={() => setSelectedSection(sec)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                            selectedSection === sec
                                ? 'bg-white text-black font-bold shadow'
                                : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                        }`}
                    >
                        {sec} ({tables.filter((t) => t.section === sec).length})
                    </button>
                ))}
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTables.map((table) => {
                    const isOccupied = table.status === 'occupied';

                    return (
                        <div
                            key={table.id}
                            className="p-5 rounded-2xl border space-y-4 relative transition-all hover:border-white/20"
                            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                        >
                            {/* Table Card Top */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black font-mono text-base shadow-inner ${
                                            isOccupied
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        }`}
                                    >
                                        {table.table_number.startsWith('T') ? table.table_number : `T${table.table_number}`}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {table.label || `Table ${table.table_number}`}
                                        </h3>
                                        <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                            {table.section || 'Main Dining'}
                                        </p>
                                    </div>
                                </div>

                                <span
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                        isOccupied
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    }`}
                                >
                                    {table.status}
                                </span>
                            </div>

                            {/* Details Info */}
                            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/8">
                                <span className="text-white/50 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" weight="bold" />
                                    <span>Capacity: <strong>{table.capacity || table.seats || 2}</strong> seats</span>
                                </span>

                                {isOccupied && table.occupied_since && (
                                    <span className="text-amber-300/80 flex items-center gap-1 font-mono text-[10px]">
                                        <Clock className="w-3 h-3" />
                                        <span>Active order</span>
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2 pt-1">
                                {isOccupied && (
                                    <button
                                        onClick={() => handleVacate(table.id, table.table_number)}
                                        className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all font-semibold"
                                        title="Free up table"
                                    >
                                        <ArrowCounterClockwise className="w-3 h-3" />
                                        Free Table
                                    </button>
                                )}

                                <button
                                    onClick={() => setEditingTable(table)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
                                    title="Edit Table"
                                >
                                    <PencilSimple className="w-3.5 h-3.5" />
                                </button>

                                <button
                                    onClick={() => handleDelete(table.id, table.table_number)}
                                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                    title="Delete Table"
                                >
                                    <Trash className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Table Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-5"
                            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <h3 className="text-base font-bold text-white font-['Outfit']">Add New Dining Table</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-white/50 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTable} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-white/70 block mb-1">
                                        Table Number *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={newTableNumber}
                                        onChange={(e) => setNewTableNumber(parseInt(e.target.value, 10) || 1)}
                                        className="w-full rounded-xl px-3 py-2 text-xs font-mono font-bold bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-white/70 block mb-1">
                                        Seating Capacity *
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[2, 4, 6, 8].map((cap) => (
                                            <button
                                                key={cap}
                                                type="button"
                                                onClick={() => setNewCapacity(cap)}
                                                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                                                    newCapacity === cap
                                                        ? 'bg-white text-black shadow'
                                                        : 'bg-white/5 text-white/70 border border-white/10'
                                                }`}
                                            >
                                                {cap} Seats
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-white/70 block mb-1">
                                        Dining Room / Section
                                    </label>
                                    <select
                                        value={newSection}
                                        onChange={(e) => setNewSection(e.target.value)}
                                        className="w-full rounded-xl px-3 py-2 text-xs bg-white/5 border border-white/10 text-white focus:outline-none"
                                    >
                                        <option value="Main Dining" className="bg-[#18181b]">Main Dining Room</option>
                                        <option value="Terrace Garden" className="bg-[#18181b]">Terrace Garden</option>
                                        <option value="Bar & High Tops" className="bg-[#18181b]">Bar & High Tops</option>
                                        <option value="VIP Lounge" className="bg-[#18181b]">VIP Lounge</option>
                                        <option value="custom" className="bg-[#18181b]">+ Create Custom Section...</option>
                                    </select>
                                </div>

                                {newSection === 'custom' && (
                                    <div>
                                        <label className="text-xs font-semibold text-white/70 block mb-1">
                                            Custom Section Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Rooftop Pergola"
                                            value={customSection}
                                            onChange={(e) => setCustomSection(e.target.value)}
                                            className="w-full rounded-xl px-3 py-2 text-xs bg-white/5 border border-white/10 text-white focus:outline-none"
                                        />
                                    </div>
                                )}

                                <div className="pt-2 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:bg-white/5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-white/90 shadow-lg"
                                    >
                                        Create Table
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Table Modal */}
            <AnimatePresence>
                {editingTable && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingTable(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-5"
                            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <h3 className="text-base font-bold text-white font-['Outfit']">
                                    Edit Table {editingTable.table_number}
                                </h3>
                                <button onClick={() => setEditingTable(null)} className="text-white/50 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateTable} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-white/70 block mb-1">
                                        Seating Capacity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        required
                                        value={editingTable.capacity || editingTable.seats || 2}
                                        onChange={(e) => {
                                            const c = parseInt(e.target.value, 10) || 2;
                                            setEditingTable({ ...editingTable, capacity: c, seats: c });
                                        }}
                                        className="w-full rounded-xl px-3 py-2 text-xs font-mono font-bold bg-white/5 border border-white/10 text-white focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-white/70 block mb-1">
                                        Dining Room / Section
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editingTable.section || 'Main Dining'}
                                        onChange={(e) => setEditingTable({ ...editingTable, section: e.target.value })}
                                        className="w-full rounded-xl px-3 py-2 text-xs bg-white/5 border border-white/10 text-white focus:outline-none"
                                    />
                                </div>

                                <div className="pt-2 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingTable(null)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:bg-white/5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-white/90 shadow-lg"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
