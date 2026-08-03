'use client';
import TransportContractorExpense from '@/components/stone-mine/transport-contractor/transport-contractor-expense';
import React from 'react';

const TransportContractorExpensePage = () => {
    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><a href="/" className="text-primary hover:underline">Dashboard</a></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Expenses</span></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Transport Contractor Exp</span></li>
            </ul>
            <TransportContractorExpense />
        </div>
    );
};

export default TransportContractorExpensePage;
