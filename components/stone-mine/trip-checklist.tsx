'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import IconPrinter from '@/components/icon/icon-printer';
import IconX from '@/components/icon/icon-x';
import api from '@/utils/api';
import InvoiceGeneration from '@/components/stone-mine/invoice-generation';

const TripChecklist = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isManagement = ['owner', 'manager', 'admin'].includes(currentUser?.role?.toLowerCase() || '');
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';

    const querySaleId = searchParams.get('id');
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const viewChecklist = async (id: string) => {
        try {
            setLoading(true);
            const { data } = await api.get(`/sales/${id}`);
            if (data.success) {
                setSelectedSale(data.data);
                setTrips(data.trips || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (querySaleId) {
            viewChecklist(querySaleId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [querySaleId]);

    if (!querySaleId) {
        return <InvoiceGeneration mode="checklist" />;
    }

    const handlePrint = () => {
        const printContent = document.getElementById('checklist-print-area');
        if (!printContent) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
            <head>
                <title>Trip Checklist - ${selectedSale?.invoiceNumber}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; }
                    th { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    @media print { body { padding: 15px; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
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
                <h4 className="text-xl font-bold text-danger">Access Denied</h4>
                <p className="mt-2 text-white-dark font-medium uppercase tracking-wider text-xs">Only authorized personnel can view this.</p>
                <button className="btn btn-primary mt-6 mx-auto" onClick={() => router.push('/')}>Go to Dashboard</button>
            </div>
        );
    }

    if (loading) {
        return <div className="panel p-10 text-center text-lg font-bold">Loading Checklist...</div>;
    }

    if (!selectedSale) {
        return (
            <div className="panel p-10 text-center text-lg font-bold text-danger">
                Sale Record Not Found!
                <button className="btn btn-outline-primary mt-4 mx-auto" onClick={() => router.push('/sales-billing/sales-entry')}>Back</button>
            </div>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white-light">
                        டிரிப் சரிபார்ப்புப் பட்டியல் (Trip Checklist)
                    </h2>
                    <p className="text-white-dark text-sm mt-1">
                        View and print the connected trips for this invoice.
                    </p>
                </div>
            </div>

            {/* Checklist View */}
            <div>
                {/* Action Bar */}
                <div className="flex items-center justify-between mb-6">
                    <button className="btn btn-outline-danger" onClick={() => router.push('/sales-billing/sales-entry')}>
                        <IconX className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> Back
                    </button>
                    {trips.length > 0 ? (
                        isOwner && (
                            <button className="btn btn-primary" onClick={handlePrint}>
                                <IconPrinter className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> Print PDF / Download
                            </button>
                        )
                    ) : (
                        <span className="text-white-dark text-xs italic">No trips connected to this sale.</span>
                    )}
                </div>

                <div id="checklist-print-area" className="panel" style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* ===== BACKGROUND WATERMARK LOGO ===== */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, pointerEvents: 'none', zIndex: 0 }}>
                        <img src="/assets/images/logo.png" alt="watermark" style={{ width: '420px', height: '420px', objectFit: 'contain' }} />
                    </div>

                    {/* ===== TOP HEADER: Company Logo + Address ===== */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div>
                            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#e79b21', margin: 0, textTransform: 'uppercase' }}>
                                Trip Checklist Annexure
                            </h1>
                            <p style={{ fontSize: '13px', color: '#555', marginTop: '4px', fontWeight: 'bold' }}>
                                Ref Invoice: {selectedSale.invoiceNumber}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <img src="/assets/images/logo.png" alt="Karthick Earth Movers" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
                            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Stone Quarry & Transport Unit</p>
                            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Tamil Nadu, India</p>
                            <p style={{ fontSize: '12px', color: '#e79b21', margin: 0, fontWeight: 'bold', letterSpacing: '0.5px' }}>Total Connected Trips: {trips.length}</p>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #e0e6ed', margin: '15px 0 25px 0', position: 'relative', zIndex: 1 }} />

                    {/* ===== DETAIL SECTION: Issue For | Invoice Info ===== */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                        {/* Issue For */}
                        <div style={{ flex: '1' }}>
                            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888', letterSpacing: '1px', marginBottom: '8px' }}>Customer Details:</p>
                            <table style={{ fontSize: '13px' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '4px 8px 4px 0', color: '#888' }}>Name :</td>
                                        <td style={{ padding: '4px 0', fontWeight: 'bold' }}>
                                            {selectedSale.saleType === '3rd Party' ? (selectedSale.contractor?.name || '—') : (selectedSale.customer?.name || '—')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '4px 8px 4px 0', color: '#888' }}>Address:</td>
                                        <td style={{ padding: '4px 0', fontWeight: 'bold', whiteSpace: 'normal', maxWidth: '300px' }}>
                                            {selectedSale.saleType === '3rd Party' ? (selectedSale.contractor?.address || '—') : (selectedSale.customer?.address || '—')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Invoice Details */}
                        <div style={{ flex: '1', textAlign: 'right' }}>
                            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888', letterSpacing: '1px', marginBottom: '8px' }}>Invoice Overview:</p>
                            <table style={{ fontSize: '13px', marginLeft: 'auto' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '4px 8px 4px 0', color: '#888' }}>Date:</td>
                                        <td style={{ padding: '4px 0', fontWeight: 'bold' }}>{new Date(selectedSale.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '4px 8px 4px 0', color: '#888' }}>Total Items Amt:</td>
                                        <td style={{ padding: '4px 0', fontWeight: 'bold' }}>₹{selectedSale.subtotal?.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '4px 8px 4px 0', color: '#888' }}>Grand Total:</td>
                                        <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#e79b21' }}>₹{selectedSale.grandTotal?.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #e0e6ed', margin: '0 0 20px 0' }} />

                    {/* ===== TRIPS TABLE ===== */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', position: 'relative', zIndex: 1 }}>
                        <thead>
                            <tr>
                                <th style={{ background: '#e79b21', color: 'white', padding: '10px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>S.No</th>
                                <th style={{ background: '#e79b21', color: 'white', padding: '10px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>Date</th>
                                <th style={{ background: '#e79b21', color: 'white', padding: '10px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>Vehicle</th>
                                <th style={{ background: '#e79b21', color: 'white', padding: '10px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>Material</th>
                                <th style={{ background: '#e79b21', color: 'white', padding: '10px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase' }}>Route</th>
                                <th style={{ background: '#e79b21', color: 'white', padding: '10px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase' }}>Bill / LR</th>
                                <th style={{ background: '#e79b21', color: 'white', padding: '10px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase' }}>Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trips.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No trips found for this invoice.</td>
                                </tr>
                            ) : (
                                trips.map((trip: any, idx: number) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '13px' }}>{idx + 1}</td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '12px', color: '#555' }}>
                                            {new Date(trip.date).toLocaleDateString('en-GB')}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '13px', fontWeight: 'bold' }}>
                                            {trip.vehicleId?.vehicleNumber || trip.vehicleId?.registrationNumber || '—'}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                                            {trip.stoneTypeId?.name || '—'}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '11px', textAlign: 'center', color: '#666' }}>
                                            {trip.fromLocation || 'Quarry'} → {trip.toLocation || 'Site'}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '13px', textAlign: 'center', fontWeight: 'bold', color: '#e79b21' }}>
                                            {trip.billNumber || '—'}
                                        </td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '13px', textAlign: 'right', fontWeight: 'bold' }}>
                                            {trip.loadQuantity} <span style={{ fontSize: '10px', fontWeight: 'normal', color: '#888' }}>{trip.loadUnit}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* ===== TOTALS ===== */}
                    {trips.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
                            <div style={{ minWidth: '220px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e0e6ed' }}>
                                <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Trip Aggregation Summary</div>
                                {Array.from(new Set(trips.map(t => t.loadUnit))).map(unit => {
                                    const totalForUnit = trips.filter(t => t.loadUnit === unit).reduce((sum, t) => sum + (t.loadQuantity || 0), 0);
                                    if (totalForUnit <= 0) return null;
                                    return (
                                        <div key={unit as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px', fontWeight: 'bold' }}>
                                            <span>Total {unit as string}:</span>
                                            <span style={{ color: '#e79b21' }}>{totalForUnit}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '11px', color: '#aaa', borderTop: '1px solid #eee', paddingTop: '15px', position: 'relative', zIndex: 1 }}>
                        <p>This is a system-generated checklist linked to Invoice {selectedSale.invoiceNumber}.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TripChecklist;
