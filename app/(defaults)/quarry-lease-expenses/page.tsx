'use client';
import QuarryLeaseExpenses from '@/components/stone-mine/quarry-lease/QuarryLeaseExpenses';
import RoleGuard from '@/components/stone-mine/role-guard';
import React from 'react';

const QuarryLeaseExpensesPage = () => {
    return (
        <RoleGuard allowedRoles={['owner', 'manager']} redirectTo="/expenses/diesel">
            <QuarryLeaseExpenses />
        </RoleGuard>
    );
};

export default QuarryLeaseExpensesPage;
