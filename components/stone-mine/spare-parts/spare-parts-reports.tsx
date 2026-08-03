'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';

const SparePartsReports = () => {
    const [sales, setSales] = useState<any[]>([]);
    const [spareParts, setSpareParts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        sparePartId: '',
        customerName: '',
    });

    useEffect(() => {
        const init = async () => {
            const partsRes = await api.get('/spare-parts');
            if (partsRes.data.success) setSpareParts(partsRes.data.data);
            fetchSales();
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const res = await api.get('/spare-parts-sales', { params });
            if (res.data.success) {
                setSales(res.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: any) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterSubmit = (e: any) => {
        e.preventDefault();
        fetchSales();
    };

    const resetFilters = () => {
        setFilters({ startDate: '', endDate: '', sparePartId: '', customerName: '' });
        setTimeout(fetchSales, 0);
    };

    // Flatten data for report:
    // We need to show "Who purchased this spare part"
    let reportData: any[] = [];
    sales.forEach(sale => {
        sale.items.forEach((item: any) => {
            reportData.push({
                saleId: sale._id,
                date: sale.date,
                customerName: sale.customerName,
                phoneNumber: sale.phoneNumber,
                vehicleName: sale.vehicleName,
                vehicleNumber: sale.vehicleNumber,
                sparePartId: item.sparePart,
                spareName: item.spareName,
                quantity: item.quantity,
                price: item.price,
                total: item.total
            });
        });
    });

    // Apply specific frontend filters (Customer & Spare Part)
    if (filters.customerName) {
        const lSearch = filters.customerName.toLowerCase();
        reportData = reportData.filter(r => r.customerName.toLowerCase().includes(lSearch));
    }
    if (filters.sparePartId) {
        reportData = reportData.filter(r => r.sparePartId === filters.sparePartId);
    }

    // Group by Spare Part for nice view
    const groupedData = reportData.reduce((acc: Record<string, any[]>, curr: any) => {
        if (!acc[curr.spareName]) acc[curr.spareName] = [];
        acc[curr.spareName].push(curr);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div className="space-y-6">
            <div className="panel animate__animated animate__fadeIn">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="text-xs font-bold uppercase mb-1">Start Date</label>
                        <input type="date" name="startDate" className="form-input" value={filters.startDate} onChange={handleFilterChange} />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase mb-1">End Date</label>
                        <input type="date" name="endDate" className="form-input" value={filters.endDate} onChange={handleFilterChange} />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase mb-1">Customer Search</label>
                        <input type="text" name="customerName" placeholder="Enter name..." className="form-input" value={filters.customerName} onChange={handleFilterChange} />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase mb-1">Spare Part Filter</label>
                        <select name="sparePartId" className="form-select" value={filters.sparePartId} onChange={handleFilterChange}>
                            <option value="">All Spare Parts</option>
                            {spareParts.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="btn btn-primary w-full">Filter</button>
                        <button type="button" className="btn btn-outline-danger w-full" onClick={resetFilters}>Reset</button>
                    </div>
                </form>
            </div>

            {loading ? (
                <div className="panel text-center py-10 font-bold text-white-dark">Loading Report Data...</div>
            ) : Object.keys(groupedData).length === 0 ? (
                <div className="panel text-center py-10 font-bold text-white-dark">No records found for these filters.</div>
            ) : (
                <div className="space-y-6">
                    {Object.keys(groupedData).sort().map(spareName => {
                        const items = groupedData[spareName];
                        const totalQty = items.reduce((sum: number, i: any) => sum + i.quantity, 0);
                        const totalValue = items.reduce((sum: number, i: any) => sum + i.total, 0);

                        return (
                            <div key={spareName} className="panel p-0 overflow-hidden shadow-lg border border-primary/10">
                                <div className="bg-primary/10 px-5 py-4 flex justify-between items-center cursor-pointer border-b border-primary/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg px-2">
                                            🔧
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-lg text-primary">{spareName}</h5>
                                            <p className="text-xs text-white-dark uppercase tracking-wider font-bold">Purchased by {items.length} Customers</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-white-dark font-bold uppercase mb-1">Total Dispensed</div>
                                        <div className="font-black text-primary text-xl">{totalQty} Units <span className="text-sm opacity-50 ml-1">(₹{totalValue.toLocaleString()})</span></div>
                                    </div>
                                </div>
                                <div className="p-0 table-responsive border-none">
                                    <table className="table-hover table-striped">
                                        <thead>
                                            <tr className="bg-dark/5 dark:bg-dark border-none">
                                                <th className="font-bold">Date</th>
                                                <th className="font-bold">Customer Name</th>
                                                <th className="font-bold">Contact</th>
                                                <th className="font-bold">Vehicle Details</th>
                                                <th className="font-bold text-center">Qty Purchased</th>
                                                <th className="font-bold text-right">Value (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((row, i) => (
                                                <tr key={i} className="border-b border-white-light dark:border-dark">
                                                    <td className="text-sm">{new Date(row.date).toLocaleDateString()}</td>
                                                    <td className="font-bold text-primary">{row.customerName}</td>
                                                    <td className="text-xs">📞 {row.phoneNumber}</td>
                                                    <td>
                                                        <div className="font-bold text-xs">{row.vehicleName}</div>
                                                        <div className="text-[10px] text-white-dark">{row.vehicleNumber || '—'}</div>
                                                    </td>
                                                    <td className="text-center font-bold">{row.quantity}</td>
                                                    <td className="text-right font-bold text-success">₹{row.total.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SparePartsReports;
