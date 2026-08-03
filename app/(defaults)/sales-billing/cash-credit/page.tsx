'use client';
import CashCreditSales from '@/components/stone-mine/cash-credit-sales';
import RoleGuard from '@/components/stone-mine/role-guard';
import React from 'react';

const CashCreditPage = () => {
    return (
        <RoleGuard allowedRoles={['owner', 'manager']} redirectTo="/expenses/diesel">
            <div>
                <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                    <li>
                        <a href="/" className="text-primary hover:underline">Dashboard</a>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>Sales & Billing</span>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>Cash / Credit Sales</span>
                    </li>
                </ul>
                <CashCreditSales />
            </div>
        </RoleGuard>
    );
};

export default CashCreditPage;
