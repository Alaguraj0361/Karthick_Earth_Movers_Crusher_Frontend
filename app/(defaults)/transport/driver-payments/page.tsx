'use client';
import DriverPaymentManagement from '@/components/stone-mine/transport/driver-payment-management';
import RoleGuard from '@/components/stone-mine/role-guard';
import React from 'react';

const DriverPaymentsPage = () => {
    return (
        <RoleGuard allowedRoles={['owner', 'manager']} redirectTo="/expenses/diesel">
            <DriverPaymentManagement />
        </RoleGuard>
    );
};

export default DriverPaymentsPage;
