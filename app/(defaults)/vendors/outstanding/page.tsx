'use client';
import VendorOutstandingManagement from '@/components/stone-mine/vendor/vendor-outstanding-management';
import RoleGuard from '@/components/stone-mine/role-guard';
import React from 'react';

const VendorOutstandingPage = () => {
    return (
        <RoleGuard allowedRoles={['owner', 'manager']} redirectTo="/expenses/diesel">
            <VendorOutstandingManagement />
        </RoleGuard>
    );
};

export default VendorOutstandingPage;
