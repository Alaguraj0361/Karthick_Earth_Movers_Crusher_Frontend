'use client';
import SummaryReports from '@/components/stone-mine/reports/summary-reports';
import RoleGuard from '@/components/stone-mine/role-guard';
import React from 'react';

const SummaryPage = () => {
    return (
        <RoleGuard allowedRoles={['owner']} redirectTo="/expenses/diesel">
            <div>
                <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                    <li>
                        <a href="/" className="text-primary hover:underline">Dashboard</a>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>Accounts & Reports</span>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>Summary</span>
                    </li>
                </ul>
                <SummaryReports />
            </div>
        </RoleGuard>
    );
};

export default SummaryPage;
