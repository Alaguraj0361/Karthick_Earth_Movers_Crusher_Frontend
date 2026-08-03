import TransportVendorManagement from '@/components/stone-mine/vendor/transport-vendor-management';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Transport Vendors',
};

const TransportVendorsPage = () => {
    return <TransportVendorManagement />;
};

export default TransportVendorsPage;
