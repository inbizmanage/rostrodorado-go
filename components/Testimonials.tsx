import React, { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Testimonial } from '../types';

const testimonials: Testimonial[] = [
    { id: 1, name: "Maria Fernanda G.", text: "La Dra. Isaura tiene unas manos de ángel. El resultado de mis labios fue tan natural que nadie notó el procedimiento, solo que me veía mejor.", rating: 5 },
    { id: 2, name: "Carlos A.", text: "Nunca pensé en hacerme algo en la cara hasta que conocí a la Dra. Isaura. Su profesionalismo me dio confianza. Me quité 10 años de encima.", rating: 5 },
    { id: 3, name: "Valentina R.", text: "La atención en Rostro Dorado Clinic es de otro nivel. Desde que entras sientes el lujo y la calidez. Mi piel nunca ha estado tan luminosa.", rating: 5 },
];

const Testimonials: React.FC = () => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % testimonials.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="py-24 px-6 bg-gold-light/20 relative">
            <div className="max-w-4xl mx-auto relative z-10">
                <div className="flex justify-center mb-8">
                    <Quote className="text-gold/30 w-16 h-16 rotate-180" />
                </div>
                
                <div className="h-[250px] md:h-[200px] relative">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 flex flex-col items-center text-center"
                        >
                            <div className="flex gap-1 mb-6">
                                {[...Array(testimonials[current].rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-gold fill-gold" />
                                ))}
                            </div>
                            <p className="font-serif text-xl md:text-2xl text-charcoal italic leading-relaxed mb-6">
                                "{testimonials[current].text}"
                            </p>
                            <h4 className="font-sans font-bold text-taupe uppercase tracking-widest text-sm">
                                — {testimonials[current].name}
                            </h4>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="flex justify-center gap-2 mt-8">
                    {testimonials.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrent(idx)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === current ? 'bg-gold w-6' : 'bg-gold/30'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;