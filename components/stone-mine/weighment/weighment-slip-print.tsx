'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/utils/api';

interface WeighmentSlip {
    _id: string;
    slipNumber: string;
    slipType: string;
    slipDate: string;
    slipTime?: string;
    vehicleNumber: string;
    driverName?: string;
    driverMobile?: string;
    transportCompany?: string;
    entryGate?: string;
    partyCategory?: string;
    partyName?: string;
    material?: { name: string; unit: string; hsnCode?: string };
    firstWeighType?: string;
    grossWeight: number; // In Metric Tons (MT)
    tareWeight: number;  // In Metric Tons (MT)
    netWeight: number;   // In Metric Tons (MT)
    ratePerTon?: number;
    subtotalAmount?: number;
    gstPercentage?: number;
    gstAmount?: number;
    totalAmount?: number;
    paymentType?: string;
    paymentStatus?: string;
    amountPaid?: number;
    balanceAmount?: number;
    slipStatus: string;
    purpose: string;
    firstWeighAt?: string;
    secondWeighAt?: string;
    grossWeighAt?: string;
    tareWeighAt?: string;
    challanNo?: string;
    volumeM3?: number;
    moisturePercentage?: number;
    weighbridgeCharges?: number;
    operatorName?: string;
    remarks?: string;
}

const WeighmentSlipPrint = () => {
    const params = useParams();
    const id = params?.id as string;
    const [slip, setSlip] = useState<WeighmentSlip | null>(null);
    const [loading, setLoading] = useState(true);
    const [paperMode, setPaperMode] = useState<'A4'>('A4');

    useEffect(() => {
        if (!id) return;
        api.get(`/weighment/${id}`).then(res => {
            setSlip(res.data.data);
            api.put(`/weighment/${id}/print`, {}).catch(() => {});
        }).catch(console.error).finally(() => setLoading(false));
    }, [id]);

    const handlePrint = () => window.print();

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
        </div>
    );

    if (!slip) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <p className="text-xl text-gray-600">Weighment Slip not found</p>
            </div>
        </div>
    );

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-CA');
    const formatTime = (d?: string) => d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
    const formatDateTime = (d?: string) => d ? `${formatDate(d)} ${formatTime(d)}` : '—';

    const isOpen = slip.slipStatus === 'Open';
    const grossKg = Math.round((slip.grossWeight || 0) * 1000);
    const tareKg = Math.round((slip.tareWeight || 0) * 1000);
    const netKg = Math.round((slip.netWeight || 0) * 1000);

    return (
        <>
            {/* Control Bar */}
            <div className="print:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center text-white text-xl shadow-md">
                        ⚖️
                    </div>
                    <div>
                        <h2 className="font-black text-gray-900 dark:text-white text-base leading-tight">A4 Weighment Document</h2>
                        <span className="text-xs text-primary font-bold">
                            Slip #{slip.slipNumber} • {slip.slipType}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handlePrint} className="btn btn-primary px-6 py-2 font-bold shadow-md flex items-center gap-2">
                        🖨️ Print
                    </button>
                    <button onClick={() => window.close()} className="btn btn-outline-danger px-4 py-2 font-bold text-xs">
                        ✕ Close
                    </button>
                </div>
            </div>

            {/* Printable Container */}
            <div className="min-h-screen bg-[#f4f5f8] dark:bg-slate-950 p-4 print:p-0 print:bg-white flex justify-center">
                {/* Full A4 Sheet in Compact Sales Invoice Format */}
                <div
                    id="weighment-ticket-a4"
                    className="panel bg-white text-gray-900 p-8 shadow-2xl border border-gray-300 w-[210mm] max-w-full font-sans print:shadow-none print:border-none print:p-4"
                    style={{ position: 'relative', overflow: 'hidden', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                    {/* Background Watermark Logo */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, pointerEvents: 'none', zIndex: 0 }}>
                        <img src="/assets/images/logo.png" alt="watermark" style={{ width: '380px', height: '380px', objectFit: 'contain' }} />
                    </div>

                    {/* Top Header: Title + Logo & Address */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <div>
                            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#e79b21', margin: 0, textTransform: 'uppercase' }}>
                                {slip.slipType === 'Inward' ? 'GOODS RECEIPT NOTE (GRN)' : 'WEIGHMENT TICKET'}
                            </h1>
                            <p style={{ fontSize: '12px', color: '#555', marginTop: '3px', fontWeight: 'bold' }}>
                                slip no: {slip.slipNumber}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            <img src="/assets/images/logo.png" alt="Karthick Earth Movers" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                            <p style={{ fontSize: '11px', color: '#888', margin: 0, fontWeight: 'bold' }}>Stone Quarry &amp; Transport Unit</p>
                            <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>Mela Thattaparai, Thoothukudi - 628 304</p>
                            <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>karthickearthmovers@gmail.com</p>
                            <p style={{ fontSize: '11px', color: '#e79b21', margin: 0, fontWeight: 'bold', letterSpacing: '0.5px' }}>GST: 33AVFPK9827P2ZV</p>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #e0e6ed', margin: '10px 0 15px 0', position: 'relative', zIndex: 1 }} />

                    {/* 2-Column Detail Section Grid */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '14px' }}>
                        {/* Column 1: Issue For & Transport Info */}
                        <div>
                            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888', letterSpacing: '1px', marginBottom: '4px', fontWeight: 'bold' }}>ISSUE FOR &amp; TRANSPORT:</p>
                            <table className="compact-info-table" style={{ width: '100%', fontSize: '12px', lineHeight: '1.8', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '1.5px 0', color: '#888' }}>{slip.slipType === 'Inward' ? 'supplier name :' : 'customer name :'}</td>
                                        <td style={{ padding: '1.5px 0', fontWeight: 'bold', textAlign: 'right' }}>{slip.partyName || '—'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1.5px 0', color: '#888' }}>vehicle number :</td>
                                        <td style={{ padding: '1.5px 0', fontWeight: 'bold', textAlign: 'right', color: '#4361ee' }}>{slip.vehicleNumber}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1.5px 0', color: '#888' }}>driver name :</td>
                                        <td style={{ padding: '1.5px 0', fontWeight: 'bold', textAlign: 'right' }}>{slip.driverName || '—'}</td>
                                    </tr>
                                    {slip.driverMobile && (
                                        <tr>
                                            <td style={{ padding: '1.5px 0', color: '#888' }}>phone number :</td>
                                            <td style={{ padding: '1.5px 0', fontWeight: 'bold', textAlign: 'right' }}>{slip.driverMobile}</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td style={{ padding: '1.5px 0', color: '#888' }}>Challan No :</td>
                                        <td style={{ padding: '1.5px 0', fontWeight: 'bold', textAlign: 'right' }}>{slip.challanNo || '—'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Column 2: Material & Slip Details */}
                        <div>
                            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888', letterSpacing: '1px', marginBottom: '4px', fontWeight: 'bold' }}>SLIP &amp; MATERIAL DETAILS:</p>
                            <table className="compact-info-table" style={{ width: '100%', fontSize: '12px', lineHeight: '1.8', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '1.5px 0', color: '#888' }}>Issue Date :</td>
                                        <td style={{ padding: '1.5px 0', fontWeight: 'bold', textAlign: 'right' }}>{formatDate(slip.slipDate)}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1.5px 0', color: '#888' }}>Entry Time :</td>
                                        <td style={{ padding: '1.5px 0', fontWeight: 'bold', textAlign: 'right' }}>{slip.slipTime || formatTime(slip.firstWeighAt)}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1.5px 0', color: '#888' }}>Material Product :</td>
                                        <td style={{ padding: '1.5px 0', fontWeight: 'bold', textAlign: 'right', color: '#e79b21' }}>{slip.material?.name || '—'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1.5px 0', color: '#888' }}>Concrete Design :</td>
                                        <td style={{ padding: '1.5px 0', fontWeight: 'bold', textAlign: 'right' }}>{slip.volumeM3 ? `${slip.volumeM3} m³` : '—'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1.5px 0', color: '#888' }}>Weigh Operator :</td>
                                        <td style={{ padding: '1.5px 0', fontWeight: 'bold', textAlign: 'right' }}>{slip.operatorName || 'admin'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1.5px 0', color: '#888' }}>Moisture (%) :</td>
                                        <td style={{ padding: '1.5px 0', fontWeight: 'bold', textAlign: 'right' }}>{slip.moisturePercentage || 0} %</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1.5px 0', color: '#888' }}>Status :</td>
                                        <td style={{ padding: '1.5px 0', fontWeight: 'bold', textAlign: 'right', color: isOpen ? '#e2a03f' : '#00ab55' }}>
                                            {isOpen ? 'Open' : 'Completed'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #e0e6ed', margin: '0 0 15px 0', position: 'relative', zIndex: 1 }} />

                    {/* Weight Breakdown Table with Explicit Print Colors */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', position: 'relative', zIndex: 1, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                        <thead style={{ backgroundColor: '#e79b21', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                            <tr style={{ backgroundColor: '#e79b21', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <th style={{ background: '#e79b21', color: '#ffffff', padding: '10px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>S.NO</th>
                                <th style={{ background: '#e79b21', color: '#ffffff', padding: '10px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>WEIGHMENT STAGE</th>
                                <th style={{ background: '#e79b21', color: '#ffffff', padding: '10px 12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>WEIGHT IN KG</th>
                                <th style={{ background: '#e79b21', color: '#ffffff', padding: '10px 12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>WEIGHT IN METRIC TONS (MT)</th>
                                <th style={{ background: '#e79b21', color: '#ffffff', padding: '10px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>TIMESTAMPS</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #eee', fontSize: '12px' }}>1</td>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #eee', fontWeight: '600', fontSize: '12px' }}>Loaded Weight (Gross Weight)</td>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #eee', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{slip.grossWeight > 0 ? `${grossKg.toLocaleString()} kg` : 'PENDING'}</td>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #eee', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#4361ee' }}>{slip.grossWeight > 0 ? `${slip.grossWeight.toFixed(3)} MT` : '—'}</td>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #eee', textAlign: 'right', fontSize: '11px', color: '#666' }}>{formatDateTime(slip.grossWeighAt || slip.firstWeighAt)}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #eee', fontSize: '12px' }}>2</td>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #eee', fontWeight: '600', fontSize: '12px' }}>Empty Weight (Tare Weight)</td>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #eee', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{slip.tareWeight > 0 ? `${tareKg.toLocaleString()} kg` : 'PENDING'}</td>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #eee', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#4361ee' }}>{slip.tareWeight > 0 ? `${slip.tareWeight.toFixed(3)} MT` : '—'}</td>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #eee', textAlign: 'right', fontSize: '11px', color: '#666' }}>{formatDateTime(slip.tareWeighAt || slip.secondWeighAt)}</td>
                            </tr>
                            <tr style={{ background: '#f0fdf4', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="bg-net-weight">
                                <td style={{ padding: '10px 12px', borderBottom: '2px solid #00ab55', fontSize: '12px', fontWeight: 'bold', color: '#00ab55' }}>3</td>
                                <td style={{ padding: '10px 12px', borderBottom: '2px solid #00ab55', fontWeight: 'bold', fontSize: '12px', color: '#00ab55' }}>NET WEIGHT DELIVERED</td>
                                <td style={{ padding: '10px 12px', borderBottom: '2px solid #00ab55', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#00ab55' }}>{isOpen ? 'PENDING' : `${netKg.toLocaleString()} kg`}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '2px solid #00ab55', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#00ab55' }}>{isOpen ? '—' : `${slip.netWeight.toFixed(3)} MT`}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '2px solid #00ab55', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', color: '#00ab55' }}>{isOpen ? 'STEP 1 OPEN' : 'COMPLETED'}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Remarks Section if available */}
                    {slip.remarks && (
                        <div style={{ background: '#f8f9fa', padding: '9px 12px', borderRadius: '6px', marginBottom: '18px', fontSize: '12px', position: 'relative', zIndex: 1, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                            <span style={{ fontWeight: 'bold', color: '#888', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Remarks: </span>
                            <span style={{ color: '#555' }}>{slip.remarks}</span>
                        </div>
                    )}

                    {/* Signatures */}
                    <div style={{ position: 'relative', zIndex: 1, paddingTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ borderTop: '1px solid #ccc', width: '180px', paddingTop: '6px', fontSize: '11px', color: '#888' }}>Weigh Operator Signature</div>
                        </div>
                        <div style={{ textAlign: 'center', position: 'relative' }}>
                            <img
                                src="/assets/images/Karthick-Earthmovers-owner-sign.jpeg"
                                alt="Authorized Signature"
                                style={{
                                    width: '160px',
                                    position: 'absolute',
                                    top: '-40px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    opacity: 1,
                                    pointerEvents: 'none',
                                    mixBlendMode: 'multiply',
                                    filter: 'grayscale(1) contrast(8) brightness(5)',
                                    WebkitPrintColorAdjust: 'exact'
                                }}
                            />
                            <div style={{ borderTop: '1px solid #ccc', width: '180px', paddingTop: '6px', marginTop: '16px', fontSize: '11px', color: '#888' }}>Authorized Signature</div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div style={{ position: 'relative', zIndex: 1, marginTop: '18px', textAlign: 'center', fontSize: '10px', color: '#aaa', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                        <p>Thank you for your business! — Karthick Earth Movers</p>
                    </div>
                </div>
            </div>

            <style>{`
                .compact-info-table td {
                    padding: 1.5px 0 !important;
                    line-height: 1.8 !important;
                    vertical-align: middle !important;
                }
                @media print {
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    #weighment-ticket-a4 {
                        border: none !important;
                        box-shadow: none !important;
                        padding: 10mm !important;
                        width: 100% !important;
                        height: auto !important;
                        max-height: 297mm !important;
                        box-sizing: border-box !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .compact-info-table td {
                        padding: 1.5px 0 !important;
                        line-height: 1.8 !important;
                    }
                    th {
                        background-color: #e79b21 !important;
                        color: #ffffff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .bg-net-weight {
                        background-color: #f0fdf4 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </>
    );
};

export default WeighmentSlipPrint;
