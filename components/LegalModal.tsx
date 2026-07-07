import React, { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText } from 'lucide-react';

type Tab = 'terms' | 'privacy';

const LegalModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('terms');

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
      }
      setIsOpen(true);
    };

    window.addEventListener('openLegal', handleOpen);
    return () => window.removeEventListener('openLegal', handleOpen);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-charcoal/90 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="relative bg-[#FAF7F2] w-full max-w-4xl h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gold/20"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 md:p-8 border-b border-gold/10 bg-white">
                <div>
                    <h2 className="font-serif text-2xl md:text-3xl text-charcoal">Marco Legal</h2>
                    <p className="font-sans text-xs text-taupe uppercase tracking-widest mt-1">Rostro Dorado Clinic</p>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-charcoal/40 hover:text-charcoal hover:bg-black/5 rounded-full transition-colors cursor-hover"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gold/10 bg-white/50">
                <button 
                    onClick={() => setActiveTab('terms')}
                    className={`flex-1 py-4 text-xs uppercase tracking-widest font-medium transition-colors flex items-center justify-center gap-2 cursor-hover ${activeTab === 'terms' ? 'bg-[#FAF7F2] text-gold border-b-2 border-gold' : 'text-charcoal/50 hover:text-charcoal bg-white'}`}
                >
                    <FileText size={16} />
                    Términos y Condiciones
                </button>
                <button 
                    onClick={() => setActiveTab('privacy')}
                    className={`flex-1 py-4 text-xs uppercase tracking-widest font-medium transition-colors flex items-center justify-center gap-2 cursor-hover ${activeTab === 'privacy' ? 'bg-[#FAF7F2] text-gold border-b-2 border-gold' : 'text-charcoal/50 hover:text-charcoal bg-white'}`}
                >
                    <ShieldCheck size={16} />
                    Política de Datos
                </button>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 text-charcoal/80 font-serif leading-relaxed text-sm md:text-base scrollbar-thin">
                {activeTab === 'terms' ? (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <h3 className="font-sans font-bold text-lg text-charcoal uppercase tracking-wide mb-4">1. Introducción</h3>
                        <p>Bienvenido a Rostro Dorado Clinic. Al agendar una cita o utilizar nuestros servicios, usted acepta regirse por los siguientes términos y condiciones. Estos protocolos están diseñados para garantizar la seguridad, calidad y excelencia en cada procedimiento.</p>

                        <h3 className="font-sans font-bold text-lg text-charcoal uppercase tracking-wide mb-4">2. Valoración Médica</h3>
                        <p>Todos los procedimientos requieren una valoración previa obligatoria por parte de la Dra. Isaura Dorado. Nos reservamos el derecho de no realizar tratamientos si el criterio médico determina que no es seguro o adecuado para el paciente.</p>

                        <h3 className="font-sans font-bold text-lg text-charcoal uppercase tracking-wide mb-4">3. Resultados y Garantías</h3>
                        <p>La medicina estética no es una ciencia exacta. Los resultados varían según la anatomía, cicatrización y hábitos de cada paciente. Aunque utilizamos productos de la más alta gama y técnicas avanzadas, no es posible garantizar un resultado idéntico al de fotos referenciales.</p>

                        <h3 className="font-sans font-bold text-lg text-charcoal uppercase tracking-wide mb-4">4. Política de Cancelación</h3>
                        <p>Para respetar el tiempo de nuestros pacientes y equipo médico, las cancelaciones o reprogramaciones deben realizarse con al menos <strong>24 horas de anticipación</strong>. Cancelaciones tardías o inasistencias podrían estar sujetas a un cargo administrativo.</p>
                        
                        <h3 className="font-sans font-bold text-lg text-charcoal uppercase tracking-wide mb-4">5. Retoques y Revisiones</h3>
                        <p>Los retoques (si aplican para el tratamiento, ej. Toxina Botulínica) deben realizarse dentro de los tiempos estipulados por el médico (usualmente entre 15 y 21 días post-tratamiento). Fuera de este periodo, cualquier procedimiento adicional tendrá un costo regular.</p>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-3xl mx-auto">
                         <div className="bg-gold/10 p-4 border border-gold/30 rounded-sm mb-8">
                            <p className="text-xs font-sans text-charcoal">
                                En cumplimiento de la <strong>Ley Estatutaria 1581 de 2012</strong> de Protección de Datos Personales (Habeas Data) de Colombia.
                            </p>
                         </div>

                        <h3 className="font-sans font-bold text-lg text-charcoal uppercase tracking-wide mb-4">1. Autorización de Tratamiento</h3>
                        <p>Al facilitar sus datos personales en nuestros formularios, usted autoriza de manera libre, previa, expresa e informada a <strong>Rostro Dorado Clinic</strong> para recolectar, almacenar, usar y procesar sus datos con fines médicos, administrativos y comerciales.</p>

                        <h3 className="font-sans font-bold text-lg text-charcoal uppercase tracking-wide mb-4">2. Finalidad de los Datos</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Gestión de historia clínica y seguimiento a tratamientos.</li>
                            <li>Confirmación y recordatorio de citas vía WhatsApp, Email o Teléfono.</li>
                            <li>Envío de información sobre promociones, nuevos servicios y eventos exclusivos.</li>
                            <li>Facturación y cumplimiento de obligaciones legales.</li>
                        </ul>

                        <h3 className="font-sans font-bold text-lg text-charcoal uppercase tracking-wide mb-4">3. Derechos del Titular (ARCO)</h3>
                        <p>Como titular de los datos, usted tiene derecho a:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Acceder</strong> a sus datos personales.</li>
                            <li><strong>Rectificar</strong> datos inexactos o incompletos.</li>
                            <li><strong>Cancelar</strong> o suprimir sus datos cuando no sean necesarios para la finalidad médica o legal.</li>
                            <li><strong>Oponerse</strong> al tratamiento de sus datos para fines específicos.</li>
                        </ul>

                        <h3 className="font-sans font-bold text-lg text-charcoal uppercase tracking-wide mb-4">4. Seguridad y Confidencialidad</h3>
                        <p>Rostro Dorado Clinic se compromete a tratar su información con estricta confidencialidad y a implementar las medidas de seguridad técnicas necesarias para evitar su adulteración, pérdida, consulta o acceso no autorizado.</p>

                        <h3 className="font-sans font-bold text-lg text-charcoal uppercase tracking-wide mb-4">5. Contacto</h3>
                        <p>Para ejercer sus derechos de Habeas Data, puede escribirnos al correo electrónico oficial o contactarnos vía WhatsApp.</p>
                    </div>
                )}
            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-gold/10 bg-white text-center">
                <button 
                    onClick={() => setIsOpen(false)}
                    className="px-8 py-3 bg-charcoal text-white font-sans text-xs uppercase tracking-widest hover:bg-gold transition-colors duration-300"
                >
                    Entendido
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LegalModal;