'use client';
import React, { useState, useEffect } from 'react';
import IconPlus from '@/components/icon/icon-plus';
import IconSearch from '@/components/icon/icon-search';
import IconSettings from '@/components/icon/icon-settings';
import IconEdit from '@/components/icon/icon-edit';
import IconMenuWidgets from '@/components/icon/menu/icon-menu-widgets';
import api from '@/utils/api';
import Link from 'next/link';

const AssetRegistry = () => {
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/master/vehicles');
            if (data.success) setAssets(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const filteredAssets = assets.filter((asset) => {
        return (
            asset.name.toLowerCase().includes(search.toLowerCase()) ||
            (asset.registrationNumber || '').toLowerCase().includes(search.toLowerCase()) ||
            (asset.vehicleNumber || '').toLowerCase().includes(search.toLowerCase()) ||
            (asset.category || '').toLowerCase().includes(search.toLowerCase()) ||
            (asset.type || '').toLowerCase().includes(search.toLowerCase())
        );
    });

    return (
        <div className="space-y-6">
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><Link href="/" className="text-primary hover:underline font-bold">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Machine & Vehicle</span></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Quarry Fleet List</span></li>
            </ul>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h5 className="text-2xl font-black text-black dark:text-white-light uppercase tracking-tight text-primary">Quarry Fleet Master List</h5>
                    <p className="text-white-dark text-sm font-bold mt-1 uppercase tracking-widest">Consolidated Registry of Heavy Machinery & Transport Vehicles</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search names, plates..."
                            className="form-input ltr:pl-10 rtl:pr-10 border-2 font-bold rounded-xl h-12 focus:border-primary transition-all"
                        />
                        <div className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2">
                            <IconSearch className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    Array(8).fill(0).map((_, i) => (
                        <div key={i} className="panel h-52 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-3xl"></div>
                    ))
                ) : filteredAssets.length === 0 ? (
                    <div className="col-span-full panel py-20 text-center uppercase font-black tracking-[0.2em] opacity-20 text-xl border-dashed border-2">
                        {search ? 'No matching assets found' : 'No assets registered in the fleet'}
                    </div>
                ) : (
                    filteredAssets.map((asset) => (
                        <div key={asset._id} className="relative group">
                            <div className={`absolute -inset-0.5 bg-gradient-to-r rounded-3xl blur opacity-20 group-hover:opacity-100 transition duration-500 ${asset.type === 'Machine' ? 'from-warning to-orange-600' : 'from-info to-blue-600'}`}></div>
                            <div className="relative panel p-0 rounded-3xl bg-white dark:bg-black border-none shadow-xl transform group-hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                                <div className={`p-4 flex items-center justify-between ${asset.type === 'Machine' ? 'bg-warning/10' : 'bg-info/10'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl text-white shadow-lg ${asset.type === 'Machine' ? 'bg-warning shadow-warning/20' : 'bg-info shadow-info/20'}`}>
                                            {asset.type === 'Machine' ? <IconSettings className="w-5 h-5" /> : <IconMenuWidgets className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <span className={`font-black text-[10px] uppercase tracking-[0.2em] block leading-none ${asset.type === 'Machine' ? 'text-warning' : 'text-info'}`}>{asset.category || (asset.type === 'Machine' ? 'EQUIPMENT' : 'VEHICLE')}</span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block text-white ${asset.ownershipType === 'Own' ? 'bg-success' : 'bg-warning'}`}>
                                                {asset.ownershipType === 'Own' ? 'OWN' : 'RENTAL'}
                                            </span>
                                        </div>
                                    </div>
                                    <Link href={asset.type === 'Machine' ? '/assets/machines' : '/assets/vehicles'} className="p-2 bg-white/50 dark:bg-white/10 rounded-lg hover:text-primary transition-colors shadow-sm">
                                        <IconEdit className="w-4 h-4" />
                                    </Link>
                                </div>

                                <div className="p-6">
                                    <h6 className="text-xl font-black text-black dark:text-white-light mb-1 line-clamp-1">{asset.name}</h6>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-xs font-black bg-primary/10 text-primary px-3 py-1 rounded-lg uppercase tracking-widest">
                                            {asset.registrationNumber || asset.vehicleNumber || 'NO PLATE'}
                                        </span>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white-light/5">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                            <span className="text-white-dark">{asset.type === 'Machine' ? 'Operator' : 'Driver'}</span>
                                            <span className="text-black dark:text-white-light truncate max-w-[120px]">{asset.operatorName || asset.driverName || 'Not Assigned'}</span>
                                        </div>
                                        {asset.type === 'Machine' ? (
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                                <span className="text-white-dark">Hours</span>
                                                <span className="text-info font-black">{asset.mileageDetails || '0'} HR</span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                                <span className="text-white-dark">Permit Expiry</span>
                                                <span className={`font-black ${asset.permitExpiryDate && new Date(asset.permitExpiryDate) < new Date() ? 'text-danger' : 'text-success'}`}>
                                                    {asset.permitExpiryDate ? new Date(asset.permitExpiryDate).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AssetRegistry;
