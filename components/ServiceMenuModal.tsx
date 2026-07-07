import React from 'react';
import { createPortal } from 'react-dom';
import { m as motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CalendarCheck } from 'lucide-react';
import { SERVICE_MENU_ITEMS } from '../constants/services';

interface ServiceMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (serviceName: string) => void;
}

const ServiceMenuModal: React.FC<ServiceMenuModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="relative bg-[#FAF7F2] w-full max-w-5xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col md:flex-row overflow-hidden"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 p-2 text-charcoal/60 hover:text-charcoal hover:bg-black/5 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {/* Left Decorative Side (Desktop) */}
                        <div className="hidden md:flex w-1/3 bg-gold/10 flex-col items-center justify-center p-12 text-center border-r border-gold/20 flex-shrink-0">
                            <Sparkles className="text-gold w-12 h-12 mb-6" />
                            <h2 className="font-serif text-3xl text-charcoal mb-4">Menú de Servicios</h2>
                            <div className="w-12 h-px bg-gold mb-4"></div>
                            <p className="font-sans text-xs uppercase tracking-widest text-taupe mb-8">Rostro Dorado Clinic</p>
                            <p className="text-charcoal/60 font-serif text-sm italic">
                                "Selecciona el tratamiento que deseas para ir directamente a tu reserva."
                            </p>
                        </div>

                        {/* Content List */}
                        <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                            <div className="md:hidden text-center mb-8">
                                <h2 className="font-serif text-3xl text-charcoal">Nuestros Servicios</h2>
                                <div className="w-12 h-px bg-gold mx-auto mt-4"></div>
                            </div>

                            <div className="grid grid-cols-1 gap-y-12">
                                {SERVICE_MENU_ITEMS.map((category, idx) => (
                                    <div key={idx}>
                                        <h3 className="font-serif text-xl text-gold-dark mb-5 italic border-b border-gold/20 pb-2">
                                            {category.category}
                                        </h3>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                                            {category.items.map((item, i) => (
                                                <li
                                                    key={i}
                                                    onClick={() => onSelect(item)}
                                                    className="group flex items-center justify-between gap-4 py-3 px-3 rounded-md hover:bg-gold/10 transition-colors cursor-pointer border-b border-dashed border-gold/10 md:border-none"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-gold mt-2 w-1.5 h-1.5 rounded-full bg-gold shrink-0 block group-hover:scale-125 transition-transform"></span>
                                                        <span className="text-charcoal/80 font-sans text-sm font-light leading-relaxed group-hover:text-charcoal group-hover:font-medium transition-colors">
                                                            {item}
                                                        </span>
                                                    </div>

                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] uppercase tracking-wider text-gold font-bold whitespace-nowrap">
                                                        Agendar
                                                        <CalendarCheck size={12} />
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ServiceMenuModal;
