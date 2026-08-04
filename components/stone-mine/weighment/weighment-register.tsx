'use client';
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';
import Link from 'next/link';

interface WeighmentSlip {
    _id: string;
    slipNumber: string;
    slipType: 'Inward' | 'Outward';
    slipDate: string;
    slipTime?: string;
    vehicleNumber: string;
    driverName?: string;
    partyName?: string;
    material?: { name: string; unit: string };
    firstWeighType?: string;
    grossWeight: number;
    tareWeight: number;
    netWeight: number;
    ratePerTon?: number;
    subtotalAmount?: number;
    gstAmount?: number;
    totalAmount?: number;
    paymentType?: string;
    paymentStatus?: string;
    balanceAmount?: number;
    slipStatus: 'Open' | 'Closed';
    purpose: string;
    remarks?: string;
}

const WeighmentRegister = () => {
    const [slips, setSlips] = useState<WeighmentSlip[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        slipType: '',
        slipStatus: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        search: '',
    });
    const [summary, setSummary] = useState({ inward: 0, outward: 0, open: 0 });

    const fetchSlips = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filters.slipType) params.slipType = filters.slipType;
            if (filters.slipStatus) params.slipStatus = filters.slipStatus;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.search) params.search = filters.search;

            const res = await api.get('/weighment', { params });
            const data = res.data.data || [];
            setSlips(data);

            setSummary({
                inward: data.filter((s: WeighmentSlip) => s.slipType === 'Inward' && s.slipStatus === 'Closed').reduce((a: number, s: WeighmentSlip) => a + (s.netWeight || 0), 0),
                outward: data.filter((s: WeighmentSlip) => s.slipType === 'Outward' && s.slipStatus === 'Closed').reduce((a: number, s: WeighmentSlip) => a + (s.netWeight || 0), 0),
                open: data.filter((s: WeighmentSlip) => s.slipStatus === 'Open').length,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchSlips(); }, [fetchSlips]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    return (
        <div className="space-y-4">
            {/* Header + Actions */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-lg shadow">📋</div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Weighment Register</h1>
                        <p className="text-xs text-gray-500">2-Step Weighbridge Register — Empty & Loaded Vehicle Entries</p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Link href="/weighment/new" className="btn btn-success text-sm font-bold">
                        1️⃣ 1st Weight Entry (முதல் எடை)
                    </Link>
                    <Link href="/weighment/close" className="btn btn-amber text-sm font-bold bg-amber-500 text-white hover:bg-amber-600">
                        2️⃣ 2nd Weight &amp; Billing (இரண்டாம் எடை)
                    </Link>
                    <Link href="/weighment/reports" className="btn btn-primary text-sm font-bold">
                        📊 Reports &amp; Analytics
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="panel bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700">
                    <p className="text-xs text-green-700 dark:text-green-400 font-medium">⬇️ Total Inward (Closed)</p>
                    <p className="text-2xl font-black text-green-600 dark:text-green-400">{summary.inward.toFixed(3)} MT</p>
                </div>
                <div className="panel bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-700">
                    <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">⬆️ Total Outward (Closed)</p>
                    <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{summary.outward.toFixed(3)} MT</p>
                </div>
                <div className="panel bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-700">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">⏳ Pending Step 2 Vehicles</p>
                    <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{summary.open}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="panel">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <input
                        type="date" name="startDate" value={filters.startDate}
                        onChange={handleFilterChange} className="form-input text-sm" placeholder="From Date"
                    />
                    <input
                        type="date" name="endDate" value={filters.endDate}
                        onChange={handleFilterChange} className="form-input text-sm" placeholder="To Date"
                    />
                    <select name="slipType" value={filters.slipType} onChange={handleFilterChange} className="form-select text-sm font-semibold">
                        <option value="">All Types</option>
                        <option value="Inward">Inward</option>
                        <option value="Outward">Outward</option>
                    </select>
                    <select name="slipStatus" value={filters.slipStatus} onChange={handleFilterChange} className="form-select text-sm font-semibold">
                        <option value="">All Status</option>
                        <option value="Open">Step 1 Open</option>
                        <option value="Closed">Step 2 Completed</option>
                    </select>
                    <input
                        type="text" name="search" value={filters.search}
                        onChange={handleFilterChange} className="form-input text-sm"
                        placeholder="Search slip / vehicle / party..."
                    />
                </div>
            </div>

            {/* Table */}
            <div className="panel p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Slip No</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Type</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Vehicle</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Party</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Material</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Gross MT</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Tare MT</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20">Net MT</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Rate / Ton</th>
                                <th className="text-right px-4 py-3 font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">Total Amount (₹)</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Payment Mode</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={14} className="text-center py-12 text-gray-400">
                                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                    Loading slips...
                                </td></tr>
                            ) : slips.length === 0 ? (
                                <tr><td colSpan={14} className="text-center py-12 text-gray-400">No weighment slips found for selected filters</td></tr>
                            ) : slips.map((slip, i) => (
                                <tr key={slip._id} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}>
                                    <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">{slip.slipNumber}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            slip.slipType === 'Inward'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                                        }`}>
                                            {slip.slipType === 'Inward' ? '⬇️' : '⬆️'} {slip.slipType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                                        {new Date(slip.slipDate).toLocaleDateString('en-IN')}
                                        {slip.slipTime && <span className="block text-gray-400">{slip.slipTime}</span>}
                                    </td>
                                    <td className="px-4 py-3 font-semibold">{slip.vehicleNumber}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">{slip.partyName || '—'}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">{slip.material?.name || '—'}</td>
                                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-mono">
                                        {slip.grossWeight > 0 ? slip.grossWeight.toFixed(3) : <span className="text-gray-400 font-sans text-xs">Step 2</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-mono">
                                        {slip.tareWeight > 0 ? slip.tareWeight.toFixed(3) : <span className="text-gray-400 font-sans text-xs">Step 2</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10 font-mono text-base">
                                        {slip.slipStatus === 'Closed' ? slip.netWeight.toFixed(3) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-700 dark:text-gray-300">
                                        {slip.ratePerTon ? `₹${slip.ratePerTon}` : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 text-base">
                                        {slip.totalAmount ? `₹${slip.totalAmount.toLocaleString('en-IN')}` : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {slip.paymentType ? (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                slip.paymentType === 'Credit'
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                                    : slip.paymentType === 'UPI'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                            }`}>
                                                💳 {slip.paymentType}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                            slip.slipStatus === 'Open'
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                                : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                        }`}>
                                            {slip.slipStatus === 'Open' ? '⏳ Step 1 Open' : '✅ Step 2 Complete'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <a
                                                href={`/weighment/print/${slip._id}`}
                                                target="_blank"
                                                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition font-bold"
                                                title={slip.slipStatus === 'Open' ? 'Print Step 1 Initial Ticket' : 'Print Step 2 Final Ticket'}
                                            >
                                                🖨️ {slip.slipStatus === 'Open' ? 'Print Step 1' : 'Print Final'}
                                            </a>
                                            {slip.slipStatus === 'Open' && (
                                                <Link
                                                    href="/weighment/close"
                                                    className="text-xs px-2 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition font-bold"
                                                >
                                                    ➡️ Step 2
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WeighmentRegister;
