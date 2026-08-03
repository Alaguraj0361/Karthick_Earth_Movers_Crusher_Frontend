'use client';
import InvoiceGeneration from '@/components/stone-mine/invoice-generation';
import RoleGuard from '@/components/stone-mine/role-guard';
import React from 'react';

const InvoicesPage = () => {
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
                        <span>Invoice Generation</span>
                    </li>
                </ul>
                <InvoiceGeneration mode="invoice" />
            </div>
        </RoleGuard>
    );
};

export default InvoicesPage;
