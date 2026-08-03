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
    partyName?: string;
    material?: { name: string; unit: string; hsnCode?: string };
    grossWeight: number;
    tareWeight: number;
    netWeight: number;
    slipStatus: string;
    purpose: string;
    firstWeighAt?: string;
    secondWeighAt?: string;
    remarks?: string;
}

const WeighmentSlipPrint = () => {
    const params = useParams();
    const id = params?.id as string;
    const [slip, setSlip] = useState<WeighmentSlip | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        api.get(`/weighment/${id}`).then(res => {
            setSlip(res.data.data);
            // Mark as printed
            api.put(`/weighment/${id}/print`, {}).catch(() => {});
        }).catch(console.error).finally(() => setLoading(false));
    }, [id]);

    const handlePrint = () => window.print();

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
    );

    if (!slip) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <p className="text-xl text-gray-600">Slip not found</p>
            </div>
        </div>
    );

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formatTime = (d?: string) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

    return (
        <>
            {/* Print Button — hidden when printing */}
            <div className="print:hidden flex justify-center gap-4 p-4 bg-gray-100">
                <button onClick={handlePrint} className="btn btn-primary px-8 py-2.5 text-base">🖨️ Print Slip</button>
                <button onClick={() => window.close()} className="btn btn-outline-secondary px-6 py-2.5">✕ Close</button>
            </div>

            {/* Challan */}
            <div className="min-h-screen bg-white flex items-center justify-center p-4 print:p-0 print:block">
                <div
                    className="bg-white border-2 border-gray-800 mx-auto"
                    style={{ width: '80mm', fontFamily: 'monospace', fontSize: '11px' }}
                    id="weighment-challan"
                >
                    {/* Header */}
                    <div className="text-center border-b-2 border-gray-800 p-3">
                        <div className="font-black text-lg leading-tight">KARTHICK EARTH MOVERS</div>
                        <div className="font-bold text-sm">CRUSHER PLANT</div>
                        <div className="text-xs mt-1">Weighment Challan</div>
                    </div>

                    {/* Slip Info */}
                    <div className="border-b border-gray-600 p-2">
                        <div className="flex justify-between font-bold">
                            <span>Slip No: {slip.slipNumber}</span>
                            <span className={slip.slipType === 'Inward' ? 'text-green-800' : 'text-orange-800'}>
                                {slip.slipType === 'Inward' ? '⬇ INWARD' : '⬆ OUTWARD'}
                            </span>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span>Date: {formatDate(slip.slipDate)}</span>
                            <span>Time: {slip.slipTime || formatTime(slip.firstWeighAt?.toString())}</span>
                        </div>
                        <div>Purpose: {slip.purpose}</div>
                    </div>

                    {/* Vehicle & Party */}
                    <div className="border-b border-gray-600 p-2 space-y-0.5">
                        <div><b>Vehicle No:</b> {slip.vehicleNumber}</div>
                        <div><b>Driver:</b> {slip.driverName || '—'}</div>
                        <div><b>Party:</b> {slip.partyName || '—'}</div>
                        <div><b>Material:</b> {slip.material?.name || '—'}</div>
                        {slip.material?.hsnCode && <div><b>HSN:</b> {slip.material.hsnCode}</div>}
                    </div>

                    {/* Weights — Main Section */}
                    <div className="border-b-2 border-gray-800 p-2">
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td className="py-0.5">Gross Weight</td>
                                    <td className="text-right font-bold">{slip.grossWeight?.toFixed(3)} MT</td>
                                </tr>
                                <tr>
                                    <td className="py-0.5">Tare Weight</td>
                                    <td className="text-right font-bold">
                                        {slip.slipStatus === 'Closed' ? `${slip.tareWeight?.toFixed(3)} MT` : 'PENDING'}
                                    </td>
                                </tr>
                                <tr className="border-t border-gray-600">
                                    <td className="py-1 font-black text-sm">NET WEIGHT</td>
                                    <td className="text-right font-black text-lg">
                                        {slip.slipStatus === 'Closed' ? `${slip.netWeight?.toFixed(3)} MT` : 'OPEN'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Timestamps */}
                    {(slip.firstWeighAt || slip.secondWeighAt) && (
                        <div className="border-b border-gray-600 p-2 text-xs space-y-0.5">
                            {slip.firstWeighAt && <div>1st Weigh: {formatTime(slip.firstWeighAt.toString())}</div>}
                            {slip.secondWeighAt && <div>2nd Weigh: {formatTime(slip.secondWeighAt.toString())}</div>}
                        </div>
                    )}

                    {/* Remarks */}
                    {slip.remarks && (
                        <div className="border-b border-gray-600 p-2 text-xs">
                            <b>Remarks:</b> {slip.remarks}
                        </div>
                    )}

                    {/* Signatures */}
                    <div className="p-2 mt-2">
                        <div className="flex justify-between text-xs">
                            <div className="text-center">
                                <div className="border-t border-gray-600 mt-6 pt-1 w-24">Operator</div>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-gray-600 mt-6 pt-1 w-24">Authorized</div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-600 text-center py-2 text-xs text-gray-600">
                        <p>*** Thank You ***</p>
                        <p>Computer Generated Slip</p>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body { margin: 0; }
                    .print\\:hidden { display: none !important; }
                    @page { size: 80mm auto; margin: 0; }
                }
            `}</style>
        </>
    );
};

export default WeighmentSlipPrint;
