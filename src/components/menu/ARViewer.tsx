'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CubeFocus,
    Hand,
    ArrowsOutCardinal,
    ShoppingCartSimple,
    Timer,
    Fire as Flame,
    Warning,
    Info,
    DeviceMobile,
    ArrowClockwise,
} from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';

interface ARViewerProps {
    isOpen: boolean;
    onClose: () => void;
    modelSrc: string;
    iosSrc?: string;
    thumbnail?: string;
    itemName: string;
    itemPrice: number;
    itemDescription: string;
    // Dynamic metadata
    calories?: number;
    prepTime?: number;
    spiceLevels?: string[];
    allergens?: string[];
    isVegetarian?: boolean;
    // Cart integration
    onAddToCart?: () => void;
}

export function ARViewer({
    isOpen,
    onClose,
    modelSrc,
    iosSrc,
    thumbnail,
    itemName,
    itemPrice,
    itemDescription,
    calories,
    prepTime,
    spiceLevels,
    allergens,
    isVegetarian,
    onAddToCart,
}: ARViewerProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [showGestureHint, setShowGestureHint] = useState(true);
    const [showQrModal, setShowQrModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const modelRef = useRef<HTMLElement>(null);

    // Dynamically register model-viewer standalone bundle on client
    useEffect(() => {
        if (typeof window !== 'undefined' && !customElements.get('model-viewer')) {
            // @ts-expect-error - standalone dist bundle
            import('@google/model-viewer/dist/model-viewer.min.js').catch((err) => {
                console.warn('[ARViewer] Failed to load model-viewer:', err);
            });
        }
    }, []);

    // Detect if client is mobile/touch-capable
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const checkMobile = () => {
                const userAgent = navigator.userAgent || '';
                const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
                const isMobileScreen = window.innerWidth <= 800;
                const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(userAgent);
                setIsMobile(isMobileDevice || (isTouch && isMobileScreen));
            };
            checkMobile();
            window.addEventListener('resize', checkMobile);
            return () => window.removeEventListener('resize', checkMobile);
        }
    }, []);

    // Listen for model-viewer load, error, and progress events
    useEffect(() => {
        if (!isOpen) return;

        const mv = modelRef.current;
        if (!mv) return;

        const handleLoad = () => {
            setIsLoaded(true);
            setLoadProgress(100);
            setLoadError(false);
        };

        const handleProgress = (event: Event) => {
            const detail = (event as CustomEvent).detail;
            if (detail?.totalProgress !== undefined) {
                setLoadProgress(Math.round(detail.totalProgress * 100));
            }
        };

        const handleError = (err: Event) => {
            console.warn('[ARViewer] Model failed to load:', err);
            setLoadError(true);
            setIsLoaded(true); // dismiss spinner to show error state
        };

        mv.addEventListener('load', handleLoad);
        mv.addEventListener('progress', handleProgress);
        mv.addEventListener('error', handleError);

        // Fallback safety timeout (12 seconds)
        const timeoutTimer = setTimeout(() => {
            if (!isLoaded && !loadError) {
                console.warn('[ARViewer] Model load timeout, fallback triggered');
                setLoadError(true);
                setIsLoaded(true);
            }
        }, 12000);

        return () => {
            clearTimeout(timeoutTimer);
            mv.removeEventListener('load', handleLoad);
            mv.removeEventListener('progress', handleProgress);
            mv.removeEventListener('error', handleError);
        };
    }, [isOpen, retryCount, isLoaded, loadError]);

    // Body scroll lock & state reset
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setIsLoaded(false);
            setLoadError(false);
            setLoadProgress(0);
            setShowGestureHint(true);
            setShowQrModal(false);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Auto-dismiss gesture hint
    useEffect(() => {
        if (isLoaded && !loadError && showGestureHint) {
            const timer = setTimeout(() => setShowGestureHint(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [isLoaded, loadError, showGestureHint]);

    const dismissHint = useCallback(() => setShowGestureHint(false), []);

    const handleRetry = () => {
        setIsLoaded(false);
        setLoadError(false);
        setLoadProgress(0);
        setRetryCount((prev) => prev + 1);
    };

    // Current page URL for QR code
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

    // Spice level indicator
    const spiceCount = spiceLevels?.length || 0;
    const spiceDisplay = spiceCount >= 3 ? 'Hot' : spiceCount >= 2 ? 'Medium' : 'Mild';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center isolate">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(24px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        className="absolute inset-0 bg-black/85"
                        onClick={onClose}
                    />

                    {/* Main Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-4xl h-[90vh] md:h-[84vh] flex flex-col md:flex-row overflow-hidden mx-3 rounded-3xl"
                        style={{
                            background: 'rgba(10, 10, 15, 0.92)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            boxShadow: '0 25px 80px -12px rgba(0,0,0,0.85)',
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 p-2.5 rounded-full transition-colors hover:bg-white/20 active:scale-95"
                            style={{ background: 'rgba(255,255,255,0.1)' }}
                            aria-label="Close AR view"
                        >
                            <X className="w-5 h-5 text-white/80" />
                        </button>

                        {/* 3D Model Viewer Area */}
                        <div className="flex-1 relative overflow-hidden flex items-center justify-center min-h-85 md:min-h-0" style={{ background: 'linear-gradient(135deg, #111118 0%, #000 50%, #0a0a12 100%)' }}>
                            {/* Corner visual brackets */}
                            <div className="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-white/20 rounded-tl-sm pointer-events-none" />
                            <div className="absolute top-6 right-6 w-6 h-6 border-t-2 border-r-2 border-white/20 rounded-tr-sm pointer-events-none" />
                            <div className="absolute bottom-6 left-6 w-6 h-6 border-b-2 border-l-2 border-white/20 rounded-bl-sm pointer-events-none" />
                            <div className="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-white/20 rounded-br-sm pointer-events-none" />

                            {/* Error Fallback State */}
                            {loadError ? (
                                <div className="flex flex-col items-center justify-center p-6 text-center z-20 max-w-md">
                                    {thumbnail ? (
                                        <div className="w-48 h-48 rounded-2xl overflow-hidden mb-4 border border-white/15 shadow-2xl relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={thumbnail} alt={itemName} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                                        </div>
                                    ) : (
                                        <Warning className="w-14 h-14 text-amber-400 mb-3" weight="duotone" />
                                    )}
                                    <h3 className="text-white font-bold text-base mb-1 font-['Outfit']">3D Preview Offline</h3>
                                    <p className="text-white/60 text-xs mb-4 leading-relaxed">
                                        The 3D interactive model could not be loaded on this connection. You can still view dish details and place your order.
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleRetry}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                                        >
                                            <ArrowClockwise className="w-3.5 h-3.5" weight="bold" />
                                            Retry Loading
                                        </button>
                                        {!isMobile && (
                                            <button
                                                onClick={() => setShowQrModal(true)}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                                            >
                                                <DeviceMobile className="w-3.5 h-3.5" weight="bold" />
                                                View on Mobile
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Model Viewer */
                                <div className="w-full h-full relative z-10">
                                    {/* @ts-expect-error - model-viewer is a custom element */}
                                    <model-viewer
                                        key={`mv-${retryCount}`}
                                        ref={modelRef}
                                        src={modelSrc}
                                        ios-src={iosSrc || undefined}
                                        alt={`A 3D model of ${itemName}`}
                                        shadow-intensity="1.4"
                                        shadow-softness="0.8"
                                        camera-controls
                                        touch-action="pan-y"
                                        auto-rotate
                                        auto-rotate-delay="1000"
                                        rotation-per-second="20deg"
                                        ar
                                        ar-modes="webxr scene-viewer quick-look"
                                        ar-scale="auto"
                                        ar-placement="floor"
                                        environment-image="neutral"
                                        exposure="0.9"
                                        interaction-prompt="none"
                                        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                                        onTouchStart={dismissHint}
                                        onMouseDown={dismissHint}
                                    >
                                        {/* Mobile AR Native Button (shown on compatible phones) */}
                                        <button
                                            slot="ar-button"
                                            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm shadow-2xl active:scale-95 transition-transform"
                                            style={{ background: '#fff', color: '#000' }}
                                        >
                                            <CubeFocus className="w-5 h-5" weight="fill" />
                                            Place on Table (AR)
                                        </button>
                                    {/* @ts-expect-error - model-viewer is a custom element */}
                                    </model-viewer>

                                    {/* Desktop Fallback: "View in AR on Phone" pill */}
                                    {!isMobile && isLoaded && !loadError && (
                                        <button
                                            onClick={() => setShowQrModal(true)}
                                            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 border border-white/15"
                                            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                        >
                                            <DeviceMobile className="w-4 h-4" weight="bold" />
                                            Scan QR for Phone AR
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Loading overlay with progress */}
                            <AnimatePresence>
                                {!isLoaded && !loadError && (
                                    <motion.div
                                        initial={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="absolute inset-0 z-20 flex flex-col items-center justify-center"
                                        style={{ background: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(8px)' }}
                                    >
                                        <div className="w-24 h-24 relative flex items-center justify-center">
                                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                                                <motion.circle
                                                    cx="50" cy="50" r="42" fill="none" stroke="#fff" strokeWidth="3"
                                                    strokeLinecap="round" strokeDasharray={264}
                                                    animate={{ strokeDashoffset: 264 - (264 * Math.max(loadProgress, 10)) / 100 }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </svg>
                                            <span className="text-white font-mono font-bold text-base">{loadProgress}%</span>
                                        </div>
                                        <p className="text-white/50 text-xs font-mono mt-4 tracking-widest uppercase">
                                            Preparing 3D Dish
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Gesture hint overlay */}
                            <AnimatePresence>
                                {isLoaded && !loadError && showGestureHint && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-15 flex items-center justify-center pointer-events-none"
                                    >
                                        <div className="flex flex-col items-center gap-3 p-5 rounded-2xl" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}>
                                            <div className="flex items-center gap-6">
                                                <div className="text-center">
                                                    <motion.div
                                                        animate={{ rotate: [0, 20, -20, 0] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                    >
                                                        <Hand className="w-7 h-7 text-white/70" weight="fill" />
                                                    </motion.div>
                                                    <p className="text-white/50 text-[10px] mt-1 font-medium">Drag to rotate</p>
                                                </div>
                                                <div className="text-center">
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                    >
                                                        <ArrowsOutCardinal className="w-7 h-7 text-white/70" weight="fill" />
                                                    </motion.div>
                                                    <p className="text-white/50 text-[10px] mt-1 font-medium">Pinch to zoom</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Desktop QR Code Modal Overlay */}
                            <AnimatePresence>
                                {showQrModal && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6"
                                        style={{ background: 'rgba(5, 5, 10, 0.92)', backdropFilter: 'blur(16px)' }}
                                    >
                                        <button
                                            onClick={() => setShowQrModal(false)}
                                            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="p-4 bg-white rounded-2xl shadow-2xl mb-4">
                                            <QRCodeSVG value={pageUrl} size={180} level="M" />
                                        </div>
                                        <h4 className="text-white font-bold text-base mb-1 font-['Outfit']">Scan with Phone Camera</h4>
                                        <p className="text-white/60 text-xs text-center max-w-xs leading-relaxed mb-4">
                                            Open your smartphone camera or QR scanner to view and project this dish onto your dining table in Augmented Reality.
                                        </p>
                                        <button
                                            onClick={() => setShowQrModal(false)}
                                            className="px-5 py-2 rounded-full text-xs font-semibold bg-white text-black hover:bg-white/90 transition-all active:scale-95"
                                        >
                                            Done
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Info Panel */}
                        <div className="w-full md:w-84 flex flex-col justify-between relative overflow-y-auto hide-scrollbar border-t md:border-t-0 md:border-l border-white/10"
                            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}>
                            {/* Grid pattern */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none" />

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="relative z-10 p-5 md:p-6"
                            >
                                {/* Live indicator */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`w-2 h-2 rounded-full ${loadError ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                                    <span className={`${loadError ? 'text-amber-400' : 'text-emerald-400'} text-[10px] font-mono tracking-widest uppercase`}>
                                        {loadError ? 'Menu Details' : 'Live 3D Render'}
                                    </span>
                                </div>

                                {/* Item info */}
                                <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] mb-1">
                                    {itemName}
                                </h2>
                                <div className="text-xl font-black text-white mb-3 font-mono">
                                    Rs. {itemPrice}
                                </div>

                                <p className="text-white/60 text-xs leading-relaxed mb-5">
                                    {itemDescription}
                                </p>

                                {/* Dynamic Stats Grid */}
                                <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-4 mb-4">
                                    {calories !== undefined && (
                                        <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                            <div className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5 font-bold">Calories</div>
                                            <div className="text-white font-mono font-bold text-xs">{calories} kcal</div>
                                        </div>
                                    )}
                                    {prepTime !== undefined && (
                                        <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                            <div className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5 font-bold">Prep Time</div>
                                            <div className="text-white font-mono font-bold text-xs flex items-center gap-1">
                                                <Timer className="w-3.5 h-3.5 text-white/50" weight="fill" />
                                                {prepTime} min
                                            </div>
                                        </div>
                                    )}
                                    {spiceLevels && spiceLevels.length > 0 && (
                                        <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                            <div className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5 font-bold">Spice Level</div>
                                            <div className="text-white font-mono font-bold text-xs flex items-center gap-1">
                                                {spiceLevels.map((_, idx) => (
                                                    <Flame key={idx} className="w-3 h-3 text-red-500" weight="fill" />
                                                ))}
                                                <span className="text-white/60 text-[10px] ml-0.5">{spiceDisplay}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5 font-bold">Diet</div>
                                        <div className="text-white font-mono font-bold text-xs">
                                            {isVegetarian ? (
                                                <span className="text-emerald-400 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Veg
                                                </span>
                                            ) : 'Non-Veg'}
                                        </div>
                                    </div>
                                </div>

                                {/* Allergens */}
                                {allergens && allergens.length > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                                        <Warning className="w-3.5 h-3.5 text-amber-400 shrink-0" weight="fill" />
                                        <span className="text-[10px] text-amber-300/80">
                                            <span className="font-bold">Allergens:</span> {allergens.join(', ')}
                                        </span>
                                    </div>
                                )}

                                {/* AR info disclaimer */}
                                <div className="flex items-start gap-2 px-3 py-2 rounded-lg mb-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" weight="fill" />
                                    <span className="text-[9.5px] text-blue-300/70 leading-relaxed">
                                        Scale and presentation are approximate. Freshly prepared to order in our kitchen.
                                    </span>
                                </div>
                            </motion.div>

                            {/* Add to Cart CTA */}
                            <div className="relative z-10 p-5 md:p-6 pt-0">
                                {onAddToCart ? (
                                    <motion.button
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() => {
                                            onAddToCart();
                                            onClose();
                                        }}
                                        className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-xl hover:brightness-105 active:scale-98"
                                        style={{ background: '#fff', color: '#000' }}
                                    >
                                        <ShoppingCartSimple className="w-4.5 h-4.5" weight="bold" />
                                        Add to Order · Rs. {itemPrice}
                                    </motion.button>
                                ) : (
                                    <button
                                        onClick={onClose}
                                        className="w-full py-3 rounded-xl font-semibold text-xs border border-white/20 text-white hover:bg-white/10 transition-colors"
                                    >
                                        Back to Menu
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

