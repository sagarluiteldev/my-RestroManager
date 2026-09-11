'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quotes, UserCircle, X } from '@phosphor-icons/react';

const testimonials = [
    {
        name: "Suresh Thapa",
        role: "Owner, The Himalayan Villa",
        content: "myRestro Manager completely transformed how we handle peak hours. The KDS keeps the kitchen calm, and our table turnover has never been faster. It's the best investment we've made this year.",
        rating: 5.0,
    },
    {
        name: "Anita Gurung",
        role: "Head Chef, Kathmandu Delights",
        content: "I used to lose my voice shouting orders over the noise. Now, everything appears instantly on the display. It's an absolute lifesaver for our kitchen staff during the weekend rush.",
        rating: 4.8,
    },
    {
        name: "Rajesh Shrestha",
        role: "Manager, Everest Coffee House",
        content: "The QR code ordering is so intuitive that even our older customers use it without asking for help. Our average order value actually went up immediately after launching!",
        rating: 4.9,
    },
    {
        name: "Priya Lama",
        role: "Operations Director, Bento Box",
        content: "We run 3 different locations. Being able to see real-time analytics for all of them from my phone while I'm traveling is incredible. Highly recommended for multi-branch setups.",
        rating: 4.7,
    },
    {
        name: "Bikash Maharjan",
        role: "Floor Supervisor, Lakeside Grill",
        content: "No more lost paper tickets or arguments about who ordered what. The digital trail is perfect, and the UI is genuinely beautiful to use every single day.",
        rating: 5.0,
    },
    {
        name: "Nima Sherpa",
        role: "Founder, Yeti's Den",
        content: "I was skeptical about SaaS pricing at first, but this software pays for itself in just a few days of saved labor and eliminated mistakes. The onboarding was also super smooth.",
        rating: 4.9,
    }
];

// Helper to check if text is long enough to need truncation
const isTextTruncated = (text: string, limit: number = 100) => {
    return text.length > limit;
};

export default function Testimonials() {
    const [selectedTestimonial, setSelectedTestimonial] = useState<typeof testimonials[0] | null>(null);

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (selectedTestimonial) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [selectedTestimonial]);

    return (
        <section id="testimonials" className="py-24 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black font-['Outfit'] mb-6 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Loved by Restaurant Teams
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto font-['Inter']" style={{ color: 'var(--text-secondary)' }}>
                        Don&apos;t just take our word for it. Here is what owners, chefs, and managers are saying about their experience with myRestro Manager.
                    </p>
                </div>

                {/* CSS Grid for uniform boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((t, i) => {
                        const isLong = isTextTruncated(t.content);
                        
                        return (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="testimonial-card relative group flex flex-col h-full cursor-pointer hover:shadow-lg transition-shadow duration-300"
                                onClick={() => isLong && setSelectedTestimonial(t)}
                            >
                                <Quotes className="w-10 h-10 absolute top-6 right-6 opacity-10" weight="fill" style={{ color: 'var(--text-muted)' }} />
                                
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star 
                                                key={i} 
                                                className={`w-4 h-4 ${i < Math.floor(t.rating) ? 'text-yellow-500' : 'text-gray-300'}`} 
                                                weight={i < Math.floor(t.rating) ? "fill" : "regular"} 
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold font-['Inter']" style={{ color: 'var(--text-primary)' }}>
                                        {t.rating.toFixed(1)} <span style={{ color: 'var(--text-muted)' }}>/ 5.0</span>
                                    </span>
                                </div>
                                
                                <div className="grow">
                                    <p className={`text-base leading-relaxed mb-4 font-['Inter'] ${isLong ? 'line-clamp-3' : ''}`} style={{ color: 'var(--text-secondary)' }}>
                                        &ldquo;{t.content}&rdquo;
                                    </p>
                                    {isLong && (
                                        <button className="text-sm font-semibold mb-8 hover:underline" style={{ color: 'var(--text-primary)' }}>
                                            View more
                                        </button>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-4 mt-auto pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                                    <UserCircle className="w-11 h-11" weight="duotone" style={{ color: 'var(--text-muted)' }} />
                                    <div>
                                        <h4 className="font-bold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>{t.name}</h4>
                                        <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* View More Modal Overlay */}
            <AnimatePresence>
                {selectedTestimonial && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
                        onClick={() => setSelectedTestimonial(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="testimonial-card relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: 'var(--bg-card)', padding: '40px' }}
                        >
                            <button 
                                onClick={() => setSelectedTestimonial(null)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors"
                            >
                                <X className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                            </button>

                            <Quotes className="w-12 h-12 mb-6 opacity-20" weight="fill" style={{ color: 'var(--text-muted)' }} />
                            
                            <div className="flex items-center gap-3 mb-8">
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star 
                                            key={i} 
                                            className={`w-5 h-5 ${i < Math.floor(selectedTestimonial.rating) ? 'text-yellow-500' : 'text-gray-300'}`} 
                                            weight={i < Math.floor(selectedTestimonial.rating) ? "fill" : "regular"} 
                                        />
                                    ))}
                                </div>
                                <span className="text-base font-bold font-['Inter']" style={{ color: 'var(--text-primary)' }}>
                                    {selectedTestimonial.rating.toFixed(1)} <span style={{ color: 'var(--text-muted)' }}>/ 5.0</span>
                                </span>
                            </div>
                            
                            <p className="text-lg md:text-xl leading-relaxed mb-10 font-['Inter']" style={{ color: 'var(--text-secondary)' }}>
                                &ldquo;{selectedTestimonial.content}&rdquo;
                            </p>
                            
                            <div className="flex items-center gap-4 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                                <UserCircle className="w-14 h-14" weight="duotone" style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <h4 className="font-bold text-base tracking-wide" style={{ color: 'var(--text-primary)' }}>{selectedTestimonial.name}</h4>
                                    <p className="text-sm font-mono mt-1" style={{ color: 'var(--text-muted)' }}>{selectedTestimonial.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
