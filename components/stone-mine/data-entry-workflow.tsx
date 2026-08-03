'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';

interface WorkflowStep {
    stepNo: number;
    titleTamil: string;
    titleEnglish: string;
    descriptionTamil: string;
    fields: { name: string; tamil: string; required: boolean }[];
    tips: string[];
}

interface WorkflowSection {
    id: string;
    icon: string;
    titleTamil: string;
    titleEnglish: string;
    color: string;
    gradient: string;
    overviewTamil: string;
    steps: WorkflowStep[];
    roles: string[];
}

const workflowData: WorkflowSection[] = [
    {
        id: 'system-flow',
        icon: '🔄',
        titleTamil: 'ஒட்டுமொத்த பணிப்பாய்வு',
        titleEnglish: 'Overall System Flow',
        color: '#6366f1',
        gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        overviewTamil: 'இந்த மென்பொருளை சரியாக பயன்படுத்த, தரவுகளை ஒரு குறிப்பிட்ட வரிசையில் உள்ளீடு செய்ய வேண்டும். முதலில் அடிப்படை தகவல்களை (Masters) பதிவு செய்த பின்னரே தினசரி பதிவுகளை செய்ய முடியும்.',
        steps: [
            {
                stepNo: 1,
                titleTamil: 'படி 1: அடிப்படை பதிவுகள் (Masters)',
                titleEnglish: 'Step 1: Master Registration',
                descriptionTamil: 'எந்தவொரு தினசரி பதிவையும் செய்வதற்கு முன், இவற்றை முதலில் பதிவு செய்ய வேண்டும்.',
                fields: [
                    { name: 'Stone Types', tamil: 'கல் வகைகளை அமைத்தல்', required: true },
                    { name: 'Vehicle & Machine Categories', tamil: 'வகைப்பாடுகளை உருவாக்குதல்', required: true },
                    { name: 'Labours & Customers', tamil: 'தொழிலாளர்கள் மற்றும் வாடிக்கையாளர்கள்', required: true },
                    { name: 'Vendors', tamil: 'விற்பனையாளர்கள் (Transport, Explosive, etc.)', required: true },
                ],
                tips: [
                    'முதலில் "Masters" மெனுவில் அனைத்து வகைகளையும் (Categories) உருவாக்கவும்.',
                    'வாடிக்கையாளர்களை "Sales & Billing" -> "Customer Management"-ல் பதிவு செய்யவும்.',
                    'விற்பனையாளர்களை "Transport Vendor Manage" -> "Transport Vendors"-ல் பதிவு செய்யவும்.',
                ],
            },
            {
                stepNo: 2,
                titleTamil: 'படி 2: அன்றாட செயல்பாடுகள் (Daily Operations)',
                titleEnglish: 'Step 2: Daily Operations',
                descriptionTamil: 'அடிப்படை தகவல்கள் உள்ளிடப்பட்ட பிறகு, அன்றாட வேலைகளை பதிவு செய்யலாம்.',
                fields: [
                    { name: 'Daily Attendance', tamil: 'தொழிலாளர் வருகை பதிவு', required: true },
                    { name: 'Machine Production', tamil: 'இயந்திர வேலை நேரம் (HMR)', required: true },
                    { name: 'Vehicle Trips', tamil: 'வாகன டிரிப்கள் பதிவு', required: true },
                    { name: 'Blasting Records', tamil: 'வெடிமருந்து பயன்பாடு', required: false },
                ],
                tips: [
                    'தினமும் காலையில் வருகை (Attendance) பதிவு செய்யவும்.',
                    'வாகன டிரிப்களை அன்றாடம் "Transport Management" -> "Vehicle Trip Management"-ல் பதிவு செய்யவும்.',
                    'இயந்திர உற்பத்தியை "Machine & Vehicle" -> "Machine Production"-ல் பதியவும்.',
                ],
            },
            {
                stepNo: 3,
                titleTamil: 'படி 3: விற்பனை & கணக்குகள் (Sales & Billing)',
                titleEnglish: 'Step 3: Sales & Billing',
                descriptionTamil: 'பதிவு செய்யப்பட்ட டிரிப்களை விற்பனையாக மாற்றுதல் அல்லது நேரடியாக விற்பனை செய்தல்.',
                fields: [
                    { name: 'Sales Entry', tamil: 'நேரடி விற்பனை பதிவு', required: true },
                    { name: 'Convert to Sale', tamil: 'டிரிப்பை விற்பனையாக மாற்றுதல்', required: false },
                    { name: 'Invoice / Bill Generation', tamil: 'பில்/இன்வாய்ஸ் உருவாக்குதல்', required: true },
                ],
                tips: [
                    'டிரிப் மேலாண்மை பக்கத்தில் உள்ள "Convert to Sale" பட்டனை பயன்படுத்தி எளிதாக விற்பனை பில் உருவாக்கலாம்.',
                    'GST விற்பனைக்கு "Invoice Generation"-ஐயும், சாதாரண விற்பனைக்கு "Bill Generation"-ஐயும் பயன்படுத்தவும்.',
                ],
            },
            {
                stepNo: 4,
                titleTamil: 'படி 4: கொடுப்பனவுகள் & அறிக்கைகள் (Settlements & Reports)',
                titleEnglish: 'Step 4: Settlements & Reports',
                descriptionTamil: 'சம்பளம், விற்பனையாளர் பணம் மற்றும் நிலுவைத் தொகைகளை முடித்தல்.',
                fields: [
                    { name: 'Driver & Vendor Payments', tamil: 'பணம் கொடுத்தல்', required: true },
                    { name: 'Pending Payments', tamil: 'வாடிக்கையாளர் நிலுவைத் தொகை வசூல்', required: true },
                    { name: 'Day Book & P&L', tamil: 'அறிக்கைகளை சரிபார்த்தல்', required: true },
                ],
                tips: [
                    'அனைத்து வரவு செலவுகளையும் "Accounts & Reports" மெனுவில் விரிவாகக் காணலாம்.',
                    'நிலுவைத் தொகைகளை "Sales & Billing" -> "Pending Payments"-ல் உடனுக்குடன் அப்டேட் செய்யவும்.',
                ],
            },
        ],
        roles: ['owner', 'manager', 'supervisor', 'accountant'],
    },
    {
        id: 'masters',
        icon: '📋',
        titleTamil: 'அடிப்படை தரவுகள் (Masters)',
        titleEnglish: 'Masters Registration',
        color: '#14b8a6',
        gradient: 'linear-gradient(135deg, #14b8a6, #0f766e)',
        overviewTamil: 'மென்பொருளின் அடிப்படை வகைகளை உருவாக்கும் இடம். இங்கு உருவாக்கப்படும் வகைகள்தான் மற்ற அனைத்து இடங்களிலும் வரும்.',
        steps: [
            {
                stepNo: 1,
                titleTamil: 'அனைத்து வகைகளை அமைத்தல்',
                titleEnglish: 'Setup All Categories',
                descriptionTamil: 'கற்கள், வாகனங்கள், இயந்திரங்கள் மற்றும் செலவு வகைகளை இங்கு பதிவு செய்யவும்.',
                fields: [
                    { name: 'Stone Types', tamil: 'M-Sand, Jelly, Dust போன்றவை', required: true },
                    { name: 'Explosive Materials', tamil: 'வெடிமருந்து பொருட்கள்', required: true },
                    { name: 'Vehicle Categories', tamil: 'Tipper, Lorry போன்றவை', required: true },
                    { name: 'Machine Categories', tamil: 'JCB, Breaker போன்றவை', required: true },
                    { name: 'Expense Categories', tamil: 'டீசல், மெயின்டனன்ஸ் தவிர்த்த இதர செலவு வகைகள்', required: true },
                    { name: 'Work & Maintenance Types', tamil: 'வேலை மற்றும் பராமரிப்பு வகைகள்', required: true },
                ],
                tips: ['இவற்றை ஒருமுறை மட்டும் பதிவு செய்தால் போதுமானது.'],
            }
        ],
        roles: ['owner', 'manager'],
    },
    {
        id: 'sales-billing',
        icon: '🧾',
        titleTamil: 'விற்பனை & பில்லிங்',
        titleEnglish: 'Sales & Billing',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        overviewTamil: 'வாடிக்கையாளர் மேலாண்மை, விற்பனை பதிவுகள் மற்றும் பில்/இன்வாய்ஸ் உருவாக்கும் பகுதி.',
        steps: [
            {
                stepNo: 1,
                titleTamil: 'வாடிக்கையாளர் & கொட்டேஷன்',
                titleEnglish: 'Customer & Quotations',
                descriptionTamil: 'முதலில் வாடிக்கையாளர்களை பதிவு செய்யவும், தேவைப்பட்டால் கொட்டேஷன் வழங்கவும்.',
                fields: [
                    { name: 'Customer Management', tamil: 'வாடிக்கையாளர் பெயர், முகவரி, GST எண்', required: true },
                    { name: 'Quotations', tamil: 'விலைப்புள்ளி உருவாக்குதல்', required: false },
                ],
                tips: ['சரியான GST எண்ணை உள்ளிடுவது இன்வாய்ஸ் உருவாக்க உதவும்.'],
            },
            {
                stepNo: 2,
                titleTamil: 'விற்பனை மற்றும் டிரிப் சரிபார்ப்பு',
                titleEnglish: 'Sales & Trip Checklist',
                descriptionTamil: 'விற்பனை பதிவுகளை உருவாக்குதல் மற்றும் டிரிப் சீட்டுகளை சரிபார்த்தல்.',
                fields: [
                    { name: 'Sales Entry', tamil: 'விற்பனை விவரங்கள் பதிவு', required: true },
                    { name: 'Trip Checklist', tamil: 'அனுப்பப்பட்ட லோடுகளை சரிபார்த்தல்', required: false },
                    { name: 'Cash / Credit Sales', tamil: 'ரொக்கம் அல்லது கடன் விற்பனை பட்டியல்', required: true },
                ],
                tips: [
                    'கடன் விற்பனைகள் தானாக "Pending Payments"-க்குச் செல்லும்.',
                    'டிரிப் சீட்டுகளை சரிபார்க்க "Trip Checklist" பயன்படுத்தவும்.',
                ],
            },
            {
                stepNo: 3,
                titleTamil: 'பில் & இன்வாய்ஸ் தயாரித்தல்',
                titleEnglish: 'Billing & Invoicing',
                descriptionTamil: 'வாடிக்கையாளருக்கு வழங்கப்படும் பற்று சீட்டுகள்.',
                fields: [
                    { name: 'Invoice Generation', tamil: 'GST இன்வாய்ஸ்கள் (Tax Invoice)', required: false },
                    { name: 'Bill Generation', tamil: 'GST இல்லாத பில்கள் (Non-Tax)', required: false },
                ],
                tips: ['இன்வாய்ஸ் மற்றும் பில்களுக்கு தனித்தனி சீரியல் எண்கள் (INV- / BILL-) வழங்கப்படும்.'],
            }
        ],
        roles: ['owner', 'manager', 'accountant'],
    },
    {
        id: 'expenses',
        icon: '💰',
        titleTamil: 'செலவு கணக்குகள்',
        titleEnglish: 'Expenses Management',
        color: '#ef4444',
        gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
        overviewTamil: 'டீசல், பராமரிப்பு மற்றும் குவாரியின் அனைத்து தினசரி செலவுகளையும் பதிவு செய்யும் பகுதி.',
        steps: [
            {
                stepNo: 1,
                titleTamil: 'தினசரி செலவுகள்',
                titleEnglish: 'Daily Expense Entry',
                descriptionTamil: 'வாகனம் அல்லது வகை வாரியாக செலவுகளை பதிவு செய்யவும்.',
                fields: [
                    { name: 'Diesel / Fuel', tamil: 'டீசல் அளவு மற்றும் தொகை (வண்டி வாரியாக)', required: true },
                    { name: 'Machine Maintenance', tamil: 'இயந்திர பராமரிப்பு செலவுகள்', required: true },
                    { name: 'Office & Misc', tamil: 'அலுவலக மற்றும் இதர செலவுகள்', required: true },
                    { name: 'Police Expense', tamil: 'போலீஸ் மற்றும் ஸ்டேஷன் செலவுகள்', required: true },
                    { name: 'Vendor Other Expenses', tamil: 'வெளி வாகன ஒப்பந்ததாரர்களின் இதர செலவுகள்', required: false },
                ],
                tips: [
                    'டீசல் பதிவின் போது வண்டியை சரியாக தேர்வு செய்யவும், இது வண்டி வாரியான மைலேஜ் பார்க்க உதவும்.',
                    'மெயின்டனன்ஸ் செலவுகளை Masters-ல் உள்ள வகைகளை கொண்டு வகைப்படுத்தலாம்.',
                    'வெண்டர் இதர செலவுகளில் அவர்களின் வாகனங்களுக்கு செய்யப்பட்ட செலவுகளை பதியலாம்.',
                ],
            }
        ],
        roles: ['owner', 'manager', 'supervisor'],
    },
    {
        id: 'transport',
        icon: '🚛',
        titleTamil: 'போக்குவரத்து மேலாண்மை',
        titleEnglish: 'Transport Management',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        overviewTamil: 'பெர்மிட்கள், வாகன டிரிப்கள் மற்றும் டிரைவர்களின் கணக்குகளை நிர்வகிக்கும் பகுதி.',
        steps: [
            {
                stepNo: 1,
                titleTamil: 'பெர்மிட் மற்றும் டிரிப் பதிவு',
                titleEnglish: 'Permit & Trip Management',
                descriptionTamil: 'அனுமதி சீட்டுகள் மற்றும் வாகனங்களின் ஒவ்வொரு லோடையும் பதிவு செய்யவும்.',
                fields: [
                    { name: 'Permit Management', tamil: 'அனுமதி சீட்டு விவரங்கள் (Permits)', required: true },
                    { name: 'Vehicle Trip Management', tamil: 'தினசரி டிரிப் பதிவுகள்', required: true },
                ],
                tips: [
                    'ஒவ்வொரு டிரிப்பையும் விற்பனையாக (Sale) மாற்ற டிரிப் லிஸ்டில் உள்ள பட்டனை பயன்படுத்தவும்.',
                    'பெர்மிட் முடிந்தால் அது தானாகவே உங்களுக்கு உணர்த்தப்படும்.',
                ],
            },
            {
                stepNo: 2,
                titleTamil: 'டிரைவர் கணக்குகள்',
                titleEnglish: 'Driver Accounts',
                descriptionTamil: 'டிரைவர்களுக்கு வழங்கப்படும் படி மற்றும் முன்பணம்.',
                fields: [
                    { name: 'Driver Payment', tamil: 'டிரைவர் பேட்டா / படி', required: true },
                    { name: 'Driver Advance', tamil: 'டிரைவர் முன்பணம்', required: true },
                ],
                tips: ['டிரைவர் கணக்குகளை தனியாக அறிக்கையாகப் பார்க்கலாம்.'],
            }
        ],
        roles: ['owner', 'manager', 'supervisor'],
    },
    {
        id: 'vendors',
        icon: '🏪',
        titleTamil: 'விற்பனையாளர் மேலாண்மை',
        titleEnglish: 'Transport Vendor Manage',
        color: '#06b6d4',
        gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
        overviewTamil: 'வெளி வாகனங்கள் (Rental Vendors) மற்றும் சப்ளையர்களின் கணக்குகளை கவனித்தல்.',
        steps: [
            {
                stepNo: 1,
                titleTamil: 'வெண்டர் மற்றும் முன்பணம்',
                titleEnglish: 'Vendor & Advance',
                descriptionTamil: 'வெண்டர்களை பதிவு செய்து அவர்களுக்கு வழங்கப்படும் முன்பணத்தை பதியவும்.',
                fields: [
                    { name: 'Transport Vendors', tamil: 'வெளி வாகன உரிமையாளர்கள்', required: true },
                    { name: 'Vendor Advance', tamil: 'வெண்டர்களுக்கு முன்பணம்', required: false },
                ],
                tips: ['வெண்டர்களை பதிவு செய்யும்போது அவர்களின் மொத்த நிலுவைத் தொகையை (Opening Balance) சரிபார்க்கவும்.'],
            },
            {
                stepNo: 2,
                titleTamil: 'டிரிப் தேடல் மற்றும் பணம் கொடுத்தல்',
                titleEnglish: 'Trip Search & Payment',
                descriptionTamil: 'வெளி வண்டி டிரிப்களை சரிபார்த்து பணம் செட்டில் செய்தல்.',
                fields: [
                    { name: 'Trip Search & Export', tamil: 'வெண்டர் வாரியாக டிரிப்களை தேடுதல்', required: true },
                    { name: 'Vendor Payment', tamil: 'விற்பனையாளர் பணம் செட்டில் செய்தல்', required: true },
                    { name: 'Vendor Pending Payment', tamil: 'கொடுக்க வேண்டிய நிலுவைத் தொகைகள்', required: false },
                ],
                tips: ['Trip Search-ல் தேடி Excel ரிப்போர்ட் எடுத்து வெண்டர்களுக்கு வழங்கலாம் (Owner மட்டும் பதிவிறக்க முடியும்).'],
            }
        ],
        roles: ['owner', 'manager', 'accountant'],
    },
    {
        id: 'labour',
        icon: '👷',
        titleTamil: 'தொழிலாளர் மேலாண்மை',
        titleEnglish: 'Labour Management',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        overviewTamil: 'தொழிலாளர் வருகை, சம்பளம் மற்றும் முன்பணத்தை நிர்வகிக்கும் பகுதி.',
        steps: [
            {
                stepNo: 1,
                titleTamil: 'தொழிலாளர் பதிவு மற்றும் வருகை',
                titleEnglish: 'Registration & Attendance',
                descriptionTamil: 'தொழிலாளர்களை பதிவு செய்து தினசரி வருகையை பதியவும்.',
                fields: [
                    { name: 'Labour List', tamil: 'தொழிலாளர் விபரங்கள்', required: true },
                    { name: 'Daily Attendance', tamil: 'தினசரி வருகை (Present/Absent)', required: true },
                ],
                tips: ['வருகை பதிவின் போது OT (Over Time) நேரத்தையும் சேர்க்கலாம்.'],
            },
            {
                stepNo: 2,
                titleTamil: 'சம்பளம் மற்றும் அறிக்கை',
                titleEnglish: 'Salary & Reports',
                descriptionTamil: 'சம்பளம் கணக்கீடு மற்றும் இதர கொடுப்பனவுகள்.',
                fields: [
                    { name: 'Advance Payment', tamil: 'தொழிலாளர் முன்பணம்', required: false },
                    { name: 'Operator Salary', tamil: 'ஆபரேட்டர்களுக்கான மாத சம்பளம்', required: true },
                    { name: 'Labour Report', tamil: 'வருகை மற்றும் சம்பள அறிக்கைகள்', required: false },
                ],
                tips: ['சம்பளம் போடும்போது முன்பணம் தானாக கழிக்கப்பட்டு மீதித் தொகை காட்டப்படும்.'],
            }
        ],
        roles: ['owner', 'manager', 'supervisor'],
    },
    {
        id: 'blasting',
        icon: '💥',
        titleTamil: 'வெடிபொருள் மேலாண்மை',
        titleEnglish: 'Blasting Management',
        color: '#f43f5e',
        gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
        overviewTamil: 'குவாரியில் நடக்கும் வெடி வைத்தல் மற்றும் வெடிபொருட்களின் கையிருப்பை நிர்வகித்தல்.',
        steps: [
            {
                stepNo: 1,
                titleTamil: 'வெடி வைப்பு மற்றும் கையிருப்பு',
                titleEnglish: 'Records & Shop',
                descriptionTamil: 'தினம் நடக்கும் வெடி வைப்பு மற்றும் ஸ்டாக் நிலவரம்.',
                fields: [
                    { name: 'Blasting Records', tamil: 'தினசரி வெடி வைப்பு விபரங்கள்', required: true },
                    { name: 'Explosive Shop', tamil: 'வெடிபொருள் இருப்பு (Current Stock)', required: true },
                    { name: 'Advance', tamil: 'வெடிபொருள் சப்ளையர் முன்பணம்', required: false },
                ],
                tips: [
                    'வெடி வைக்கும்போது பயன்படும் பொருட்களை பதியும்போது ஸ்டாக் தானாக குறையும்.',
                    'சரியான நேரத்திற்கு ஆர்டர் செய்ய ஸ்டாக் அளவை அடிக்கடி சரிபார்க்கவும்.',
                ],
            }
        ],
        roles: ['owner', 'manager'],
    },
    {
        id: 'quarry-lease',
        icon: '📜',
        titleTamil: 'குத்தகை மேலாண்மை',
        titleEnglish: 'Quarry Lease Mgmt',
        color: '#6366f1',
        gradient: 'linear-gradient(135deg, #6366f1, #4338ca)',
        overviewTamil: 'நில உரிமையாளர்களின் குத்தகை தொகை மற்றும் செலவுகளை நிர்வகித்தல்.',
        steps: [
            {
                stepNo: 1,
                titleTamil: 'குத்தகை செலவு மற்றும் தீர்வு',
                titleEnglish: 'Expenses & Settlement',
                descriptionTamil: 'குத்தகை உரிமையாளர்களுக்கு வழங்கப்படும் பணம் மற்றும் செலவுகள்.',
                fields: [
                    { name: 'Lease Expenses', tamil: 'குத்தகை சார்ந்த இதர செலவுகள்', required: true },
                    { name: 'Lease Settlement', tamil: 'உரிமையாளருக்கு பணம் செட்டில் செய்தல்', required: true },
                ],
                tips: ['குத்தகை செட்டில்மென்ட் போடும்போது அந்த குறிப்பிட்ட காலத்தின் லோடுகளை சரிபார்க்கவும்.'],
            }
        ],
        roles: ['owner', 'manager'],
    },
    {
        id: 'assets',
        icon: '🚜',
        titleTamil: 'இயந்திரம் & வாகனங்கள்',
        titleEnglish: 'Machine & Vehicle',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        overviewTamil: 'குவாரி இயந்திரங்கள், வாகனங்கள் மற்றும் உதிரிப் பாகங்களை நிர்வகிக்கும் பகுதி.',
        steps: [
            {
                stepNo: 1,
                titleTamil: 'இயந்திரம் மற்றும் வாகன விவரங்கள்',
                titleEnglish: 'Asset Details',
                descriptionTamil: 'இயந்திரங்கள் மற்றும் வாகனங்களை பதிவு செய்தல்.',
                fields: [
                    { name: 'Machine Details', tamil: 'இயந்திரங்களின் முழு விவரம்', required: true },
                    { name: 'Vehicle Details', tamil: 'வாகனங்களின் முழு விவரம்', required: true },
                    { name: 'Spare Parts', tamil: 'உதிரிப் பாகங்கள் இருப்பு மற்றும் செலவு', required: false },
                ],
                tips: ['ஒவ்வொரு வாகனத்திற்கும் தனித்தனியாக மைலேஜ் மற்றும் மெயின்டனன்ஸ் தேதிகளை கவனிக்கவும்.'],
            },
            {
                stepNo: 2,
                titleTamil: 'இயந்திர உற்பத்தி',
                titleEnglish: 'Machine Production',
                descriptionTamil: 'இயந்திரங்கள் வேலை செய்த நேரம் (HMR) பதிவு.',
                fields: [
                    { name: 'Machine Production', tamil: 'தினம் ஒரு இயந்திரம் வேலை செய்த நேரம்', required: true },
                ],
                tips: ['ஒவ்வொரு ஷிப்ட் முடிவிலும் HMR ரீடிங்கை தவறாமல் பதியவும்.'],
            }
        ],
        roles: ['owner', 'manager', 'supervisor'],
    },
    {
        id: 'rentals',
        icon: '📅',
        titleTamil: 'வாடகை மேலாண்மை',
        titleEnglish: 'Rental Management',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        overviewTamil: 'வெளியில் இருந்து வாடகைக்கு எடுக்கப்பட்ட இயந்திரங்கள் மற்றும் வாகனங்களின் டிரிப் கணக்குகள்.',
        steps: [
            {
                stepNo: 1,
                titleTamil: 'வாடகை பதிவுகள்',
                titleEnglish: 'Rental Entries',
                descriptionTamil: 'வாடகை வண்டிகளின் டிரிப் தகவல்கள்.',
                fields: [
                    { name: 'Rentals Page', tamil: 'வாடகை வாகன டிரிப் பதிவு', required: true },
                ],
                tips: ['இவை வண்டியின் உரிமையாளர் கணக்கில் (Vendor) சேமிக்கப்படும்.'],
            }
        ],
        roles: ['owner', 'manager', 'supervisor'],
    },
    {
        id: 'reports',
        icon: '📊',
        titleTamil: 'கணக்கு & அறிக்கைகள்',
        titleEnglish: 'Accounts & Reports',
        color: '#64748b',
        gradient: 'linear-gradient(135deg, #64748b, #475569)',
        overviewTamil: 'முழுமையான வரவு செலவு, லாப நஷ்டம் மற்றும் மாதாந்திர அறிக்கைகள்.',
        steps: [
            {
                stepNo: 1,
                titleTamil: 'அறிக்கை கண்காணிப்பு',
                titleEnglish: 'Monitoring Reports',
                descriptionTamil: 'நிதி நிலைமையை சரிபார்க்க இந்த அறிக்கைகளை பயன்படுத்தவும்.',
                fields: [
                    { name: 'Day Book', tamil: 'இன்றைய முழு வரவு செலவு பட்டியல்', required: true },
                    { name: 'Cash Flow Statement', tamil: 'பணப்புழக்கம் (Inward/Outward)', required: true },
                    { name: 'Profit & Loss A/c', tamil: 'நிறுவன லாப நஷ்டம்', required: true },
                    { name: 'Monthly/Yearly Reports', tamil: 'தேதி வாரியான மொத்த சுருக்கம்', required: true },
                ],
                tips: [
                    'தினமும் மாலையில் "Day Book" சரிபார்ப்பது அவசியம்.',
                    'அறிக்கைகளை PDF அல்லது Excel ஆக பதிவிறக்கம் செய்ய "Owner" அனுமதி தேவை.',
                ],
            }
        ],
        roles: ['owner'],
    },
];

const DataEntryWorkflow = () => {
    const [activeSection, setActiveSection] = useState<string>('system-flow');
    const [expandedStep, setExpandedStep] = useState<number | null>(null);
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const userRole = currentUser?.role?.toLowerCase() || 'all';
    const isAdmin = userRole === 'owner' || userRole === 'admin';

    useEffect(() => {
        if (userRole && userRole !== 'all') {
            // Default to first visible section for this role
            // Skip 'system-flow' as default for specific roles to get them straight to their modules
            const firstVisible = workflowData.find(s => s.id !== 'system-flow' && s.roles.includes(userRole));
            if (firstVisible) {
                setActiveSection(firstVisible.id);
            } else {
                const anyVisible = workflowData.find(s => s.roles.includes(userRole));
                if (anyVisible) setActiveSection(anyVisible.id);
            }
        }
    }, [userRole]);

    const filteredSections = workflowData.filter((s: any) =>
        isAdmin || s.roles.includes(userRole)
    );

    const activeData = workflowData.find((s) => s.id === activeSection);

    return (
        <div className="min-h-screen">
            {/* Page Header */}
            <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-2xl">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative z-10">
                    <h1 className="mb-2 text-3xl font-black tracking-tight">📋 Data Entry Workflow</h1>
                    <h2 className="mb-1 text-xl font-semibold text-white/90">தரவு பதிவு செயல்முறை வழிகாட்டி</h2>
                    <p className="text-sm text-white/75">கார்த்திக் எர்த் மூவர்ஸ் - கல் குவாரி மேலாண்மை அமைப்பு</p>
                    <p className="mt-3 text-sm leading-relaxed text-white/80">
                        இந்த பக்கத்தில் ஒவ்வொரு Data Entry செயல்முறையும் படிப்படியாக தமிழில் விளக்கப்பட்டுள்ளது.
                        உங்கள் பொறுப்பை (Role) தேர்வு செய்து உங்களுக்கு தேவையான வழிமுறைகளை மட்டும் பார்க்கலாம்.
                    </p>
                </div>
            </div>



            {/* Visual Workflow Path */}
            <div className="mb-8 overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-6 text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="text-2xl">🔗</span> Module Connection Flow (தரவு ஓட்டம்)
                </h3>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
                    {/* Background connecting line for desktop */}
                    <div className="hidden md:block absolute top-[45%] left-10 right-10 h-1 bg-gray-200 dark:bg-gray-700 z-0 rounded-full"></div>

                    {/* Step 1 */}
                    <div className="flex-1 rounded-2xl bg-white p-5 border-2 border-indigo-100 text-center w-full dark:bg-gray-800 dark:border-indigo-900 shadow-[0_10px_20px_-10px_rgba(99,102,241,0.2)] z-10 transition-transform hover:-translate-y-1">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-2xl font-black mb-3 border border-indigo-200 dark:border-indigo-800">1</div>
                        <h4 className="font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider text-xs mb-1">Step 1: Masters</h4>
                        <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-2">அடிப்படை தரவு</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">Vehicles, Labours, Customers, Vendors, Stone Types, Lease Owners</p>
                    </div>

                    <div className="md:hidden text-2xl text-gray-300 font-black">⬇</div>

                    {/* Step 2 */}
                    <div className="flex-1 rounded-2xl bg-white p-5 border-2 border-blue-100 text-center w-full dark:bg-gray-800 dark:border-blue-900 shadow-[0_10px_20px_-10px_rgba(59,130,246,0.2)] z-10 transition-transform hover:-translate-y-1">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-2xl font-black mb-3 border border-blue-200 dark:border-blue-800">2</div>
                        <h4 className="font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-wider text-xs mb-1">Step 2: Operations</h4>
                        <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-2">தினசரி வேலைகள்</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">Attendance, Machine Production, Permits, Transport Trips</p>
                    </div>

                    <div className="md:hidden text-2xl text-gray-300 font-black">⬇</div>

                    {/* Step 3 */}
                    <div className="flex-1 rounded-2xl bg-white p-5 border-2 border-amber-100 text-center w-full dark:bg-gray-800 dark:border-amber-900 shadow-[0_10px_20px_-10px_rgba(245,158,11,0.2)] z-10 transition-transform hover:-translate-y-1">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 text-2xl font-black mb-3 border border-amber-200 dark:border-amber-800">3</div>
                        <h4 className="font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider text-xs mb-1">Step 3: Transact</h4>
                        <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-2">செலவு & விற்பனை</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">Diesel, Maintenance, Wages, Billing Entries, Invoices Generated</p>
                    </div>

                    <div className="md:hidden text-2xl text-gray-300 font-black">⬇</div>

                    {/* Step 4 */}
                    <div className="flex-1 rounded-2xl bg-white p-5 border-2 border-emerald-100 text-center w-full dark:bg-gray-800 dark:border-emerald-900 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.2)] z-10 transition-transform hover:-translate-y-1">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-2xl font-black mb-3 border border-emerald-200 dark:border-emerald-800">4</div>
                        <h4 className="font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider text-xs mb-1">Step 4: Finalize</h4>
                        <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-2">தீர்வு & அறிக்கை</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">Vendor Payments, Day Book, Cash Flow, Pending Payment Collections</p>
                    </div>
                </div>

                <div className="mt-8 rounded-2xl border-2 border-gray-100 p-5 dark:border-gray-700 dark:bg-gray-800/50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <p className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                        <span className="w-2 h-6 bg-primary rounded-full block"></span>
                        Connected Modules (இணைக்கப்பட்ட பகுதிகள் எப்படி இயங்குகிறது):
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 relative z-10">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <p className="font-bold text-gray-800 dark:text-gray-200 text-[11px] uppercase tracking-wide mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Labour To Wages To Payment</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium">
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Master (Labour)</span>
                                <span>➔</span>
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Daily Attendance</span>
                                <span>➔</span>
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Wages Calculation</span>
                                <span>➔</span>
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Vendor Payment (If Contractor)</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <p className="font-bold text-gray-800 dark:text-gray-200 text-[11px] uppercase tracking-wide mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Transport To Sales Generation</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium">
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Transport Trips Entry</span>
                                <span>➔</span>
                                <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded font-bold border border-emerald-100 dark:border-emerald-800">Convert to Sale Button</span>
                                <span>➔</span>
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Sales Entry Auto Created</span>
                                <span>➔</span>
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Generate Invoice</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <p className="font-bold text-gray-800 dark:text-gray-200 text-[11px] uppercase tracking-wide mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Machine/Vehicle To Expenses</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium">
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Master (Machine/Vehicle)</span>
                                <span>➔</span>
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Diesel Used</span>
                                <span>&amp;</span>
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Maintenance Expense</span>
                                <span>➔</span>
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-primary font-bold">Reflected in Accounts</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <p className="font-bold text-gray-800 dark:text-gray-200 text-[11px] uppercase tracking-wide mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Sales To Payment Lifecycle</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium">
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Master (Customer)</span>
                                <span>➔</span>
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Credit Sales Entry</span>
                                <span>➔</span>
                                <span className="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-1 rounded font-bold border border-rose-100 dark:border-rose-800">Pending Payments Log</span>
                                <span>➔</span>
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Receive Cash & Update Status</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {filteredSections.map((section: any) => (
                    <button
                        key={section.id}
                        onClick={() => { setActiveSection(section.id); setExpandedStep(null); }}
                        className={`group relative overflow-hidden rounded-xl border-2 p-3 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg ${activeSection === section.id
                            ? 'border-transparent shadow-lg'
                            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800'
                            }`}
                        style={activeSection === section.id ? { background: section.gradient, color: 'white' } : {}}
                    >
                        <div className="text-2xl">{section.icon}</div>
                        <div className="mt-1 text-[10px] font-bold uppercase tracking-wider">{section.titleEnglish}</div>
                        <div className="mt-0.5 text-[10px] font-medium opacity-80">{section.titleTamil}</div>
                    </button>
                ))}
            </div>

            {/* Active Section Content */}
            {activeData && (
                <div className="space-y-6">
                    {/* Section Header */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-md" style={{ background: activeData.gradient }}>
                                {activeData.icon}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-800 dark:text-white">
                                    {activeData.titleTamil} <span className="text-lg font-medium text-gray-400">({activeData.titleEnglish})</span>
                                </h3>
                                <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{activeData.overviewTamil}</p>
                            </div>
                        </div>

                        {/* Navigation Path */}
                        <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">📍 வழிசெலுத்தல் (Navigation Path)</p>
                            <p className="mt-1 font-mono text-sm font-bold" style={{ color: activeData.color }}>
                                Sidebar Menu → {activeData.titleEnglish} → Sub Pages
                            </p>
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-4">
                        {activeData.steps.map((step, idx) => (
                            <div
                                key={idx}
                                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                            >
                                {/* Step Header */}
                                <button
                                    onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                                    className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                >
                                    <div
                                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-black text-white shadow-md"
                                        style={{ background: activeData.gradient }}
                                    >
                                        {step.stepNo}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-bold text-gray-800 dark:text-white">
                                            படி {step.stepNo}: {step.titleTamil}
                                        </h4>
                                        <p className="text-sm text-gray-400">{step.titleEnglish}</p>
                                    </div>
                                    <div className={`text-xl transition-transform duration-300 ${expandedStep === idx ? 'rotate-180' : ''}`}>
                                        ▼
                                    </div>
                                </button>

                                {/* Step Content */}
                                <div className={`transition-all duration-500 ease-in-out ${expandedStep === idx ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                                    <div className="border-t border-gray-100 p-5 dark:border-gray-700">
                                        {/* Description */}
                                        <div className="mb-5 rounded-xl bg-blue-50/70 p-4 dark:bg-blue-900/20">
                                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">📝 விளக்கம்:</p>
                                            <p className="mt-1 text-sm leading-relaxed text-blue-700 dark:text-blue-200">{step.descriptionTamil}</p>
                                        </div>

                                        {/* Fields Table */}
                                        <div className="mb-5">
                                            <p className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">📋 நிரப்ப வேண்டிய புலங்கள் (Fields):</p>
                                            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-gray-700">
                                                            <th className="px-4 py-2.5 text-left font-bold text-gray-600 dark:text-gray-300">Field Name</th>
                                                            <th className="px-4 py-2.5 text-left font-bold text-gray-600 dark:text-gray-300">தமிழ் விளக்கம்</th>
                                                            <th className="px-4 py-2.5 text-center font-bold text-gray-600 dark:text-gray-300">கட்டாயம்?</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {step.fields.map((field, fIdx) => (
                                                            <tr key={fIdx} className="border-t border-gray-100 dark:border-gray-600">
                                                                <td className="px-4 py-2 font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">{field.name}</td>
                                                                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{field.tamil}</td>
                                                                <td className="px-4 py-2 text-center">
                                                                    {field.required ? (
                                                                        <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                                            ✓ ஆம்
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                                                            விருப்பம்
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Tips */}
                                        <div className="rounded-xl bg-amber-50/70 p-4 dark:bg-amber-900/20">
                                            <p className="mb-2 text-sm font-bold text-amber-700 dark:text-amber-300">💡 குறிப்புகள் (Tips):</p>
                                            <ul className="space-y-1">
                                                {step.tips.map((tip, tIdx) => (
                                                    <li key={tIdx} className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-200">
                                                        <span className="mt-0.5 text-amber-500">▸</span>
                                                        {tip}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>


                </div>
            )}

            {/* Footer Help Section */}
            <div className="mt-10 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white shadow-xl">
                <h4 className="mb-3 text-lg font-bold">❓ உதவி & முக்கிய குறிப்புகள்</h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl bg-white/10 p-4">
                        <p className="mb-1 text-sm font-bold text-yellow-300">⚠️ கட்டாய புலங்கள்</p>
                        <p className="text-xs text-gray-300">சிவப்பு நிறத்தில் &quot;ஆம்&quot; என்று குறிக்கப்பட்ட fields கட்டாயம் நிரப்ப வேண்டும். இல்லையெனில் சேமிக்க முடியாது.</p>
                    </div>
                    <div className="rounded-xl bg-white/10 p-4">
                        <p className="mb-1 text-sm font-bold text-green-300">✅ தினசரி பதிவு</p>
                        <p className="text-xs text-gray-300">வருகை மற்றும் செலவுகளை தினமும் பதிவு செய்ய வேண்டும். தாமதமாக பதிவு செய்தால் தவறுகள் ஏற்படலாம்.</p>
                    </div>
                    <div className="rounded-xl bg-white/10 p-4">
                        <p className="mb-1 text-sm font-bold text-blue-300">📱 தொடர்புக்கு</p>
                        <p className="text-xs text-gray-300">ஏதேனும் சிக்கல் ஏற்பட்டால் நிர்வாகியை தொடர்பு கொள்ளவும்.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataEntryWorkflow;
