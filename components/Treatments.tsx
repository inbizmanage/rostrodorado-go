import React, { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, X, Sparkles, CalendarCheck } from 'lucide-react';
import { Treatment } from '../types';

import ServiceMenuModal from './ServiceMenuModal';

// Updated to match the 4 main categories from the Menu Image
const treatments: (Treatment & { image: string })[] = [
    {
        id: 1,
        title: 'Armonización Facial',
        description: 'Protocolos de arquitectura facial: RostroDorado, Rinomodelación, Labios, Ojeras y Definición Mandibular.',
        image: '/images/Treatments - Armonización Facial-600.webp',
        icon: ArrowUpRight
    },
    {
        id: 2,
        title: 'Toxina Botulínica',
        description: 'Suavizado de líneas de expresión, tratamiento de bruxismo, sonrisa gingival y sonrisa triste.',
        image: '/images/Treatments - Toxina Botulínica-600.webp',
        icon: ArrowUpRight
    },
    {
        id: 3,
        title: 'Calidad de Piel',
        description: 'Revitalización profunda: Peeling químico, Detox facial, NCTF 135HA y manejo de acné o manchas.',
        image: '/images/Treatments - Calidad de Piel-600.webp',
        icon: ArrowUpRight
    },
    {
        id: 4,
        title: 'Tecnologías & Bioestimulación',
        description: 'Regeneración avanzada con Endolift Láser, CO2, Harmonyca, Sculptra y Radiesse.',
        image: '/images/Treatments - Tecnologías & Bioestimulación-600.webp',
        icon: ArrowUpRight
    },
];

const Treatments: React.FC = () => {
    const [activeTreatment, setActiveTreatment] = useState(0);
    const [isModaOpen, setIsModalOpen] = useState(false); // Typo fixed in original state name if any, ensuring standard naming

    // Function to handle booking from main list or modal
    const handleBook = (treatmentName: string) => {
        // Close modal if open
        setIsModalOpen(false);

        // Dispatch event to pre-fill the contact form
        const event = new CustomEvent('prefillContact', { detail: { interest: treatmentName } });
        window.dispatchEvent(event);

        // Scroll smoothly to the contact form
        setTimeout(() => {
            const element = document.getElementById('contact');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    return (
        <section id="treatments" className="py-24 bg-charcoal text-base-white relative overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

                {/* Left: List */}
                <div className="relative z-10">
                    <span className="text-gold text-xs uppercase tracking-widest mb-8 block">Nuestros Tratamientos</span>
                    <div className="flex flex-col border-t border-white/10">
                        {treatments.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: Math.min(idx * 0.1, 0.3) }}
                                onMouseEnter={() => setActiveTreatment(idx)}
                                className={`group py-8 border-b border-white/10 cursor-pointer transition-all duration-500 relative ${activeTreatment === idx ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                                onClick={() => setActiveTreatment(idx)}
                            >
                                {/* Active Marker Line (Stable positioning) */}
                                {activeTreatment === idx && (
                                    <motion.div
                                        layoutId="activeLine"
                                        className="absolute left-0 top-0 bottom-0 w-[2px] bg-gold"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}

                                <div className="flex justify-between items-center pl-6">
                                    <h3 className={`font-serif text-3xl md:text-4xl transition-colors duration-300 ${activeTreatment === idx ? 'text-white italic' : 'text-white/80'}`}>
                                        {item.title}
                                    </h3>
                                    <ArrowUpRight className={`w-6 h-6 text-gold transition-all duration-300 ${activeTreatment === idx ? 'opacity-100 rotate-45' : 'opacity-0 -rotate-45'}`} />
                                </div>
                                <AnimatePresence>
                                    {activeTreatment === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden pl-6"
                                        >
                                            <p className="font-sans font-light text-white/60 mt-4 max-w-md leading-relaxed">
                                                {item.description}
                                            </p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleBook(item.title);
                                                }}
                                                className="mt-6 flex items-center gap-3 px-6 py-3 border border-gold/30 rounded-sm text-gold text-xs uppercase tracking-widest hover:bg-gold hover:text-white hover:border-gold transition-all duration-300 group/btn"
                                            >
                                                Agendar Cita
                                                <ArrowUpRight size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                    <div className="mt-12 pl-6">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-xs uppercase tracking-widest border-b border-gold pb-1 text-gold hover:text-white hover:border-white transition-colors cursor-hover"
                        >
                            Ver menú completo de servicios
                        </button>
                    </div>
                </div>

                {/* Right: Image Preview */}
                <div className="relative h-[600px] hidden lg:flex items-center justify-center sticky top-24">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={activeTreatment}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="absolute w-[85%] h-[85%] bg-white p-3 pb-12 shadow-[0_25px_50px_-5px_rgba(0,0,0,0.7)] flex flex-col"
                        >
                            {/* Inner Image Container */}
                            <div className="w-full flex-1 relative overflow-hidden bg-gray-200">
                                <img
                                    src={treatments[activeTreatment].image}
                                    alt={treatments[activeTreatment].title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                            
                            {/* Frame Text (Polaroid style) */}
                            <div className="absolute bottom-0 left-0 w-full h-12 flex items-center justify-center px-4">
                                <span className="font-serif text-charcoal text-sm tracking-wide flex items-center gap-2">
                                    {treatments[activeTreatment].title} <span className="text-gold">®RostroDorado</span>
                                </span>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Full Menu Modal - Replaced with Shared Component */}
            <ServiceMenuModal
                isOpen={isModaOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleBook}
            />
        </section>
    );
};

export default Treatments;