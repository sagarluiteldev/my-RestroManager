'use client';

import { useEffect } from 'react';
import './landing.css';

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        // Force light theme for landing
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
        try {
            localStorage.removeItem('myrestromanager-theme');
        } catch {
            // ignore
        }
    }, []);

    return (
        <div className="landing-root" style={{ background: '#FAFAFA', color: '#09090B' }}>
            {children}
        </div>
    );
}
