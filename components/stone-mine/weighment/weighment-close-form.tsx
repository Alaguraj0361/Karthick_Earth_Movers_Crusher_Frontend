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
    partyName?: string;
    material?: { name: string; unit: string };
    grossWeight: number;
    slipStatus: string;
    slipDate: string;
    vehicleId?: { _id: string; vehicleNumber: string; emptyWeightMT?: number; emptyWeightUpdatedAt?: string };
}

interface VehicleTareInfo {
    _id: string;
    vehicleNumber: string;
    emptyWeightMT: number;
    hasStoredTare: boolean;
    emptyWeightUpdatedAt?: string;
}

const WeighmentCloseForm = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [openSlips, setOpenSlips] = useState<Slip[]>([]);
    const [selectedSlip, setSelectedSlip] = useState<Slip | null>(null);
    const [tareWeight, setTareWeight] = useState('');
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [vehicleTareInfo, setVehicleTareInfo] = useState<VehicleTareInfo | null>(null);
    const [saveNewTare, setSaveNewTare] = useState(false);
    const [useStoredTare, setUseStoredTare] = useState(false);

    // Load all open slips on mount
    useEffect(() => {
        const fetchOpen = async () => {
            const res = await api.get('/weighment?slipStatus=Open');
            setOpenSlips(res.data.data || []);
        };
        fetchOpen();
    }, []);

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
            api.get('/weighment?slipStatus=Open').then(r => setOpenSlips(r.data.data || []));
        }
    };

    // Fetch stored tare weight for a vehicle
    const fetchVehicleTare = async (vehicleNumber: string) => {
        try {
            const res = await api.get(`/weighment/vehicle-tare?vehicleNumber=${encodeURIComponent(vehicleNumber)}`);
            if (res.data.found && res.data.data?.hasStoredTare) {
                setVehicleTareInfo(res.data.data);
            } else {
                setVehicleTareInfo(null);
            }
        } catch {
            setVehicleTareInfo(null);
        }
    };

    const selectSlip = async (slip: Slip) => {
        setSelectedSlip(slip);
        setOpenSlips([]);
        setSearchTerm('');
        setTareWeight('');
        setUseStoredTare(false);
        setSaveNewTare(false);
        setVehicleTareInfo(null);

        // Auto-fetch stored tare for this vehicle
        await fetchVehicleTare(slip.vehicleNumber);
    };

    // When useStoredTare is toggled, auto-fill tare weight
    useEffect(() => {
        if (useStoredTare && vehicleTareInfo) {
            setTareWeight(vehicleTareInfo.emptyWeightMT.toString());
        } else if (!useStoredTare) {
            setTareWeight('');
        }
    }, [useStoredTare, vehicleTareInfo]);

    const handleClose = async () => {
        if (!selectedSlip) return;

        const tare = parseFloat(tareWeight);
        if (!tareWeight || isNaN(tare) || tare <= 0) {
            return Swal.fire('Error', 'Please enter tare weight', 'error');
        }
        if (tare >= selectedSlip.grossWeight) {
            return Swal.fire('Error', 'Tare weight cannot be equal to or greater than gross weight', 'error');
        }
        const net = parseFloat((selectedSlip.grossWeight - tare).toFixed(3));

        // Check if entered tare differs significantly from stored tare
        const storedTareAlert = vehicleTareInfo?.hasStoredTare && !useStoredTare
            ? `<p style="margin-top:8px; padding:6px; background:#fff3cd; border-radius:6px; font-size:12px; color:#856404;">
                ⚠️ Note: Stored tare for this vehicle is <b>${vehicleTareInfo.emptyWeightMT} MT</b>. You entered <b>${tare} MT</b>.
               </p>`
            : '';

        const confirm = await Swal.fire({
            title: 'Confirm 2nd Weigh',
            html: `
                <div style="text-align:left; font-size:14px; line-height:2; background:#f9fafb; padding:12px; border-radius:8px">
                    <b>Slip:</b> ${selectedSlip.slipNumber}<br/>
                    <b>Vehicle:</b> ${selectedSlip.vehicleNumber}<br/>
                    <b>Gross Weight:</b> <span style="color:#1d4ed8">${selectedSlip.grossWeight} MT</span><br/>
                    <b>Tare Weight:</b> <span style="color:#ea580c">${tare} MT</span><br/>
                    <hr style="margin:8px 0"/>
                    <b style="font-size:18px; color:#16a34a">Net Weight: ${net} MT</b>
                </div>
                ${storedTareAlert}
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '✅ Close Slip',
            cancelButtonText: 'Cancel',
        });
        if (!confirm.isConfirmed) return;

        setLoading(true);
        try {
            await api.put(`/weighment/${selectedSlip._id}/close`, { tareWeight: tare, remarks });

            // If user checked "save new tare", update the vehicle master
            if (saveNewTare && vehicleTareInfo?._id && !useStoredTare) {
                try {
                    await api.put(`/weighment/vehicle-tare/${vehicleTareInfo._id}`, { emptyWeightMT: tare });
                } catch {
                    // Non-critical — don't fail the close
                }
            }

            await Swal.fire({
                icon: 'success',
                title: 'Slip Closed!',
                html: `
                    <div style="text-align:center">
                        <div style="font-size:36px; font-weight:900; color:#16a34a">${net} MT</div>
                        <div style="color:#6b7280">Net Weight</div>
                        <div style="margin-top:8px">Slip <b>${selectedSlip.slipNumber}</b> has been closed.</div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '🖨️ Print Challan',
                cancelButtonText: 'Done',
            }).then(r => {
                if (r.isConfirmed) {
                    window.open(`/weighment/print/${selectedSlip._id}`, '_blank');
                }
            });

            // Reset
            setSelectedSlip(null);
            setTareWeight('');
            setRemarks('');
            setVehicleTareInfo(null);
            setSaveNewTare(false);
            setUseStoredTare(false);

            // Reload open slips
            const res = await api.get('/weighment?slipStatus=Open');
            setOpenSlips(res.data.data || []);
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.error || 'Failed to close slip', 'error');
        } finally {
            setLoading(false);
        }
    };

    const netPreview = selectedSlip && tareWeight && parseFloat(tareWeight) > 0
        ? Math.max(0, selectedSlip.grossWeight - parseFloat(tareWeight))
        : null;

    const isTareSameAsStored = vehicleTareInfo?.hasStoredTare && parseFloat(tareWeight) === vehicleTareInfo.emptyWeightMT;

    return (
        <div className="panel max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-2xl shadow-lg">🔒</div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Close Weighment</h1>
                    <p className="text-sm text-gray-500">2nd Weigh — Enter tare weight to calculate net weight and close slip</p>
                </div>
            </div>

            {/* Search — shown only when no slip selected */}
            {!selectedSlip && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Search Open Slip (Slip No / Vehicle No / Party)
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Type to search open slips..."
                            className="form-input pl-10"
                            id="weighment-close-search"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    </div>

                    <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                        {searching && <p className="text-center text-sm text-gray-400 py-4">Searching...</p>}
                        {!searching && openSlips.length === 0 && (
                            <p className="text-center text-sm text-gray-400 py-6">No open slips found</p>
                        )}
                        {openSlips.map(slip => (
                            <div
                                key={slip._id}
                                onClick={() => selectSlip(slip)}
                                className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition"
                            >
                                <div>
                                    <p className="font-bold text-yellow-800 dark:text-yellow-300">{slip.slipNumber}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {slip.vehicleNumber} {slip.partyName ? `| ${slip.partyName}` : ''}
                                    </p>
                                    <p className="text-xs text-gray-500">{slip.material?.name} | Gross: {slip.grossWeight} MT</p>
                                </div>
                                <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">OPEN</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected Slip + Tare Entry */}
            {selectedSlip && (
                <div className="space-y-5">
                    {/* Slip Info */}
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{selectedSlip.slipNumber}</h3>
                            <button onClick={() => { setSelectedSlip(null); setVehicleTareInfo(null); }} className="text-gray-400 hover:text-gray-600 text-sm">✕ Change</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-gray-500">Vehicle:</span> <span className="font-bold">{selectedSlip.vehicleNumber}</span></div>
                            <div><span className="text-gray-500">Driver:</span> <span className="font-semibold">{selectedSlip.driverName || '—'}</span></div>
                            <div><span className="text-gray-500">Party:</span> <span className="font-semibold">{selectedSlip.partyName || '—'}</span></div>
                            <div><span className="text-gray-500">Material:</span> <span className="font-semibold">{selectedSlip.material?.name || '—'}</span></div>
                            <div className="col-span-2 pt-1 border-t border-gray-200 dark:border-gray-700 mt-1">
                                <span className="text-gray-500">Gross Weight (1st Weigh):</span>
                                <span className="font-black text-blue-600 text-xl ml-2">{selectedSlip.grossWeight} MT</span>
                            </div>
                        </div>
                    </div>

                    {/* ─── Vehicle Empty Weight Info ─── */}
                    {vehicleTareInfo?.hasStoredTare ? (
                        <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-300 dark:border-teal-700 rounded-xl">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">💾</span>
                                <div className="flex-1">
                                    <p className="font-bold text-teal-800 dark:text-teal-300">Stored Tare Weight Found</p>
                                    <p className="text-sm text-teal-600 dark:text-teal-400 mt-0.5">
                                        <b>{selectedSlip.vehicleNumber}</b> empty weight: <b>{vehicleTareInfo.emptyWeightMT} MT</b>
                                        {vehicleTareInfo.emptyWeightUpdatedAt && (
                                            <span className="text-xs text-teal-500 ml-2">
                                                (Last verified: {new Date(vehicleTareInfo.emptyWeightUpdatedAt).toLocaleDateString('en-IN')})
                                            </span>
                                        )}
                                    </p>
                                    <div className="mt-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useStoredTare}
                                                onChange={e => setUseStoredTare(e.target.checked)}
                                                className="form-checkbox h-4 w-4 text-teal-600"
                                                id="use-stored-tare"
                                            />
                                            <span className="text-sm font-semibold text-teal-800 dark:text-teal-300">
                                                Use stored tare weight ({vehicleTareInfo.emptyWeightMT} MT) — skip 2nd weigh
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : vehicleTareInfo !== null ? (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <p className="text-sm text-gray-500">
                                ℹ️ <b>{selectedSlip.vehicleNumber}</b> is in the system but no tare weight stored yet. Enter tare below and optionally save it for future use.
                            </p>
                        </div>
                    ) : (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                            <p className="text-sm text-gray-500">
                                ℹ️ Vehicle not found in master. Enter tare weight manually below.
                            </p>
                        </div>
                    )}

                    {/* Tare Weight Input */}
                    <div className={`p-4 rounded-xl border-2 transition ${
                        useStoredTare
                            ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-400 dark:border-teal-600'
                            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
                    }`}>
                        <label className={`block text-sm font-bold mb-2 ${useStoredTare ? 'text-teal-800 dark:text-teal-300' : 'text-orange-800 dark:text-orange-300'}`}>
                            {useStoredTare ? '💾 Tare Weight (from vehicle master)' : '🪶 Tare Weight (MT) — 2nd Weigh (Empty Vehicle)'}
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="number"
                            value={tareWeight}
                            onChange={e => { setTareWeight(e.target.value); if (useStoredTare) setUseStoredTare(false); }}
                            placeholder="Enter tare weight in Metric Tons"
                            step="0.001"
                            min="0"
                            max={selectedSlip.grossWeight - 0.001}
                            className={`form-input text-xl font-bold ${useStoredTare ? 'text-teal-700 dark:text-teal-300' : 'text-orange-700 dark:text-orange-300'}`}
                            id="tare-weight-input"
                            autoFocus={!useStoredTare}
                            readOnly={useStoredTare}
                        />

                        {/* Tare mismatch warning */}
                        {vehicleTareInfo?.hasStoredTare && tareWeight && !useStoredTare && parseFloat(tareWeight) !== vehicleTareInfo.emptyWeightMT && (
                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg text-xs text-yellow-800 dark:text-yellow-300">
                                ⚠️ Entered tare ({parseFloat(tareWeight).toFixed(3)} MT) differs from stored ({vehicleTareInfo.emptyWeightMT} MT).
                                Check if the vehicle is carrying any extra load.
                            </div>
                        )}

                        {/* Save new tare option — only show when entering manually and vehicle exists in master */}
                        {!useStoredTare && vehicleTareInfo && tareWeight && parseFloat(tareWeight) > 0 && (
                            <label className="flex items-center gap-2 cursor-pointer mt-3">
                                <input
                                    type="checkbox"
                                    checked={saveNewTare}
                                    onChange={e => setSaveNewTare(e.target.checked)}
                                    className="form-checkbox h-4 w-4"
                                    id="save-new-tare"
                                />
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Save <b>{parseFloat(tareWeight).toFixed(3)} MT</b> as new tare for {selectedSlip.vehicleNumber}
                                </span>
                            </label>
                        )}
                    </div>

                    {/* Net Weight Preview */}
                    {netPreview !== null && netPreview > 0 && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-400 dark:border-green-600 text-center">
                            <p className="text-sm text-green-700 dark:text-green-400 font-medium">Calculated Net Weight</p>
                            <p className="text-5xl font-black text-green-600 dark:text-green-400 mt-1 tabular-nums">
                                {netPreview.toFixed(3)} MT
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                                {selectedSlip.grossWeight} − {parseFloat(tareWeight).toFixed(3)} = {netPreview.toFixed(3)} MT
                            </p>
                        </div>
                    )}

                    {netPreview !== null && netPreview <= 0 && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 rounded-xl text-center text-red-600 font-bold text-sm">
                            ❌ Tare weight must be less than gross weight ({selectedSlip.grossWeight} MT)
                        </div>
                    )}

                    {/* Remarks */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks</label>
                        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} className="form-textarea" placeholder="Optional..." />
                    </div>

                    <button
                        onClick={handleClose}
                        disabled={loading || !tareWeight || parseFloat(tareWeight) <= 0}
                        className="btn btn-warning w-full py-3 text-base font-bold rounded-xl"
                        id="close-slip-btn"
                    >
                        {loading
                            ? <span className="flex items-center justify-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>Closing...</span>
                            : '🔒 Close Slip & Calculate Net Weight'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default WeighmentCloseForm;
