import React, { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastProps {
    toast: Toast;
    onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, 4000);

        return () => clearTimeout(timer);
    }, [toast.id, onClose]);

    const icons = {
        success: <CheckCircle size={24} />,
        error: <XCircle size={24} />,
        info: <Info size={24} />,
        warning: <Info size={24} className="text-yellow-500" />
    };

    const colors = {
        success: 'border-green-500 text-green-500',
        error: 'border-red-500 text-red-500',
        info: 'border-blue-500 text-blue-500',
        warning: 'border-yellow-500 text-yellow-500'
    };

    const iconColors = {
        success: 'text-green-500',
        error: 'text-red-500',
        info: 'text-blue-500',
        warning: 'text-yellow-500'
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`flex items-center gap-3 px-5 py-4 rounded-lg bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-l-4 min-w-[320px] max-w-md ${(colors[toast.type] || colors.info).split(' ')[0]}`}
        >
            <div className={`flex-shrink-0 ${iconColors[toast.type]}`}>
                {icons[toast.type]}
            </div>
            <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm leading-snug">{toast.message}</p>
            </div>
            <button
                onClick={() => onClose(toast.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

let toastCounter = 0;
let addToastCallback: ((message: string, type: ToastType) => void) | null = null;

export const showToast = (message: string, type: ToastType = 'info') => {
    if (addToastCallback) {
        addToastCallback(message, type);
    }
};

const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        addToastCallback = (message: string, type: ToastType) => {
            const id = `toast-${toastCounter++}`;
            setToasts(prev => [...prev, { id, message, type }]);
        };

        return () => {
            addToastCallback = null;
        };
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div
            className="fixed bottom-4 right-4 flex flex-col-reverse gap-3 pointer-events-none"
            style={{ zIndex: 2147483646 }} // Above everything, below cursor
        >
            <AnimatePresence>
                {toasts.map(toast => (
                    <div className="pointer-events-auto" key={toast.id}>
                        <ToastItem toast={toast} onClose={removeToast} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;
