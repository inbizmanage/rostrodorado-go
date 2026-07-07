import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { m as motion } from 'framer-motion';
import LeadForm from './LeadForm';

const Contact: React.FC = () => {
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    return (
        <section id="contact" className="bg-base-white pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[700px]">

                {/* Map Side (5 Columns) */}
                <div className="lg:col-span-5 relative h-[400px] lg:h-auto w-full order-2 lg:order-1 overflow-hidden group bg-charcoal">
                    {/* Facade Loading for Map - Se ve igual pero no carga el iframe hasta interactuar */}
                    {!isMapLoaded ? (
                        <div
                            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group z-20 overflow-hidden"
                            onClick={() => setIsMapLoaded(true)}
                        >
                            {/* Background Image: Facade - UPDATED IMAGE */}
                            <div className="absolute inset-0 bg-[url('https://i.imgur.com/76cFZmP.png')] bg-cover bg-center transition-transform duration-[2000ms] ease-out group-hover:scale-105"></div>

                            {/* Dark Overlay for contrast */}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500"></div>

                            {/* Elegant Button Container */}
                            <motion.div
                                className="relative z-10 flex flex-col items-center"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center mb-4 shadow-xl group-hover:bg-gold/90 group-hover:border-gold transition-all duration-300">
                                    <MapPin className="w-8 h-8 text-white group-hover:text-white transition-colors" />
                                </div>

                                <span className="text-sm uppercase tracking-[0.2em] text-white font-medium drop-shadow-md border-b border-transparent group-hover:border-white pb-1 transition-all text-center px-4">
                                    Ver ubicación en el mapa
                                </span>
                            </motion.div>
                        </div>
                    ) : (
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.634882756858!2d-72.9173475!3d11.5460254!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e8b63efe7154287%3A0x45d8ddc4b8966f7f!2sRostro%20Dorado%20Clinic!5e0!3m2!1ses!2sco!4v1708305000000!5m2!1ses!2sco"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            title="Ubicación Rostro Dorado Clinic"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="grayscale contrast-[0.9] hover:grayscale-0 transition-all duration-700"
                        ></iframe>
                    )}

                    {!isMapLoaded && <div className="absolute inset-0 bg-charcoal/20 pointer-events-none group-hover:bg-transparent transition-colors duration-700 z-10"></div>}

                    {/* Overlay Info for Mobile Map */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal to-transparent p-8 text-white lg:hidden z-30 pointer-events-none">
                        <p className="text-xs uppercase tracking-widest text-gold mb-1">Visítanos</p>
                        <p className="font-serif text-xl">Calle 12 #12-03 local 2, Riohacha</p>
                    </div>
                </div>

                {/* Form Side (7 Columns) */}
                <div className="lg:col-span-7 bg-[#0f0f0f] text-base-white p-8 md:p-16 xl:p-24 flex flex-col justify-center order-1 lg:order-2 relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="relative z-10 max-w-xl mx-auto w-full">
                        
                        <LeadForm source="landing_contact_form" />

                        <div className="mt-16 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-white/30 border-t border-white/5 pt-8 gap-4">
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Respuesta Inmediata
                            </span>
                            <span>Calle 12 #12-03 local 2, Riohacha</span>
                            <span className="hover:text-gold transition-colors cursor-pointer">+57 312 619 6527</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;