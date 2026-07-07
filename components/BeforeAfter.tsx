import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronsLeftRight, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { m as motion, AnimatePresence } from 'framer-motion';

type MediaType = 'image' | 'video';

interface CaseData {
  id: number;
  title: string;
  category: string;
  description: string;
  type: MediaType;
  before: string;
  after: string;
  tags: string[];
}

// Data for the cases pointing to the public folder structure
const CASES: CaseData[] = [
  {
    id: 1,
    title: "Armonización Facial",
    category: "Rostro",
    description: "Equilibrio del perfil, rinomodelación y proyección de mentón para un contorno definido.",
    type: "image",
    before: "/images/antes-y-despues/armonizacion-facial/Antes.webp",
    after: "/images/antes-y-despues/armonizacion-facial/Despues.webp",
    tags: ["Rinomodelación", "Perfilamiento"]
  },
  {
    id: 2,
    title: "Aumento e Hidratación de Labios",
    category: "Labios",
    description: "Volumezación natural y corrección de asimetrías con ácido hialurónico.",
    type: "video",
    before: "/images/antes-y-despues/hidratacion-labios/Antes.webm",
    after: "/images/antes-y-despues/hidratacion-labios/Despues.webm",
    tags: ["Ácido Hialurónico", "Full Lips"]
  },
  {
    id: 3,
    title: "Eliminación de Acrocordones",
    category: "Piel",
    description: "Remoción segura de pequeñas lesiones en la piel dejándola lisa y sin marcas.",
    type: "image",
    before: "/images/antes-y-despues/eliminacion-verrugas/Antes.webp",
    after: "/images/antes-y-despues/eliminacion-verrugas/Despues.webp",
    tags: ["Láser", "Piel Sana"]
  }
];

const CATEGORIES = ["Todos", "Rostro", "Labios", "Piel"];

const MediaElement: React.FC<{ src: string, type: MediaType, alt: string, className?: string, style?: React.CSSProperties }> = ({ src, type, alt, className, style }) => {
  if (type === 'video') {
    return (
      <video
        src={src}
        className={`${className} object-cover`}
        style={style}
        autoPlay
        loop
        muted
        playsInline
      />
    );
  }
  return (
    <img
      src={src}
      className={`${className} object-cover`}
      style={style}
      alt={alt}
      loading="lazy"
    />
  );
};

const BeforeAfter: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(80);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Filter cases based on category
  const filteredCases = useMemo(() => {
    if (activeCategory === "Todos") return CASES;
    return CASES.filter(c => c.category === activeCategory);
  }, [activeCategory]);

  // Reset slider position and index when category changes
  useEffect(() => {
    setCurrentIndex(0);
    setSliderPosition(80);
  }, [activeCategory]);

  // Reset slider when changing current specific case
  useEffect(() => {
    setSliderPosition(80);
  }, [currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredCases.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredCases.length) % filteredCases.length);
  };

  const handleMove = (event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;

    const { left, width } = containerRef.current.getBoundingClientRect();
    let clientX;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
    } else {
      clientX = (event as any).clientX;
    }

    const position = ((clientX - left) / width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, position)));
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleConsult = (caseTitle: string) => {
    const event = new CustomEvent('prefillContact', { detail: { interest: caseTitle } });
    window.dispatchEvent(event);

    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging.current) {
        handleMove(e);
      }
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('touchmove', handleGlobalMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  if (filteredCases.length === 0) return null;

  const currentCase = filteredCases[currentIndex];

  return (
    <section id="results" className="py-24 md:py-32 px-6 bg-base overflow-hidden">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <span className="text-gold-dark text-xs uppercase tracking-widest mb-4 block">Galería Clínica</span>
          <h2 className="font-serif text-4xl md:text-5xl text-charcoal mb-6">Casos Reales</h2>
          <p className="font-sans text-taupe font-light tracking-wide text-lg">
            Desliza para descubrir el cambio. Evidencia de nuestra dedicación a la armonía y naturalidad.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full text-sm tracking-wide transition-all duration-300 ${
                activeCategory === category 
                  ? 'bg-charcoal text-white shadow-md' 
                  : 'bg-white text-taupe border border-gold/20 hover:border-gold hover:text-charcoal'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Carousel Area */}
        <div className="relative max-w-6xl mx-auto">

          {/* Navigation Buttons */}
          {filteredCases.length > 1 && (
            <>
              <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-6 z-20">
                <button
                  onClick={handlePrev}
                  className="group w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white/60 hover:bg-white/90 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-500 ease-out cursor-hover"
                  aria-label="Ver caso anterior"
                >
                  <ChevronLeft size={20} className="text-charcoal/60 group-hover:text-charcoal transition-colors" />
                </button>
              </div>

              <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-6 z-20">
                <button
                  onClick={handleNext}
                  className="group w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white/60 hover:bg-white/90 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-500 ease-out cursor-hover"
                  aria-label="Ver siguiente caso"
                >
                  <ChevronRight size={20} className="text-charcoal/60 group-hover:text-charcoal transition-colors" />
                </button>
              </div>
            </>
          )}

          {/* Main Slider Component */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">

            {/* Media Container */}
            <div className="lg:col-span-7 relative shadow-2xl rounded-sm overflow-hidden bg-charcoal/5 max-w-[500px] lg:max-w-full mx-auto w-full">
              <AnimatePresence mode='wait'>
                <motion.div
                  key={currentCase.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="aspect-square relative flex items-center justify-center bg-charcoal/10"
                >
                  <div
                    ref={containerRef}
                    className="relative w-full h-full cursor-col-resize select-none group touch-none"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                  >
                    {/* After (Background) */}
                    <MediaElement 
                       src={currentCase.after} 
                       type={currentCase.type} 
                       alt="Resultado Después"
                       className="absolute inset-0 w-full h-full pointer-events-none" 
                    />
                    
                    {currentCase.type === 'video' && (
                       <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm rounded-full p-2 z-10">
                          <Play size={14} className="text-white ml-0.5" />
                       </div>
                    )}
                    
                    <span className="absolute bottom-4 right-4 md:bottom-6 md:right-6 font-sans text-[10px] uppercase tracking-widest text-charcoal bg-white/90 px-3 py-1 backdrop-blur-md z-10 rounded-sm shadow-sm">
                      Después
                    </span>

                    {/* Before (Foreground - Clipped & Grayscale) */}
                    <div
                      className="absolute inset-0 overflow-hidden pointer-events-none border-r-[3px] border-white drop-shadow-[2px_0_5px_rgba(0,0,0,0.5)]"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <MediaElement 
                         src={currentCase.before} 
                         type={currentCase.type} 
                         alt="Resultado Antes"
                         className="absolute inset-0 w-full max-w-none h-full grayscale-[0.85] contrast-125 brightness-95"
                         style={{ width: '100%', maxWidth: 'none' }}
                      />
                      
                      {/* Dark overlay for contrast */}
                      <div className="absolute inset-0 bg-charcoal/20 mix-blend-multiply"></div>

                      <span className="absolute bottom-4 left-4 md:bottom-6 md:left-6 font-sans text-[10px] uppercase tracking-widest text-white bg-charcoal/80 px-3 py-1 backdrop-blur-md rounded-sm shadow-sm">
                        Antes
                      </span>
                    </div>

                    {/* Minimalist Slider Line & Handle */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-white/60 shadow-[0_0_5px_rgba(0,0,0,0.2)] cursor-col-resize z-20 flex items-center justify-center transform -translate-x-1/2"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="relative flex items-center justify-center">
                         {/* Elegant Soft Glow Ping */}
                         <div className="absolute w-12 h-12 bg-white/40 rounded-full animate-[ping_3s_ease-in-out_infinite] object-cover pointer-events-none group-hover:hidden"></div>
                         
                         {/* Minimalist Handle Button */}
                         <div className="relative w-8 h-8 md:w-10 md:h-10 bg-white/95 backdrop-blur-xl rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.15)] group-hover:scale-110 group-active:scale-95 transition-all duration-500 cursor-col-resize">
                           <ChevronsLeftRight size={14} className="text-charcoal/70" />
                         </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Info Side */}
            <div className="lg:col-span-5 flex flex-col justify-center h-full mt-4 lg:mt-0">
              <AnimatePresence mode='wait'>
                <motion.div
                  key={currentCase.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white p-6 md:p-8 shadow-xl border border-gold/10 relative rounded-sm max-w-[500px] lg:max-w-full mx-auto w-full lg:ml-[-2rem] z-10"
                >
                  <span className="absolute -top-4 md:-top-6 left-6 md:left-8 text-5xl md:text-6xl text-gold/10 font-serif font-bold">
                    0{currentCase.id}
                  </span>

                  <div className="flex gap-2 mb-4 flex-wrap relative z-10">
                    {currentCase.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-base text-[10px] uppercase tracking-widest text-gold-dark rounded-full border border-gold/20">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="font-serif text-3xl text-charcoal mb-4 relative z-10">
                    {currentCase.title}
                  </h3>

                  <div className="w-12 h-px bg-gold mb-6"></div>

                  <p className="font-sans font-light text-charcoal/80 leading-relaxed mb-8 relative z-10">
                    {currentCase.description}
                  </p>

                  <button
                    onClick={() => handleConsult(currentCase.title)}
                    className="text-xs font-bold uppercase tracking-widest text-charcoal hover:text-gold transition-colors flex items-center gap-2 group cursor-hover relative z-10"
                  >
                    Consultar este caso
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              </AnimatePresence>

              {/* Pagination Dots */}
              {filteredCases.length > 1 && (
                <div className="flex gap-3 mt-8 justify-center lg:justify-start px-10">
                  {filteredCases.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 transition-all duration-300 rounded-full ${idx === currentIndex ? 'w-12 bg-gold' : 'w-4 bg-charcoal/20 hover:bg-gold/50'}`}
                      aria-label={`Ir al caso ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfter;