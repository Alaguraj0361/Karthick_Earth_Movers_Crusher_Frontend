'use client';
import ExpenseCategoryManager from '@/components/stone-mine/expense-category-manager';
import React from 'react';

const OfficeExpensePage = () => {
    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><a href="/" className="text-primary hover:underline">Dashboard</a></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Expenses</span></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Office & Misc</span></li>
            </ul>
            <ExpenseCategoryManager category="Office & Misc" title="அலுவலக மற்றும் இதர செலவுகள் (Office & Misc Expenses)" />
        </div>
    );
};

export default OfficeExpensePage;
