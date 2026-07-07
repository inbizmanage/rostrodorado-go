import React, { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { X, CalendarHeart } from 'lucide-react';
import LeadForm from './LeadForm';

const ContactDrawer: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        const handleClose = () => setIsOpen(false);

        window.addEventListener('openContactDrawer', handleOpen);
        window.addEventListener('closeContactDrawer', handleClose);

        return () => {
            window.removeEventListener('openContactDrawer', handleOpen);
            window.removeEventListener('closeContactDrawer', handleClose);
        };
    }, []);

    const toggleDrawer = () => setIsOpen(!isOpen);

    const handleComplete = () => {
        setTimeout(() => setIsOpen(false), 2000); // Close after showing success state (Whatsapp redirect will trigger anyway)
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm shadow-black"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[#0f0f0f] border-l border-white/10 z-[90] shadow-2xl flex flex-col overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 p-6 border-b border-white/10 flex items-center justify-between bg-[#0f0f0f]/90 backdrop-blur-md z-20">
                            <h2 className="text-white font-serif text-2xl flex items-center gap-3">
                                Reserva tu Cita <CalendarHeart size={24} className="text-gold" />
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors p-2 bg-white/5 rounded-full border border-white/10 hover:bg-white/10">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 md:p-12 relative">
                            {/* Background Decoration */}
                            <div className="absolute top-10 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[100px] pointer-events-none"></div>
                            
                            <LeadForm onComplete={handleComplete} source="hero_drawer_form" />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ContactDrawer;
