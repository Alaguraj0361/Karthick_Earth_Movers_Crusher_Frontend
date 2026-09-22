'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';


interface Slip {
    _id: string;
    slipNumber: string;
    slipType: string;
    vehicleNumber: string;
    driverName?: string;
    driverMobile?: string;
    partyName?: string;
    partyCategory?: string;
    material?: { _id: string; name: string; unit: string; ratePerTon?: number };
    firstWeighType?: string;
    grossWeight: number;
    tareWeight: number;
    slipStatus: string;
    slipDate: string;
    ratePerTon?: number;
    gstPercentage?: number;
    paymentType?: string;
    challanNo?: string;
    volumeM3?: number;
    moisturePercentage?: number;
    operatorName?: string;
    purpose?: string;
}

const WeighmentCloseForm = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [openSlips, setOpenSlips] = useState<Slip[]>([]);
    const [selectedSlip, setSelectedSlip] = useState<Slip | null>(null);
    const [secondWeight, setSecondWeight] = useState('');
    const [ratePerTon, setRatePerTon] = useState('');
    const [gstPercentage, setGstPercentage] = useState('0');
    const [paymentType, setPaymentType] = useState('Cash'); // Cash, UPI, Bank Transfer, Credit
    const [amountPaid, setAmountPaid] = useState('');
    const [remarks, setRemarks] = useState('');
    const [challanNo, setChallanNo] = useState('');
    const [volumeM3, setVolumeM3] = useState('');
    const [moisturePercentage, setMoisturePercentage] = useState('0');
    const [operatorName, setOperatorName] = useState('admin');
    const [products, setProducts] = useState<any[]>([]);
    const [materialId, setMaterialId] = useState('');
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        fetchOpenSlips();
        api.get('/products?status=active').then(res => setProducts(res.data.data || [])).catch(() => {});
    }, []);

    const fetchOpenSlips = async () => {
        try {
            const res = await api.get('/weighment?slipStatus=Open');
            setOpenSlips(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const searchOpenSlips = async (q: string) => {
        setSearching(true);
        try {
            const res = await api.get(`/weighment?slipStatus=Open&search=${encodeURIComponent(q)}`);
            setOpenSlips(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (e.target.value.length > 1) {
            searchOpenSlips(e.target.value);
        } else if (!e.target.value) {
            fetchOpenSlips();
        }
    };

    const selectSlip = (slip: Slip) => {
        setSelectedSlip(slip);
        setOpenSlips([]);
        setSearchTerm('');
        setSecondWeight('');
        setRatePerTon(slip.ratePerTon ? String(slip.ratePerTon) : (slip.material?.ratePerTon ? String(slip.material.ratePerTon) : '950'));
        setGstPercentage(slip.gstPercentage !== undefined ? String(slip.gstPercentage) : '0');
        setPaymentType(slip.paymentType || 'Cash');
        setAmountPaid('');
        setChallanNo(slip.challanNo || '');
        setVolumeM3(slip.volumeM3 ? String(slip.volumeM3) : '');
        setMoisturePercentage(slip.moisturePercentage !== undefined ? String(slip.moisturePercentage) : '0');
        setOperatorName(slip.operatorName || 'admin');
        setMaterialId(slip.material?._id || '');
    };

    const isInitialTare = selectedSlip?.firstWeighType === 'Empty Vehicle (Tare)' || (selectedSlip?.tareWeight! > 0 && selectedSlip?.grossWeight === 0);

    // Calculate Net Weight, Amounts, GST, Total & Balance
    const secondW = parseFloat(secondWeight || '0');
    let gross = isInitialTare ? secondW : (selectedSlip?.grossWeight || 0);
    let tare = isInitialTare ? (selectedSlip?.tareWeight || 0) : secondW;
    const netWeight = (gross > 0 && tare > 0 && gross > tare) ? parseFloat((gross - tare).toFixed(3)) : 0;
    
    const rate = parseFloat(ratePerTon || '0');
    const subtotal = parseFloat((netWeight * rate).toFixed(2));
    const gstPercent = parseFloat(gstPercentage || '0');
    const gstAmt = parseFloat(((subtotal * gstPercent) / 100).toFixed(2));
    const grandTotal = parseFloat((subtotal + gstAmt).toFixed(2));
    
    const paid = paymentType === 'Credit' ? parseFloat(amountPaid || '0') : grandTotal;
    const balance = Math.max(0, parseFloat((grandTotal - paid).toFixed(2)));

    const handleClose = async () => {
        if (!selectedSlip) return;
        if (!secondWeight || secondW <= 0) {
            return Swal.fire('Error', `Please enter valid ${isInitialTare ? 'gross' : 'tare'} weight`, 'error');
        }
        if (tare >= gross) {
            return Swal.fire('Error', 'Tare weight cannot be equal to or greater than gross weight', 'error');
        }

        const isInward = selectedSlip.slipType === 'Inward' || selectedSlip.purpose === 'Purchase';

        const confirm = await Swal.fire({
            title: 'Confirm 2nd Weight Entry',
            html: `
                <div style="font-family: system-ui, -apple-system, sans-serif; text-align: left; padding: 2px;">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-top: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
                            <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">SUMMARY SLIP</span>
                            <span style="background: #eff6ff; color: #2563eb; font-weight: 800; font-family: monospace; font-size: 13px; padding: 2px 8px; border-radius: 6px; border: 1px solid #bfdbfe;">
                                ${selectedSlip.slipNumber}
                            </span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                            <div>
                                <span style="color: #64748b; font-size: 10px; display: block; font-weight: 700; text-transform: uppercase;">Vehicle No</span>
                                <b style="font-size: 13px; font-family: monospace; color: #0f172a;">${selectedSlip.vehicleNumber}</b>
                            </div>
                            <div>
                                <span style="color: #64748b; font-size: 10px; display: block; font-weight: 700; text-transform: uppercase;">Party Name</span>
                                <b style="color: #1e293b;">${selectedSlip.partyName || '—'}</b>
                            </div>
                            <div>
                                <span style="color: #64748b; font-size: 10px; display: block; font-weight: 700; text-transform: uppercase;">Gross / Tare</span>
                                <b style="color: #1e293b;">${gross} MT / ${tare} MT</b>
                            </div>
                            <div>
                                <span style="color: #64748b; font-size: 10px; display: block; font-weight: 700; text-transform: uppercase;">Net Weight</span>
                                <b style="color: #2563eb; font-size: 14px;">${netWeight} MT</b>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '✅ Complete 2nd Weighment',
            cancelButtonText: 'Cancel',
            customClass: {
                confirmButton: 'btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 mx-1 rounded-xl text-xs shadow-md',
                cancelButton: 'btn bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 font-bold px-4 py-2.5 mx-1 rounded-xl text-xs border border-gray-300'
            },
            buttonsStyling: false
        });
        if (!confirm.isConfirmed) return;

        setLoading(true);
        try {
            const payload: any = {
                grossWeight: gross,
                tareWeight: tare,
                ratePerTon: rate,
                subtotalAmount: subtotal,
                gstPercentage: gstPercent,
                gstAmount: gstAmt,
                totalAmount: grandTotal,
                paymentType,
                amountPaid: paid,
                balanceAmount: balance,
                challanNo,
                volumeM3: parseFloat(volumeM3 || '0'),
                moisturePercentage: parseFloat(moisturePercentage || '0'),
                operatorName,
                material: materialId,
                remarks
            };

            await api.put(`/weighment/${selectedSlip._id}/close`, payload);

            await Swal.fire({
                icon: 'success',
                title: '2nd Weighment Completed!',
                html: `
                    <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 4px;">
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-top: 8px;">
                            <div style="font-size: 32px; font-weight: 900; color: #16a34a; font-family: monospace;">${netWeight} MT</div>
                            <div style="color: #15803d; font-weight: 700; font-size: 13px; margin-top: 2px;">Net Delivered Weight</div>
                        </div>
                        <p style="margin-top: 12px; font-size: 13px; color: #475569;">
                            Slip <b style="font-family: monospace; color: #0f172a;">${selectedSlip.slipNumber}</b> closed successfully. Details synced to Purchases/Sales.
                        </p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '🖨️ Print Slip',
                cancelButtonText: 'Done',
                customClass: {
                    confirmButton: 'btn bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 mx-1 rounded-xl text-xs shadow-md',
                    cancelButton: 'btn bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 font-bold px-5 py-2.5 mx-1 rounded-xl text-xs border border-gray-300'
                },
                buttonsStyling: false
            }).then(r => {
                if (r.isConfirmed) {
                    window.open(`/weighment/print/${selectedSlip._id}`, '_blank');
                }
            });

            setSelectedSlip(null);
            setSecondWeight('');
            setRemarks('');
            fetchOpenSlips();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.error || 'Failed to complete weighment', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel max-w-4xl mx-auto shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-teal-700 flex items-center justify-center text-white text-2xl shadow-lg">⚖️</div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">2nd Weight Entry (இரண்டாம் எடை)</h1>
                    <p className="text-sm text-gray-500">Record 2nd weight reading (Tare/Gross), calculate Net Weight, and auto-sync to Purchase &amp; Sales module.</p>
                </div>
            </div>

            {/* Search Open Slips */}
            {!selectedSlip && (
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Select Vehicle Pending 2nd Weight (இரண்டாம் எடை பெற காத்திருக்கும் வாகனம்)
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Search by Slip No / Vehicle No / Party Name..."
                            className="form-input pl-10 font-bold"
                            id="weighment-close-search"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    </div>

                    <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                        {searching && <p className="text-center text-sm text-gray-400 py-4">Searching pending entries...</p>}
                        {!searching && openSlips.length === 0 && (
                            <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center">
                                <p className="text-base font-bold text-gray-600 dark:text-gray-400">No pending vehicle entries found for 2nd weight</p>
                                <button onClick={() => router.push('/weighment/new')} className="btn btn-primary btn-sm mt-3 mx-auto shadow-sm">
                                    + Start New Vehicle Entry
                                </button>
                            </div>
                        )}
                        {openSlips.map(slip => {
                            const isTare = slip.firstWeighType === 'Empty Vehicle (Tare)' || (slip.tareWeight > 0 && slip.grossWeight === 0);
                            return (
                                <div
                                    key={slip._id}
                                    onClick={() => selectSlip(slip)}
                                    className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition shadow-sm"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-blue-900 dark:text-blue-300 text-base">{slip.slipNumber}</span>
                                            <span className="badge badge-outline-blue text-[10px] font-bold">
                                                {isTare ? '🚛 Tare Captured' : '🚚 Gross Captured'}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-1">
                                            Vehicle: {slip.vehicleNumber} | Party: {slip.partyName || '—'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Material: {slip.material?.name || '—'} | 1st Weight: <b className="text-primary">{isTare ? `${slip.tareWeight} MT` : `${slip.grossWeight} MT`}</b>
                                        </p>
                                    </div>
                                    <button className="btn btn-sm btn-success shadow-sm font-bold">
                                        2nd Weigh ➡️
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Selected Slip Form */}
            {selectedSlip && (
                <div className="space-y-5">
                    {/* Vehicle Info */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">Step 1 Data Loaded</span>
                                <h3 className="font-black text-gray-900 dark:text-white text-xl">{selectedSlip.slipNumber}</h3>
                            </div>
                            <button onClick={() => setSelectedSlip(null)} className="btn btn-outline-danger btn-sm">✕ Select Different Vehicle</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div><span className="text-gray-500 block">Vehicle No:</span> <span className="font-bold text-sm text-primary">{selectedSlip.vehicleNumber}</span></div>
                            <div><span className="text-gray-500 block">Driver:</span> <span className="font-semibold">{selectedSlip.driverName || '—'}</span></div>
                            <div><span className="text-gray-500 block">Party Name:</span> <span className="font-semibold">{selectedSlip.partyName || '—'}</span></div>
                            <div>
                                <span className="text-gray-500 block">1st Weight (Empty/Gross):</span> 
                                <span className="font-black text-sm text-blue-700 dark:text-blue-300">
                                    {isInitialTare ? `${selectedSlip.tareWeight} MT (Empty Tare)` : `${selectedSlip.grossWeight} MT (Gross)`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Second Weight & Net Weight */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-amber-50/80 dark:bg-amber-950/20 rounded-xl border-2 border-amber-300 dark:border-amber-700">
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                <label className="block text-xs font-black uppercase tracking-wide text-amber-900 dark:text-amber-200">
                                    {isInitialTare ? '🚚 2nd Weight — Gross Weight (பார எடை - MT)' : '🚛 2nd Weight — Tare Weight (வெற்று எடை - MT)'} <span className="text-red-500">*</span>
                                </label>
                                {secondWeight && !isNaN(parseFloat(secondWeight)) && parseFloat(secondWeight) > 0 && (
                                    <span className="text-xs font-mono font-bold bg-white dark:bg-gray-800 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-gray-700 shadow-sm text-gray-700 dark:text-gray-300">
                                        = {Math.round(parseFloat(secondWeight) * 1000).toLocaleString('en-IN')} kg
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={secondWeight}
                                    onChange={e => setSecondWeight(e.target.value)}
                                    placeholder="0.000"
                                    step="0.001"
                                    min="0"
                                    className="form-input text-2xl font-black font-mono tracking-wider h-13 pl-4 pr-16 text-amber-700 dark:text-amber-300 rounded-xl border-2 focus:border-amber-600"
                                    autoFocus
                                    required
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold text-gray-400 text-sm pointer-events-none">
                                    MT
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                                Enter manual 2nd weighbridge reading in <b>Metric Tons (MT)</b>
                            </p>
                        </div>

                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-400 text-center flex flex-col items-center justify-center">
                            <span className="text-xs font-black text-green-700 dark:text-green-300 uppercase tracking-wider">Calculated Net Weight</span>
                            <span className="text-4xl font-black text-green-700 dark:text-green-300 font-mono mt-1">
                                {netWeight.toFixed(3)} MT
                            </span>
                            <span className="text-[10px] text-green-600 dark:text-green-400 mt-1 font-bold">
                                Gross ({gross} MT) − Tare ({tare} MT) = {netWeight} MT
                            </span>
                        </div>
                    </div>

                    {/* Loaded Dispatch Details */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xs font-black text-primary uppercase tracking-wider mb-3">
                            Loaded Dispatch Details (பார சுமை விவரங்கள்)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Product Material (பொருள்) <span className="text-red-500">*</span></label>
                                <select value={materialId} onChange={e => setMaterialId(e.target.value)} className="form-select font-bold">
                                    <option value="">-- Choose Material --</option>
                                    {products.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} ({p.unit})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Challan No (சலான் எண்)</label>
                                <input type="text" value={challanNo} onChange={e => setChallanNo(e.target.value)} placeholder="e.g. 24" className="form-input font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Concrete Design Vol (m³)</label>
                                <input type="number" step="0.001" value={volumeM3} onChange={e => setVolumeM3(e.target.value)} placeholder="e.g. 19.760" className="form-input font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Moisture (%) (ஈரப்பதம்)</label>
                                <input type="number" step="0.1" value={moisturePercentage} onChange={e => setMoisturePercentage(e.target.value)} placeholder="0" className="form-input font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Weigh Operator Name</label>
                                <input type="text" value={operatorName} onChange={e => setOperatorName(e.target.value)} placeholder="admin" className="form-input font-bold" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Remarks / Entry Notes</label>
                        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} className="form-textarea font-medium" placeholder="Optional notes..." />
                    </div>

                    <button
                        onClick={handleClose}
                        disabled={loading || !secondWeight || secondW <= 0}
                        className="btn btn-success w-full py-3.5 text-base font-bold rounded-xl shadow-lg"
                        id="close-slip-btn"
                    >
                        {loading
                            ? <span className="flex items-center justify-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>Saving 2nd Weight...</span>
                            : '⚖️ Complete 2nd Weighment & Close Ticket'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default WeighmentCloseForm;
