'use client';
import ExpenseCategoryManager from '@/components/stone-mine/expense-category-manager';
import React from 'react';

const DieselExpensePage = () => {
    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><a href="/" className="text-primary hover:underline">Dashboard</a></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Expenses</span></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Diesel</span></li>
            </ul>
            <ExpenseCategoryManager category="Diesel" title="டீசல் / எரிபொருள் செலவு (Diesel / Fuel Expenses)" />
        </div>
    );
};

export default DieselExpensePage;
