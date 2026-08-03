import SalesDetailsView from '@/components/stone-mine/sales-details-view';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Sales Details - Stone Mine',
};

const SalesDetailsPage = () => {
    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6 font-semibold">
                <li>
                    <a href="/" className="text-primary hover:underline">
                        Dashboard
                    </a>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <a href="/sales-billing/sales-entry" className="text-primary hover:underline">
                        Sales Entry
                    </a>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Sales Details</span>
                </li>
            </ul>
            <SalesDetailsView />
        </div>
    );
};

export default SalesDetailsPage;
