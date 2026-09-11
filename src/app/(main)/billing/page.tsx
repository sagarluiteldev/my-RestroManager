'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Printer as Printer,
    Users as Users,
    Scissors as SplitSquareVertical,
    Receipt as Receipt,
    X as X,
    Check as Check
} from '@phosphor-icons/react';
import { useOrdersStore, KitchenOrder } from '@/stores/useOrdersStore';
import { useTableStore } from '@/stores/useTableStore';
import { useDataStore } from '@/stores/useDataStore';
import toast from 'react-hot-toast';
import { printReceipt } from '@/lib/printUtils';
import { PrintOrder } from '@/components/ReceiptPrinter';

const VAT_RATE = 0.13;
const SERVICE_CHARGE_RATE = 0.10;

interface BillData {
    order: KitchenOrder;
    subtotal: number;
    serviceCharge: number;
    vat: number;
    grandTotal: number;
}

function getItemDetails(item: any) {
    const name = item.menu_item?.name || item.name || 'Menu Item';
    const price = typeof item.menu_item?.price === 'number'
        ? item.menu_item.price
        : typeof item.price === 'number'
            ? item.price
            : 0;
    const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
    return { name, price, quantity };
}

export default function BillingPage() {
    const { orders, updateOrderStatus } = useOrdersStore();
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [splitMode, setSplitMode] = useState<'none' | 'equal' | 'by_item'>('none');
    const [splitCount, setSplitCount] = useState(2);
    const [showBill, setShowBill] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Fonepay' | 'eSewa'>('Cash');

    const billableOrders = orders.filter((o) => o.status === 'ready' || o.status === 'completed');
    const selectedOrder = orders.find((o) => o.id === selectedOrderId);

    const billData: BillData | null = useMemo(() => {
        if (!selectedOrder) return null;
        const subtotal = (selectedOrder.items || []).reduce((s, i) => {
            const { price, quantity } = getItemDetails(i);
            return s + price * quantity;
        }, 0);
        const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
        const vat = (subtotal + serviceCharge) * VAT_RATE;
        const grandTotal = subtotal + serviceCharge + vat;
        return { order: selectedOrder, subtotal, serviceCharge, vat, grandTotal };
    }, [selectedOrder]);

    const handlePrint = () => {
        if (!billData) return;
        
        const printPayload: PrintOrder = {
            id: billData.order.id,
            type: billData.order.type as 'Dine-In' | 'Takeaway' | 'Delivery',
            table_number: billData.order.tableNumber.toString(),
            items: (billData.order.items || []).map(item => {
                const { name, price, quantity } = getItemDetails(item);
                return { name, quantity, price };
            }),
            subtotal: billData.subtotal,
            tax: billData.vat,
            discount: 0,
            total: billData.grandTotal,
            date: new Date(billData.order.createdAt)
        };

        printReceipt(printPayload);
        toast.success('Bill sent to printer');
        setShowBill(false);
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-lg font-bold font-['Outfit']" style={{ color: 'var(--text-primary)' }}>Billing</h1>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{billableOrders.length} orders ready for billing</p>
            </div>

            {/* Order List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {orders.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center py-16">
                        <Receipt className="w-10 h-10 mb-2" weight="fill" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No orders to bill</p>
                    </div>
                ) : (
                    orders.map((order) => {
                        const sub = (order.items || []).reduce((s, i) => {
                            const { price, quantity } = getItemDetails(i);
                            return s + price * quantity;
                        }, 0);
                        const total = sub + (sub * SERVICE_CHARGE_RATE) + ((sub + sub * SERVICE_CHARGE_RATE) * VAT_RATE);
                        const isSelected = selectedOrderId === order.id;
                        return (
                            <motion.button key={order.id} whileTap={{ scale: 0.98 }}
                                onClick={() => { setSelectedOrderId(order.id); setShowBill(true); setSplitMode('none'); }}
                                className="rounded-xl p-3.5 text-left transition-all"
                                style={{
                                    background: 'var(--bg-card)',
                                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                                }}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                            style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>T{order.tableNumber}</div>
                                        <div>
                                            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Table {order.tableNumber}</p>
                                            <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{(order.items || []).length} items</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                        style={{
                                            background: order.status === 'ready' ? 'rgba(46,204,113,0.1)' :
                                                order.status === 'completed' ? 'rgba(77,84,102,0.08)' :
                                                    order.status === 'preparing' ? 'rgba(91,155,213,0.1)' : 'rgba(232,168,56,0.1)',
                                            color: order.status === 'ready' ? 'var(--success)' :
                                                order.status === 'completed' ? 'var(--text-muted)' :
                                                    order.status === 'preparing' ? 'var(--info)' : 'var(--warning)',
                                        }}>{order.status}</span>
                                </div>
                                <div className="space-y-0.5">
                                    {(order.items || []).slice(0, 3).map((item, i) => {
                                        const { name, price, quantity } = getItemDetails(item);
                                        return (
                                            <div key={i} className="flex justify-between text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                                                <span className="truncate mr-2">{name} ×{quantity}</span>
                                                <span className="shrink-0">Rs. {(price * quantity).toFixed(0)}</span>
                                            </div>
                                        );
                                    })}
                                    {(order.items || []).length > 3 && (
                                        <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>+{(order.items || []).length - 3} more</p>
                                    )}
                                </div>
                                <div className="mt-2 pt-2 flex justify-between text-xs font-bold" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                    <span>Total (incl. VAT)</span>
                                    <span>Rs. {total.toFixed(0)}</span>
                                </div>
                            </motion.button>
                        );
                    })
                )}
            </div>

            {/* Bill Viewing Drawer */}
            <AnimatePresence>
                {showBill && billData && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowBill(false)} className="fixed inset-0 bg-black/40 z-50" />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed right-0 top-0 bottom-0 w-96 z-50 overflow-y-auto"
                            style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)' }}
                        >
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-bold font-['Outfit']" style={{ color: 'var(--text-primary)' }}>Bill — Table {billData.order.tableNumber}</h2>
                                    <button onClick={() => setShowBill(false)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" weight="bold" /></button>
                                </div>

                                {/* Bill Receipt */}
                                <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                    <div className="text-center pb-3" style={{ borderBottom: '1px dashed var(--border)' }}>
                                        <p className="text-sm font-bold font-['Outfit']" style={{ color: 'var(--text-primary)' }}>myRestro Manager</p>
                                        <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Kathmandu, Nepal · VAT No: 123456789</p>
                                        <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                                            {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-[10px] font-medium mt-1" style={{ color: 'var(--accent-text)' }}>
                                            Table {billData.order.tableNumber} · Bill #{billData.order.id.slice(-6)}
                                        </p>
                                    </div>

                                    {/* Items */}
                                    <div className="space-y-1">
                                        <div className="grid grid-cols-12 text-[9px] font-semibold uppercase tracking-wider pb-1"
                                            style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                                            <span className="col-span-6">Item</span>
                                            <span className="col-span-2 text-center">Qty</span>
                                            <span className="col-span-2 text-right">Rate</span>
                                            <span className="col-span-2 text-right">Amount</span>
                                        </div>
                                        {(billData.order.items || []).map((item, i) => {
                                            const { name, price, quantity } = getItemDetails(item);
                                            return (
                                                <div key={i} className="grid grid-cols-12 text-[11px] py-0.5" style={{ color: 'var(--text-secondary)' }}>
                                                    <span className="col-span-6 truncate pr-1" style={{ color: 'var(--text-primary)' }}>{name}</span>
                                                    <span className="col-span-2 text-center">{quantity}</span>
                                                    <span className="col-span-2 text-right">{price}</span>
                                                    <span className="col-span-2 text-right font-medium">{(price * quantity).toFixed(0)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Totals */}
                                    <div className="pt-2 space-y-1 text-[11px]" style={{ borderTop: '1px dashed var(--border)' }}>
                                        <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                                            <span>Subtotal</span><span>Rs. {billData.subtotal.toFixed(0)}</span>
                                        </div>
                                        <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                                            <span>Service Charge (10%)</span><span>Rs. {billData.serviceCharge.toFixed(0)}</span>
                                        </div>
                                        <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                                            <span>VAT (13%)</span><span>Rs. {billData.vat.toFixed(0)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-xs pt-1" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                            <span>Grand Total</span><span>Rs. {billData.grandTotal.toFixed(0)}</span>
                                        </div>
                                    </div>

                                    <p className="text-[8px] text-center pt-2" style={{ color: 'var(--text-muted)', borderTop: '1px dashed var(--border)' }}>
                                        Thank you for dining with us!
                                    </p>
                                </div>

                                {/* Split Bill */}
                                <div className="rounded-xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <SplitSquareVertical className="w-3.5 h-3.5" weight="bold" style={{ color: 'var(--text-muted)' }} />
                                        <p className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>Split Bill</p>
                                    </div>
                                    <div className="flex gap-1.5 mb-2">
                                        {(['none', 'equal', 'by_item'] as const).map((mode) => (
                                            <button key={mode} onClick={() => setSplitMode(mode)}
                                                className="flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all"
                                                style={{
                                                    background: splitMode === mode ? 'var(--accent)' : 'var(--bg-input)',
                                                    color: splitMode === mode ? 'var(--accent-fg)' : 'var(--text-secondary)',
                                                    border: `1px solid ${splitMode === mode ? 'var(--accent)' : 'var(--border)'}`,
                                                }}>
                                                {mode === 'none' ? 'No Split' : mode === 'equal' ? 'Equal Split' : 'By Item'}
                                            </button>
                                        ))}
                                    </div>

                                    {splitMode === 'equal' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-3 h-3" weight="fill" style={{ color: 'var(--text-muted)' }} />
                                                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Split between</span>
                                                <div className="flex gap-0.5">
                                                    {[2, 3, 4, 5, 6].map((n) => (
                                                        <button key={n} onClick={() => setSplitCount(n)}
                                                            className="w-6 h-6 rounded text-[10px] font-semibold"
                                                            style={{
                                                                background: splitCount === n ? 'var(--accent)' : 'var(--bg-input)',
                                                                color: splitCount === n ? 'var(--accent-fg)' : 'var(--text-secondary)',
                                                            }}>{n}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="p-2 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Each person pays:</p>
                                                <p className="text-base font-bold" style={{ color: 'var(--accent-text)' }}>
                                                    Rs. {(billData.grandTotal / splitCount).toFixed(0)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {splitMode === 'by_item' && (
                                        <div className="space-y-1">
                                            <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Each item can be assigned to a guest:</p>
                                            {(billData.order.items || []).map((item, i) => {
                                                const { name, price, quantity } = getItemDetails(item);
                                                return (
                                                    <div key={i} className="flex items-center justify-between p-1.5 rounded-md" style={{ background: 'var(--bg-input)' }}>
                                                        <span className="text-[10px]" style={{ color: 'var(--text-primary)' }}>{name}</span>
                                                        <span className="text-[10px] font-bold" style={{ color: 'var(--accent-text)' }}>
                                                            Rs. {(price * quantity).toFixed(0)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Payment Method Selector */}
                                <div className="space-y-1.5 pt-1">
                                    <p className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Payment Method</p>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {(['Cash', 'Card', 'Fonepay', 'eSewa'] as const).map((m) => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setPaymentMethod(m)}
                                                className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border ${paymentMethod === m ? 'shadow-sm' : ''}`}
                                                style={{
                                                    background: paymentMethod === m ? 'var(--accent)' : 'var(--bg-input)',
                                                    borderColor: paymentMethod === m ? 'var(--accent)' : 'var(--border)',
                                                    color: paymentMethod === m ? 'var(--accent-fg)' : 'var(--text-secondary)'
                                                }}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={handlePrint}
                                        className="flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                        <Printer className="w-3.5 h-3.5" weight="fill" /> Print Bill
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.97 }}
                                        onClick={async () => {
                                            if (!billData) return;
                                            
                                            // 1. Mark order completed in Orders Store
                                            updateOrderStatus(billData.order.id, 'completed');

                                            // 2. Add real transaction to ledger
                                            await useDataStore.getState().addTransaction({
                                                order_id: billData.order.id,
                                                type: 'income',
                                                category: billData.order.type || 'Dine-In',
                                                description: `Table ${billData.order.tableNumber} bill settlement`,
                                                amount: Math.round(billData.grandTotal),
                                                method: paymentMethod,
                                                date: new Date().toISOString(),
                                            });

                                            // 3. Free the table
                                            if (billData.order.tableNumber) {
                                                useTableStore.getState().vacateTable(billData.order.tableNumber);
                                                useDataStore.getState().vacateTable(billData.order.tableNumber.toString());
                                            }

                                            toast.success(`Payment of Rs. ${billData.grandTotal.toFixed(0)} received (${paymentMethod}). Table ${billData.order.tableNumber} is now vacant!`);
                                            setShowBill(false);
                                        }}
                                        className="flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                                        style={{ background: 'var(--success)', color: '#fff' }}>
                                        <Check className="w-3.5 h-3.5" weight="bold" /> Settle & Free Table
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
