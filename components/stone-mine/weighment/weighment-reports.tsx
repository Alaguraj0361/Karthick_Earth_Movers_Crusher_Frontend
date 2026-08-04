'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const WeighmentReports = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'daily' | 'customer' | 'vehicle' | 'driver' | 'product'>('daily');
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [reports, setReports] = useState<{
        dailyReport: any[];
        customerReport: any[];
        vehicleReport: any[];
        driverReport: any[];
        productReport: any[];
    }>({
        dailyReport: [],
        customerReport: [],
        vehicleReport: [],
        driverReport: [],
        productReport: [],
    });

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/weighment/reports?startDate=${startDate}&endDate=${endDate}`);
            if (res.data.success) {
                setReports(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch weighment reports', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [startDate, endDate]);

    const exportToExcel = (exportAll = false) => {
        const wb = XLSX.utils.book_new();

        const appendSheet = (data: any[], headers: string[], sheetName: string, mapRow: (r: any) => any[]) => {
            const rows = [headers, ...data.map(mapRow)];
            const ws = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        };

        if (exportAll || activeTab === 'daily') {
            appendSheet(
                reports.dailyReport,
                ['Date', 'Total Vehicles', 'Total Net Weight (MT)', 'Total Revenue (₹)'],
                'Daily Summary',
                r => [r.date, r.vehicleCount, r.totalNetMT, r.totalRevenue]
            );
        }
        if (exportAll || activeTab === 'customer') {
            appendSheet(
                reports.customerReport,
                ['Party Name', 'Category', 'Trips', 'Total Weight (MT)', 'Total Billed (₹)', 'Balance (₹)'],
                'Customer & Supplier',
                r => [r.partyName, r.category, r.tripCount, r.totalNetMT, r.totalAmount, r.balanceAmount]
            );
        }
        if (exportAll || activeTab === 'vehicle') {
            appendSheet(
                reports.vehicleReport,
                ['Vehicle Number', 'Trips Count', 'Total Gross (MT)', 'Total Tare (MT)', 'Total Net (MT)'],
                'Vehicle Analytics',
                r => [r.vehicleNumber, r.tripCount, r.totalGrossMT, r.totalTareMT, r.totalNetMT]
            );
        }
        if (exportAll || activeTab === 'driver') {
            appendSheet(
                reports.driverReport,
                ['Driver Name', 'Mobile Number', 'Total Trips', 'Total Weight Delivered (MT)'],
                'Driver Analytics',
                r => [r.driverName, r.driverMobile || '—', r.tripCount, r.totalNetMT]
            );
        }
        if (exportAll || activeTab === 'product') {
            appendSheet(
                reports.productReport,
                ['Material Name', 'Trips Count', 'Total Quantity (MT)', 'Total Sales Amount (₹)'],
                'Product Analytics',
                r => [r.materialName, r.tripCount, r.totalNetMT, r.totalAmount]
            );
        }

        const filename = exportAll
            ? `Weighment_Full_Analytics_${startDate}_to_${endDate}.xlsx`
            : `Weighment_${activeTab.toUpperCase()}_Report_${startDate}_to_${endDate}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    const exportToPDF = () => {
        const doc = new jsPDF('p', 'mm', 'a4');

        doc.setFontSize(16);
        doc.setTextColor(37, 99, 235);
        doc.text('Karthick Earth Movers - Weighment Analytics Report', 14, 15);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Report Type: ${activeTab.toUpperCase()} REPORT  |  Period: ${startDate} to ${endDate}`, 14, 22);

        let head: string[][] = [];
        let body: any[][] = [];

        if (activeTab === 'daily') {
            head = [['Date', 'Total Vehicles', 'Total Net Weight (MT)', 'Total Revenue (₹)']];
            body = reports.dailyReport.map(r => [
                r.date,
                r.vehicleCount,
                `${r.totalNetMT.toFixed(3)} MT`,
                `Rs. ${r.totalRevenue.toLocaleString('en-IN')}`
            ]);
        } else if (activeTab === 'customer') {
            head = [['Party Name', 'Category', 'Trips', 'Total Weight (MT)', 'Total Billed (₹)', 'Balance (₹)']];
            body = reports.customerReport.map(r => [
                r.partyName,
                r.category,
                r.tripCount,
                `${r.totalNetMT.toFixed(3)} MT`,
                `Rs. ${r.totalAmount.toLocaleString('en-IN')}`,
                `Rs. ${r.balanceAmount.toLocaleString('en-IN')}`
            ]);
        } else if (activeTab === 'vehicle') {
            head = [['Vehicle Number', 'Trips Count', 'Total Gross (MT)', 'Total Tare (MT)', 'Total Net (MT)']];
            body = reports.vehicleReport.map(r => [
                r.vehicleNumber,
                r.tripCount,
                `${r.totalGrossMT.toFixed(3)} MT`,
                `${r.totalTareMT.toFixed(3)} MT`,
                `${r.totalNetMT.toFixed(3)} MT`
            ]);
        } else if (activeTab === 'driver') {
            head = [['Driver Name', 'Mobile Number', 'Total Trips', 'Total Weight Delivered (MT)']];
            body = reports.driverReport.map(r => [
                r.driverName,
                r.driverMobile || '—',
                r.tripCount,
                `${r.totalNetMT.toFixed(3)} MT`
            ]);
        } else if (activeTab === 'product') {
            head = [['Material Name', 'Trips Count', 'Total Quantity (MT)', 'Total Sales Amount (₹)']];
            body = reports.productReport.map(r => [
                r.materialName,
                r.tripCount,
                `${r.totalNetMT.toFixed(3)} MT`,
                `Rs. ${r.totalAmount.toLocaleString('en-IN')}`
            ]);
        }

        autoTable(doc, {
            startY: 28,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            styles: { fontSize: 9, cellPadding: 3 }
        });

        doc.save(`Weighment_${activeTab.toUpperCase()}_Report_${startDate}_to_${endDate}.pdf`);
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white-light">Weighment Reports & Analytics</h2>
                    <p className="text-white-dark text-sm mt-1">Multi-dimensional analytics for Daily, Customer, Vehicle, Driver, and Product sales</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500">From:</span>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input text-xs font-bold py-1" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500">To:</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input text-xs font-bold py-1" />
                        </div>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => exportToExcel(false)}
                            className="btn btn-success text-xs font-bold shadow-sm flex items-center gap-1.5"
                            title="Download active tab report as Excel spreadsheet"
                        >
                            📊 Excel (.xlsx)
                        </button>
                        <button
                            onClick={() => exportToExcel(true)}
                            className="btn btn-outline-success text-xs font-bold shadow-sm flex items-center gap-1.5"
                            title="Download all report tabs in one Excel workbook"
                        >
                            📁 Full Workbook (.xlsx)
                        </button>
                        <button
                            onClick={exportToPDF}
                            className="btn btn-danger text-xs font-bold shadow-sm flex items-center gap-1.5"
                            title="Download active tab report as PDF document"
                        >
                            📄 PDF (.pdf)
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-1">
                {[
                    { id: 'daily', label: '📊 Daily Report', count: reports.dailyReport.length },
                    { id: 'customer', label: '👤 Customer / Supplier Report', count: reports.customerReport.length },
                    { id: 'vehicle', label: '🚚 Vehicle Report', count: reports.vehicleReport.length },
                    { id: 'driver', label: '🧑‍✈️ Driver Report', count: reports.driverReport.length },
                    { id: 'product', label: '📦 Product Report', count: reports.productReport.length },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2.5 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeTab === tab.id
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                    >
                        {tab.label}
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-black">{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Content Tables */}
            <div className="panel p-0 overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
                {loading ? (
                    <div className="py-16 text-center text-gray-400">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                        Generating reports...
                    </div>
                ) : (
                    <>
                        {/* 1. Daily Report */}
                        {activeTab === 'daily' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-bold text-gray-600">Date</th>
                                            <th className="text-center px-4 py-3 font-bold text-gray-600">Total Vehicles</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-600">Total Net Weight (MT)</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-600">Total Revenue (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.dailyReport.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-8 text-gray-400">No daily records found</td></tr>
                                        ) : reports.dailyReport.map((row, i) => (
                                            <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50">
                                                <td className="px-4 py-3 font-bold text-primary">{row.date}</td>
                                                <td className="px-4 py-3 text-center font-bold">{row.vehicleCount}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">{row.totalNetMT.toFixed(3)} MT</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-success">₹{row.totalRevenue.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 2. Customer / Supplier Report */}
                        {activeTab === 'customer' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-bold text-gray-600">Party Name</th>
                                            <th className="text-left px-4 py-3 font-bold text-gray-600">Category</th>
                                            <th className="text-center px-4 py-3 font-bold text-gray-600">Trips</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-600">Total Weight (MT)</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-600">Total Billed (₹)</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-600 text-danger">Outstanding Balance (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.customerReport.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">No customer records found</td></tr>
                                        ) : reports.customerReport.map((row, i) => (
                                            <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50">
                                                <td className="px-4 py-3 font-bold text-primary">{row.partyName}</td>
                                                <td className="px-4 py-3 text-xs"><span className="badge badge-outline-primary">{row.category}</span></td>
                                                <td className="px-4 py-3 text-center font-bold">{row.tripCount}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold">{row.totalNetMT.toFixed(3)} MT</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-success">₹{row.totalAmount.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-danger">₹{row.balanceAmount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 3. Vehicle Report */}
                        {activeTab === 'vehicle' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-bold text-gray-600">Vehicle Number</th>
                                            <th className="text-center px-4 py-3 font-bold text-gray-600">Trips Count</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-600">Total Gross MT</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-600">Total Tare MT</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-600 text-success">Total Net MT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.vehicleReport.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-8 text-gray-400">No vehicle records found</td></tr>
                                        ) : reports.vehicleReport.map((row, i) => (
                                            <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50">
                                                <td className="px-4 py-3 font-bold text-primary uppercase font-mono">{row.vehicleNumber}</td>
                                                <td className="px-4 py-3 text-center font-bold">{row.tripCount}</td>
                                                <td className="px-4 py-3 text-right font-mono">{row.totalGrossMT.toFixed(3)} MT</td>
                                                <td className="px-4 py-3 text-right font-mono">{row.totalTareMT.toFixed(3)} MT</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-success">{row.totalNetMT.toFixed(3)} MT</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 4. Driver Report */}
                        {activeTab === 'driver' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-bold text-gray-600">Driver Name</th>
                                            <th className="text-left px-4 py-3 font-bold text-gray-600">Mobile Number</th>
                                            <th className="text-center px-4 py-3 font-bold text-gray-600">Total Trips</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-600 text-primary">Total Weight Delivered (MT)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.driverReport.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-8 text-gray-400">No driver records found</td></tr>
                                        ) : reports.driverReport.map((row, i) => (
                                            <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50">
                                                <td className="px-4 py-3 font-bold text-primary">{row.driverName}</td>
                                                <td className="px-4 py-3 font-mono">{row.driverMobile || '—'}</td>
                                                <td className="px-4 py-3 text-center font-bold">{row.tripCount}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-primary">{row.totalNetMT.toFixed(3)} MT</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 5. Product Report */}
                        {activeTab === 'product' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-bold text-gray-600">Material Name</th>
                                            <th className="text-center px-4 py-3 font-bold text-gray-600">Trips Count</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-600">Total Quantity (MT)</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-600 text-success">Total Sales Amount (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.productReport.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-8 text-gray-400">No product records found</td></tr>
                                        ) : reports.productReport.map((row, i) => (
                                            <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50">
                                                <td className="px-4 py-3 font-bold text-primary">{row.materialName}</td>
                                                <td className="px-4 py-3 text-center font-bold">{row.tripCount}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">{row.totalNetMT.toFixed(3)} MT</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-success">₹{row.totalAmount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default WeighmentReports;
