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



const DayBook = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';
    const { showToast } = useToast();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0 });
    const [loading, setLoading] = useState(false);

    const fetchDayBook = async () => {
        try {
            setLoading(true);
            const { data: res } = await api.get('/reports/day-book', { params: { date } });
            if (res.success) {
                setData(res.data);
                setSummary(res.summary);
            }
        } catch (error) {
            console.error(error);
            showToast('Error fetching day book', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDayBook();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date]);

    const exportToExcel = () => {
        const exportData = data.map((item, idx) => ({
            'S.No': idx + 1,
            'Time': new Date(item.time).toLocaleTimeString(),
            'Description': item.description,
            'Payment Mode': item.paymentMode,
            'Income (₹)': item.income,
            'Expense (₹)': item.expense
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Day Book');
        XLSX.writeFile(wb, `DayBook_${date}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF() as any;
        doc.text(`Karthick Earth Movers - Day Book (${date})`, 14, 15);

        const tableColumn = ["S.No", "Time", "Description", "Mode", "Income (₹)", "Expense (₹)"];
        const tableRows = data.map((item, idx) => [
            idx + 1,
            new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            item.description,
            item.paymentMode,
            item.income ? item.income.toLocaleString() : '0',
            item.expense ? item.expense.toLocaleString() : '0'
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            theme: 'grid',
            headStyles: { fillColor: [67, 97, 238] }
        });

        const finalY = (doc as any).lastAutoTable.cursor.y || 25;
        doc.text(`Total Income: ₹${summary.totalIncome.toLocaleString()}`, 14, finalY + 10);
        doc.text(`Total Expense: ₹${summary.totalExpense.toLocaleString()}`, 14, finalY + 17);
        doc.text(`Closing Balance: ₹${(summary.totalIncome - summary.totalExpense).toLocaleString()}`, 14, finalY + 24);

        doc.save(`DayBook_${date}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="panel">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <div>
                        <h5 className="text-xl font-bold dark:text-white-light">நாள் பதிவேடு (Day Book)</h5>
                        <p className="text-white-dark text-xs mt-1">Daily income and expense tracking</p>
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

                <div className="flex flex-wrap items-end gap-4 mb-8 bg-dark-light/5 p-4 rounded-xl">
                    <div className="w-full sm:w-auto">
                        <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Select Date</label>
                        <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <button className="btn btn-dark" onClick={fetchDayBook}>
                        <IconSearch className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="panel bg-success/10 border-success/20">
                        <div className="flex items-center justify-between">
                            <h6 className="font-bold text-success">Total Income</h6>
                            <span className="badge bg-success">வரவு</span>
                        </div>
                        <p className="text-2xl font-black text-success mt-2">₹{summary.totalIncome.toLocaleString()}</p>
                    </div>
                    <div className="panel bg-danger/10 border-danger/20">
                        <div className="flex items-center justify-between">
                            <h6 className="font-bold text-danger">Total Expense</h6>
                            <span className="badge bg-danger">செலவு</span>
                        </div>
                        <p className="text-2xl font-black text-danger mt-2">₹{summary.totalExpense.toLocaleString()}</p>
                    </div>
                    <div className="panel bg-primary/10 border-primary/20">
                        <div className="flex items-center justify-between">
                            <h6 className="font-bold text-primary">Closing Balance</h6>
                            <span className="badge bg-primary">இருப்பு</span>
                        </div>
                        <p className="text-2xl font-black text-primary mt-2">₹{(summary.totalIncome - summary.totalExpense).toLocaleString()}</p>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Description (விவரம்)</th>
                                <th>Payment Mode</th>
                                <th className="!text-right">Income (₹)</th>
                                <th className="!text-right text-danger">Expense (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-white-dark">No transactions for this date</td></tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="text-white-dark text-xs">{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="font-semibold">{item.description}</td>
                                        <td>
                                            <span className={`badge ${item.paymentMode === 'Cash' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'}`}>
                                                {item.paymentMode}
                                            </span>
                                        </td>
                                        <td className="!text-right font-bold text-success">{item.income > 0 ? `+ ₹${item.income.toLocaleString()}` : '—'}</td>
                                        <td className="!text-right font-bold text-danger">{item.expense > 0 ? `- ₹${item.expense.toLocaleString()}` : '—'}</td>
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

export default DayBook;
