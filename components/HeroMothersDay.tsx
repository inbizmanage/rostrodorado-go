import React, { useState } from 'react';
import { m as motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ArrowDown, Gift, X, Flower2, Heart } from 'lucide-react';

// --- MOTHER'S DAY SPECIAL MODULE ---
// This component replaces the default Hero for the month of May.
// To revert, simply change the import in Home.tsx back to './Hero'
const HeroMothersDay: React.FC = () => {
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const { scrollY } = useScroll();

  const handleSelectPromo = (promoName: string) => {
    setIsPromoOpen(false);
    window.dispatchEvent(new CustomEvent('openContactDrawer'));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('prefillContact', { detail: { interest: promoName } }));
    }, 300);
  };
  const y = useTransform(scrollY, [0, 800], [0, 300]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  // Transform color from White (initial) to Black (on scroll)
  const bottomTextColor = useTransform(scrollY, [0, 100], ["rgba(255, 255, 255, 0.7)", "rgba(17, 17, 17, 1)"]);

  // Mouse Parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = ((e.clientX / window.innerWidth) - 0.5) * -40; // Moves slightly opposite to cursor
    const y = ((e.clientY / window.innerHeight) - 0.5) * -40;
    mouseX.set(x);
    mouseY.set(y);
  };

  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  const openContactDrawer = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const event = new CustomEvent('openContactDrawer');
    window.dispatchEvent(event);
  };

  return (
    <section 
      className="relative h-[110vh] w-full overflow-hidden flex items-center justify-center bg-base"
      onMouseMove={handleMouseMove}
    >

      {/* Background Image - Mother's Day Special */}
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        {/* Darker overlay for better text contrast as requested */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <motion.img
          src="/images/hero.webp"
          alt="Tratamientos Exclusivos - Rostro Dorado Clinic"
          className="w-full h-full object-cover object-center"
          style={{ x: springX, y: springY }}
          animate={{ scale: [1.05, 1.12] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          fetchPriority="high"
          loading="eager"
          decoding="sync"
          width="1920"
          height="1080"
        />
      </motion.div>

      {/* Main Content */}
      <motion.div style={{ opacity }} className="relative z-20 text-center px-6 max-w-5xl mx-auto mt-20">

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center"
        >
          {/* Signature Star SVG with Glow Effect */}
          <div className="mb-6 relative">
            {/* Soft Glow Background */}
            <div className="absolute inset-0 bg-white blur-2xl opacity-40 rounded-full scale-150 animate-pulse"></div>

            <svg
              viewBox="0 0 2196 2196"
              className="w-16 h-16 md:w-24 md:h-24 text-white fill-current drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]"
              aria-hidden="true"
            >
              <path d="m1096.52 991.59c4.85 1.2 14.08 21.2 16.85 26.3l35.28 64.8c4.01 7.47 7.87 17.84 13.43 24.07 9.41 10.58 107.48 63.16 123.55 69.77-10.51 8-42.31 24.52-55.22 31.37-20.37 10.8-46.03 26.45-66.47 35.93-9.32 19.89-24.76 45.33-35.37 65.31-7.88 14.84-21.47 41.25-29.99 53.79-10.39-3.75-54.57-105.46-69.45-119.18-13.37-12.33-113.18-58.3-116.6-66.13 6.15-7.37 103.2-58.11 118.09-66.69 22.65-37.68 43.6-80.78 65.9-119.34z" />
              <path d="m1085.96 67l4.55 1.67c4.98 5.87 3.25 40.54 3.99 50.53 3.83 51.54 5.48 103.04 7.04 154.69 0.33 10.69 2.22 21.26 2.45 31.95 0.79 38.16 0.41 76.34 1.09 114.48 0.23 12.55 2.37 24.94 2.6 37.49 1.01 55.14 0.78 110.78 0 165.93-0.17 12.16-2.23 24.12-2.54 36.24-1.02 38.38-0.18 76.87-1.12 115.27-0.24 9.96-1.82 19.78-2.36 29.71-1.16 21.04-1.04 42.47-1.29 63.56l-2.37-0.47c-1.76-3.53-3.58-6.85-4.11-10.81-1.79-13.42-1.22-27.63-1.84-41.2-0.42-9.15-1.74-18.22-2.23-27.38-0.8-15.18-0.79-30.4-1.38-45.59-0.36-9.2-1.76-18.3-2.17-27.5-0.94-21.03-0.7-42.09-1.5-63.11-0.35-9.31-1.79-18.55-2.25-27.87-1.06-21.28-0.9-43.17-1.07-64.5-0.09-12.87 2.01-83.97-1.01-91.15-4.01-9.48-2.23-110.48-1.57-128.5 0.38-10.49 2.18-20.87 2.43-31.38 1.08-45.73 0.24-91.6 1.16-137.36 0.2-10.01 1.86-19.91 2.32-29.9 1.16-24.81 1.19-49.96 1.18-74.8z" />
              <path d="m1091.11 98.59c3.44 11.39 0.5 36.64 2.1 49.61 3.28 26.55 2.6 53.1 3.89 79.72 7.31 161.25 9.32 322.69 6.02 484.07-0.17 13.2-2.38 23.77-2.55 37.36-0.36 28.61-0.56 59.39-1.29 88.18q-0.85 1.09-1.68 2.18c-4.73-22.02-3.48-37.5-4.7-59.87-11.19-192.29-13.56-384.99-7.09-577.49 0.6-21.84 0.06-43.92 0.97-65.8 0.61-14.55-1.74-24.14 4.33-37.96z" />
              <path d="m1328.06 1506.67c10.59 11.95 22.45 28.59 32.46 41.67q31.91 41.64 63.13 83.79c71.35 96.31 140.39 194.31 207.07 293.91 30.35 45.47 60.05 94.4 90.14 138.83l0.04 1.73c4.71 7.51 17.29 27.01 20.14 34.47-1.6-0.42-22.15-25.77-25.39-29.24-3.29-1.85-30.2-39.08-34.88-45.24-97.21-126.86-190.04-257.02-278.34-390.23q-27.52-41.12-54.21-82.77c-2.88-4.48-22.45-35.73-24.93-38.28l-1.68-5.67z" />
              <path d="m886.2 1518.46c6.16 0.93 3.89-0.16 8.53 4.17-77.94 131.17-172.65 273.15-260.4 397.9q-43.75 62.33-88.86 123.68l-26.65 36.16c-3.83 5.15-12.48 15.84-14.9 20.95-1.35-0.73-2.07-1.37-3.29-2.29l-0.64-4.81c17.61-27.87 35.07-57.64 52.56-85.85q41.87-67.07 85.03-133.3c79.44-121.22 162.35-240.14 248.62-356.61z" />
              <path d="m2126.23 871.33c5.23 0.06 8.61-0.93 11.83 1.86-4.39 3.03-16.36 5.97-24.44 11.02-6.7 1.73-29.86 11.01-38.35 14.07q-45.74 16.64-91.72 32.64c-98.16 34.14-197.05 66.16-296.6 96.03q-71.28 21.24-142.93 41.16c-7.18 2-59.46 15.44-62.35 17.25-4.68-1.36-6.06 0.46-10.01-1.58l0.05-4.83c5.32-0.62 54.98-19.56 63.32-22.59q65.9-23.73 132.17-46.4c148.11-49.67 307.52-100.08 459.03-138.63z" />
              <path d="m96.63 895.11c2.73 2.51 5.9 2.25 9.78 2.65 7.33 0.81 31.88 7.71 39.79 9.76l85.09 22.43c120.24 32.2 239.62 67.55 358.01 106.01q47.48 15.36 94.73 31.45c14.34 4.89 33.94 12.82 48.06 16.35-4.32 6.79-10.86 4.2-18.98 4.35-37.15-7.22-95.72-24.3-133.18-34.32-107.98-29.08-215.26-60.7-321.75-94.81q-57.86-18.75-115.45-38.3c-7.61-2.56-43.84-15.41-49.74-16.46 0.51-3.43 2.09-5.99 3.64-9.11z" />
              <path d="m581.13 498.29c4.48 0.72 7.81 4.88 10.87 8.36 30.53 34.63 60.51 70.45 89.35 106.46 69.83 86.65 135.22 176.79 195.92 270.06 3.88 5.93 26.83 39.46 26.64 44.52l-0.9 0.34c-3.04-1.68-31.41-35.04-35.9-40.3q-34.41-40.45-67.96-81.6c-9.78-11.89-19.41-25.33-28.96-37.56-44.6-56.67-87.09-114.97-127.41-174.76-19.62-29.16-44.44-65.09-61.65-95.52z" />
              <path d="m1598.45 507.79l3.34 1.02c1.57 3.32 0.1 5.23 0.27 9.03-7.65 7.61-28.97 47.43-37.19 58.81-15.3 20.85-27.89 42.86-42.62 64.15-56.87 82.21-115.92 163.73-180.39 240.12-5.01 5.94-33.63 43.05-37.44 44.42l-0.58-1.85c3.64-9.19 31.44-52.43 37.74-62.38 58.61-92.7 121.71-182.49 189.08-269.04q23.84-30.26 48.32-60c5.14-6.3 15.98-17.91 19.47-24.28z" />
              <path d="m772.78 1308.04c3.36 0.31 5.82 0.32 8.99 1.55l-1.19-0.25 0.86 0.65c-7.02 2.71-11.53 3.48-16.36 8.94-3.01 0.62-34.73 13.53-40.2 15.68q-41.73 16.38-83.95 31.46c-85.2 30.36-171.58 57.29-258.93 80.74-11.52 3.04-52.33 12.68-59.5 15.99l1.2-9.99c7.67-1.26 39.89-15.47 49.17-19.09q44.57-17.38 89.72-33.2c72.62-25.58 146.1-48.61 220.33-69.06 28.6-7.84 60.93-16.99 89.86-23.42z" />
              <path d="m1452.98 1303.66c32.11 5.87 74.1 17.52 105.94 25.89 84.99 22.28 169.05 47.96 251.98 77q27.9 9.89 55.69 20.11c8.79 3.22 22.99 8.05 30.92 12l0.47 1.16 0.29 2.9c-4.21 1.59-7.78 0.42-12.62 0.59l-4.11 0.03c-4.27-2.56-92.49-23-104.47-26.17-84.69-22.71-168.47-48.69-251.15-77.89q-27.61-9.65-54.98-19.95c-6.2-2.38-13.87-4.66-19.4-7.55-1.5-1.49-1.13-0.9-3.74-1.57l-0.04-3.72c2.15-1.34 2.96-1.73 5.22-2.83z" />
              <path d="m1092.69 1581.05c5.6-6.88 0.05-15.89 3.77-22.24l1.36 0.71c2.91 11.22 2.79 23.31 4.2 34.65 1.43 11.49-2.81 34.54 3.68 43.06 0.67 20.74 0.16 42.85 0.18 63.74 0.57 61.76-0.88 123.53-4.34 185.21q-1.24 30.63-3.7 61.18c-0.78 9.98-3.21 32.76-2.6 41.38-8.21 10.88 0.48 17.89-6.37 25.11-10.06-10.07 0.42-45.47-7.53-56.67-4.83-11.49 2.72-362.5 11.35-376.13z" />
              <path d="m1092.69 1581.05c0.04-7.86 2.97-57.26 5.59-61.3l1.61 0.76c4.6 13.32 2.04 57.72 4.34 74.41 1.73 12.53-1.84 28.47 1.47 42.31-6.49-8.52-2.25-31.57-3.68-43.06-1.41-11.34-1.29-23.43-4.2-34.65l-1.36-0.71c-3.72 6.35 1.83 15.36-3.77 22.24z" />
              <path d="m1081.34 1957.18c7.95 11.2-2.53 46.6 7.53 56.67 6.85-7.22-1.84-14.23 6.37-25.11-2.24 8.4-1.55 17.36-2.59 25.99-1.75 14.5-1.6 29.87-4.87 44.08-5.62-23.39-4.7-48.26-5.5-72.29-0.33-9.74 0.49-19.69-0.94-29.34z" />
              <path d="m732.09 1083.76c14.63 5.57 37.02 13.96 51.72 18.1l-0.07 1.16c-6.06 1.46-11.45 1.85-17.18-0.83-11.96-5.57-43.01-9.11-53.45-14.08 8.12-0.15 14.66 2.44 18.98-4.35z" />
              <path d="m911.78 1483.58l2.28 1.85c0.19 1.89 0.38 3.6 0.49 5.51-6.8 9.37-12.67 22.13-19.82 31.69-4.64-4.33-2.37-3.24-8.53-4.17 7.03-9.89 18.07-25.64 25.58-34.88z" />
              <path d="m1481.67 1085.36c-12.96 2.54-48.39 15.09-58.27 14.01l0.11-1.33c8.15-4.89 36.48-13.56 47.11-18.57l1.09-0.52-0.05 4.83c3.95 2.04 5.33 0.22 10.01 1.58z" />
              <path d="m1720.86 2064.87c5.9 3.72 27.2 41.13 31.83 49.59l-0.75 2.4 1.63 0.69-0.25-1.66-0.92 1.44c-7.54-5.8-35.1-37.25-36.75-45.5 3.24 3.47 23.79 28.82 25.39 29.24-2.85-7.46-15.43-26.96-20.14-34.47z" />
              <path d="m68.68 895.57c-7.61-4.43-18.72-6.94-24.29-10.79 15.04 0.38 37.43 9.46 52.24 10.33-1.55 3.12-3.13 5.68-3.64 9.11-6.47-3.7-17.53-4.86-24.31-8.65z" />
              <path d="m68.68 895.57c-9.1-1.09-29.25-9.25-38.78-12.77l-0.9-1.57c3.15-2.11 7.85-1.85 11.07-0.86 10.41 3.24 60.56 12.18 66.34 17.39-3.88-0.4-7.05-0.14-9.78-2.65-14.81-0.87-37.2-9.95-52.24-10.33 5.57 3.85 16.68 6.36 24.29 10.79z" />
              <path d="m1321.61 1509.64c-4.04-5.71-20.62-29.05-20.78-34.39l3.27-0.69c4.6 6 21.46 27.26 23.96 32.11z" />
              <path d="m322.5 1462.8c-5.88 0.68-31.12 8.14-33.79 6.31 4.65-5.38 27.03-12.92 34.99-16.3z" />
              <path d="m2160.07 861.74c4.9-1.38 12.69-4.06 17.41-2.97l-0.31 1.66c-9.3 4.82-54.58 23.06-63.55 23.78 8.08-5.05 20.05-7.99 24.44-11.02-0.64 0.47 14.94-5.91 16.84-6.9 1.57-2.8 1.32-2.15 4.3-4.02z" />
              <path d="m499.99 2094.22l0.64 4.81c1.22 0.92 1.94 1.56 3.29 2.29-3.27 3.41-20.86 27.75-21.46 27.96l-1.15-2.19c0.58-7.13 13.98-26.08 18.68-32.87z" />
              <path d="m1897.51 1438.66c8.11-1.17 21.41 7.75 30.79 11.25l1.33 1.65-0.72 2.16c-8.21-1.71-44.22-6.42-47.37-10.38l4.11-0.03c7.54 1.47 21.14 4.56 28.51 4.04l-0.6-1.06c-5.69-2.93-8.87-3.49-13.92-5.72l-1.66-0.75z" />
              <path d="m1323.29 1515.31c-4.76-5.05-34.07-50.78-33.55-55.83l1.45-0.2c4.9 3.53 9.73 10.14 12.91 15.28l-3.27 0.69c0.16 5.34 16.74 28.68 20.78 34.39z" />
              <path d="m1598.45 507.79c4.44-5.5 16.1-17.33 19.05-22.12l1.92-0.18c0.9 3.35-14.39 28.38-17.36 32.35-0.17-3.8 1.3-5.71-0.27-9.03z" />
              <path d="m772.78 1308.04c11.23-3.08 23.64-6.78 34.81-9.46-8.9 8.47-30.79 17.41-42.51 20.35 4.83-5.46 9.34-6.23 16.36-8.94l-0.86-0.65 1.19 0.25c-3.17-1.23-5.63-1.24-8.99-1.55z" />
              <path d="m1451.54 1311.78c-8.71 0.82-27.93-7.59-34.02-13.91l0.23-1.6c5.26-1.43 19.12 3.03 24.56 4.63-4.71-0.03-6.96-0.29-11.46 0.88l2.58-0.71-1.12 2.61c5.54 2.14 10.1 3.9 15.49 6.53 2.61 0.67 2.24 0.08 3.74 1.57z" />
              <path d="m911.78 1483.58c2.68-4.81 12.17-17.6 16.74-20.08-0.46 6.6-9.92 22.02-13.97 27.44-0.11-1.91-0.3-3.62-0.49-5.51z" />
              <path d="m2160.07 861.74l-0.87 0.53c-2.98 1.87-2.73 1.22-4.3 4.02-1.9 0.99-17.48 7.37-16.84 6.9-3.22-2.79-6.6-1.8-11.83-1.86 3.35-1.56 29.76-8.89 33.84-9.59z" />
              <path d="m1442.31 1300.9l10.67 2.76c-2.26 1.1-3.07 1.49-5.22 2.83l0.04 3.72c-5.39-2.63-9.95-4.39-15.49-6.53l1.12-2.61-2.58 0.71c4.5-1.17 6.75-0.91 11.46-0.88z" />
              <path d="m1897.98 1439.82l1.66 0.75c5.05 2.23 8.23 2.79 13.92 5.72l0.6 1.06c-7.37 0.52-20.97-2.57-28.51-4.04 4.84-0.17 8.41 1 12.62-0.59z" />
            </svg>
          </div>

          {/* Doctor Name - Signature Style */}
          <span className="font-serif text-xl md:text-2xl italic text-white/90 mb-3 drop-shadow-md">
            Dra. Isaura Dorado
          </span>
          <span className="font-sans text-[10px] md:text-xs font-medium tracking-[0.3em] uppercase text-gold mb-8 drop-shadow-md bg-black/20 px-4 py-1.5 rounded-full border border-gold/30">
            Promociones Especiales
          </span>

          <h1 className="font-serif text-4xl md:text-6xl lg:text-8xl text-white leading-none mb-8 drop-shadow-lg mix-blend-overlay opacity-90">
            Natural<span className="italic font-light">Elegance</span>
          </h1>

          <div className="h-px w-24 bg-white/60 mb-8"></div>

          <p className="font-serif text-lg md:text-2xl text-white/90 italic max-w-xl leading-relaxed drop-shadow-md">
            "La verdadera belleza no grita, susurra. Rejuvenece con la luz que ya habita en ti."
          </p>

          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6">
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
              <motion.div 
                className="absolute inset-0 rounded-full border border-white/30 pointer-events-none"
                animate={{ opacity: [0.8, 0, 0], scale: [1, 1.3, 1.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeOut", repeatDelay: 1 }}
              />
              <button
                onClick={openContactDrawer}
                className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden border border-white/40 rounded-full text-white transition-all duration-300 hover:bg-white hover:text-charcoal hover:border-white cursor-hover backdrop-blur-sm"
                aria-label="Agendar tu cita"
              >
                <span className="font-sans text-xs uppercase tracking-widest z-10">Agenda tu cita</span>
              </button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsPromoOpen(true);
                }}
                className="group relative inline-flex items-center justify-center px-10 py-4 overflow-hidden bg-gold/10 border border-gold/50 rounded-full text-white transition-all duration-300 shadow-[0_0_15px_rgba(216,167,160,0.2)] hover:bg-gold/20 hover:border-gold hover:shadow-[0_0_25px_rgba(216,167,160,0.4)] cursor-hover backdrop-blur-md"
                aria-label="Ver promociones del mes"
              >
                <Gift size={18} className="mr-3 text-gold z-10 transition-transform group-hover:scale-110" />
                <span className="font-sans text-xs font-bold uppercase tracking-widest z-10 text-white">Ver Promociones</span>
              </button>
            </motion.div>

          </div>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ color: bottomTextColor }}
        className="absolute bottom-10 left-0 right-0 flex justify-between px-12 text-[10px] uppercase tracking-widest font-sans z-30 transition-colors duration-300"
      >
        <span>Riohacha</span>

        <div className="flex flex-col items-center gap-2">
          <motion.span
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Scroll
          </motion.span>
          <motion.div
            animate={{ y: [0, 5, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <ArrowDown size={14} />
          </motion.div>
        </div>

        <span>Colombia</span>
      </motion.div>

      {/* Mother's Day Promo Modal - Light Glassmorphic Redesign */}
      <AnimatePresence mode="wait">
        {isPromoOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40"
            style={{ willChange: 'opacity' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden bg-[#f9f8f6] rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-gold/30 flex flex-col"
              style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-[-10%] left-[-5%] text-gold/15 pointer-events-none transform -rotate-12">
                <Flower2 size={300} strokeWidth={0.5} />
              </div>
              <div className="absolute bottom-[-5%] right-[-5%] text-gold/15 pointer-events-none transform rotate-12">
                <Flower2 size={250} strokeWidth={0.5} />
              </div>
              <div className="absolute top-[40%] right-[10%] text-gold/10 pointer-events-none transform rotate-45">
                <Heart size={200} strokeWidth={0.5} fill="currentColor" />
              </div>
              <div className="absolute top-[60%] left-[5%] text-gold/10 pointer-events-none transform -rotate-45">
                <Heart size={150} strokeWidth={0.5} />
              </div>

              <button 
                onClick={() => setIsPromoOpen(false)}
                className="absolute top-4 right-4 z-30 p-2 text-charcoal/60 hover:text-gold bg-white hover:bg-gold/10 rounded-full transition-colors shadow-sm border border-gold/20"
              >
                <X size={20} />
              </button>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar relative z-20">
                <div className="p-8 pb-4 text-center">
                  <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold mb-3 inline-block px-5 py-1.5 rounded-full border border-gold/40 bg-white shadow-sm">
                    Promociones de Temporada
                  </span>
                  <h3 className="font-serif text-3xl md:text-4xl text-charcoal drop-shadow-sm mt-2">Cuidado Exclusivo</h3>
                  <p className="text-charcoal/60 font-light text-sm mt-3 max-w-lg mx-auto">Porque mereces sentirte y verte más radiante que nunca. Descubre nuestros tratamientos premium de temporada.</p>
                </div>

                <div className="p-4 md:p-8 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Promo 1: Neolift */}
                  <button 
                    onClick={() => handleSelectPromo('Promoción: Neolift')}
                    className="flex flex-col text-left p-6 rounded-2xl bg-white border border-gold/20 hover:border-gold shadow-sm hover:shadow-md transition-[border-color,box-shadow] duration-200 group cursor-pointer"
                  >
                    <h4 className="font-serif text-2xl text-gold mb-3 group-hover:scale-105 transform origin-left transition-transform">Neolift</h4>
                    <p className="font-sans text-sm text-charcoal/80 mb-4 flex-1 font-light leading-relaxed">
                      Hidrata y bioregenera tu piel + efecto tensor con Hifu. <br/>
                      <span className="font-medium text-charcoal block mt-2">Profhilo o Skinvive + Lift!N Plus</span>
                    </p>
                    <div className="bg-gold/5 w-full rounded-xl p-4 border border-gold/20 mb-4 group-hover:border-gold/40 transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-charcoal/50 uppercase tracking-wider">Antes</span>
                        <span className="text-sm line-through text-charcoal/50">$2,400,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-charcoal uppercase tracking-wider">Ahora</span>
                        <span className="text-xl font-bold text-gold">$2,160,000</span>
                      </div>
                    </div>
                    <p className="text-[9px] uppercase tracking-widest text-center text-charcoal/40 w-full">Válido por tiempo limitado | Aplican TyC</p>
                    <div className="w-full mt-4 py-3 text-center border border-gold/50 rounded-xl text-gold text-xs uppercase tracking-widest font-bold group-hover:bg-gold group-hover:text-white transition-colors bg-white">Agendar Cita</div>
                  </button>

                  {/* Promo 2: Symmetria Elite */}
                  <button 
                    onClick={() => handleSelectPromo('Promoción: Symmetria Elite')}
                    className="flex flex-col text-left p-6 rounded-2xl bg-white border border-gold/20 hover:border-gold shadow-sm hover:shadow-md transition-[border-color,box-shadow] duration-200 group cursor-pointer"
                  >
                    <h4 className="font-serif text-2xl text-gold mb-3 group-hover:scale-105 transform origin-left transition-transform">Symmetria Elite</h4>
                    <p className="font-sans text-sm text-charcoal/80 mb-4 flex-1 font-light leading-relaxed">
                      Perfil armonioso, labios hidratados y definidos, mentón proyectado. <br/>
                      <span className="font-medium text-charcoal block mt-2">Ácido Hialurónico</span>
                    </p>
                    <div className="bg-gold/5 w-full rounded-xl p-4 border border-gold/20 mb-4 group-hover:border-gold/40 transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-charcoal/50 uppercase tracking-wider">Antes</span>
                        <span className="text-sm line-through text-charcoal/50">$3,500,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-charcoal uppercase tracking-wider">Ahora</span>
                        <span className="text-xl font-bold text-gold">$2,975,000</span>
                      </div>
                    </div>
                    <p className="text-[9px] uppercase tracking-widest text-center text-charcoal/40 w-full">Válido por tiempo limitado | Aplican TyC</p>
                    <div className="w-full mt-4 py-3 text-center border border-gold/50 rounded-xl text-gold text-xs uppercase tracking-widest font-bold group-hover:bg-gold group-hover:text-white transition-colors bg-white">Agendar Cita</div>
                  </button>

                  {/* Promo 3: Rejuvenation 360 */}
                  <div className="flex flex-col p-6 rounded-2xl bg-white border border-gold/20 shadow-sm md:col-span-2">
                    <h4 className="font-serif text-2xl text-gold mb-3">Rejuvenation 360</h4>
                    <p className="font-sans text-sm text-charcoal/80 mb-6 font-light leading-relaxed max-w-2xl">
                      Mejora líneas de expresión, sustenta tu rostro y bioestimula, hidrata de adentro hacia fuera.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <button 
                        onClick={() => handleSelectPromo('Promoción: Rejuvenation 360 (Botox+Harmonyca+Skinvive)')}
                        className="bg-gold/5 text-left rounded-xl p-5 border border-gold/20 hover:border-gold hover:bg-white shadow-sm hover:shadow-md transition-[border-color,box-shadow] duration-200 group cursor-pointer"
                      >
                        <span className="block font-medium text-charcoal mb-4 text-sm">Botox + Harmonyca + Skinvive</span>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-charcoal/50 uppercase tracking-wider">Antes</span>
                          <span className="text-sm line-through text-charcoal/50">$5,750,000</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold text-charcoal uppercase tracking-wider">Ahora</span>
                          <span className="text-xl font-bold text-gold">$5,175,000</span>
                        </div>
                        <div className="w-full py-2 text-center border border-gold/50 rounded-lg text-gold text-xs uppercase tracking-widest font-bold group-hover:bg-gold group-hover:text-white transition-colors bg-white">Agendar Cita</div>
                      </button>

                      <button 
                        onClick={() => handleSelectPromo('Promoción: Rejuvenation 360 (Botox+Sculptra+Skinbooster)')}
                        className="bg-gold/5 text-left rounded-xl p-5 border border-gold/20 hover:border-gold hover:bg-white shadow-sm hover:shadow-md transition-[border-color,box-shadow] duration-200 group cursor-pointer"
                      >
                        <span className="block font-medium text-charcoal mb-4 text-sm">Botox + Sculptra + Skinbooster</span>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-charcoal/50 uppercase tracking-wider">Antes</span>
                          <span className="text-sm line-through text-charcoal/50">$3,950,000</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold text-charcoal uppercase tracking-wider">Ahora</span>
                          <span className="text-xl font-bold text-gold">$3,555,000</span>
                        </div>
                        <div className="w-full py-2 text-center border border-gold/50 rounded-lg text-gold text-xs uppercase tracking-widest font-bold group-hover:bg-gold group-hover:text-white transition-colors bg-white">Agendar Cita</div>
                      </button>
                    </div>
                    <p className="text-[9px] uppercase tracking-widest text-center text-charcoal/40 mt-2">Válido por tiempo limitado | Aplican TyC</p>
                  </div>

                  {/* Promo 4: Hydtaskin & Nacar C */}
                  <div className="flex flex-col p-6 rounded-2xl bg-white border border-gold/20 shadow-sm md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                      
                      {/* Hydtaskin */}
                      <div className="flex flex-col">
                        <h4 className="font-serif text-2xl text-gold mb-3">Hydtaskin</h4>
                        <p className="font-sans text-sm text-charcoal/80 mb-6 font-light leading-relaxed flex-1">
                          Unifica el tono de tu piel haciéndola más radiante y combate el envejecimiento con una hidratación profunda.<br/>
                          <span className="font-medium text-charcoal block mt-2">Nácar Advance + Skinbooster</span>
                        </p>
                        <button 
                          onClick={() => handleSelectPromo('Promoción: Hydtaskin')}
                          className="bg-gold/5 text-left rounded-xl p-5 border border-gold/20 hover:border-gold hover:bg-white shadow-sm hover:shadow-md transition-[border-color,box-shadow] duration-200 group cursor-pointer"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-charcoal/50 uppercase tracking-wider">Antes</span>
                            <span className="text-sm line-through text-charcoal/50">$1,150,000</span>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-charcoal uppercase tracking-wider">Ahora</span>
                            <span className="text-xl font-bold text-gold">$1,035,000</span>
                          </div>
                          <div className="w-full py-2 text-center border border-gold/50 rounded-lg text-gold text-xs uppercase tracking-widest font-bold group-hover:bg-gold group-hover:text-white transition-colors bg-white">Agendar Cita</div>
                        </button>
                      </div>

                      {/* Nacar C */}
                      <div className="flex flex-col">
                        <h4 className="font-serif text-2xl text-gold mb-3">Nácar C</h4>
                        <p className="font-sans text-sm text-charcoal/80 mb-6 font-light leading-relaxed flex-1">
                          Unifica el tono de tu piel haciéndola más radiante y antioxidante tu cuerpo de adentro hacia afuera.<br/>
                          <span className="font-medium text-charcoal block mt-2">Nácar Advance + Megadosis Vitamina C</span>
                        </p>
                        <button 
                          onClick={() => handleSelectPromo('Promoción: Nácar C')}
                          className="bg-gold/5 text-left rounded-xl p-5 border border-gold/20 hover:border-gold hover:bg-white shadow-sm hover:shadow-md transition-[border-color,box-shadow] duration-200 group cursor-pointer"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-charcoal/50 uppercase tracking-wider">Antes</span>
                            <span className="text-sm line-through text-charcoal/50">$700,000</span>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-charcoal uppercase tracking-wider">Ahora</span>
                            <span className="text-xl font-bold text-gold">$600,000</span>
                          </div>
                          <div className="w-full py-2 text-center border border-gold/50 rounded-lg text-gold text-xs uppercase tracking-widest font-bold group-hover:bg-gold group-hover:text-white transition-colors bg-white">Agendar Cita</div>
                        </button>
                      </div>

                    </div>
                    <p className="text-[9px] uppercase tracking-widest text-center text-charcoal/40 mt-2">Válido por tiempo limitado | Aplican TyC</p>
                  </div>

                </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
};

export default HeroMothersDay;