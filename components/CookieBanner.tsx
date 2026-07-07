import React, { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';
import { updateGtagConsent } from '../utils/gtag';

const CookieBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem('rd_cookie_consent');
        if (!consent) {
            // Slight delay before showing so it's not jarring on immediate load
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        } else if (consent === 'all') {
            // If already accepted in previous session, ensure GA knows
            updateGtagConsent(true);
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem('rd_cookie_consent', 'all');
        setIsVisible(false);
        updateGtagConsent(true);
        // Dispatch event so analytics and pixel can initialize immediately
        window.dispatchEvent(new Event('cookieConsentGranted'));
    };

    const handleAcceptEssential = () => {
        // No lo guardamos en localStorage para que siga preguntando si recargan
        // Solo lo escondemos temporalmente y lo volvemos a mostrar en 30 segundos
        setIsVisible(false);
        setTimeout(() => {
            setIsVisible(true);
        }, 30000);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 pointer-events-none"
                >
                    <div className="max-w-4xl mx-auto bg-[#1a1a1a]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-6 pointer-events-auto relative overflow-hidden">
                        {/* Decorative background glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center relative z-10">

                            {/* Icon & Text */}
                            <div className="flex-1 flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 mt-0.5">
                                    <ShieldAlert className="w-4 h-4 text-gold" />
                                </div>
                                <div>
                                    <h3 className="text-white font-serif text-base mb-0.5">Tu privacidad es importante</h3>
                                    <p className="text-xs text-white/50 leading-relaxed max-w-xl">
                                        Utilizamos cookies esenciales para el carrito de compras. También usamos cookies analíticas y de marketing (Meta Pixel) para mejorar tu experiencia.
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
                                <button
                                    onClick={handleAcceptEssential}
                                    className="px-4 py-2.5 text-[10px] uppercase tracking-widest text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-colors"
                                >
                                    Solo Esenciales
                                </button>
                                <button
                                    onClick={handleAcceptAll}
                                    className="px-4 py-2.5 text-[10px] uppercase tracking-widest text-charcoal bg-white rounded-lg hover:shadow-[0_0_15px_rgba(198,168,124,0.4)] transition-all font-bold"
                                >
                                    Aceptar Todo
                                </button>
                            </div>
                        </div>

                        {/* Optional Close Button (acting as essential only) */}
                        <button
                            onClick={handleAcceptEssential}
                            className="absolute top-4 right-4 p-2 text-white/30 hover:text-white transition-colors md:hidden"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieBanner;
