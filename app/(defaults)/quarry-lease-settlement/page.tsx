'use client';
import QuarryLeaseManagement from '@/components/stone-mine/quarry-lease/QuarryLeaseManagement';
import RoleGuard from '@/components/stone-mine/role-guard';
import React from 'react';

const QuarryLeaseSettlementPage = () => {
    return (
        <RoleGuard allowedRoles={['owner', 'manager']} redirectTo="/expenses/diesel">
            <QuarryLeaseManagement />
        </RoleGuard>
    );
};

export default QuarryLeaseSettlementPage;
