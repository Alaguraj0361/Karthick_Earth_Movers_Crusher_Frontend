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



const ProfitLoss = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';
    const { showToast } = useToast();
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchProfitLoss = async () => {
        try {
            setLoading(true);
            const { data: res } = await api.get('/reports/profit-loss', { params: filters });
            if (res.success) {
                setReportData(res.data);
            }
        } catch (error) {
            console.error(error);
            showToast('Error fetching profit & loss', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfitLoss();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const exportToExcel = () => {
        if (!reportData) return;
        const excelData = [
            { Category: 'INCOME', SubCategory: 'Sales Income', Amount: reportData.income.sales },
            ...reportData.income.other.map((i: any) => ({ Category: 'INCOME', SubCategory: i._id, Amount: i.total })),
            { Category: '---', SubCategory: 'TOTAL INCOME', Amount: reportData.totalIncome },
            { Category: '', SubCategory: '', Amount: '' },
            { Category: 'EXPENSE', SubCategory: 'Total Expenses', Amount: reportData.totalExpense },
            ...reportData.expenses.map((e: any) => ({ Category: 'EXPENSE', SubCategory: e._id, Amount: e.total })),
            { Category: '---', SubCategory: 'NET PROFIT/LOSS', Amount: reportData.netProfit }
        ];

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Profit & Loss');
        XLSX.writeFile(wb, `ProfitLoss_${filters.startDate}.xlsx`);
    };

    const exportToPDF = () => {
        if (!reportData) return;
        const doc = new jsPDF() as any;
        doc.text('Karthick Earth Movers - Profit & Loss Account', 14, 15);

        const body = [
            ['Income', '', ''],
            ['  Stone Sales', '', reportData.income.sales.toLocaleString()],
            ...reportData.income.other.map((i: any) => [`  ${i._id}`, '', i.total.toLocaleString()]),
            ['Total Income (A)', '', reportData.totalIncome.toLocaleString()],
            ['', '', ''],
            ['Expenses', '', ''],
            ...reportData.expenses.map((e: any) => [`  ${e._id}`, '', e.total.toLocaleString()]),
            ['Total Expenses (B)', '', reportData.totalExpense.toLocaleString()],
            ['', '', ''],
            ['Net Profit (A - B)', '', reportData.netProfit.toLocaleString()]
        ];

        doc.autoTable({
            head: [['Description', '', 'Amount (₹)']],
            body: body,
            startY: 25,
            theme: 'plain',
            rowStyles: { 0: { fontStyle: 'bold' }, 3: { fontStyle: 'bold' }, 5: { fontStyle: 'bold' }, 7: { fontStyle: 'bold' }, 9: { fontStyle: 'bold' } }
        });

        doc.save(`ProfitLoss_${filters.startDate}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="panel">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <div>
                        <h5 className="text-xl font-bold dark:text-white-light">லாப நட்ட அறிக்கை (Profit & Loss)</h5>
                        <p className="text-white-dark text-xs mt-1">Income vs Expense analysis (Accrual basis)</p>
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
                    <button className="btn btn-dark h-10" onClick={fetchProfitLoss}>
                        <IconSearch className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> {loading ? 'Computing...' : 'Generate Report'}
                    </button>
                </div>

                {reportData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Income Side */}
                        <div className="panel border-t-4 border-success">
                            <h6 className="font-bold text-lg text-success mb-6 uppercase tracking-wider flex items-center justify-between">
                                Income (வரவு)
                                <span className="p-2 bg-success/10 rounded-full text-xl">💰</span>
                            </h6>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/10">
                                    <span className="font-semibold">Stone Sales</span>
                                    <span className="font-bold">₹{reportData.income.sales.toLocaleString()}</span>
                                </div>
                                {reportData.income.other.map((i: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-dark/10">
                                        <span className="text-white-dark">{i._id}</span>
                                        <span className="font-bold">₹{i.total.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="mt-8 pt-4 border-t-2 border-dashed border-success/30 flex items-center justify-between">
                                    <span className="font-black text-lg">Total Income (A)</span>
                                    <span className="font-black text-xl text-success">₹{reportData.totalIncome.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Expense Side */}
                        <div className="panel border-t-4 border-danger">
                            <h6 className="font-bold text-lg text-danger mb-6 uppercase tracking-wider flex items-center justify-between">
                                Expense (செலவு)
                                <span className="p-2 bg-danger/10 rounded-full text-xl">💸</span>
                            </h6>
                            <div className="space-y-4">
                                {reportData.expenses.map((e: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-dark/10">
                                        <span className="text-white-dark">{e._id}</span>
                                        <span className="font-bold">₹{e.total.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="mt-8 pt-4 border-t-2 border-dashed border-danger/30 flex items-center justify-between">
                                    <span className="font-black text-lg">Total Expenses (B)</span>
                                    <span className="font-black text-xl text-danger">₹{reportData.totalExpense.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Net Result */}
                        <div className={`lg:col-span-2 panel ${reportData.netProfit >= 0 ? 'bg-success text-white' : 'bg-danger text-white'} shadow-xl`}>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
                                <div>
                                    <h4 className="text-xl opacity-80 font-bold mb-1">Net Result (A - B)</h4>
                                    <p className="text-sm opacity-60 italic">Summary for the period {filters.startDate} to {filters.endDate}</p>
                                </div>
                                <div className="text-center md:text-right">
                                    <p className="text-4xl font-black">
                                        {reportData.netProfit >= 0 ? `₹${reportData.netProfit.toLocaleString()}` : `- ₹${Math.abs(reportData.netProfit).toLocaleString()}`}
                                    </p>
                                    <p className="text-sm font-bold uppercase tracking-widest mt-2 px-4 py-1 bg-white/20 rounded-full inline-block">
                                        {reportData.netProfit >= 0 ? '🏆 Profit (லாபம்)' : '⚠️ Loss (நட்டம்)'}
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

export default ProfitLoss;
