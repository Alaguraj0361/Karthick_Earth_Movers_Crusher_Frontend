'use client';
import VendorPaymentManagement from '@/components/stone-mine/vendor/vendor-payment-management';
import RoleGuard from '@/components/stone-mine/role-guard';
import React from 'react';

const VendorPaymentsPage = () => {
    return (
        <RoleGuard allowedRoles={['owner', 'manager']} redirectTo="/expenses/diesel">
            <VendorPaymentManagement />
        </RoleGuard>
    );
};

export default VendorPaymentsPage;
