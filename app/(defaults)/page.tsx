'use client';
import ComponentsDashboardSales from '@/components/dashboard/components-dashboard-sales';
import RoleGuard from '@/components/stone-mine/role-guard';
import React from 'react';

const Sales = () => {
    return (
        <RoleGuard allowedRoles={['owner']} redirectTo="/expenses/diesel">
            <ComponentsDashboardSales />
        </RoleGuard>
    );
};

export default Sales;
