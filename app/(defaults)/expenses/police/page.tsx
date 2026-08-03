'use client';
import PoliceExpenseManagement from '@/components/stone-mine/police/police-expense-management';
import React from 'react';

const PoliceExpensePage = () => {
    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><a href="/" className="text-primary hover:underline">Dashboard</a></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Expenses</span></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Police Expense</span></li>
            </ul>
            <PoliceExpenseManagement />
        </div>
    );
};

export default PoliceExpensePage;
