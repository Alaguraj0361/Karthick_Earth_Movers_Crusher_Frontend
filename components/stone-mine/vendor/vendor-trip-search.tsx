'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import api from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';
import IconSearch from '@/components/icon/icon-search';
import IconDownload from '@/components/icon/icon-download';
import * as XLSX from 'xlsx';

// ─── Excel Export Helper ────────────────────────────────────────────────────
const exportToExcel = (data: any[], fileName: string) => {
    if (!data || data.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(
        data.map((item: any) => ({
            Date: new Date(item.date).toLocaleDateString('en-GB'),
            Vehicle: (
                item.vehicleId?.vehicleNumber ||
                item.vehicleId?.registrationNumber ||
                item.manualVehicleNumber ||
                'N/A'
            ).toUpperCase(),
            Material: item.stoneTypeId?.name || 'General',
            From: item.fromLocation || '',
            To: item.toLocation || '',
            'Tons / Qty': item.loadQuantity || 0,
            Status: item.isVendorSettled ? 'Settled' : 'Pending',
        }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trips');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// ─── Summary Card ───────────────────────────────────────────────────────────
const StatCard = ({
    label,
    value,
    sub,
    color = 'text-slate-800',
    bg = 'bg-slate-50',
    border = 'border-slate-200',
    icon,
}: {
    label: string;
    value: string | number;
    sub?: string;
    color?: string;
    bg?: string;
    border?: string;
    icon: string;
}) => (
    <div className={`${bg} border ${border} rounded-2xl p-5 shadow-sm flex flex-col gap-2`}>
        <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
        <div className={`text-2xl font-black ${color}`}>{value}</div>
        {sub && <div className="text-[10px] text-slate-400 font-bold">{sub}</div>}
    </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────
const VendorTripSearch = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';
    const { showToast } = useToast();

    const [allVendors, setAllVendors] = useState<any[]>([]);
    const [trips, setTrips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0];

    const [params, setParams] = useState({
        vendorId: '',
        startDate: firstOfMonth,
        endDate: today,
        statusFilter: 'all', // 'all' | 'settled' | 'unsettled'
    });

    // Load vendors on mount
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const res = await api.get('/vendors/transport');
                if (res.data.success) {
                    const mapped = res.data.data.map((v: any) => ({
                        ...v,
                        type: 'TransportVendor',
                        label: `${v.companyName ? `${v.companyName} - ` : ''}${v.name} (${v.vehicles?.length || 0} Vehicles)`,
                    }));
                    setAllVendors(mapped);
                }
            } catch {
                showToast('Error loading vendors', 'error');
            }
        };
        fetchVendors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = async () => {
        if (!params.vendorId) return showToast('Please select a vendor first', 'error');
        try {
            setIsLoading(true);
            setHasSearched(true);
            const res = await api.get(
                `/trips?startDate=${params.startDate}&endDate=${params.endDate}T23:59:59.999Z`
            );
            if (res.data.success) {
                const vendor = allVendors.find((v) => v._id === params.vendorId);
                const normalize = (s: string) => (s || '').replace(/[\s-]/g, '').toLowerCase();
                const vehicleNumbers = (vendor?.vehicles || []).map((v: any) =>
                    normalize(v.vehicleNumber)
                );

                let filtered = res.data.data.filter((t: any) => {
                    const tripVNum = normalize(
                        t.vehicleId?.vehicleNumber ||
                        t.vehicleId?.registrationNumber ||
                        t.manualVehicleNumber ||
                        ''
                    );
                    return vehicleNumbers.includes(tripVNum);
                });

                if (params.statusFilter === 'settled') filtered = filtered.filter((t: any) => t.isVendorSettled);
                if (params.statusFilter === 'unsettled') filtered = filtered.filter((t: any) => !t.isVendorSettled);

                setTrips(filtered);
                if (filtered.length === 0) showToast('No trips found for selected filters', 'info');
            }
        } catch {
            showToast('Error fetching trips', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Derived stats
    const totalTrips = trips.length;
    const totalTons = trips.reduce((s, t) => s + (t.loadQuantity || 0), 0);
    const settledCount = trips.filter((t) => t.isVendorSettled).length;
    const unsettledCount = trips.filter((t) => !t.isVendorSettled).length;

    // Group by material
    const byMaterial: Record<string, { tons: number; count: number }> = {};
    trips.forEach((t) => {
        const mat = t.stoneTypeId?.name || 'General';
        if (!byMaterial[mat]) byMaterial[mat] = { tons: 0, count: 0 };
        byMaterial[mat].tons += t.loadQuantity || 0;
        byMaterial[mat].count += 1;
    });

    const selectedVendorName = allVendors.find((v) => v._id === params.vendorId)?.label || '';

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-black uppercase text-primary tracking-tighter">
                        Vendor Trip Search
                    </h2>
                    <p className="text-white-dark text-[10px] font-bold uppercase tracking-widest mt-1">
                        Search, filter &amp; export vendor trip records
                    </p>
                </div>
                {trips.length > 0 && (
                    <button
                        onClick={() =>
                            exportToExcel(
                                trips,
                                `${selectedVendorName.replace(/[^a-z0-9]/gi, '_')}_Trips_${params.startDate}_to_${params.endDate}`
                            )
                        }
                        className="btn btn-success flex items-center gap-2 px-5 shadow-lg"
                    >
                        <IconDownload className="w-4 h-4" />
                        <span className="font-black uppercase text-[11px] tracking-widest">
                            Export Excel ({totalTrips})
                        </span>
                    </button>
                )}
            </div>

            {/* ── Filter Panel ── */}
            <div className="panel rounded-2xl shadow-sm">
                <h6 className="text-[10px] font-black uppercase tracking-widest mb-5 text-slate-400 flex items-center gap-2">
                    <span className="w-6 h-1 bg-primary rounded-full inline-block" />
                    Search Filters
                </h6>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    {/* Vendor */}
                    <div className="lg:col-span-2">
                        <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">
                            Transport Vendor
                        </label>
                        <select
                            className="form-select text-xs font-bold"
                            value={params.vendorId}
                            onChange={(e) => setParams((p) => ({ ...p, vendorId: e.target.value }))}
                        >
                            <option value="">-- Select Vendor --</option>
                            {allVendors.map((v) => (
                                <option key={v._id} value={v._id}>
                                    {v.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">
                            From Date
                        </label>
                        <input
                            type="date"
                            className="form-input text-xs font-bold"
                            value={params.startDate}
                            onChange={(e) => setParams((p) => ({ ...p, startDate: e.target.value }))}
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">
                            To Date
                        </label>
                        <input
                            type="date"
                            className="form-input text-xs font-bold"
                            value={params.endDate}
                            onChange={(e) => setParams((p) => ({ ...p, endDate: e.target.value }))}
                        />
                    </div>

                    {/* Status & Search */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">
                            Trip Status
                        </label>
                        <div className="flex gap-2">
                            <select
                                className="form-select text-xs font-bold flex-1"
                                value={params.statusFilter}
                                onChange={(e) => setParams((p) => ({ ...p, statusFilter: e.target.value }))}
                            >
                                <option value="all">All</option>
                                <option value="unsettled">Unsettled</option>
                                <option value="settled">Settled</option>
                            </select>
                            <button
                                onClick={handleSearch}
                                disabled={isLoading || !params.vendorId}
                                className="btn btn-primary flex items-center gap-1 px-4 font-black uppercase text-[10px] tracking-widest disabled:opacity-40"
                            >
                                {isLoading ? (
                                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                                ) : (
                                    <IconSearch className="w-4 h-4" />
                                )}
                                <span className="hidden sm:inline">Search</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Summary Stats (shown after search) ── */}
            {hasSearched && trips.length > 0 && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon="🚛"
                            label="Total Trips"
                            value={totalTrips}
                            color="text-slate-800"
                            bg="bg-slate-50"
                            border="border-slate-200"
                        />
                        <StatCard
                            icon="⚖️"
                            label="Total Tonnage"
                            value={`${totalTons.toFixed(2)} T`}
                            color="text-primary"
                            bg="bg-blue-50"
                            border="border-blue-100"
                        />
                        <StatCard
                            icon="✅"
                            label="Settled"
                            value={settledCount}
                            sub={`${((settledCount / totalTrips) * 100).toFixed(0)}% of trips`}
                            color="text-emerald-600"
                            bg="bg-emerald-50"
                            border="border-emerald-100"
                        />
                        <StatCard
                            icon="⏳"
                            label="Unsettled"
                            value={unsettledCount}
                            sub={`${((unsettledCount / totalTrips) * 100).toFixed(0)}% of trips`}
                            color="text-amber-600"
                            bg="bg-amber-50"
                            border="border-amber-100"
                        />
                    </div>

                    {/* Material Breakdown */}
                    {Object.keys(byMaterial).length > 0 && (
                        <div className="panel rounded-2xl shadow-sm">
                            <h6 className="text-[10px] font-black uppercase tracking-widest mb-4 text-slate-400 flex items-center gap-2">
                                <span className="w-6 h-1 bg-amber-400 rounded-full inline-block" />
                                Material-wise Breakdown
                            </h6>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {Object.entries(byMaterial).map(([mat, data]) => (
                                    <div
                                        key={mat}
                                        className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center"
                                    >
                                        <div className="text-[9px] font-black text-amber-600 uppercase tracking-wider mb-1 truncate" title={mat}>
                                            {mat}
                                        </div>
                                        <div className="text-xl font-black text-slate-800">
                                            {data.tons.toFixed(2)}
                                            <span className="text-[10px] font-bold text-slate-400 ml-1">T</span>
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 mt-1">
                                            {data.count} trips
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Results Table ── */}
            {hasSearched && (
                <div className="panel rounded-2xl shadow-xl border-none">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="font-black text-xs uppercase tracking-widest text-primary flex items-center gap-2">
                            <span className="w-8 h-1 bg-primary rounded-full" />
                            Trip Records
                            {trips.length > 0 && (
                                <span className="ml-2 badge bg-primary/10 text-primary border-none text-[10px] font-black px-2 py-0.5 rounded-full">
                                    {totalTrips} found
                                </span>
                            )}
                        </h5>
                        {trips.length > 0 && isOwner && (
                            <button
                                onClick={() =>
                                    exportToExcel(
                                        trips,
                                        `${selectedVendorName.replace(/[^a-z0-9]/gi, '_')}_Trips_${params.startDate}_to_${params.endDate}`
                                    )
                                }
                                className="btn btn-outline-success btn-sm flex items-center gap-2 text-[10px] font-black uppercase"
                            >
                                <IconDownload className="w-4 h-4" />
                                Download XL
                            </button>
                        )}
                    </div>

                    <div className="table-responsive rounded-2xl border border-gray-100 overflow-hidden">
                        <table className="table-hover w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                    <th className="py-4 px-4">#</th>
                                    <th className="py-4 px-4">Date</th>
                                    <th className="py-4 px-4">Vehicle</th>
                                    <th className="py-4 px-4">Material</th>
                                    <th className="py-4 px-4">Route</th>
                                    <th className="py-4 px-4 text-right">Tons</th>
                                    <th className="py-4 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <span className="animate-pulse text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                                Searching trips...
                                            </span>
                                        </td>
                                    </tr>
                                ) : trips.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <span className="text-4xl opacity-20">🚛</span>
                                                <span className="text-slate-300 italic text-[11px] font-bold">
                                                    No trips found for selected filters
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    trips.map((t, idx) => (
                                        <tr
                                            key={t._id || idx}
                                            className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                        >
                                            <td className="py-3 px-4 text-[10px] font-black text-slate-300">
                                                {String(idx + 1).padStart(2, '0')}
                                            </td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">
                                                {new Date(t.date).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-black text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                                                    {(
                                                        t.vehicleId?.vehicleNumber ||
                                                        t.vehicleId?.registrationNumber ||
                                                        t.manualVehicleNumber ||
                                                        'N/A'
                                                    ).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-[11px] font-black text-amber-700">
                                                    {t.stoneTypeId?.name || 'General'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-[10px] text-slate-500 font-bold">
                                                {t.fromLocation}
                                                <span className="mx-1 opacity-30">→</span>
                                                {t.toLocation}
                                            </td>
                                            <td className="py-3 px-4 text-right font-black text-xs text-primary">
                                                {(t.loadQuantity || 0).toFixed(2)}
                                                <span className="text-[9px] font-bold text-slate-400 ml-0.5">T</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span
                                                    className={`badge text-[9px] font-black uppercase px-3 py-1 rounded-full border-none ${
                                                        t.isVendorSettled
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {t.isVendorSettled ? '✓ Settled' : '⏳ Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>

                            {/* Totals row */}
                            {trips.length > 0 && (
                                <tfoot>
                                    <tr className="bg-primary/5 border-t-2 border-primary/20">
                                        <td colSpan={5} className="py-4 px-4 text-[10px] font-black uppercase text-primary tracking-widest">
                                            Total ({totalTrips} Trips)
                                        </td>
                                        <td className="py-4 px-4 text-right font-black text-primary text-sm">
                                            {totalTons.toFixed(2)} T
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* ── Empty State (before first search) ── */}
            {!hasSearched && (
                <div className="panel rounded-3xl border-dashed border-2 border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center py-24 text-center gap-4">
                    <span className="text-5xl opacity-20">🔍</span>
                    <p className="text-slate-400 font-black text-[11px] uppercase tracking-widest">
                        Select a vendor &amp; date range, then click Search
                    </p>
                    <p className="text-slate-300 font-bold text-[10px]">
                        Results will appear here with summary stats and Excel export
                    </p>
                </div>
            )}
        </div>
    );
};

export default VendorTripSearch;
