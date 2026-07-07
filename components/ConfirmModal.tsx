import React from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    type = 'danger',
    isLoading = false
}) => {
    const colors = {
        danger: {
            icon: 'text-red-500',
            button: 'bg-red-500 hover:bg-red-600',
            border: 'border-red-500/20'
        },
        warning: {
            icon: 'text-yellow-500',
            button: 'bg-yellow-500 hover:bg-yellow-600',
            border: 'border-yellow-500/20'
        },
        info: {
            icon: 'text-blue-500',
            button: 'bg-blue-500 hover:bg-blue-600',
            border: 'border-blue-500/20'
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-6"
                    onClick={() => !isLoading && onCancel()}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`bg-[#111] border ${colors[type].border} rounded-2xl max-w-md w-full overflow-hidden shadow-2xl`}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`flex-shrink-0 ${colors[type].icon}`}>
                                        <AlertTriangle size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-serif text-white mb-2">
                                            {title}
                                        </h3>
                                        <p className="text-white/70 text-sm leading-relaxed">
                                            {message}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onCancel}
                                    disabled={isLoading}
                                    className="text-white/50 hover:text-white transition-colors flex-shrink-0 disabled:opacity-50"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 flex gap-3">
                            <button
                                onClick={onCancel}
                                disabled={isLoading}
                                className="flex-1 px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`flex-1 px-6 py-3 ${colors[type].button} text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    confirmText
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
