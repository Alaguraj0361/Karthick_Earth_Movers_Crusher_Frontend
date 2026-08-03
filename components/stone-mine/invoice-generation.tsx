'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import IconSearch from '@/components/icon/icon-search';
import IconPrinter from '@/components/icon/icon-printer';
import IconX from '@/components/icon/icon-x';
import api from '@/utils/api';

interface InvoiceGenerationProps {
    mode?: 'invoice' | 'bill' | 'checklist';
}

const InvoiceGeneration = ({ mode = 'invoice' }: InvoiceGenerationProps) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isManagement = ['owner', 'manager', 'admin'].includes(currentUser?.role?.toLowerCase() || '');

    const querySaleId = searchParams.get('id');
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [showInvoice, setShowInvoice] = useState(false);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
    });

    const fetchSales = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            const { data } = await api.get('/sales', { params });
            if (data.success) {
                const sorted = data.data.sort((a: any, b: any) => {
                    const dateA = new Date(a.invoiceDate).getTime();
                    const dateB = new Date(b.invoiceDate).getTime();
                    if (dateB !== dateA) return dateB - dateA;
                    return (b._id || '').localeCompare(a._id || '');
                });
                setSales(sorted);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const viewInvoice = async (id: string) => {
        try {
            const { data } = await api.get(`/sales/${id}`);
            if (data.success) {
                setSelectedSale(data.data);
                setShowInvoice(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (querySaleId) {
            viewInvoice(querySaleId);
        }
        fetchSales();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [querySaleId]);

    const handlePrint = () => {
        const printContent = document.getElementById('invoice-print-area');
        if (!printContent) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
            <head>
                <title>${(selectedSale?.gstAmount || 0) > 0 ? 'Invoice' : 'Bill'} ${selectedSale?.invoiceNumber?.replace('INV-', (selectedSale?.gstAmount || 0) > 0 ? 'INV-' : 'BILL-')}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; }
                    th { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    img { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    @media print { 
                        body { padding: 15px; } 
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } 
                        img { mix-blend-mode: multiply !important; }
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 500);
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
            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white-light">
                        {mode === 'invoice' ? 'விலைப்பட்டியல் உருவாக்குதல் (Invoice Generation)' : mode === 'checklist' ? 'டிரிப் இன்வாய்ஸ் சரிபார்ப்பு (Trip Invoice Checklist)' : 'பில் பட்டியல் (Cash Bill)'}
                    </h2>
                    <p className="text-white-dark text-sm mt-1">
                        {mode === 'invoice' ? 'Invoice Generation — View and print tax invoices' : mode === 'checklist' ? 'Trip Invoice Checklist — View and print connected trips for invoices' : 'Bill Generation — View and print non-tax bills'}
                    </p>
                </div>
            </div>

            {/* Invoice Detail View */}
            {showInvoice && selectedSale ? (
                <div>
                    {/* Action Bar */}
                    <div className="flex items-center justify-between mb-6">
                        <button className="btn btn-outline-danger" onClick={() => setShowInvoice(false)}>
                            <IconX className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> Back to List
                        </button>
                        {currentUser?.role?.toLowerCase() === 'owner' && (selectedSale.grandTotal || 0) > 0 && (
                            <button className="btn btn-primary" onClick={handlePrint}>
                                <IconPrinter className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> Print / Download PDF
                            </button>
                        )}
                    </div>

                    {/* ===== ZERO TOTAL GUARD ===== */}
                    {(selectedSale.grandTotal || 0) === 0 ? (
                        <div className="panel flex flex-col items-center justify-center py-16 text-center gap-4">
                            <div className="text-6xl">🚫</div>
                            <h4 className="text-xl font-bold text-danger">Invoice Cannot Be Generated</h4>
                            <p className="text-white-dark max-w-sm">
                                This sale has a <span className="font-bold text-danger">Grand Total of ₹0</span>.
                                Please update the sale with valid quantities and rates before generating an invoice.
                            </p>
                            <button className="btn btn-outline-danger mt-2" onClick={() => setShowInvoice(false)}>
                                <IconX className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> Back to List
                            </button>
                        </div>
                    ) : (


                        <div id="invoice-print-area" className="panel" style={{ position: 'relative', overflow: 'hidden' }}>
                            {/* ===== BACKGROUND WATERMARK LOGO ===== */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.06, pointerEvents: 'none', zIndex: 0 }}>
                                <img src="/assets/images/logo.png" alt="watermark" style={{ width: '420px', height: '420px', objectFit: 'contain' }} />
                            </div>

                            {/* ===== TOP HEADER: Company Logo + Address ===== */}
                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div>
                                    <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#e79b21', margin: 0 }}>
                                        {(selectedSale?.gstAmount || 0) > 0 ? 'INVOICE' : 'BILL'}
                                    </h1>
                                    <p style={{ fontSize: '13px', color: '#555', marginTop: '4px', fontWeight: 'bold' }}>
                                        {(selectedSale?.gstAmount || 0) > 0 ? 'invoice no:' : 'bill no:'} {(selectedSale?.gstAmount || 0) > 0 ? selectedSale.invoiceNumber : selectedSale.invoiceNumber.replace('INV-', 'BILL-')}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <img src="/assets/images/logo.png" alt="Karthick Earth Movers" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
                                    <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Stone Quarry & Transport Unit</p>
                                    <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Tamil Nadu, India</p>
                                    <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>karthickearthmovers@gmail.com</p>
                                    <p style={{ fontSize: '12px', color: '#e79b21', margin: 0, fontWeight: 'bold', letterSpacing: '0.5px' }}>GST: 33AVFPK9827P2ZV</p>
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #e0e6ed', margin: '15px 0 25px 0', position: 'relative', zIndex: 1 }} />

                            {/* ===== DETAIL SECTION: Issue For | Invoice Info | Bank Info ===== */}
                            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                {/* Issue For */}
                                <div style={{ flex: '1', minWidth: '250px' }}>
                                    <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888', letterSpacing: '1px', marginBottom: '8px' }}>Issue For:</p>
                                    <table style={{ width: '100%', fontSize: '13px' }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: '4px 0', color: '#888' }}>customer name :</td>
                                                <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right' }}>
                                                    {selectedSale.saleType === '3rd Party' ? (selectedSale.contractor?.name || '—') : (selectedSale.customer?.name || '—')}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '4px 0', color: '#888' }}>address:</td>
                                                <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right', whiteSpace: 'normal', maxWidth: '150px' }}>
                                                    {selectedSale.saleType === '3rd Party' ? (selectedSale.contractor?.address || '—') : (selectedSale.customer?.address || '—')}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '4px 0', color: '#888' }}>phone number:</td>
                                                <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right' }}>
                                                    {selectedSale.saleType === '3rd Party' ? (selectedSale.contractor?.mobileNumber || '—') : (selectedSale.customer?.phone || '—')}
                                                </td>
                                            </tr>
                                            {(selectedSale.saleType === '3rd Party' ? selectedSale.contractor?.gstNumber : selectedSale.customer?.gstNumber) && (
                                                <tr>
                                                    <td style={{ padding: '4px 0', color: '#888' }}>GST:</td>
                                                    <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right', color: '#e79b21' }}>
                                                        {selectedSale.saleType === '3rd Party' ? selectedSale.contractor?.gstNumber : selectedSale.customer?.gstNumber}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Invoice Details */}
                                <div style={{ flex: '1', minWidth: '200px' }}>
                                    <table style={{ width: '100%', fontSize: '13px' }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: '4px 0', color: '#888' }}>Issue Date :</td>
                                                <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right' }}>{new Date(selectedSale.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '4px 0', color: '#888' }}>Payment Type :</td>
                                                <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right' }}>{selectedSale.paymentType}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '4px 0', color: '#888' }}>Status :</td>
                                                <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right', color: selectedSale.paymentStatus === 'Paid' ? '#00ab55' : selectedSale.paymentStatus === 'Partial' ? '#e2a03f' : '#e7515a' }}>{selectedSale.paymentStatus}</td>
                                            </tr>
                                            {selectedSale.dueDate && (
                                                <tr>
                                                    <td style={{ padding: '4px 0', color: '#888' }}>Due Date :</td>
                                                    <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right' }}>{new Date(selectedSale.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Bank / Payment Info */}
                                <div style={{ flex: '1', minWidth: '200px' }}>
                                    <table style={{ width: '100%', fontSize: '13px' }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: '4px 0', color: '#888' }}>Bank Name:</td>
                                                <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right' }}>IDBI Bank (Kallandhiri Branch)</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '4px 0', color: '#888' }}>Account Number:</td>
                                                <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right' }}>1201102000002059</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '4px 0', color: '#888' }}>IFSC Code:</td>
                                                <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right' }}>IBKL0001201</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '4px 0', color: '#888' }}>City:</td>
                                                <td style={{ padding: '4px 0', fontWeight: 'bold', textAlign: 'right' }}>Madurai</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #e0e6ed', margin: '0 0 20px 0' }} />

                            {/* ===== ITEMS TABLE ===== */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>S.No</th>
                                        <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item Description</th>
                                        {mode === 'invoice' && <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HSN CODE</th>}
                                        <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
                                        <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unit</th>
                                        <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rate (₹)</th>
                                        {mode === 'invoice' && <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tax %</th>}
                                        <th style={{ background: '#e79b21', color: 'white', padding: '12px 15px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSale.items?.map((item: any, idx: number) => (
                                        <tr key={idx}>
                                            <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee', fontSize: '13px' }}>{idx + 1}</td>
                                            <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee', fontWeight: '600', fontSize: '13px' }}>{item.item}</td>
                                            {mode === 'invoice' && <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee', textAlign: 'center', fontSize: '13px' }}>{item.hsnCode || '-'}</td>}
                                            <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee', textAlign: 'center', fontSize: '13px' }}>{item.quantity}</td>
                                            <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee', textAlign: 'center', fontSize: '13px' }}>{item.unit}</td>
                                            <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee', textAlign: 'right', fontSize: '13px' }}>₹{item.rate?.toLocaleString()}</td>
                                            {mode === 'invoice' && <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee', textAlign: 'right', fontSize: '13px' }}>{item.gstPercentage || 0}%</td>}
                                            <td style={{ padding: '11px 15px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>₹{item.amount?.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* ===== TOTALS ===== */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
                                <div style={{ minWidth: '280px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px' }}>
                                        <span style={{ color: '#888' }}>Subtotal</span>
                                        <span style={{ fontWeight: 'bold' }}>₹{selectedSale.subtotal?.toLocaleString()}</span>
                                    </div>
                                    {selectedSale.gstAmount > 0 && (
                                        <div style={{ borderTop: '1px solid #eee', marginTop: '5px', paddingTop: '5px' }}>
                                            {Array.from(new Set(selectedSale.items?.map((i: any) => i.gstPercentage) || [])).sort((a: any, b: any) => b - a).map((pct: any) => {
                                                const amt = selectedSale.items?.filter((i: any) => i.gstPercentage === pct).reduce((s: number, i: any) => s + (i.gstAmount || 0), 0) || 0;
                                                if (amt <= 0) return null;
                                                return (
                                                    <div key={pct} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '12px', color: '#666' }}>
                                                        <span style={{ fontStyle: 'italic' }}>GST {pct}%</span>
                                                        <span>₹{amt.toLocaleString()}</span>
                                                    </div>
                                                );
                                            })}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', borderTop: '1px solid #eee', marginTop: '5px' }}>
                                                <span style={{ color: '#888' }}>Total Tax (GST)</span>
                                                <span style={{ fontWeight: 'bold' }}>₹{selectedSale.gstAmount?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px' }}>
                                        <span style={{ color: '#888' }}>Amount Paid</span>
                                        <span style={{ fontWeight: 'bold', color: '#00ab55' }}>₹{selectedSale.amountPaid?.toLocaleString()}</span>
                                    </div>
                                    {selectedSale.balanceAmount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px' }}>
                                            <span style={{ color: '#888' }}>Balance Due</span>
                                            <span style={{ fontWeight: 'bold', color: '#e7515a' }}>₹{selectedSale.balanceAmount?.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 6px 0', fontSize: '18px', fontWeight: 'bold', color: '#e79b21', borderTop: '2px solid #e79b21', marginTop: '8px' }}>
                                        <span>{mode === 'invoice' || mode === 'checklist' ? 'Grand Total' : 'Bill Total'}</span>
                                        <span>₹{selectedSale.grandTotal?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* ===== NOTES ===== */}
                            {selectedSale.notes && (
                                <div style={{ background: '#f8f9fa', padding: '12px 15px', borderRadius: '6px', marginBottom: '30px', fontSize: '13px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes: </span>
                                    <span style={{ color: '#555' }}>{selectedSale.notes}</span>
                                </div>
                            )}

                            {/* ===== FOOTER ===== */}
                            <div style={{ paddingTop: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ borderTop: '1px solid #ccc', width: '200px', paddingTop: '8px', fontSize: '12px', color: '#888' }}>Customer Signature</div>
                                </div>
                                <div style={{ textAlign: 'center', position: 'relative' }}>
                                    <img
                                        src="/assets/images/Karthick-Earthmovers-owner-sign.jpeg"
                                        alt="Authorized Signature"
                                        style={{
                                            width: '180px',
                                            position: 'absolute',
                                            top: '-45px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            opacity: 1,
                                            pointerEvents: 'none',
                                            mixBlendMode: 'multiply',
                                            filter: 'grayscale(1) contrast(8) brightness(5)',
                                            WebkitPrintColorAdjust: 'exact'
                                        }}
                                    />
                                    <div style={{ borderTop: '1px solid #ccc', width: '200px', paddingTop: '8px', marginTop: '20px', fontSize: '12px', color: '#888' }}>Authorized Signature</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '11px', color: '#aaa', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                <p>Thank you for your business! — Karthick Earth Movers</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <div className="panel mb-6">
                        <div className="flex items-end gap-4 flex-wrap">
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">From Date</label>
                                <input type="date" className="form-input w-44" value={filters.startDate} onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white-dark uppercase mb-2 block">To Date</label>
                                <input type="date" className="form-input w-44" value={filters.endDate} onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} />
                            </div>
                            <button className="btn btn-primary" onClick={fetchSales}>
                                <IconSearch className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> Search
                            </button>
                        </div>
                    </div>

                    {/* Sales List */}
                    <div className="panel">
                        <h5 className="text-lg font-bold dark:text-white-light mb-4">
                            {mode === 'invoice' ? 'Tax Invoice List' : mode === 'checklist' ? 'Checklist - Select Invoice / Bill' : 'Normal Bill List'}
                        </h5>
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{mode === 'checklist' ? 'Inv / Bill Number' : mode === 'invoice' ? 'Inv Number' : 'Bill #'}</th>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Items</th>
                                        <th className="!text-right">Total</th>
                                        <th className="!text-center">Payment</th>
                                        <th className="!text-center">Status</th>
                                        <th className="!text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={9} className="text-center py-8 text-white-dark">Loading...</td></tr>
                                    ) : (() => {
                                        const filtered = sales.filter(s => {
                                            if (mode === 'checklist') return true;
                                            const isGST = (s.gstAmount || 0) > 0;
                                            return mode === 'invoice' ? isGST : !isGST;
                                        });

                                        if (filtered.length === 0) {
                                            return <tr><td colSpan={9} className="text-center py-8 text-white-dark">No {mode === 'invoice' ? 'invoices' : 'bills'} found</td></tr>;
                                        }

                                        return filtered.map((sale, idx) => (
                                            <tr key={sale._id}>
                                                <td>{idx + 1}</td>
                                                <td className="font-bold text-primary">
                                                    {mode === 'invoice' || mode === 'checklist' ? sale.invoiceNumber : sale.invoiceNumber.replace('INV-', 'BILL-')}
                                                </td>
                                                <td>{new Date(sale.invoiceDate).toLocaleDateString()}</td>
                                                <td className="font-semibold">
                                                    {sale.saleType === '3rd Party' ? (sale.contractor?.name || '—') : (sale.customer?.name || '—')}
                                                </td>
                                                <td>
                                                    <span className="badge bg-dark/10 text-dark dark:bg-dark-light/10 dark:text-white-dark">
                                                        {sale.items?.length || 0} items
                                                    </span>
                                                </td>
                                                <td className="!text-right font-bold text-lg">₹{sale.grandTotal?.toLocaleString()}</td>
                                                <td className="!text-center">
                                                    <span className={`badge ${sale.paymentType === 'Cash' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                                        {sale.paymentType}
                                                    </span>
                                                </td>
                                                <td className="!text-center">
                                                    <span className={`badge ${sale.paymentStatus === 'Paid' ? 'bg-success/10 text-success' : sale.paymentStatus === 'Partial' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
                                                        {sale.paymentStatus}
                                                    </span>
                                                </td>
                                                <td className="!text-center">
                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => {
                                                        if (mode === 'checklist') router.push(`/sales-billing/trip-checklist?id=${sale._id}`);
                                                        else viewInvoice(sale._id);
                                                    }}>
                                                        <IconPrinter className="w-4 h-4 ltr:mr-1 rtl:ml-1" /> View
                                                    </button>
                                                </td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default InvoiceGeneration;
