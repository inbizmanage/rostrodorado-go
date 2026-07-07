import React, { useState, useRef, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: string[] | Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    searchable?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Seleccionar...',
    label,
    disabled = false,
    searchable = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Normalize options to Option[]
    const normalizedOptions: Option[] = options.map(opt =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    const filteredOptions = normalizedOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = normalizedOptions.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset search when opening
    useEffect(() => {
        if (isOpen) setSearchTerm('');
    }, [isOpen]);

    return (
        <div className="relative space-y-2" ref={wrapperRef}>
            {label && <label className="text-xs uppercase tracking-widest text-white/50">{label}</label>}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full bg-white/5 border ${isOpen ? 'border-gold' : 'border-white/10'} p-4 rounded-xl text-white flex items-center justify-between cursor-pointer transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/30'}`}
            >
                <span className={`truncate ${selectedOption ? 'text-white' : 'text-white/30'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={20}
                    className={`text-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </div>

            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[300px] flex flex-col"
                    >
                        {searchable && (
                            <div className="p-3 border-b border-white/5 sticky top-0 bg-[#1a1a1a] z-10">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/50"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt) => (
                                    <div
                                        key={opt.value}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                        }}
                                        className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center justify-between ${value === opt.value
                                            ? 'bg-gold/20 text-gold'
                                            : 'text-white/80 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        {opt.label}
                                        {value === opt.value && <Check size={16} />}
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-white/40 text-sm">
                                    No se encontraron resultados
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomSelect;
