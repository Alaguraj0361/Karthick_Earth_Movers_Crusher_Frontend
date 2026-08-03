'use client';
import React, { useState } from 'react';
import SparePartsMaster from '@/components/stone-mine/spare-parts/spare-parts-master';
import SparePartsSales from '@/components/stone-mine/spare-parts/spare-parts-sales';
import SparePartsReports from '@/components/stone-mine/spare-parts/spare-parts-reports';

const SparePartsPage = () => {
    const [activeTab, setActiveTab] = useState('master');

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h5 className="font-semibold text-lg dark:text-white-light">Spare Parts Stock Management</h5>
                    <p className="text-white-dark text-xs mt-1">Manage master parts, record stock out sales, and view grouped reports</p>
                </div>
            </div>

            <div className="panel mb-5 p-0 overflow-hidden">
                <div className="flex flex-wrap border-b border-white-light dark:border-[#191e3a]">
                    <button
                        className={`p-5 py-3 hover:text-primary transition-all font-semibold outline-none flex items-center gap-2 ${
                            activeTab === 'master' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-white-dark'
                        }`}
                        onClick={() => setActiveTab('master')}
                    >
                        📦 Spareparts Lists
                    </button>
                    <button
                        className={`p-5 py-3 hover:text-primary transition-all font-semibold outline-none flex items-center gap-2 ${
                            activeTab === 'sales' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-white-dark'
                        }`}
                        onClick={() => setActiveTab('sales')}
                    >
                        🧾 Stock / Sales Entry
                    </button>
                    <button
                        className={`p-5 py-3 hover:text-primary transition-all font-semibold outline-none flex items-center gap-2 ${
                            activeTab === 'reports' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-white-dark'
                        }`}
                        onClick={() => setActiveTab('reports')}
                    >
                        📊 Reports & Analytics
                    </button>
                </div>
                
                <div className="p-5">
                    {activeTab === 'master' && <SparePartsMaster />}
                    {activeTab === 'sales' && <SparePartsSales />}
                    {activeTab === 'reports' && <SparePartsReports />}
                </div>
            </div>
        </div>
    );
};

export default SparePartsPage;
