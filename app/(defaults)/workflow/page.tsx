'use client';
import DataEntryWorkflow from '@/components/stone-mine/data-entry-workflow';
import React from 'react';

const WorkflowPage = () => {
    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><a href="/" className="text-primary hover:underline">Dashboard</a></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Workflow Guide</span></li>
            </ul>
            <DataEntryWorkflow />
        </div>
    );
};

export default WorkflowPage;
