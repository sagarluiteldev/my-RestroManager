'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogoIcon } from '@/components/Logo';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const navLinks = [
        { label: 'Features', href: '/#features' },
        { label: 'How it Works', href: '/#how-it-works' },
        { label: 'Gallery', href: '/#gallery' },
        { label: 'Pricing', href: '/#pricing' },
    ];

    return (
        <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
            <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                padding: '0 24px',
                height: '72px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                {/* Logo */}
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--accent)',
                    }}>
                        <LogoIcon size={22} style={{ color: 'var(--accent-fg)' }} />
                    </div>
                    <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 700,
                        fontSize: '20px',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                    }}>
                        myRestro Manager
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="nav-desktop-links">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            style={{
                                color: 'var(--text-secondary)',
                                fontSize: '14px',
                                fontWeight: 500,
                                textDecoration: 'none',
                                transition: 'color 0.2s ease',
                                fontFamily: "'Inter', sans-serif",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="nav-desktop-cta">
                    <Link
                        href="/login"
                        style={{
                            color: 'var(--text-secondary)',
                            fontSize: '14px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            padding: '10px 20px',
                            borderRadius: '10px',
                            transition: 'all 0.2s ease',
                            fontFamily: "'Inter', sans-serif",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-elevated)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        Request Demo
                    </Link>
                    <Link
                        href="/login"
                        className="btn-primary"
                        style={{
                            fontSize: '14px',
                            padding: '10px 24px',
                        }}
                    >
                        Sign Up Free
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button
                    className="nav-mobile-toggle"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        flexDirection: 'column',
                        gap: '5px',
                    }}
                    aria-label="Toggle menu"
                >
                    {[0, 1, 2].map((i) => (
                        <span key={i} style={{
                            display: 'block',
                            width: '22px',
                            height: '2px',
                            background: 'var(--text-primary)',
                            borderRadius: '2px',
                            transition: 'all 0.3s ease',
                            transform: i === 0 && mobileOpen ? 'rotate(45deg) translateY(7px)' : i === 2 && mobileOpen ? 'rotate(-45deg) translateY(-7px)' : 'none',
                            opacity: i === 1 && mobileOpen ? 0 : 1,
                        }} />
                    ))}
                </button>
            </div>

            {/* Mobile Menu */}
            <div
                className="nav-mobile-menu"
                style={{
                    maxHeight: mobileOpen ? '400px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                    background: 'color-mix(in srgb, var(--bg-primary) 95%, transparent)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: mobileOpen ? '1px solid var(--border)' : 'none',
                }}
            >
                <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            style={{
                                color: 'var(--text-primary)',
                                fontSize: '16px',
                                fontWeight: 500,
                                textDecoration: 'none',
                                padding: '12px 0',
                                borderBottom: '1px solid var(--border)',
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px', alignItems: 'center' }}>
                        <Link
                            href="/login"
                            onClick={() => setMobileOpen(false)}
                            style={{
                                flex: 1, textAlign: 'center', padding: '12px',
                                borderRadius: '10px', border: '1px solid var(--border)',
                                color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px',
                                textDecoration: 'none', fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            Demo
                        </Link>
                        <Link
                            href="/login"
                            onClick={() => setMobileOpen(false)}
                            className="btn-primary"
                            style={{
                                flex: 1, textAlign: 'center', padding: '12px',
                                borderRadius: '10px', fontSize: '14px',
                            }}
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
