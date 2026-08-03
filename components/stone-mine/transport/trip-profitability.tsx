'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import IconSearch from '@/components/icon/icon-search';
import IconTrendingUp from '@/components/icon/icon-trending-up';
import IconTrendingDown from '@/components/icon/icon-trending-down';

const TripProfitability = () => {
    const [trips, setTrips] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tripRes, statRes] = await Promise.all([
                api.get('/trips'),
                api.get('/trips/stats')
            ]);
            if (tripRes.data.success) {
                const sorted = tripRes.data.data.sort((a: any, b: any) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    if (dateB !== dateA) return dateB - dateA;
                    return (b._id || '').localeCompare(a._id || '');
                });
                setTrips(sorted);
            }
            if (statRes.data.success) setStats(statRes.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold dark:text-white-light">வாகன பயண லாபம் (Vehicle Trip Profit)</h2>
                <p className="text-white-dark text-sm mt-1">Net profit analysis: Income - (Driver Salary + Other Costs)</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="panel bg-primary/10 border-primary/20">
                    <div className="text-white-dark text-xs font-bold uppercase">Total Trip Income</div>
                    <div className="text-2xl font-black text-primary mt-1">₹{stats?.totalIncome?.toLocaleString()}</div>
                </div>
                <div className="panel bg-warning/10 border-warning/20">
                    <div className="text-white-dark text-xs font-bold uppercase">Total Driver Salary</div>
                    <div className="text-2xl font-black text-warning mt-1">₹{(stats?.totalDriverPayment + stats?.totalBata)?.toLocaleString()}</div>
                </div>
                <div className="panel bg-success/10 border-success/20">
                    <div className="text-white-dark text-xs font-bold uppercase">Net Profit</div>
                    <div className="text-2xl font-black text-success mt-1">₹{stats?.totalProfit?.toLocaleString()}</div>
                </div>
            </div>

            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-bold text-lg">Detailed Profit Analysis</h5>
                    <div className="relative">
                        <input type="text" placeholder="Filter by vehicle..." className="form-input ltr:pr-10" />
                        <IconSearch className="w-5 h-5 absolute ltr:right-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th>Vehicle Info</th>
                                <th className="!text-right text-primary">Income (A)</th>
                                <th className="!text-right text-warning">Driver Salary (B)</th>
                                <th className="!text-right text-info">Other (C)</th>
                                <th className="!text-right text-success bg-success/5 font-black">Net Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8">Calculating...</td></tr>
                            ) : trips.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8">No data available.</td></tr>
                            ) : (
                                trips.map(trip => (
                                    <tr key={trip._id}>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] bg-primary/10 text-primary px-1 rounded uppercase font-bold">{trip.vehicleType || 'Lorry'}</span>
                                                <div className="font-bold">{trip.vehicleNumber || trip.lorryNumber}</div>
                                            </div>
                                            <div className="text-[10px] text-white-dark uppercase">{new Date(trip.date).toLocaleDateString()} — {trip.materialType}</div>
                                        </td>
                                        <td className="!text-right font-bold text-primary">₹{trip.tripRate?.toLocaleString()}</td>
                                        <td className="!text-right font-bold text-warning">₹{(trip.driverAmount + trip.driverBata)?.toLocaleString()}</td>
                                        <td className="!text-right font-bold text-info">₹{trip.otherExpenses?.toLocaleString()}</td>
                                        <td className={`!text-right font-black text-lg bg-success/5 ${trip.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                                            <div className="flex items-center justify-end gap-1">
                                                ₹{trip.netProfit?.toLocaleString()}
                                                {trip.netProfit >= 0 ? <IconTrendingUp className="w-4 h-4" /> : <IconTrendingDown className="w-4 h-4" />}
                                            </div>
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

export default TripProfitability;
