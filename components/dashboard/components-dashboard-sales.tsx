'use client';
import Dropdown from '@/components/dropdown';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconBolt from '@/components/icon/icon-bolt';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconHorizontalDots from '@/components/icon/icon-horizontal-dots';
import IconInbox from '@/components/icon/icon-inbox';
import IconShoppingCart from '@/components/icon/icon-shopping-cart';
import IconTag from '@/components/icon/icon-tag';
import IconBellBing from '@/components/icon/icon-bell-bing';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import IconBox from '@/components/icon/icon-box';
import IconAlertTriangle from '@/components/icon/icon-info-triangle';
import { IRootState } from '@/store';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
import { useSelector } from 'react-redux';
import api from '@/utils/api';

const ComponentsDashboardSales = () => {
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';

    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [chartPeriod, setChartPeriod] = useState('last12months');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { data: res } = await api.get(`/reports/dashboard-summary?chartPeriod=${chartPeriod}`);
            if (res.success) {
                setData(res.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [chartPeriod]);


    // Revenue Chart Data Processing - Synchronized Alignment
    const monthsLabel = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const getChartDataPoints = () => {
        const points: any[] = [];
        const now = new Date();

        if (chartPeriod === 'week') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                points.push({
                    day: d.getDate(),
                    month: d.getMonth() + 1,
                    year: d.getFullYear(),
                    label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                });
            }
        } else if (chartPeriod === 'month') {
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                points.push({
                    day: i,
                    month: now.getMonth() + 1,
                    year: now.getFullYear(),
                    label: i.toString()
                });
            }
        } else if (chartPeriod === 'year') {
            for (let i = 0; i < 12; i++) {
                points.push({
                    month: i + 1,
                    year: now.getFullYear(),
                    label: monthsLabel[i]
                });
            }
        } else if (chartPeriod === 'all') {
            const years = new Set<number>();
            data?.revenueChart?.revenueData?.forEach((rd: any) => years.add(rd._id.year));
            data?.revenueChart?.expenseData?.forEach((ed: any) => years.add(ed._id.year));
            const sortedYears = Array.from(years).sort((a, b) => a - b);

            sortedYears.forEach(year => {
                if (year) {
                    points.push({
                        year,
                        label: year.toString()
                    });
                }
            });
        } else {
            // last12months
            for (let i = 11; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                points.push({
                    month: d.getMonth() + 1,
                    year: d.getFullYear(),
                    label: `${monthsLabel[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`
                });
            }
        }
        return points;
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><span className="animate-spin border-4 border-primary border-t-transparent rounded-full w-12 h-12"></span></div>;

    if (!data) return <div className="flex justify-center items-center h-screen text-white-dark uppercase font-black tracking-widest">No data available (கிடைக்கவில்லை)</div>;

    const chartPoints = getChartDataPoints();

    const revenueChartSeries = [
        {
            name: 'Income',
            data: chartPoints.map(p => {
                const found = data?.revenueChart?.revenueData?.find((rd: any) =>
                    rd?._id &&
                    (p.day ? rd._id.day === p.day : true) &&
                    (p.month ? rd._id.month === p.month : true) &&
                    rd._id.year === p.year
                );
                return found?.total ?? 0;
            })
        },
        {
            name: 'Expenses',
            data: chartPoints.map(p => {
                const found = data?.revenueChart?.expenseData?.find((ed: any) =>
                    ed?._id &&
                    (p.day ? ed._id.day === p.day : true) &&
                    (p.month ? ed._id.month === p.month : true) &&
                    ed._id.year === p.year
                );
                return found?.total ?? 0;
            })
        }
    ];

    const revenueChartLabels = chartPoints.map(p => p.label);

    //Revenue Chart Options
    const revenueChart: any = {
        series: revenueChartSeries,
        options: {
            chart: {
                height: 325,
                type: 'area',
                fontFamily: 'Nunito, sans-serif',
                zoom: { enabled: false },
                toolbar: { show: false },
            },
            dataLabels: { enabled: false },
            stroke: { show: true, curve: 'smooth', width: 2, lineCap: 'square' },
            colors: isDark ? ['#2196F3', '#E7515A'] : ['#1B55E2', '#E7515A'],
            labels: revenueChartLabels,
            xaxis: {
                axisBorder: { show: false },
                axisTicks: { show: false },
                crosshairs: { show: true },
                labels: {
                    offsetX: isRtl ? 2 : 0,
                    offsetY: 5,
                    style: { fontSize: '12px', cssClass: 'apexcharts-xaxis-title' },
                },
            },
            yaxis: {
                tickAmount: 7,
                labels: {
                    formatter: (value: number) => {
                        if (value === null || value === undefined) return '0';
                        if (typeof value !== 'number' || isNaN(value)) return '0';
                        if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                        return String(value);
                    },
                    offsetX: isRtl ? -30 : -10,
                    offsetY: 0,
                    style: { fontSize: '12px', cssClass: 'apexcharts-yaxis-title' },
                },
                opposite: isRtl ? true : false,
            },
            grid: {
                borderColor: isDark ? '#191E3A' : '#E0E6ED',
                strokeDashArray: 5,
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
                padding: { top: 0, right: 0, bottom: 0, left: 0 },
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                fontSize: '16px',
                markers: { width: 10, height: 10, offsetX: -2 },
                itemMargin: { horizontal: 10, vertical: 5 },
            },
            tooltip: { marker: { show: true }, x: { show: true } },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    inverseColors: !1,
                    opacityFrom: isDark ? 0.19 : 0.28,
                    opacityTo: 0.05,
                    stops: isDark ? [100, 100] : [45, 100],
                },
            },
        },
    };

    //Sales By Category
    const salesData = data?.salesByCategory || [];
    const salesByCategory: any = {
        series: salesData.length > 0 ? salesData.map((d: any) => d.total ?? 0) : [0],
        options: {
            chart: { type: 'donut', height: 460, fontFamily: 'Nunito, sans-serif' },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 15, colors: isDark ? '#0e1726' : '#fff' },
            colors: ['#e2a03f', '#5c1ac3', '#e7515a', '#2196f3', '#00ab55'],
            labels: salesData.length > 0 ? salesData.map((d: any) => d._id || 'Unknown') : ['No Data'],
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '14px',
                markers: { width: 10, height: 10, offsetX: -2 },
                height: 50,
                offsetY: 20,
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        background: 'transparent',
                        labels: {
                            show: true,
                            name: { show: true, fontSize: '20px', offsetY: -10 },
                            value: {
                                show: true,
                                fontSize: '20px',
                                color: isDark ? '#bfc9d4' : undefined,
                                offsetY: 16,
                                formatter: (val: any) => {
                                    const num = parseFloat(val);
                                    if (isNaN(num)) return '₹0K';
                                    return '₹' + (num / 1000).toFixed(1) + 'K';
                                },
                            },
                            total: {
                                show: true,
                                label: 'Total Sales',
                                color: '#888ea8',
                                fontSize: '16px',
                                formatter: (w: any) => {
                                    const totals = w?.globals?.seriesTotals;
                                    if (!totals || !Array.isArray(totals)) return '₹0K';
                                    const total = totals.reduce((a: any, b: any) => a + (b || 0), 0);
                                    return '₹' + (total / 1000).toFixed(1) + 'K';
                                },
                            },
                        },
                    },
                },
            },
        },
    };

    if (!isMounted) return null;

    return (
        <>
            <div>
                <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                    <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Mine Overview</span></li>
                </ul>

                {/* Real-time Alerts Section */}
                {(data?.alerts?.compliance?.length > 0) && (
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Compliance Alerts */}
                        {data?.alerts?.compliance?.length > 0 && (
                            <div className="panel bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800 rounded-2xl shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30">
                                        <IconBellBing className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h5 className="font-black uppercase tracking-tight text-red-800 dark:text-red-400">Compliance Expiry (காலாவதி எச்சரிக்கை)</h5>
                                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Documents expiring within 30 days</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {data?.alerts?.compliance.map((v: any) => (
                                        <div key={v._id} className="flex items-start justify-between bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-red-200/50 dark:border-red-800/50">
                                            <div>
                                                <span className="font-black text-sm uppercase italic tracking-tight block">{v.name} ({v.registrationNumber || v.vehicleNumber})</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {(['insuranceExpiryDate', 'fitnessExpiryDate', 'pollutionExpiryDate', 'taxExpiryDate', 'permitExpiryDate']).map((key) => {
                                                        const dateVal = v[key];
                                                        if (dateVal && new Date(dateVal) <= new Date(new Date().setDate(new Date().getDate() + 30))) {
                                                            const label = key.replace('ExpiryDate', '').toUpperCase();
                                                            return <span key={key} className="text-[8px] font-black bg-danger/10 text-danger px-1.5 py-0.5 rounded uppercase tracking-tighter">{label}</span>
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                            </div>
                                            <IconInfoCircle className="w-4 h-4 text-red-500 shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="pt-2">
                    <div className="mb-6 grid gap-6 xl:grid-cols-3">
                        <div className="panel h-full xl:col-span-2 border-none shadow-xl rounded-3xl">
                            <div className="mb-5 flex items-center justify-between dark:text-white-light px-2">
                                <h5 className="text-xl font-black uppercase tracking-tight">Revenue vs Expenses (வருமானம் & செலவுகள்)</h5>
                                <div className="dropdown">
                                    <Dropdown
                                        offset={[0, 5]}
                                        placement={isRtl ? 'bottom-start' : 'bottom-end'}
                                        btnClassName="btn btn-outline-primary dropdown-toggle btn-sm font-black uppercase tracking-widest text-[10px]"
                                        button={
                                            <>
                                                {chartPeriod === 'week' ? 'Last 7 Days' :
                                                    chartPeriod === 'month' ? 'This Month' :
                                                        chartPeriod === 'year' ? 'This Year' :
                                                            chartPeriod === 'all' ? 'All Years' : 'Last 12 Months'}
                                                <span>
                                                    <IconCaretDown className="inline-block ltr:ml-1 rtl:mr-1" />
                                                </span>
                                            </>
                                        }
                                    >
                                        <ul className="!min-w-[150px] font-bold uppercase text-[10px] tracking-widest">
                                            <li><button type="button" onClick={() => setChartPeriod('week')}>Last 7 Days</button></li>
                                            <li><button type="button" onClick={() => setChartPeriod('month')}>This Month</button></li>
                                            <li><button type="button" onClick={() => setChartPeriod('year')}>This Year</button></li>
                                            <li><button type="button" onClick={() => setChartPeriod('last12months')}>Last 12 Months</button></li>
                                            <li><button type="button" onClick={() => setChartPeriod('all')}>All Years</button></li>
                                        </ul>
                                    </Dropdown>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 px-2 mb-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-white-dark tracking-widest mb-1">Month Profit</p>
                                    <p className="text-2xl font-black text-primary italic">₹{(data?.summary?.netProfit || 0).toLocaleString()}</p>
                                </div>
                                <div className="h-10 w-[2px] bg-primary/10"></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-white-dark tracking-widest mb-1">Status</p>
                                    <span className={`badge ${data?.summary?.netProfit > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'} border-none font-black uppercase text-[10px] px-3`}>
                                        {data?.summary?.netProfit > 0 ? 'Profitable' : 'Loss'}
                                    </span>
                                </div>
                            </div>
                            <div className="relative">
                                {isMounted && <ReactApexChart series={revenueChart.series} options={revenueChart.options} type="area" height={325} width={'100%'} />}
                            </div>
                        </div>

                        <div className="panel h-full border-none shadow-xl rounded-3xl">
                            <div className="mb-5 flex items-center px-2">
                                <h5 className="text-xl font-black uppercase tracking-tight dark:text-white-light">Sales By Category (விற்பனை)</h5>
                            </div>
                            <div>
                                {isMounted && <ReactApexChart series={salesByCategory.series} options={salesByCategory.options} type="donut" height={460} width={'100%'} />}
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="panel h-full border-none shadow-xl rounded-3xl bg-gradient-to-br from-white to-gray-50 dark:from-black dark:to-gray-900">
                            <div className="mb-8 flex items-center px-2">
                                <h5 className="text-xl font-black uppercase tracking-tight dark:text-white-light italic">Executive Summary (சுருக்கம்)</h5>
                            </div>
                            <div className="space-y-8 px-2">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-transform hover:scale-110">
                                        <IconInbox className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 ltr:ml-4 rtl:mr-4">
                                        <div className="mb-1 flex font-black uppercase tracking-widest text-[10px] text-white-dark">
                                            <h6>Market Income</h6>
                                            <p className="ltr:ml-auto rtl:mr-auto text-primary">₹{(data?.summary?.monthIncome || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-primary/5">
                                            <div className="h-full rounded-full bg-primary shadow-[0_0_10px_rgba(67,97,238,0.3)]" style={{ width: '100%' }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="h-12 w-12 rounded-2xl bg-danger/10 flex items-center justify-center text-danger shrink-0 transition-transform hover:scale-110">
                                        <IconCreditCard className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 ltr:ml-4 rtl:mr-4">
                                        <div className="mb-1 flex font-black uppercase tracking-widest text-[10px] text-white-dark">
                                            <h6>Operational Cost</h6>
                                            <p className="ltr:ml-auto rtl:mr-auto text-danger">₹{(data?.summary?.monthExpense || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-danger/5">
                                            <div className="h-full rounded-full bg-danger shadow-[0_0_10px_rgba(231,81,90,0.3)]" style={{ width: `${data?.summary?.monthIncome > 0 ? Math.min((data?.summary?.monthExpense / data?.summary?.monthIncome) * 100, 100) : 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center text-success shrink-0 transition-transform hover:scale-110">
                                        <IconTag className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 ltr:ml-4 rtl:mr-4">
                                        <div className="mb-1 flex font-black uppercase tracking-widest text-[10px] text-white-dark">
                                            <h6>Net Surplus</h6>
                                            <p className="ltr:ml-auto rtl:mr-auto text-success">₹{(data?.summary?.netProfit || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-success/5">
                                            <div className="h-full rounded-full bg-success shadow-[0_0_10px_rgba(0,171,85,0.3)]" style={{ width: `${data?.summary?.monthIncome > 0 ? Math.max((data?.summary?.netProfit / data?.summary?.monthIncome) * 100, 0) : 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Business Stats Card - Light Version */}
                        <div className="panel h-full border-none shadow-xl rounded-3xl bg-white dark:bg-black overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-8 translate-x-8"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-success/5 rounded-full translate-y-6 -translate-x-6"></div>
                            <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white-dark mb-1">Quick Stats — இந்த மாதம்</p>
                                    <h5 className="text-2xl font-black text-black dark:text-white">Business Overview</h5>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                                        <p className="text-[9px] uppercase tracking-widest font-black text-white-dark mb-1">Month Income</p>
                                        <p className="text-xl font-black text-primary">₹{((data?.summary?.monthIncome || 0) / 1000).toFixed(1)}K</p>
                                    </div>
                                    <div className="bg-danger/5 rounded-2xl p-4 border border-danger/10">
                                        <p className="text-[9px] uppercase tracking-widest font-black text-white-dark mb-1">Month Expense</p>
                                        <p className="text-xl font-black text-danger">₹{((data?.summary?.monthExpense || 0) / 1000).toFixed(1)}K</p>
                                    </div>
                                    <div className="bg-success/5 rounded-2xl p-4 border border-success/10">
                                        <p className="text-[9px] uppercase tracking-widest font-black text-white-dark mb-1">Net Profit</p>
                                        <p className={`text-xl font-black ${(data?.summary?.netProfit || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                                            ₹{((data?.summary?.netProfit || 0) / 1000).toFixed(1)}K
                                        </p>
                                    </div>
                                    <div className="bg-warning/5 rounded-2xl p-4 border border-warning/10">
                                        <p className="text-[9px] uppercase tracking-widest font-black text-white-dark mb-1">Total Invoices</p>
                                        <p className="text-xl font-black text-warning">{data?.summary?.totalInvoices || 0}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-white/10 pt-4">
                                    <span className="text-[9px] uppercase tracking-widest font-black text-white-dark">Profit Margin</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-success to-primary"
                                                style={{ width: `${data?.summary?.monthIncome > 0 ? Math.max(Math.min((data?.summary?.netProfit / data?.summary?.monthIncome) * 100, 100), 0) : 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-black text-success">
                                            {data?.summary?.monthIncome > 0 ? Math.round((data?.summary?.netProfit / data?.summary?.monthIncome) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Today's Labour Attendance Card */}
                        <div className="panel h-full border-none shadow-xl rounded-3xl bg-white dark:bg-black overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-8 translate-x-8"></div>
                            <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white-dark mb-1">Attendance — வருகை</p>
                                    <h5 className="text-2xl font-black text-black dark:text-white">Labour Stats</h5>
                                </div>

                                <div className="mt-4 flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary text-2xl">👷</div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-0.5">Present Today</p>
                                            <p className="text-2xl font-black text-primary">{data?.summary?.todayAttendance ?? 0}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] uppercase tracking-widest text-white-dark font-black">இன்றைய ஆட்கள்</p>
                                        <div className="mt-1 h-1.5 w-16 rounded-full bg-primary/10 overflow-hidden ml-auto">
                                            <div className="h-full rounded-full bg-primary" style={{ width: '100%' }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 space-y-2">
                                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-tight text-white-dark">
                                        <span>Status</span>
                                        <span className="text-success">Live Tracking</span>
                                    </div>
                                    <Link href="/labour/list" className="text-[9px] font-black uppercase tracking-[0.2em] text-primary hover:underline flex items-center gap-1">
                                        Open Labour Management <IconArrowLeft className="w-3 h-3 rotate-180" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 grid gap-6 sm:grid-cols-2">
                        <div className="panel h-full border-none shadow-xl rounded-2xl col-span-2 overflow-hidden">
                            <div className="mb-6 flex items-center justify-between px-2">
                                <h5 className="text-xl font-black uppercase tracking-tight italic">Latest Live Sales (சமீபத்திய விற்பனை)</h5>
                                <Link href="/sales-billing/sales-entry" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">View All Registry →</Link>
                            </div>
                            <div className="table-responsive rounded-xl">
                                <table className="table-hover">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-white-dark p-4">
                                            <th className="py-4 px-6">Invoice / Date</th>
                                            <th>Customer Name</th>
                                            <th>Total Revenue</th>
                                            <th>Mode</th>
                                            <th className="text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-bold">
                                        {data?.latestSales?.map((sale: any) => (
                                            <tr key={sale._id} className="group hover:bg-primary/5 transition-all">
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-black dark:text-white uppercase italic">{sale.invoiceNumber}</span>
                                                        <span className="text-[10px] text-white-dark uppercase">{new Date(sale.invoiceDate).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-primary/30"></div>
                                                        <span className="uppercase tracking-tight text-white-dark group-hover:text-primary transition-colors">{sale.customer?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-primary italic">₹{(sale.grandTotal || 0).toLocaleString()}</td>
                                                <td>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${sale.paymentType === 'Cash' ? 'text-success' : 'text-warning'}`}>
                                                        {sale.paymentType}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`badge ${sale.paymentStatus === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'} border-none font-black uppercase text-[9px] px-3`}>
                                                        {sale.paymentStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ComponentsDashboardSales;
