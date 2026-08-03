'use client';
import UserManagement from '@/components/stone-mine/user-management';
import RoleGuard from '@/components/stone-mine/role-guard';
import React from 'react';

export default function UserManagementPage() {
    return (
        <RoleGuard allowedRoles={['owner']} redirectTo="/expenses/diesel">
            <UserManagement />
        </RoleGuard>
    );
}
