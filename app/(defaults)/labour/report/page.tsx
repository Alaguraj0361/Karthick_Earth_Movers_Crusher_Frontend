'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import IconMenuUsers from '@/components/icon/menu/icon-menu-users';

const LabourReportPage = () => {
    const [labours, setLabours] = useState<any[]>([]);
    const [selectedLabour, setSelectedLabour] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchLabours = async () => {
            try {
                const { data } = await api.get('/labour');
                if (data.success) setLabours(data.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchLabours();
    }, []);

    const fetchReport = async (labourId: string, month: number, year: number) => {
        if (!labourId) {
            setReportData(null);
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get(`/labour/report/${labourId}?month=${month}&year=${year}`);
            if (data.success) setReportData(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLabourChange = (e: any) => {
        setSelectedLabour(e.target.value);
        fetchReport(e.target.value, selectedMonth, selectedYear);
    };

    const handleMonthYearChange = (month: number, year: number) => {
        setSelectedMonth(month);
        setSelectedYear(year);
        if (selectedLabour) {
            fetchReport(selectedLabour, month, year);
        }
    };

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><a href="/" className="text-primary hover:underline">Dashboard</a></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Labour</span></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Labour-wise Reports</span></li>
            </ul>

            <div className="panel mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <IconMenuUsers className="w-8 h-8 text-primary" />
                        <div>
                            <h5 className="text-xl font-bold dark:text-white-light">Labour Reports (தொழிலாளர் அறிக்கை)</h5>
                            <p className="text-white-dark text-xs">Detailed historical data per worker</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            className="form-select border-primary font-bold text-primary w-40"
                            value={selectedMonth}
                            onChange={(e) => handleMonthYearChange(parseInt(e.target.value), selectedYear)}
                        >
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            className="form-select border-primary font-bold text-primary w-32"
                            value={selectedYear}
                            onChange={(e) => handleMonthYearChange(selectedMonth, parseInt(e.target.value))}
                        >
                            {Array.from({ length: 12 }, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <div className="w-full sm:w-60">
                            <select
                                className="form-select border-primary font-bold text-primary"
                                value={selectedLabour}
                                onChange={handleLabourChange}
                            >
                                <option value="">Select Worker to View Report</option>
                                {labours.filter(l => l.labourType === 'Direct').map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="panel text-center py-20 font-bold uppercase tracking-widest text-primary animate-pulse">Generating Report...</div>
            ) : reportData ? (
                <div className="space-y-6">
                    {/* Labour Profile Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="panel lg:col-span-1">
                            <div className="flex flex-col items-center pb-5 border-b mb-5">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary font-extrabold text-3xl mb-3">
                                    {reportData.labour.name.charAt(0)}
                                </div>
                                <h3 className="text-xl font-bold">{reportData.labour.name}</h3>
                                <span className="badge badge-primary">{reportData.labour.workType}</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white-dark uppercase font-bold text-[10px]">Mobile:</span>
                                    <span className="font-bold">{reportData.labour.mobile || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white-dark uppercase font-bold text-[10px]">Wage Rate:</span>
                                    <span className="font-bold">₹{reportData.labour.wage} ({reportData.labour.wageType})</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white-dark uppercase font-bold text-[10px]">Join Date:</span>
                                    <span className="font-bold">{new Date(reportData.labour.joiningDate).toLocaleDateString()}</span>
                                </div>
                                <div className="pt-3">
                                    <span className="text-white-dark uppercase font-bold text-[10px] block mb-1">Address:</span>
                                    <p className="text-xs break-words">{reportData.labour.address || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="panel flex flex-col items-center justify-center text-center p-5 bg-info/5 border-info/20">
                                <div className="text-3xl font-extrabold text-info">{reportData.attendance.length}</div>
                                <div className="text-[10px] font-bold uppercase text-info mt-1">Total Attendance Marked</div>
                            </div>
                             <div className="panel flex flex-col items-center justify-center text-center p-5 bg-warning/5 border-warning/20">
                                <div className="text-3xl font-extrabold text-warning">₹ {reportData.advances.reduce((sum: number, a: any) => sum + a.amount, 0).toLocaleString()}</div>
                                <div className="text-[10px] font-bold uppercase text-warning mt-1">Advance Taken In This Period</div>
                            </div>
                            <div className="panel flex flex-col items-center justify-center text-center p-5 bg-success/5 border-success/20">
                                <div className="text-3xl font-extrabold text-success">
                                    {reportData.attendance.filter((a: any) => a.status === 'Present').length} / {reportData.attendance.length}
                                </div>
                                <div className="text-[10px] font-bold uppercase text-success mt-1">Present Percentage</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs / History Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="panel">
                            <h5 className="text-lg font-bold mb-5 uppercase text-primary border-b pb-3">Attendance History</h5>
                            <div className="table-responsive max-h-[400px]">
                                <table className="table-hover">
                                    <thead className="sticky top-0 bg-white dark:bg-black z-10">
                                        <tr>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>OT (Hrs)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.attendance.map((att: any) => (
                                            <tr key={att._id}>
                                                <td>{new Date(att.date).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`badge badge-sm ${att.status === 'Present' ? 'badge-outline-success' :
                                                        att.status === 'Half Day' ? 'badge-outline-warning' : 'badge-outline-danger'
                                                        }`}>
                                                        {att.status}
                                                    </span>
                                                </td>
                                                <td className="font-bold">{att.overtimeHours || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="panel">
                            <h5 className="text-lg font-bold mb-5 uppercase text-danger border-b pb-3">Advance History</h5>
                            <div className="table-responsive max-h-[400px]">
                                <table className="table-hover">
                                    <thead className="sticky top-0 bg-white dark:bg-black z-10">
                                        <tr>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Mode</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.advances.map((adv: any) => (
                                            <tr key={adv._id}>
                                                <td>{new Date(adv.date).toLocaleDateString()}</td>
                                                <td className="text-danger font-bold">₹{adv.amount.toLocaleString()}</td>
                                                <td className="text-xs uppercase font-bold">{adv.paymentMode}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="panel text-center py-20 text-white-dark italic">
                    <p className="text-lg uppercase font-bold">Please select a worker to generate a report</p>
                    <IconMenuUsers className="w-16 h-16 mx-auto mt-4 opacity-50" />
                </div>
            )}
        </div>
    );
};

export default LabourReportPage;
