import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '../../firebase';
import { m as motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Navbar from '../Layout/Navbar';

const LoginVerifyPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verificando tu enlace de acceso...');

    useEffect(() => {
        const verifyLogin = async () => {
            if (isSignInWithEmailLink(auth, window.location.href)) {
                let email = window.localStorage.getItem('emailForSignIn');

                // If email is missing (e.g. user opened link on different device), prompt for it
                if (!email) {
                    email = window.prompt('Por favor confirma tu correo electrónico para verificar el acceso:');
                }

                if (email) {
                    try {
                        await signInWithEmailLink(auth, email, window.location.href);
                        window.localStorage.removeItem('emailForSignIn');
                        setStatus('success');
                        setMessage('¡Acceso verificado! Redirigiendo...');
                        // Delay slightly to show success state
                        setTimeout(() => navigate('/mis-pedidos'), 2000);
                    } catch (error) {
                        console.error('Error verifying email link', error);
                        setStatus('error');
                        setMessage('El enlace ha expirado o es inválido. Por favor intenta ingresar nuevamente.');
                    }
                } else {
                    setStatus('error');
                    setMessage('No se pudo verificar el correo electrónico.');
                }
            } else {
                setStatus('error');
                setMessage('Enlace de acceso no válido.');
            }
        };

        verifyLogin();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#f9f8f6] flex flex-col">
            <Navbar />

            <div className="flex-1 flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-white border border-gray-100 p-8 rounded-3xl text-center shadow-xl"
                >
                    <div className="flex justify-center mb-6">
                        {status === 'verifying' && <Loader2 size={48} className="text-gold animate-spin" />}
                        {status === 'success' && <CheckCircle size={48} className="text-green-500" />}
                        {status === 'error' && <AlertCircle size={48} className="text-red-500" />}
                    </div>

                    <h2 className="text-2xl font-serif text-black mb-2">
                        {status === 'verifying' && 'Verificando...'}
                        {status === 'success' && '¡Bienvenido!'}
                        {status === 'error' && 'Error de Acceso'}
                    </h2>

                    <p className="text-gray-500 mb-8 font-light">
                        {message}
                    </p>

                    {status === 'error' && (
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-black text-white px-6 py-2 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-gold hover:text-black transition-colors"
                        >
                            Volver al Login
                        </button>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default LoginVerifyPage;
