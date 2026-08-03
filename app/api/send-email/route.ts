import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        // Verify a shared secret so only our backend can call this route
        const secret = req.headers.get('x-api-secret');
        if (secret !== process.env.EMAIL_API_SECRET) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { to, subject, text, html } = await req.json();

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"${process.env.FROM_NAME || 'Karthick Earth Movers'}" <${process.env.SMTP_EMAIL}>`,
            to,
            subject,
            text,
            html,
        });

        return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } catch (error: any) {
        console.error('Email send error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
