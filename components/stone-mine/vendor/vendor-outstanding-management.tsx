'use client';
import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import IconRefresh from '@/components/icon/icon-refresh';
import IconDownload from '@/components/icon/icon-download';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import IconCashBanknotes from '@/components/icon/icon-cash-banknotes';

const VendorOutstandingManagement = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';
    const [loading, setLoading] = useState(true);
    const [outstandings, setOutstandings] = useState<any[]>([]);
    const { showToast } = useToast();

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/vendors/outstanding');
            if (res.data.success) {
                setOutstandings(res.data.data);
            }
        } catch (error) {
            showToast('Error fetching balances', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(outstandings.map(v => ({
            'Vendor Name': v.vendorName || 'General',
            'Vendor Type': v.vendorType === 'TransportVendor' ? 'Transport' : 'Explosive',
            'Payable Amount (Tons)': v.totalInvoice,
            'Spending (Expenses)': Number(v.totalDeductions || 0),
            'Cash Paid': v.totalPaid,
            'Outstanding Balance': v.balance,
            'Status': v.balance > 0 ? 'To Pay' : v.balance < 0 ? 'Owed (Credit)' : 'Cleared'
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendor_Outstanding');
        XLSX.writeFile(workbook, `Vendor_Pending_Payments_${new Date().toLocaleDateString()}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-black uppercase tracking-widest text-[#e79b21] flex items-center gap-3">
                    <IconCashBanknotes className="w-6 h-6" />
                    Vendor Pending Payments
                </h2>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="btn btn-outline-info p-2 rounded-full border-2 hover:bg-info hover:text-white transition-all">
                        <IconRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {isOwner && (
                        <button onClick={exportToExcel} className="btn btn-success flex items-center gap-2 font-black uppercase text-[10px] tracking-widest px-6 shadow-lg shadow-success/20">
                            <IconDownload className="w-4 h-4" />
                            Download XL
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="panel bg-[#e79b21]/10 border-none p-6 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden relative group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-all duration-700">
                        <IconCashBanknotes className="w-32 h-32" />
                    </div>
                    <div>
                        <h6 className="text-[10px] font-black uppercase opacity-60 mb-2 text-[#e79b21]">Total Outstanding to Pay</h6>
                        <div className="text-4xl font-black text-[#e79b21]">
                            ₹ {outstandings.reduce((acc, curr) => acc + (curr.balance > 0 ? curr.balance : 0), 0).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div className="panel bg-danger/10 border-none p-6 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden relative group border-l-4 border-danger">
                    <div>
                        <h6 className="text-[10px] font-black uppercase opacity-60 mb-2 text-danger">Total Vendor Credits (Owed)</h6>
                        <div className="text-4xl font-black text-danger">
                            ₹ {Math.abs(outstandings.reduce((acc, curr) => acc + (curr.balance < 0 ? curr.balance : 0), 0)).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div className="panel bg-success/10 border-none p-6 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden relative group border-l-4 border-success">
                    <div>
                        <h6 className="text-[10px] font-black uppercase opacity-60 mb-2 text-success">Net Cash Flow Requirement</h6>
                        <div className="text-4xl font-black text-success">
                            ₹ {outstandings.reduce((acc, curr) => acc + curr.balance, 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel border-none shadow-xl rounded-2xl overflow-hidden p-0">
                <div className="table-responsive">
                    <table className="table-hover w-full">
                        <thead>
                            <tr className="bg-gray-50 text-[10px] uppercase font-black text-white-dark tracking-widest border-none">
                                <th className="py-4 px-6">Vendor Name</th>
                                <th className="py-4 px-6">Type</th>
                                <th className="py-4 px-6 text-right">Payable Amount</th>
                                <th className="py-4 px-6 text-right">Spending</th>
                                <th className="py-4 px-6 text-right">Cash Paid</th>
                                <th className="py-4 px-6 text-right">Outstanding</th>
                                <th className="py-4 px-6 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-20 uppercase font-black text-[10px] tracking-widest italic opacity-30">Loading...</td></tr>
                            ) : outstandings.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-20 uppercase font-black text-[10px] tracking-widest italic opacity-30">No data found</td></tr>
                            ) : (
                                outstandings.sort((a,b) => b.balance - a.balance).map((v, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50/50 transition-all border-b border-gray-50 last:border-none">
                                        <td className="py-4 px-6">
                                            <div className="font-black text-xs uppercase text-dark group-hover:text-primary transition-colors">{v.vendorName || 'N/A'}</div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">ID: {v.vendorId?.slice(-6).toUpperCase()}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`badge ${v.vendorType === 'TransportVendor' ? 'badge-outline-primary' : 'badge-outline-warning'} text-[9px] font-black uppercase`}>
                                                {v.vendorType === 'TransportVendor' ? 'Transport' : 'Explosive'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right font-bold text-xs opacity-60">₹ {Number(v.totalInvoice || 0).toLocaleString()}</td>
                                        <td className="py-4 px-6 text-right font-bold text-xs text-danger opacity-80">₹ {Number(v.totalDeductions || 0).toLocaleString()}</td>
                                        <td className="py-4 px-6 text-right font-bold text-xs opacity-60">₹ {Number(v.totalPaid || 0).toLocaleString()}</td>
                                        <td className="py-4 px-6 text-right">
                                            <div className={`font-black text-sm ${v.balance > 0 ? 'text-[#e79b21]' : v.balance < 0 ? 'text-danger' : 'text-success'}`}>
                                                ₹ {Number(v.balance || 0).toLocaleString()}
                                            </div>
                                            <div className="text-[9px] font-bold uppercase opacity-30 tracking-tighter">
                                                {v.balance > 0 ? 'Pending Payment' : v.balance < 0 ? 'Excess Credit' : 'Balance Cleared'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {v.vendorType === 'TransportVendor' && (
                                                <Link href="/vendors/payments" className="btn btn-sm btn-outline-primary rounded-full font-black text-[9px] uppercase hover:bg-primary hover:text-white transition-all">
                                                    Settle Now
                                                </Link>
                                            )}
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

export default VendorOutstandingManagement;
