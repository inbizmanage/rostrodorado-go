import React from 'react';
import { m as motion } from 'framer-motion';

const FloatingWhatsApp: React.FC = () => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const contactSection = document.getElementById('contact');
      let isContactVisible = false;

      if (contactSection) {
        const rect = contactSection.getBoundingClientRect();
        // Si el apartado de contacto entra en el viewport (o está visible)
        if (rect.top < window.innerHeight && rect.bottom >= 0) {
          isContactVisible = true;
        }
      }

      // Mostrar solo si se ha scrolleado > 500px Y NO estamos en la sección de contacto
      setIsVisible(window.scrollY > 500 && !isContactVisible);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openContactDrawer = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('openContactDrawer'));
  };

  return (
    <motion.a
      href="#contact"
      onClick={openContactDrawer}
      // Ajuste de posición: bottom-4 right-4 en móvil, bottom-8 right-8 en escritorio
      className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 group cursor-hover"
      initial={{ opacity: 0, y: 20, pointerEvents: 'none' }}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : 20,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.5 }}
    >
      {/* Ajuste de tamaño: px-4 py-2 en móvil, px-6 py-3 en escritorio */}
      <div className="relative flex items-center gap-2 md:gap-3 px-4 py-2 md:px-6 md:py-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:bg-[#111111] hover:border-gold/40 hover:shadow-[0_10px_30px_rgba(198,168,124,0.2)] transition-all duration-500 overflow-hidden">

        {/* Shine effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>

        {/* Status Indicator - Ligeramente más pequeño en móvil */}
        <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
          <span className="relative inline-flex rounded-full h-full w-full bg-gold"></span>
        </span>

        {/* Text - Fuente más pequeña en móvil (text-xs) */}
        <span className="relative z-10 font-sans font-medium text-[10px] md:text-xs text-white/90 tracking-widest uppercase group-hover:text-gold transition-colors duration-300">
          Contáctanos
        </span>
      </div>
    </motion.a>
  );
};

export default FloatingWhatsApp;