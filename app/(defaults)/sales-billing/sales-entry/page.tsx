import SalesEntryForm from '@/components/stone-mine/sales-entry-form';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Sales Entry - Stone Mine',
};

const SalesEntryPage = () => {
    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li>
                    <a href="/" className="text-primary hover:underline">
                        Dashboard
                    </a>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Sales & Billing</span>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Sales Entry</span>
                </li>
            </ul>
            <SalesEntryForm />
        </div>
    );
};

export default SalesEntryPage;
