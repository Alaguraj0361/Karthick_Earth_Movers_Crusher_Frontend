'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import api from '@/utils/api';
import dynamic from 'next/dynamic';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
import IconPrinter from '@/components/icon/icon-printer';
import IconDownload from '@/components/icon/icon-download';
import { useToast } from '@/components/stone-mine/toast-notification';
import * as XLSX from 'xlsx';



const SummaryReports = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';
    const { showToast } = useToast();
    const [year, setYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            const { data: res } = await api.get('/reports/summary', { params: { year } });
            if (res.success) {
                setReportData(res.data);
            }
        } catch (error) {
            console.error(error);
            showToast('Error fetching summaries', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const getSeriesData = (data: any[], type: string) => {
        const series = new Array(12).fill(0);
        data.forEach(item => {
            series[item._id - 1] = item.total;
        });
        return series;
    };

    const chartOptions: any = {
        chart: {
            height: 350,
            type: 'area',
            toolbar: { show: false }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth' },
        xaxis: {
            categories: months,
        },
        tooltip: {
            x: { format: 'MMM' },
        },
        colors: ['#00ab55', '#e7515a'],
        legend: { position: 'top' }
    };

    const exportToExcel = () => {
        if (!reportData) return;
        const excelData = months.map((m, idx) => {
            const sale = reportData.monthlySales.find((s: any) => s._id === idx + 1)?.total || 0;
            const exp = reportData.monthlyExpenses.find((e: any) => e._id === idx + 1)?.total || 0;
            return {
                Month: m,
                'Sales (₹)': sale,
                'Expenses (₹)': exp,
                'Net Profit (₹)': sale - exp
            };
        });

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Monthly Summary');
        XLSX.writeFile(wb, `YearlySummary_${year}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="panel">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <div>
                        <h5 className="text-xl font-bold dark:text-white-light">மாத / ஆண்டு அறிக்கைகள் (Monthly/Yearly)</h5>
                        <p className="text-white-dark text-xs mt-1">Strategic growth and performance analysis</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select className="form-select w-32" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                            {Array.from({ length: (new Date().getFullYear() + 2) - 2024 }, (_, i) => 2024 + i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        {isOwner && (
                            <button className="btn btn-outline-primary" onClick={exportToExcel}>
                                <IconDownload className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> Export
                            </button>
                        )}
                    </div>
                </div>

                {reportData && (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="panel bg-white dark:bg-black border border-white-light/10">
                            <h6 className="font-bold text-lg mb-4">Sales vs Expenses ({year})</h6>
                            <ReactApexChart
                                options={chartOptions}
                                series={[
                                    { name: 'Sales', data: getSeriesData(reportData.monthlySales, 'sales') },
                                    { name: 'Expenses', data: getSeriesData(reportData.monthlyExpenses, 'expenses') }
                                ]}
                                type="area"
                                height={350}
                            />
                        </div>

                        <div className="table-responsive">
                            <table className="table-hover border">
                                <thead className="bg-[#f6f7f8] dark:bg-[#1b2e4b]">
                                    <tr>
                                        <th>Month</th>
                                        <th className="!text-right text-success">Sales (₹)</th>
                                        <th className="!text-right text-danger">Expenses (₹)</th>
                                        <th className="!text-right">Net Profit</th>
                                        <th className="!text-center">Trend</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {months.map((m, idx) => {
                                        const sale = reportData.monthlySales.find((s: any) => s._id === idx + 1)?.total || 0;
                                        const exp = reportData.monthlyExpenses.find((e: any) => e._id === idx + 1)?.total || 0;
                                        const profit = sale - exp;
                                        return (
                                            <tr key={idx}>
                                                <td className="font-bold">{m}</td>
                                                <td className="!text-right text-success font-semibold">{sale.toLocaleString()}</td>
                                                <td className="!text-right text-danger font-semibold">{exp.toLocaleString()}</td>
                                                <td className={`!text-right font-black ${profit >= 0 ? 'text-primary' : 'text-danger'}`}>
                                                    {profit.toLocaleString()}
                                                </td>
                                                <td className="!text-center">
                                                    {profit > 0 ? '📈' : profit < 0 ? '📉' : '➖'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SummaryReports;
