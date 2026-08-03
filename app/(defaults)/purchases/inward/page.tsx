'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';

interface WeighmentSlip {
    _id: string;
    slipNumber: string;
    slipDate: string;
    vehicleNumber: string;
    driverName?: string;
    partyName?: string;
    material?: { name: string; unit: string };
    grossWeight: number;
    tareWeight: number;
    netWeight: number;
    slipStatus: string;
    purpose: string;
}

const InwardRegisterPage = () => {
    const [slips, setSlips] = useState<WeighmentSlip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/weighment?slipType=Inward')
            .then(res => setSlips(res.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const totalNetMT = slips.reduce((sum, s) => sum + (s.netWeight || 0), 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xl shadow">
                        📥
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Inward Raw Material Register</h1>
                        <p className="text-xs text-gray-500">All raw stone &amp; ROM deliveries entering the crusher weighbridge</p>
                    </div>
                </div>
                <div className="px-4 py-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl">
                    <span className="text-xs text-green-700 dark:text-green-400 font-semibold block">Total Inward Net Weight</span>
                    <span className="text-lg font-black text-green-600 dark:text-green-400">{totalNetMT.toFixed(3)} MT</span>
                </div>
            </div>

            {/* Table */}
            <div className="panel p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Slip No</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Vehicle</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Supplier / Party</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Material</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Gross MT</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Tare MT</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20">Net MT</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400">
                                        <div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                        Loading inward register...
                                    </td>
                                </tr>
                            ) : slips.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400">
                                        No inward weighment slips recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                slips.map((slip, idx) => (
                                    <tr
                                        key={slip._id}
                                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                                            idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'
                                        }`}
                                    >
                                        <td className="px-4 py-3 font-mono font-bold text-green-600 dark:text-green-400">
                                            {slip.slipNumber}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                                            {new Date(slip.slipDate).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                                            {slip.vehicleNumber}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            {slip.partyName || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            {slip.material?.name || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                                            {slip.grossWeight?.toFixed(3)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                                            {slip.slipStatus === 'Closed' ? slip.tareWeight?.toFixed(3) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10">
                                            {slip.slipStatus === 'Closed' ? slip.netWeight?.toFixed(3) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    slip.slipStatus === 'Open'
                                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                                                        : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                }`}
                                            >
                                                {slip.slipStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InwardRegisterPage;
