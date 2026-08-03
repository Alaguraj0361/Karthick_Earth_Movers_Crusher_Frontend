'use client';
import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import Swal from 'sweetalert2';

interface StockItem {
    productTypeId: string;
    product: { _id: string; name: string; unit: string; category: string; baseRate: number };
    quantityMT: number;
    openingStockMT: number;
    totalProducedMT: number;
    totalSoldMT: number;
    lastUpdated: string;
}

const CrusherStockPage = () => {
    const [stock, setStock] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editOpening, setEditOpening] = useState('');

    const fetchStock = async () => {
        setLoading(true);
        try {
            const res = await api.get('/crusher-stock');
            setStock(res.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchStock(); }, []);

    const handleSetOpening = async (productTypeId: string) => {
        if (!editOpening || parseFloat(editOpening) < 0) return Swal.fire('Error', 'Enter a valid quantity', 'error');
        try {
            await api.post('/crusher-stock/opening', { productTypeId, openingStockMT: parseFloat(editOpening) });
            setEditingId(null);
            setEditOpening('');
            fetchStock();
            Swal.fire({ icon: 'success', title: 'Opening stock set!', timer: 1500, showConfirmButton: false });
        } catch (err) { Swal.fire('Error', 'Failed to set opening stock', 'error'); }
    };

    const getStockColor = (qty: number) => {
        if (qty <= 0) return 'red';
        if (qty < 50) return 'yellow';
        return 'green';
    };

    const totalStock = stock.reduce((a, s) => a + (s.quantityMT || 0), 0);
    const totalValue = stock.reduce((a, s) => a + (s.quantityMT || 0) * (s.product?.baseRate || 0), 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-lg shadow">📦</div>
                    <div>
                        <h1 className="text-xl font-bold">Crusher Stock</h1>
                        <p className="text-xs text-gray-500">Live running inventory — updated from production logs and sales</p>
                    </div>
                </div>
                <button onClick={fetchStock} className="btn btn-outline-primary text-sm">🔄 Refresh</button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
                <div className="panel bg-gradient-to-r from-teal-50 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 border-teal-200 dark:border-teal-700">
                    <p className="text-xs text-teal-700 dark:text-teal-400 font-medium">Total Stock</p>
                    <p className="text-3xl font-black text-teal-600 dark:text-teal-400">{totalStock.toFixed(3)} MT</p>
                </div>
                <div className="panel bg-gradient-to-r from-indigo-50 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border-indigo-200 dark:border-indigo-700">
                    <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">Estimated Stock Value</p>
                    <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
            </div>

            {/* Stock Grid */}
            {loading ? (
                <div className="text-center py-16"><div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-3"></div>Loading stock...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stock.map(item => {
                        const color = getStockColor(item.quantityMT);
                        return (
                            <div key={item.productTypeId} className={`panel border-l-4 ${
                                color === 'green' ? 'border-green-500' : color === 'yellow' ? 'border-yellow-500' : 'border-red-500'
                            }`}>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-gray-900 dark:text-white">{item.product?.name}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                        color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                                        color === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                                        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                    }`}>
                                        {color === 'red' ? '🔴 LOW' : color === 'yellow' ? '🟡 MED' : '🟢 OK'}
                                    </span>
                                </div>

                                {/* Current Stock */}
                                <div className="text-center py-2">
                                    <p className={`text-4xl font-black ${
                                        color === 'green' ? 'text-green-600 dark:text-green-400' :
                                        color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                                        'text-red-600 dark:text-red-400'
                                    }`}>{(item.quantityMT || 0).toFixed(3)}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">MT Current Stock</p>
                                </div>

                                {/* Breakdown */}
                                <div className="grid grid-cols-3 gap-1 text-center text-xs mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <div>
                                        <p className="text-gray-400">Opening</p>
                                        <p className="font-bold text-gray-700 dark:text-gray-300">{(item.openingStockMT || 0).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-green-500">Produced</p>
                                        <p className="font-bold text-green-600 dark:text-green-400">+{(item.totalProducedMT || 0).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-red-400">Sold</p>
                                        <p className="font-bold text-red-500 dark:text-red-400">−{(item.totalSoldMT || 0).toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Set Opening Stock */}
                                {editingId === item.productTypeId ? (
                                    <div className="mt-3 flex gap-2">
                                        <input
                                            type="number" step="0.001" min="0"
                                            value={editOpening}
                                            onChange={e => setEditOpening(e.target.value)}
                                            placeholder="Opening MT"
                                            className="form-input flex-1 text-sm"
                                            autoFocus
                                        />
                                        <button onClick={() => handleSetOpening(item.productTypeId)} className="btn btn-sm btn-success px-3">✓</button>
                                        <button onClick={() => setEditingId(null)} className="btn btn-sm btn-outline-secondary px-3">✕</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { setEditingId(item.productTypeId); setEditOpening((item.openingStockMT || 0).toString()); }}
                                        className="mt-3 w-full text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-center py-1.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 transition"
                                    >
                                        Set Opening Stock
                                    </button>
                                )}

                                {item.product?.baseRate > 0 && (
                                    <p className="text-xs text-center text-gray-400 mt-2">
                                        ₹{item.product.baseRate}/MT • Est. Value: ₹{((item.quantityMT || 0) * item.product.baseRate).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CrusherStockPage;
