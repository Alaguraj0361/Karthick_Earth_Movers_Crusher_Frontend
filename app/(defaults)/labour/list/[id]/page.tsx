'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/utils/api';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconCalendar from '@/components/icon/icon-calendar';
import IconUser from '@/components/icon/icon-user';
import IconChecks from '@/components/icon/icon-checks';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconClock from '@/components/icon/icon-clock';
import IconCashBanknotes from '@/components/icon/icon-cash-banknotes';

const LabourDetailsPage = () => {
    const params = useParams();
    const [labour, setLabour] = useState<any>(null);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [advances, setAdvances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const months = [
        { value: 1, label: 'January (ஜனவரி)' }, { value: 2, label: 'February (பிப்ரவரி)' },
        { value: 3, label: 'March (மார்ச்)' }, { value: 4, label: 'April (ஏப்ரல்)' },
        { value: 5, label: 'May (மே)' }, { value: 6, label: 'June (ஜூன்)' },
        { value: 7, label: 'July (ஜூலை)' }, { value: 8, label: 'August (ஆகஸ்ட்)' },
        { value: 9, label: 'September (செப்டம்பர்)' }, { value: 10, label: 'October (அக்டோபர்)' },
        { value: 11, label: 'November (நவம்பர்)' }, { value: 12, label: 'December (டிசம்பர்)' }
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    const fetchDetails = async () => {
        try {
            const { data } = await api.get(`/labour/report/${params.id}`);
            if (data.success) {
                setLabour(data.data.labour);
                setAttendance(data.data.attendance);
                setAdvances(data.data.advances);
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) fetchDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    if (loading) return <div className="p-10 text-center font-bold">Loading Profile...</div>;
    if (!labour) return <div className="p-10 text-center text-danger font-bold">Labour details not found!</div>;

    // Filtered data for the selected month
    const filteredAttendance = attendance.filter(a => {
        const d = new Date(a.date);
        return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
    });

    const filteredAdvances = advances.filter(a => {
        const d = new Date(a.date);
        return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
    });

    const monthlyStats = {
        present: filteredAttendance.filter(a => a.status === 'Present').length,
        halfDay: filteredAttendance.filter(a => a.status === 'Half Day').length,
        absent: filteredAttendance.filter(a => a.status === 'Absent').length,
        totalOT: filteredAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
        totalAdvance: filteredAdvances.reduce((sum, a) => sum + a.amount, 0),
    };

    const lifetimeStats = {
        totalAdvance: advances.reduce((sum, a) => sum + a.amount, 0),
        totalOT: attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/labour/list" className="btn btn-outline-primary btn-sm rounded-full w-10 h-10 p-0 flex items-center justify-center">
                        <IconArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h4 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
                            {labour.name} <span className="text-sm font-medium text-white-dark normal-case"> - Profile Details</span>
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`badge ${labour.labourType === 'Direct' ? 'badge-outline-primary' : 'badge-outline-warning'} text-[10px] font-bold py-0.5`}>
                                {labour.labourType || 'Direct'} WORKER
                            </span>
                            <span className="text-xs text-white-dark font-medium flex items-center gap-1">
                                <IconCalendar className="w-3 h-3" /> Joined: {new Date(labour.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        className="form-select w-44 font-bold border-primary/20 focus:border-primary shadow-sm"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    >
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select
                        className="form-select w-32 font-bold border-primary/20 focus:border-primary shadow-sm"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="panel p-0 overflow-hidden rounded-2xl border-none shadow-lg">
                        <div className="bg-gradient-to-br from-primary/80 to-primary p-8 text-center text-white relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <IconUser className="w-24 h-24" />
                            </div>
                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30 text-4xl font-black shadow-xl">
                                {labour.name.charAt(0)}
                            </div>
                            <h5 className="text-xl font-bold">{labour.name}</h5>
                            <p className="text-white/70 text-sm font-medium">{labour.workType}</p>
                            <div className="mt-4 inline-block bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border border-white/20">
                                ID: {labour._id.substring(labour._id.length - 6).toUpperCase()}
                            </div>
                        </div>
                        <div className="p-6 space-y-5 bg-white dark:bg-gray-800">
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center text-info group-hover:bg-info group-hover:text-white transition-all">
                                        <IconClock className="w-5 h-5" />
                                    </div>
                                    <div className="text-sm font-bold text-white-dark">Wage Type</div>
                                </div>
                                <div className="text-sm font-black text-gray-800 dark:text-white">{labour.wageType}</div>
                            </div>
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center text-success group-hover:bg-success group-hover:text-white transition-all">
                                        <IconCashBanknotes className="w-5 h-5" />
                                    </div>
                                    <div className="text-sm font-bold text-white-dark">Rate</div>
                                </div>
                                <div className="text-sm font-black text-gray-800 dark:text-white">₹{labour.wage?.toLocaleString()}</div>
                            </div>
                            {labour.labourType === 'Vendor' && (
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center text-warning group-hover:bg-warning group-hover:text-white transition-all">
                                            <IconUser className="w-5 h-5" />
                                        </div>
                                        <div className="text-sm font-bold text-white-dark">Contractor</div>
                                    </div>
                                    <div className="text-sm font-black text-warning">
                                        {labour.contractor?.name}
                                        <div className="text-[10px] text-white-dark font-medium text-right">{labour.contractor?.companyName}</div>
                                    </div>
                                </div>
                            )}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="text-xs font-bold text-white-dark uppercase mb-3">Address & Contact</div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                    {labour.address || 'No address provided'}
                                </p>
                                <p className="text-primary font-bold mt-2 text-sm">{labour.mobile || 'No contact info'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="panel bg-gray-50 dark:bg-gray-800/50 border-none rounded-2xl p-6">
                        <h6 className="text-sm font-bold mb-4 flex items-center gap-2">
                            <IconChecks className="w-4 h-4 text-primary" /> Lifetime Summary
                        </h6>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <span className="text-sm font-bold text-white-dark">Total Attendance</span>
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-black text-sm">{attendance.length} Days</span>
                            </div>
                            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <span className="text-sm font-bold text-white-dark">Total Advance</span>
                                <span className="bg-danger/10 text-danger px-3 py-1 rounded-lg font-black text-sm">₹{lifetimeStats.totalAdvance.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <span className="text-sm font-bold text-white-dark">Lifetime OT</span>
                                <span className="bg-info/10 text-info px-3 py-1 rounded-lg font-black text-sm">{lifetimeStats.totalOT} Hrs</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Attendance Records & Stats */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Breakdown Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="panel bg-gradient-to-br from-success/5 to-success/10 border-success/20 rounded-2xl p-4 text-center group hover:scale-105 transition-all">
                            <div className="text-success text-2xl font-black mb-1 group-hover:scale-110 transition-transform">{monthlyStats.present}</div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-success/70">Days Present</div>
                        </div>
                        <div className="panel bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 rounded-2xl p-4 text-center group hover:scale-105 transition-all">
                            <div className="text-warning text-2xl font-black mb-1 group-hover:scale-110 transition-transform">{monthlyStats.halfDay}</div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-warning/70">Half Days</div>
                        </div>
                        <div className="panel bg-gradient-to-br from-danger/5 to-danger/10 border-danger/20 rounded-2xl p-4 text-center group hover:scale-105 transition-all">
                            <div className="text-danger text-2xl font-black mb-1 group-hover:scale-110 transition-transform">{monthlyStats.absent}</div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-danger/70">Days Absent</div>
                        </div>
                        <div className="panel bg-gradient-to-br from-info/5 to-info/10 border-info/20 rounded-2xl p-4 text-center group hover:scale-105 transition-all">
                            <div className="text-info text-2xl font-black mb-1 group-hover:scale-110 transition-transform">{monthlyStats.totalOT}</div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-info/70">OT Hours</div>
                        </div>
                    </div>

                    <div className="panel rounded-2xl shadow-xl border-none">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="text-lg font-black flex items-center gap-2">
                                <IconCalendar className="text-primary" /> Attendance History - {months.find(m => m.value === selectedMonth)?.label}
                            </h5>
                        </div>
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                    <tr>
                                        <th className="font-black text-xs uppercase tracking-wider">Date</th>
                                        <th className="font-black text-xs uppercase tracking-wider">Status</th>
                                        <th className="font-black text-xs uppercase tracking-wider">OT Hours</th>
                                        <th className="font-black text-xs uppercase tracking-wider text-right">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAttendance.length === 0 ? (
                                        <tr><td colSpan={4} className="text-center py-10 font-bold text-white-dark uppercase">No attendance history found for this month</td></tr>
                                    ) : (
                                        filteredAttendance.map((att, idx) => (
                                            <tr key={idx} className="group">
                                                <td className="font-bold text-gray-700 dark:text-white-light">
                                                    {new Date(att.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td>
                                                    <span className={`badge ${att.status === 'Present' ? 'badge-outline-success' :
                                                        att.status === 'Half Day' ? 'badge-outline-warning' : 'badge-outline-danger'
                                                        } font-black text-[10px] px-3 py-1 rounded-full uppercase`}>
                                                        {att.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {att.overtimeHours > 0 ? (
                                                        <span className="text-info font-black flex items-center gap-1">
                                                            <IconClock className="w-3 h-3" /> {att.overtimeHours} Hrs
                                                        </span>
                                                    ) : (
                                                        <span className="text-white-dark opacity-50">-</span>
                                                    )}
                                                </td>
                                                <td className="text-right italic text-xs text-white-dark group-hover:text-primary transition-colors">
                                                    {att.remarks || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Advances Tab (Optional but good for transparency) */}
                    <div className="panel rounded-2xl border-none shadow-lg">
                        <h5 className="text-lg font-black mb-5 flex items-center gap-2 text-danger">
                            <IconCashBanknotes /> Advance Payment History
                        </h5>
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead className="bg-danger/5 dark:bg-danger/10">
                                    <tr>
                                        <th className="font-black text-xs uppercase tracking-wider">Date</th>
                                        <th className="font-black text-xs uppercase tracking-wider">Amount</th>
                                        <th className="font-black text-xs uppercase tracking-wider text-right">Method / Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAdvances.length === 0 ? (
                                        <tr><td colSpan={3} className="text-center py-8 font-bold text-white-dark uppercase">No advance payments recorded for this month</td></tr>
                                    ) : (
                                        filteredAdvances.map((adv, idx) => (
                                            <tr key={idx}>
                                                <td className="font-bold">
                                                    {new Date(adv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="text-danger font-black">₹{adv.amount.toLocaleString()}</td>
                                                <td className="text-right text-sm">
                                                    <span className="badge badge-outline-dark text-[10px] font-bold mr-2">{adv.paymentMode}</span>
                                                    <span className="text-white-dark italic text-xs">{adv.remarks || '-'}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabourDetailsPage;
