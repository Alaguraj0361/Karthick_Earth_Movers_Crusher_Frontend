import CustomerManagement from '@/components/stone-mine/customer-management';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Customer Management - Stone Mine',
};

const CustomersPage = () => {
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
                    <span>Customer Management</span>
                </li>
            </ul>
            <CustomerManagement />
        </div>
    );
};

export default CustomersPage;
