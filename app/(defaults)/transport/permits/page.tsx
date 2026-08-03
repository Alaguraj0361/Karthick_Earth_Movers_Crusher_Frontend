import PermitManagement from '@/components/stone-mine/transport/permit-management';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Permit Management',
};

const PermitPage = () => {
    return <PermitManagement />;
};

export default PermitPage;
