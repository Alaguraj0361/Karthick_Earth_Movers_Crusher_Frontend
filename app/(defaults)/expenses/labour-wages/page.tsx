'use client';
import ExpenseCategoryManager from '@/components/stone-mine/expense-category-manager';
import RoleGuard from '@/components/stone-mine/role-guard';
import React from 'react';

const LabourExpensePage = () => {
    return (
        <RoleGuard allowedRoles={['owner', 'manager']} redirectTo="/expenses/diesel">
            <div>
                <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                    <li><a href="/" className="text-primary hover:underline">Dashboard</a></li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Expenses</span></li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Labour</span></li>
                </ul>
                <ExpenseCategoryManager category="Labour Wages" title="தொழிலாளர் கூலி (Labour Wages)" />
            </div>
        </RoleGuard>
    );
};

export default LabourExpensePage;
