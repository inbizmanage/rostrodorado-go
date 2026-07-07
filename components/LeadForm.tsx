import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import CustomSelect from './CustomSelect';
import ServiceMenuModal from './ServiceMenuModal';
import { m as motion } from 'framer-motion';
import { COLOMBIA_DATA } from '../constants/colombia';
import { SERVICE_MENU_ITEMS } from '../constants/services';
import { Turnstile } from '@marsidev/react-turnstile';

const TREATMENTS = [
    ...SERVICE_MENU_ITEMS.flatMap(category => category.items),
    "Otro (especificar abajo)"
];

interface LeadFormProps {
    onComplete?: () => void;
    source?: string;
}

const LeadForm: React.FC<LeadFormProps> = ({ onComplete, source = 'landing_contact_form' }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        department: '',
        city: '',
        treatment: '',
        details: '',
        privacy: false
    });

    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isTurnstileValid, setIsTurnstileValid] = useState(false);

    // Multi-step State
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0);

    // Track the Firestore lead document ID for progressive save
    const leadDocId = useRef<string | null>(null);

    const savePartialLead = async (nextStep: number) => {
        try {
            const { db } = await import('../firebase');
            const { collection, addDoc, serverTimestamp, updateDoc, doc } = await import('firebase/firestore');

            if (!leadDocId.current) {
                const docRef = await addDoc(collection(db, 'leads'), {
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    department: formData.department || '',
                    city: formData.city || '',
                    treatment: formData.treatment || '',
                    details: formData.details || '',
                    privacy: formData.privacy,
                    createdAt: serverTimestamp(),
                    status: 'new',
                    source: source,
                    completedStep: nextStep,
                    completed: false
                });
                leadDocId.current = docRef.id;
            } else {
                await updateDoc(doc(db, 'leads', leadDocId.current), {
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    department: formData.department || '',
                    city: formData.city || '',
                    treatment: formData.treatment || '',
                    details: formData.details || '',
                    privacy: formData.privacy,
                    completedStep: nextStep
                });
            }
        } catch (error) {
            console.error("Error saving partial lead:", error);
        }
    };

    const handleNext = () => {
        if (isStepValid()) {
            const nextStep = currentStep + 1;
            setDirection(1);
            setCurrentStep(nextStep);
            setFocusedField(null);

            if (currentStep >= 1) {
                savePartialLead(nextStep);
            }
        }
    };

    const handleBack = () => {
        setDirection(-1);
        setCurrentStep(prev => prev - 1);
        setFocusedField(null);
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 0: return formData.name.trim().length > 2;
            case 1: return formData.phone.length > 7 && formData.email.includes('@');
            case 2: return !!formData.department && !!formData.city;
            case 3: return !!formData.treatment;
            case 4: return formData.privacy;
            default: return false;
        }
    };

    useEffect(() => {
        const handlePrefill = (e: Event) => {
            const customEvent = e as CustomEvent;
            const interest = customEvent.detail?.interest;

            if (interest) {
                const exactMatch = TREATMENTS.find(t => t === interest);

                if (exactMatch) {
                    setFormData(prev => ({
                        ...prev,
                        treatment: exactMatch,
                    }));
                    setFocusedField('treatment');
                } else {
                    setFormData(prev => ({
                        ...prev,
                        treatment: "Otro (especificar abajo)",
                        details: prev.details ? prev.details : `Me interesa: ${interest}`
                    }));
                    setFocusedField('details');
                }

                setTimeout(() => setFocusedField(null), 2500);
            }
        };

        window.addEventListener('prefillContact', handlePrefill);
        return () => window.removeEventListener('prefillContact', handlePrefill);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDepartmentChange = (value: string) => {
        setFormData(prev => ({ ...prev, department: value, city: '' }));
        const dept = COLOMBIA_DATA.find(d => d.name === value);
        if (dept) {
            setAvailableCities(dept.cities);
        } else {
            setAvailableCities([]);
        }
    };

    const handleCityChange = (value: string) => {
        setFormData(prev => ({ ...prev, city: value }));
    };

    const handleTreatmentChange = (value: string) => {
        setFormData(prev => ({ ...prev, treatment: value }));
    };

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, privacy: e.target.checked }));
    };

    const openLegal = (e: React.MouseEvent, tab: 'terms' | 'privacy') => {
        e.preventDefault();
        e.stopPropagation();
        const event = new CustomEvent('openLegal', { detail: { tab } });
        window.dispatchEvent(event);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.privacy) return;

        // Guardar lead de forma asíncrona sin bloquear la redirección a WhatsApp
        const saveLead = async () => {
            try {
                const { db } = await import('../firebase');
                const { collection, addDoc, serverTimestamp, updateDoc, doc } = await import('firebase/firestore');

                if (leadDocId.current) {
                    await updateDoc(doc(db, 'leads', leadDocId.current), {
                        ...formData,
                        completedStep: 5,
                        completed: true
                    });
                } else {
                    await addDoc(collection(db, 'leads'), {
                        ...formData,
                        createdAt: serverTimestamp(),
                        status: 'new',
                        source: source,
                        completedStep: 5,
                        completed: true
                    });
                }
            } catch (error) {
                console.error("Error saving lead:", error);
            }
        };

        saveLead();

        const message = `Hola Dra. Isaura, ¡Quiero agendar una cita!\n\n*Mis Datos:*\nNombre: ${formData.name}\nTel: ${formData.phone}\nEmail: ${formData.email}\nUbicación: ${formData.city} (${formData.department})\n\n*Me interesa:*\nTratamiento: ${formData.treatment || 'No especificado'}\nDetalles: ${formData.details || 'N/A'}`;
        const encodedMessage = encodeURIComponent(message);
        const phoneNumber = '573126196527';
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
        if (isMobile) {
            window.location.href = url;
        } else {
            window.open(url, '_blank');
        }

        leadDocId.current = null;
        setCurrentStep(0);
        setFormData({
            name: '',
            phone: '',
            email: '',
            department: '',
            city: '',
            treatment: '',
            details: '',
            privacy: false
        });
        
        if (onComplete) {
            onComplete();
        }
    };

    const inputClasses = (fieldName: string) => `
    w-full bg-transparent border-b py-4 text-base md:text-lg text-white font-serif
    focus:outline-none transition-all duration-300 placeholder-white/40
    ${focusedField === fieldName || formData[fieldName as keyof typeof formData] ? 'border-gold' : 'border-white/10'}
  `;

    return (
        <div className="relative z-10 w-full max-w-xl mx-auto">
            <span className="inline-block py-1 px-3 border border-gold/30 rounded-full text-gold text-[10px] uppercase tracking-widest mb-6">
                Agenda Abierta 2026
            </span>

            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-4 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60">
                Tu mejor versión<br /> empieza aquí.
            </h2>
            <p className="font-sans text-white/50 font-light mb-12 text-sm md:text-base max-w-md">
                <strong className="text-gold font-medium">Consulta Gratis.</strong> Agenda tu valoración personalizada. Un espacio exclusivo para diseñar el plan perfecto para tu rostro.
            </p>

            <form onSubmit={handleSubmit} className="space-y-8 w-full max-w-lg mx-auto">
                {/* Progress Indicator */}
                <div className="flex gap-2 mb-8">
                    {[0, 1, 2, 3, 4].map((step) => (
                        <div
                            key={step}
                            className={`h-1 flex-1 rounded-full transition-all duration-500 ${step <= currentStep ? 'bg-gold' : 'bg-white/10'}`}
                        ></div>
                    ))}
                </div>

                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction < 0 ? 50 : -50 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="min-h-[300px] flex flex-col justify-center"
                >
                    {/* Step 0: Name */}
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <h3 className="font-serif text-2xl md:text-3xl text-white mb-2">¿Cuál es tu nombre?</h3>
                            <div className="group">
                                <label
                                    htmlFor="name"
                                    className={`block text-[10px] uppercase tracking-widest transition-colors duration-300 ${focusedField === 'name' ? 'text-gold' : 'text-white/70'}`}
                                >
                                    Nombre Completo *
                                </label>
                                <input
                                    id="name"
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                    type="text"
                                    autoFocus
                                    className={inputClasses('name')}
                                    placeholder="Escribe tu nombre aquí"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && formData.name.trim().length > 2) {
                                            e.preventDefault();
                                            handleNext();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 1: Contact */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h3 className="font-serif text-2xl md:text-3xl text-white mb-2">¿Cómo te contactamos?</h3>
                            <div className="grid grid-cols-1 gap-8">
                                <div>
                                    <label
                                        htmlFor="phone"
                                        className={`block text-[10px] uppercase tracking-widest transition-colors duration-300 ${focusedField === 'phone' ? 'text-gold' : 'text-white/70'}`}
                                    >
                                        Celular / WhatsApp *
                                    </label>
                                    <input
                                        id="phone"
                                        required
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('phone')}
                                        onBlur={() => setFocusedField(null)}
                                        type="tel"
                                        autoFocus
                                        pattern="[3][0-9]{9}"
                                        className={inputClasses('phone')}
                                        placeholder="300 000 0000"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="email"
                                        className={`block text-[10px] uppercase tracking-widest transition-colors duration-300 ${focusedField === 'email' ? 'text-gold' : 'text-white/70'}`}
                                    >
                                        Correo Electrónico *
                                    </label>
                                    <input
                                        id="email"
                                        required
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        type="email"
                                        className={inputClasses('email')}
                                        placeholder="tu@correo.com"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && isStepValid()) {
                                                e.preventDefault();
                                                handleNext();
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Location */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h3 className="font-serif text-2xl md:text-3xl text-white mb-2">¿Desde dónde nos escribes?</h3>
                            <div className="grid grid-cols-1 gap-8">
                                <div className="relative">
                                    <label className="block text-[10px] uppercase tracking-widest text-white/70 mb-2">
                                        Departamento *
                                    </label>
                                    <CustomSelect
                                        options={COLOMBIA_DATA.map(d => d.name)}
                                        value={formData.department}
                                        onChange={handleDepartmentChange}
                                        placeholder="Seleccionar Departamento"
                                        label=""
                                        searchable={true}
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-[10px] uppercase tracking-widest text-white/70 mb-2">
                                        Ciudad *
                                    </label>
                                    <CustomSelect
                                        options={availableCities}
                                        value={formData.city}
                                        onChange={handleCityChange}
                                        placeholder="Seleccionar Ciudad"
                                        label=""
                                        disabled={!formData.department}
                                        searchable={true}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Treatment */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h3 className="font-serif text-2xl md:text-3xl text-white mb-2">¿Qué tratamiento buscas?</h3>
                            <div className="relative">
                                <div
                                    onClick={() => setIsServiceModalOpen(true)}
                                    className={`w-full bg-white/5 border ${formData.treatment ? 'border-gold' : 'border-white/10'} p-6 rounded-xl text-white flex items-center justify-between cursor-pointer transition-colors hover:border-gold/50 group h-24`}
                                >
                                    <span className={`text-lg md:text-xl font-serif truncate ${formData.treatment ? 'text-white' : 'text-white/40'}`}>
                                        {formData.treatment || "Toca para abrir el menú..."}
                                    </span>
                                    <div className="flex items-center gap-3 text-gold bg-gold/10 px-4 py-2 rounded-full group-hover:bg-gold group-hover:text-black transition-all">
                                        <span className="text-[10px] uppercase tracking-widest font-bold">Ver Menú</span>
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </div>

                            {formData.treatment && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center text-white/40 text-xs mt-4"
                                >
                                    Tratamiento seleccionado. Pulsa Continuar.
                                </motion.p>
                            )}
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <h3 className="font-serif text-2xl md:text-3xl text-white mb-2">Últimos detalles</h3>

                            <div>
                                <label
                                    htmlFor="details"
                                    className={`block text-[10px] uppercase tracking-widest transition-colors duration-300 ${focusedField === 'details' ? 'text-gold' : 'text-white/70'}`}
                                >
                                    Cuéntanos más (Opcional)
                                </label>
                                <textarea
                                    id="details"
                                    name="details"
                                    value={formData.details}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('details')}
                                    onBlur={() => setFocusedField(null)}
                                    maxLength={150}
                                    rows={2}
                                    className={`${inputClasses('details')} resize-none`}
                                    placeholder="¿Tienes alguna duda específica?"
                                />
                            </div>

                            <div className="flex items-start gap-4 pt-4 group">
                                <div className="relative flex items-center mt-1">
                                    <input
                                        required
                                        type="checkbox"
                                        id="privacy"
                                        checked={formData.privacy}
                                        onChange={handleCheckbox}
                                        className="peer h-5 w-5 cursor-pointer appearance-none border border-white/20 rounded-sm bg-transparent checked:bg-gold checked:border-gold transition-all duration-300"
                                    />
                                    <Check size={14} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-charcoal opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <label htmlFor="privacy" className="text-xs font-light text-white/70 cursor-pointer select-none group-hover:text-white/80 transition-colors leading-relaxed">
                                    He leído y acepto los <button type="button" onClick={(e) => openLegal(e, 'terms')} className="p-1 -m-1 underline decoration-white/30 hover:decoration-gold hover:text-gold transition-colors font-medium inline-block">Términos y Condiciones</button> y autorizo el <button type="button" onClick={(e) => openLegal(e, 'privacy')} className="p-1 -m-1 underline decoration-white/30 hover:decoration-gold hover:text-gold transition-colors font-medium inline-block">Tratamiento de Datos Personales</button>.
                                </label>
                            </div>

                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-left">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-emerald-400 shrink-0 mt-0.5">
                                    <path d="M12.031 2c-5.524 0-10 4.48-10 10 0 1.83.49 3.55 1.34 5.04L2.031 22l5.12-1.34c1.45.79 3.09 1.24 4.88 1.24 5.52 0 10-4.48 10-10s-4.48-10-10-10zm5.95 14.18c-.27.76-1.35 1.39-1.9 1.44-.5.05-1 .17-3.18-.73-2.79-1.15-4.53-4.07-4.67-4.26-.14-.19-1.12-1.48-1.12-2.83 0-1.35.7-2.01.95-2.28.25-.26.54-.33.72-.33h.52c.18 0 .42-.07.65.48.24.58.81 2 .88 2.14.07.14.12.31.02.5-.1.19-.15.3-.3.48-.15.18-.32.4-.46.54-.16.15-.33.32-.14.65.19.33.85 1.39 1.82 2.26.84.75 1.56 1.13 1.89 1.29.33.16.53.13.72-.08.19-.22.82-.95 1.04-1.28.22-.33.45-.28.75-.17.3.11 1.91.9 2.24 1.07.33.16.55.24.63.38.08.14.08.82-.19 1.58z"/>
                                </svg>
                                <div>
                                    <p className="text-[11px] font-sans text-emerald-400 uppercase tracking-wider font-semibold mb-1">
                                        Paso Final Importante
                                    </p>
                                    <p className="text-xs text-white/80 font-light leading-relaxed">
                                        Al confirmar, se abrirá tu aplicación de WhatsApp. Debes enviar el mensaje de texto pre-escrito en el chat para que nuestro equipo pueda agendar y confirmar tu cita.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-center w-full overflow-hidden">
                                <div className="scale-90 sm:scale-100 origin-center">
                                    <Turnstile
                                        siteKey={(import.meta.env as Record<string, string>).VITE_TURNSTILE_SITE_KEY || '0x4AAAAAACh2eJMuJcB0TgIt'}
                                        onSuccess={() => setIsTurnstileValid(true)}
                                        onError={() => setIsTurnstileValid(false)}
                                        onExpire={() => setIsTurnstileValid(false)}
                                        options={{ theme: 'dark', size: 'normal' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Service Modal */}
                <ServiceMenuModal
                    isOpen={isServiceModalOpen}
                    onClose={() => setIsServiceModalOpen(false)}
                    onSelect={(service) => {
                        handleTreatmentChange(service);
                        setIsServiceModalOpen(false);
                    }}
                />

                {/* Navigation Buttons */}
                <div className="flex items-center gap-4 pt-8 border-t border-white/5 mt-8">
                    {currentStep > 0 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-4 text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors border border-white/10 hover:border-white/30 rounded-sm"
                        >
                            Atrás
                        </button>
                    )}

                    {currentStep < 4 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={!isStepValid()}
                            className={`flex-1 relative overflow-hidden font-bold py-4 px-8 transition-all duration-500 group shadow-[0_0_0_1px_rgba(255,255,255,0.1)] 
                                ${isStepValid() ? 'bg-white text-charcoal hover:shadow-[0_0_20px_rgba(198,168,124,0.4)] cursor-pointer' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs">
                                Siguiente
                                <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isStepValid() ? 'group-hover:translate-x-2' : ''}`} />
                            </span>
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={!formData.privacy || !isTurnstileValid}
                            className={`flex-1 relative overflow-hidden font-bold py-4 px-8 transition-all duration-500 group shadow-[0_0_0_1px_rgba(255,255,255,0.1)]
                                ${(formData.privacy && isTurnstileValid) ? 'bg-white text-charcoal hover:text-white hover:shadow-[0_0_20px_rgba(198,168,124,0.4)] cursor-pointer' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                        >
                            {(formData.privacy && isTurnstileValid) && (
                                <div className="absolute inset-0 w-full h-full bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ease-out"></div>
                            )}
                            <span className="relative z-10 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs">
                                Confirmar Cita
                                <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${(formData.privacy && isTurnstileValid) ? 'group-hover:translate-x-2' : ''}`} />
                            </span>
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default LeadForm;
