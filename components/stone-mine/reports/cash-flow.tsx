'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import api from '@/utils/api';
import IconPrinter from '@/components/icon/icon-printer';
import IconDownload from '@/components/icon/icon-download';
import IconSearch from '@/components/icon/icon-search';
import { useToast } from '@/components/stone-mine/toast-notification';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';



const CashFlow = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';
    const { showToast } = useToast();
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchCashFlow = async () => {
        try {
            setLoading(true);
            const { data: res } = await api.get('/reports/cash-flow', { params: filters });
            if (res.success) {
                setReportData(res.data);
            }
        } catch (error) {
            console.error(error);
            showToast('Error fetching cash flow', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCashFlow();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const exportToExcel = () => {
        if (!reportData) return;
        const ws = XLSX.utils.json_to_sheet([
            { 'Statement': 'Opening Balance', 'Amount (₹)': reportData.openingBalance },
            { 'Statement': 'Total Received', 'Amount (₹)': reportData.totalReceived },
            { 'Statement': 'Total Paid', 'Amount (₹)': reportData.totalPaid },
            { 'Statement': 'Closing Balance', 'Amount (₹)': reportData.closingBalance }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cash Flow');
        XLSX.writeFile(wb, `CashFlow_${filters.startDate}_to_${filters.endDate}.xlsx`);
    };

    const exportToPDF = () => {
        if (!reportData) return;
        const doc = new jsPDF() as any;
        doc.text('Karthick Earth Movers - Cash Flow Statement', 14, 15);
        doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 14, 22);

        doc.autoTable({
            head: [['Description', 'Amount (₹)']],
            body: [
                ['Opening Balance', reportData.openingBalance.toLocaleString()],
                ['Total Cash Received (+)', reportData.totalReceived.toLocaleString()],
                ['Total Cash Paid (-)', reportData.totalPaid.toLocaleString()],
                ['Closing Balance', reportData.closingBalance.toLocaleString()]
            ],
            startY: 30,
            theme: 'striped',
            headStyles: { fillColor: [67, 97, 238] }
        });

        doc.save(`CashFlow_${filters.startDate}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="panel">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <div>
                        <h5 className="text-xl font-bold dark:text-white-light">பணப்புழக்கம் அறிக்கை (Cash Flow)</h5>
                        <p className="text-white-dark text-xs mt-1">Track money movement and balances</p>
                    </div>
                    {isOwner && (
                        <div className="flex items-center gap-3">
                            <button className="btn btn-outline-primary" onClick={exportToExcel}>
                                <IconDownload className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> Excel
                            </button>
                            <button className="btn btn-primary" onClick={exportToPDF}>
                                <IconPrinter className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> PDF
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-end gap-4 mb-8 bg-dark-light/5 p-4 rounded-xl border border-white-light/10">
                    <div>
                        <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Start Date</label>
                        <input type="date" className="form-input h-10" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-white-dark mb-2 block">End Date</label>
                        <input type="date" className="form-input h-10" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
                    </div>
                    <button className="btn btn-dark h-10" onClick={fetchCashFlow} disabled={loading}>
                        <IconSearch className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> {loading ? 'Loading...' : 'Filter'}
                    </button>
                </div>

                {reportData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Summary Cards */}
                        <div className="space-y-4">
                            <div className="panel bg-[#f1f2f3] dark:bg-[#1b2e4b] border-none">
                                <div className="flex items-center justify-between">
                                    <span className="text-white-dark font-bold uppercase text-xs tracking-wider">Opening Balance (ஆரம்ப இருப்பு)</span>
                                </div>
                                <h4 className="text-2xl font-black mt-2">₹{reportData.openingBalance.toLocaleString()}</h4>
                            </div>

                            <div className="panel bg-success/10 border-success/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-success font-bold uppercase text-xs tracking-wider">Total Received (+)</span>
                                    <span className="text-success text-2xl">↑</span>
                                </div>
                                <h4 className="text-2xl font-black text-success mt-2">₹{reportData.totalReceived.toLocaleString()}</h4>
                            </div>

                            <div className="panel bg-danger/10 border-danger/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-danger font-bold uppercase text-xs tracking-wider">Total Paid (-)</span>
                                    <span className="text-danger text-2xl">↓</span>
                                </div>
                                <h4 className="text-2xl font-black text-danger mt-2">₹{reportData.totalPaid.toLocaleString()}</h4>
                            </div>

                            <div className="panel bg-primary text-white shadow-lg shadow-primary/30">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold uppercase text-xs tracking-wider opacity-80">Closing Balance (இறுதி இருப்பு)</span>
                                </div>
                                <h4 className="text-2xl font-black mt-2">₹{reportData.closingBalance.toLocaleString()}</h4>
                                <p className="text-[10px] mt-2 opacity-60 italic">* Calculated based on actual cash/bank movement</p>
                            </div>
                        </div>

                        {/* Analysis Section */}
                        <div className="panel border-2 border-primary/10">
                            <h6 className="font-bold text-lg mb-6 flex items-center gap-2">
                                <span className="p-2 bg-primary/10 rounded-lg text-primary text-xl">📊</span>
                                Cash Positon Analysis
                            </h6>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-semibold text-white-dark uppercase">Utilization Rate</span>
                                        <span className="font-bold">
                                            {reportData.totalReceived > 0
                                                ? Math.min(100, Math.round((reportData.totalPaid / (reportData.openingBalance + reportData.totalReceived)) * 100))
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-dark-light/10 rounded-full h-3">
                                        <div
                                            className="bg-primary h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, (reportData.totalReceived > 0 ? (reportData.totalPaid / (reportData.openingBalance + reportData.totalReceived)) * 100 : 0))}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="bg-warning/5 p-4 rounded-xl border border-warning/10">
                                    <h6 className="text-warning font-bold text-sm mb-2">💡 Financial Advice</h6>
                                    <p className="text-xs text-white-dark leading-relaxed">
                                        {reportData.closingBalance < 0
                                            ? "Caution: Your closing balance is negative. You may have cash shortage issues. Check for pending customer payments."
                                            : "Your cash flow is positive. Maintain a 15% reserve for unexpected maintenance costs."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashFlow;
