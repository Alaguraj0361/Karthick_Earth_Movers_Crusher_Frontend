import { Metadata } from 'next';
import React from 'react';
import OperatorSalaryManagement from '@/components/stone-mine/labour/operator-salary-management';

export const metadata: Metadata = {
    title: 'Machine Operator Salary | Stone Mine Management',
    description: 'Manage hourly based machine operator salaries and payments.',
};

const OperatorSalaryPage = () => {
    return (
        <div>
            <OperatorSalaryManagement />
        </div>
    );
};

export default OperatorSalaryPage;
