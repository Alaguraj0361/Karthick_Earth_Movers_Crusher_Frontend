'use client';
import React, { useState, useEffect } from 'react';
import IconSearch from '@/components/icon/icon-search';
import IconSave from '@/components/icon/icon-save';
import IconX from '@/components/icon/icon-x';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { IRootState } from '@/store';
import { useToast } from '@/components/stone-mine/toast-notification';
import api from '@/utils/api';

const PendingPayments = () => {
    const router = useRouter();
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isManagement = ['owner', 'manager', 'admin'].includes(currentUser?.role?.toLowerCase() || '');

    const { showToast } = useToast();
    const [report, setReport] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPending, setTotalPending] = useState(0);
    const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'Cash',
        referenceNumber: '',
        notes: '',
    });

    const fetchReport = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/sales/pending-payments');
            if (data.success) {
                setReport(data.data);
                setTotalPending(data.totalPending);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const openPaymentModal = (invoice: any) => {
        setSelectedInvoice(invoice);
        setPaymentData({
            amount: String(invoice.balanceAmount),
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMode: 'Cash',
            referenceNumber: '',
            notes: '',
        });
        setShowPaymentModal(true);
    };

    const handlePayment = async (e: any) => {
        e.preventDefault();
        if (!selectedInvoice) return;
        try {
            const { data } = await api.post(`/sales/${selectedInvoice._id}/payment`, {
                amount: parseFloat(paymentData.amount),
                paymentDate: paymentData.paymentDate,
                paymentMode: paymentData.paymentMode,
                referenceNumber: paymentData.referenceNumber,
                notes: paymentData.notes,
            });
            if (data.success) {
                showToast('Payment recorded successfully!', 'success');
                setShowPaymentModal(false);
                fetchReport();
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Error recording payment', 'error');
        }
    };

    if (!isManagement) {
        return (
            <div className="panel p-5 text-center">
                <h4 className="text-xl font-bold text-danger">Access Denied (அனுமதி இல்லை)</h4>
                <p className="mt-2 text-white-dark font-medium uppercase tracking-wider text-xs">Only Owners and Managers can access this page.</p>
                <button className="btn btn-primary mt-6 mx-auto" onClick={() => router.push('/')}>Go to Dashboard</button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white-light">பாக்கி தொகை கண்காணிப்பு</h2>
                    <p className="text-white-dark text-sm mt-1">Pending Payment Tracking — Monitor outstanding balances</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="panel py-2 px-4 bg-gradient-to-r from-danger/20 to-danger/5 border border-danger/20">
                        <p className="text-xs uppercase font-bold text-danger tracking-wider">Total Pending</p>
                        <h3 className="text-2xl font-black text-danger">₹{totalPending.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                <div className="panel bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/20">
                    <p className="text-xs uppercase font-bold text-warning tracking-wider">Total Customers with Dues</p>
                    <h3 className="text-3xl font-black text-warning mt-2">{report.length}</h3>
                </div>
                <div className="panel bg-gradient-to-br from-info/20 to-info/5 border border-info/20">
                    <p className="text-xs uppercase font-bold text-info tracking-wider">Total Outstanding Invoices</p>
                    <h3 className="text-3xl font-black text-info mt-2">
                        {report.reduce((sum, r) => sum + r.invoices.length, 0)}
                    </h3>
                </div>
                <div className="panel bg-gradient-to-br from-success/20 to-success/5 border border-success/20">
                    <p className="text-xs uppercase font-bold text-success tracking-wider">Partial Payments Received</p>
                    <h3 className="text-3xl font-black text-success mt-2">
                        ₹{report.reduce((sum, r) => sum + r.totalPaid, 0).toLocaleString()}
                    </h3>
                </div>
            </div>

            {/* Customer-wise Pending Report */}
            <div className="panel">
                <h5 className="text-lg font-bold dark:text-white-light mb-4">Customer-wise Pending Report</h5>

                {loading ? (
                    <div className="text-center py-8 text-white-dark">Loading...</div>
                ) : report.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-4">🎉</div>
                        <h4 className="text-lg font-bold text-success">No Pending Payments!</h4>
                        <p className="text-white-dark">All payments are collected.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {report.map((item) => (
                            <div key={item.customer._id} className="border border-[#ebedf2] dark:border-[#1b2e4b] rounded-lg overflow-hidden">
                                {/* Customer Header */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-primary/5 transition-colors"
                                    onClick={() => setExpandedCustomer(expandedCustomer === item.customer._id ? null : item.customer._id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                            {item.customer.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <h6 className="font-bold text-primary">{item.customer.name}</h6>
                                            <p className="text-white-dark text-xs">{item.customer.phone || 'No phone'} · {item.invoices.length} invoice(s)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xs text-white-dark">Total Sales</p>
                                            <p className="font-bold">₹{item.totalSales.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-white-dark">Paid</p>
                                            <p className="font-bold text-success">₹{item.totalPaid.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-white-dark">Balance</p>
                                            <p className="font-black text-danger text-lg">₹{item.totalBalance.toLocaleString()}</p>
                                        </div>
                                        <div className={`transition-transform ${expandedCustomer === item.customer._id ? 'rotate-180' : ''}`}>
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                {/* Invoice Details (Expandable) */}
                                {expandedCustomer === item.customer._id && (
                                    <div className="border-t border-[#ebedf2] dark:border-[#1b2e4b]">
                                        <div className="table-responsive">
                                            <table className="table-hover">
                                                <thead>
                                                    <tr className="bg-dark-light/5 dark:bg-dark">
                                                        <th>Invoice #</th>
                                                        <th>Date</th>
                                                        <th className="!text-right">Total</th>
                                                        <th className="!text-right">Paid</th>
                                                        <th className="!text-right">Balance</th>
                                                        <th>Due Date</th>
                                                        <th className="!text-center">Status</th>
                                                        <th className="!text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {item.invoices.map((inv: any) => (
                                                        <tr key={inv._id}>
                                                            <td className="font-bold text-primary">{inv.invoiceNumber}</td>
                                                            <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                                            <td className="!text-right font-bold">₹{inv.grandTotal.toLocaleString()}</td>
                                                            <td className="!text-right font-bold text-success">₹{inv.amountPaid.toLocaleString()}</td>
                                                            <td className="!text-right font-black text-danger">₹{inv.balanceAmount.toLocaleString()}</td>
                                                            <td>
                                                                {inv.dueDate ? (
                                                                    <span className={`badge ${new Date(inv.dueDate) < new Date() ? 'bg-danger/10 text-danger' : 'bg-info/10 text-info'}`}>
                                                                        {new Date(inv.dueDate).toLocaleDateString()}
                                                                    </span>
                                                                ) : '—'}
                                                            </td>
                                                            <td className="!text-center">
                                                                <span className={`badge ${inv.paymentStatus === 'Partial' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
                                                                    {inv.paymentStatus}
                                                                </span>
                                                            </td>
                                                            <td className="!text-center">
                                                                <button className="btn btn-sm btn-success" onClick={() => openPaymentModal(inv)}>
                                                                    💰 Collect
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payment Collection Modal */}
            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="panel w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-6 border-b border-[#ebedf2] dark:border-[#1b2e4b] pb-4">
                            <div>
                                <h5 className="text-lg font-bold dark:text-white-light">Record Payment</h5>
                                <p className="text-white-dark text-xs">{selectedInvoice.invoiceNumber} · Balance: ₹{selectedInvoice.balanceAmount.toLocaleString()}</p>
                            </div>
                            <button className="btn btn-sm btn-outline-danger rounded-full" onClick={() => setShowPaymentModal(false)}>
                                <IconX className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handlePayment} className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Payment Amount (₹) *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold">₹</span>
                                    <input
                                        type="number"
                                        className="form-input pl-8 font-bold text-lg border-primary text-primary"
                                        placeholder="0.00"
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                                        max={selectedInvoice.balanceAmount}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Payment Date</label>
                                    <input type="date" className="form-input" value={paymentData.paymentDate} onChange={(e) => setPaymentData(prev => ({ ...prev, paymentDate: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Payment Mode</label>
                                    <select className="form-select" value={paymentData.paymentMode} onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMode: e.target.value }))}>
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Reference Number</label>
                                <input type="text" className="form-input" placeholder="Cheque / UPI Reference" value={paymentData.referenceNumber} onChange={(e) => setPaymentData(prev => ({ ...prev, referenceNumber: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">Notes</label>
                                <textarea className="form-textarea" rows={2} placeholder="Any notes..." value={paymentData.notes} onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}></textarea>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ebedf2] dark:border-[#1b2e4b]">
                                <button type="button" className="btn btn-outline-danger" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success shadow-lg shadow-success/20">
                                    <IconSave className="ltr:mr-2 rtl:ml-2" />
                                    Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingPayments;
