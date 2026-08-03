'use client';
import VendorTripSearch from '@/components/stone-mine/vendor/vendor-trip-search';
import RoleGuard from '@/components/stone-mine/role-guard';
import React from 'react';

const VendorTripSearchPage = () => {
    return (
        <RoleGuard allowedRoles={['owner', 'manager', 'admin']} redirectTo="/expenses/diesel">
            <VendorTripSearch />
        </RoleGuard>
    );
};

export default VendorTripSearchPage;
