import TripManagement from '@/components/stone-mine/transport/trip-management';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Vehicle Trip Management',
};

const TripPage = () => {
    return <TripManagement />;
};

export default TripPage;
