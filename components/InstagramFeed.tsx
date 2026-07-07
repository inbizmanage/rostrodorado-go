import React, { useState } from 'react';
import { m as motion } from 'framer-motion';
import { ExternalLink, ArrowRight, Play, Quote } from 'lucide-react';

const InstagramFeed: React.FC = () => {
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);

    return (
        <section className="py-24 bg-base-white relative overflow-hidden">
            {/* Decorative background text */}
            <div className="absolute top-10 right-0 w-full text-right pointer-events-none opacity-[0.02]" aria-hidden="true">
                <span className="text-[10rem] leading-none font-serif text-charcoal">SOCIAL</span>
            </div>

            <div className="max-w-[1200px] mx-auto px-6">
                <div className="mb-12 text-center lg:text-left">
                    <span className="text-gold-dark text-xs uppercase tracking-widest mb-2 block">Connect With Us</span>
                    <a href="https://www.instagram.com/rostrodoradoclinic" target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2 group cursor-hover">
                        <h2 className="font-serif text-3xl md:text-4xl text-charcoal group-hover:text-gold transition-colors">
                            @rostrodoradoclinic
                        </h2>
                        <ExternalLink size={20} className="text-charcoal group-hover:text-gold transition-colors opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 duration-300" />
                    </a>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Featured Video Embed (Left Side) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="w-full flex justify-center lg:justify-end"
                    >
                        <div
                            className="w-full max-w-[400px] overflow-hidden rounded-xl shadow-2xl border border-charcoal/5 bg-white relative aspect-[9/16] flex items-center justify-center cursor-pointer group"
                            style={{ minHeight: '600px' }}
                            onClick={() => setIsVideoLoaded(true)}
                        >
                            {!isVideoLoaded ? (
                                <>
                                    {/* Imagen de portada solicitada - Optimizada */}
                                    <img
                                        src="https://i.imgur.com/cGqvKh2.jpeg"
                                        alt="Dra. Isaura Dorado - Rostro Dorado"
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        loading="lazy"
                                    />

                                    {/* Overlay Gradiente para legibilidad */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent"></div>

                                    {/* Mensaje Flotante Animado */}
                                    <motion.div
                                        initial={{ y: -10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5, duration: 0.8 }}
                                        className="absolute top-6 right-6 bg-white/95 backdrop-blur-md px-4 py-3 rounded-tr-xl rounded-bl-xl shadow-lg border-l-2 border-gold max-w-[200px]"
                                    >
                                        <div className="flex gap-2 items-start">
                                            <Quote size={12} className="text-gold fill-gold shrink-0 mt-1 rotate-180" />
                                            <p className="font-serif italic text-charcoal text-sm leading-tight">
                                                Así piensan nuestros pacientes
                                            </p>
                                        </div>
                                    </motion.div>

                                    {/* Play Button con Animación de Pulso */}
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                        <div className="relative">
                                            {/* Ondas de expansión */}
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-30"></span>
                                            <div className="relative w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md">
                                                    <Play className="ml-1 w-6 h-6 text-gold fill-gold" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <span className="absolute bottom-10 font-sans text-xs uppercase tracking-widest text-white/90 font-medium">Reproducir Historia</span>
                                </>
                            ) : (
                                <iframe
                                    src="https://www.instagram.com/p/DVBhiu8julO/embed"
                                    className="w-full h-full"
                                    style={{ border: 'none', overflow: 'hidden' }}
                                    scrolling="no"
                                    title="Rostro Dorado Clinic Instagram Video"
                                    loading="lazy"
                                ></iframe>
                            )}
                        </div>
                    </motion.div>

                    {/* Biography / Context Text (Right Side) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="flex flex-col gap-6 lg:max-w-lg"
                    >
                        <div>
                            <span className="font-sans text-gold-dark text-xs uppercase tracking-widest mb-3 block">La visión detrás de la clínica</span>
                            <h3 className="font-serif text-3xl md:text-4xl text-charcoal leading-tight mb-4">
                                Arte, Ciencia y <br />
                                <span className="italic text-taupe">Empatía Médica.</span>
                            </h3>
                        </div>

                        <p className="font-serif text-lg text-charcoal/80 font-light leading-relaxed">
                            "En mis redes sociales no solo comparto resultados, sino el proceso humano detrás de cada transformación.
                            Para mí, la medicina estética es el equilibrio perfecto entre la precisión técnica y la visión artística."
                        </p>

                        <p className="font-sans text-sm text-charcoal/60 leading-relaxed">
                            A través de @rostrodoradoclinic, la Dra. Isaura Dorado abre las puertas de su consultorio para mostrar la realidad
                            de los tratamientos, desmitificar procedimientos y educar sobre el cuidado de la piel con honestidad y transparencia.
                        </p>

                        <div className="pt-4 flex flex-col gap-6">
                            <a
                                href="https://www.instagram.com/rostrodoradoclinic"
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="group inline-flex items-center gap-3 text-charcoal uppercase tracking-widest text-xs font-medium hover:text-gold transition-colors cursor-hover"
                            >
                                Ver más contenido exclusivo
                                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
                            </a>

                            {/* Instagram Broadcast Channel */}
                            <div className="bg-base border border-gold/20 p-6 rounded-xl relative overflow-hidden group hover:border-gold/40 transition-colors">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-gold/10 transition-colors"></div>

                                <h4 className="font-sans text-xs uppercase tracking-widest text-gold-dark mb-2 font-bold">
                                    Rostro Dorado | Chismes & Ofertas
                                </h4>
                                <p className="font-serif text-charcoal/80 text-sm mb-4 leading-relaxed">
                                    Únete a nuestra comunidad de Instagram para recibir últimas noticias y promociones exclusivas.
                                </p>
                                <a
                                    href="https://ig.me/j/AbYAJ_2DfKeGGYGA/"
                                    target="_blank"
                                    rel="noopener noreferrer nofollow"
                                    className="inline-flex items-center gap-2 bg-charcoal text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-gold transition-colors duration-300"
                                >
                                    Unirme al canal
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default InstagramFeed;