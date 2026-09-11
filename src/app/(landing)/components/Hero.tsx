'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChartBar, Lightning } from '@phosphor-icons/react';
import gsap from 'gsap';

export default function Hero() {
    const sectionRef = useRef<HTMLElement>(null);
    const headlineRef = useRef<HTMLDivElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            // Headline words reveal
            const words = headlineRef.current?.querySelectorAll('.hero-word-inner');
            if (words) {
                tl.to(words, {
                    y: 0,
                    duration: 0.8,
                    stagger: 0.06,
                    ease: 'power4.out',
                }, 0.2);
            }

            // Subtitle fades in
            tl.fromTo(
                subtitleRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6 },
                '-=0.4'
            );

            // CTA buttons
            tl.fromTo(
                ctaRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6 },
                '-=0.3'
            );

            // Hero image slides up
            tl.fromTo(
                imageRef.current,
                { opacity: 0, y: 60, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' },
                '-=0.5'
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const headlineWords = ['Make', 'your', 'restaurant', 'management', 'a', 'snap'];

    return (
        <section
            ref={sectionRef}
            style={{
                position: 'relative',
                overflow: 'hidden',
                paddingTop: '140px',
                paddingBottom: '80px',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
            }}
        >
            {/* Decorative shapes */}
            <div className="hero-shape hero-shape-1" />
            <div className="hero-shape hero-shape-2" />

            <div className="hero-grid" style={{
                maxWidth: '1280px',
                margin: '0 auto',
                padding: '0 24px',
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '60px',
                alignItems: 'center',
            }}>
                {/* Left — Text */}
                <div>
                    {/* Headline */}
                    <div ref={headlineRef} style={{ marginBottom: '24px' }}>
                        <h1 style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 800,
                            fontSize: 'clamp(40px, 5.5vw, 72px)',
                            lineHeight: 1.05,
                            letterSpacing: '-0.03em',
                            color: 'var(--text-primary)',
                        }}>
                            {headlineWords.map((word, i) => (
                                <span key={i} className="hero-word" style={{ marginRight: i < headlineWords.length - 1 ? '0.25em' : 0 }}>
                                    <span className="hero-word-inner">{word}</span>
                                </span>
                            ))}
                        </h1>
                    </div>

                    {/* Subtitle */}
                    <p
                        ref={subtitleRef}
                        style={{
                            fontSize: '18px',
                            lineHeight: 1.6,
                            color: 'var(--text-secondary)',
                            maxWidth: '460px',
                            marginBottom: '36px',
                            fontFamily: "'Inter', sans-serif",
                            opacity: 0,
                        }}
                    >
                        Seamless menu management, kitchen displays, POS, and analytics — tailored to your bar and restaurant priorities.
                    </p>

                    {/* CTAs */}
                    <div ref={ctaRef} style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', opacity: 0 }}>
                        <Link href="/login" className="btn-primary">
                            Get Started Free
                            <ArrowRight size={18} weight="bold" />
                        </Link>
                        <a href="#how-it-works" className="btn-secondary">
                            How it works
                            <ArrowRight size={18} weight="bold" />
                        </a>
                    </div>

                    {/* Social proof */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginTop: '48px',
                        paddingTop: '32px',
                        borderTop: '1px solid var(--border)',
                    }}>
                        {/* Avatar stack */}
                        <div style={{ display: 'flex', marginRight: '-4px' }}>
                            {['#3B82F6', '#EF4444', '#10B981', '#F59E0B'].map((color, i) => (
                                <div key={i} style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: color,
                                    border: '3px solid var(--bg-primary)',
                                    marginLeft: i > 0 ? '-10px' : 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                }} />
                            ))}
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}>
                                200+ restaurants
                            </p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'Inter', sans-serif" }}>
                                already managing digitally
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right — Image */}
                <div ref={imageRef} style={{ position: 'relative', opacity: 0 }}>
                    <div style={{
                        position: 'relative',
                        borderRadius: 0,
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-card)',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        aspectRatio: '3/4',
                    }}>
                        <Image
                            src="/landing/hero-staff.jpg"
                            alt="Restaurant staff using myRestro Manager"
                            fill
                            priority
                            style={{
                                objectFit: 'cover',
                                display: 'block',
                            }}
                        />
                    </div>

                    {/* Floating card — Orders */}
                    <div className="hero-float-card" style={{
                        position: 'absolute',
                        bottom: '-20px',
                        left: '-20px',
                        background: 'var(--bg-card)',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        boxShadow: 'var(--shadow-card)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'var(--bg-elevated)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <ChartBar size={20} weight="bold" style={{ color: 'var(--text-primary)' }} />
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}>Orders Today</p>
                            <p style={{ fontSize: '18px', fontWeight: 800, color: '#10B981', fontFamily: "'Outfit', sans-serif" }}>+127</p>
                        </div>
                    </div>

                    {/* Top-right floating card — KDS */}
                    <div className="hero-float-card" style={{
                        position: 'absolute',
                        top: '-16px',
                        right: '-16px',
                        background: 'var(--bg-card)',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        boxShadow: 'var(--shadow-card)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}>
                        <Lightning size={18} weight="bold" style={{ color: 'var(--text-primary)' }} />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}>
                            Real-time KDS
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
