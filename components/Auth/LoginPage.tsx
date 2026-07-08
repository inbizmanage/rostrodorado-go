import React, { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { signInWithEmailAndPassword, signInWithCustomToken, signInWithPopup } from 'firebase/auth'; // Import password auth and custom token
import { auth, googleProvider } from '../../firebase';
import { ArrowRight, CheckCircle, Mail, Eye, EyeOff, Info } from 'lucide-react';
import Navbar from '../Layout/Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadGoogleIdentity } from '../../utils/loadGoogleIdentity';

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otpCode, setOtpCode] = useState(''); // New state for OTP
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<'idle' | 'otp_sent' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const hasSentAutoCode = React.useRef(false);

    // Lazy-load Google Identity Services only when Login page is visited
    useEffect(() => {
        loadGoogleIdentity().catch(err => console.warn('GIS load failed:', err));
    }, []);

    // Auto-handle redirect from Checkout
    React.useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
            if (location.state.autoSend && status === 'idle' && !hasSentAutoCode.current) {
                // Prevent double sending
                hasSentAutoCode.current = true;
                const autoEmail = location.state.email;
                handleSendCode(null, autoEmail);
            }
        }
    }, [location.state]);

    // Use emulator URL for local dev or production URL
    // Since we don't have the cloud functions URL yet, we must change this after deployment.
    // For now we assume local emulator default port 5001 or we will instruct user to deploy.
    // const FUNCTIONS_URL = 'http://127.0.0.1:5001/rostro-dorado-clinic/us-central1';
    // For production (after deploy): https://us-central1-rostro-dorado-clinic.cloudfunctions.net
    const FUNCTIONS_URL = '/api';


    const handleSendCode = async (e: React.FormEvent | null, manualEmail?: string) => {
        if (e) e.preventDefault();
        const targetEmail = manualEmail || email; // Use manual if provided

        setLoading(true);
        setStatus('idle');
        setErrorMessage('');

        try {
            // ADMIN LOGIN FLOW (Password)
            if (targetEmail === 'isauradorado@rostrodorado.com') {
                if (!password) {
                    // If admin enters email but no password yet, just let them see the password field
                    // (Handled by UI state)
                    if (status !== 'idle') return; // Don't loop
                } else {
                    const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
                    console.log('Admin logged in:', userCredential.user.uid);
                    navigate('/admin');
                    return;
                }
            }

            // CUSTOMER OTP FLOW - STEP 1: SEND CODE
            const response = await fetch(`${FUNCTIONS_URL}/sendOtp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: targetEmail })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error enviando código.');

            setStatus('otp_sent');

        } catch (error: any) {
            console.error(error);
            setStatus('error');
            if (error.code === 'auth/wrong-password') {
                setErrorMessage('Contraseña incorrecta.');
            } else {
                setErrorMessage(error.message || 'Error al conectar con el servidor.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');

        try {
            // CUSTOMER OTP FLOW - STEP 2: VERIFY CODE
            const response = await fetch(`${FUNCTIONS_URL}/verifyOtp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: otpCode })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Código inválido.');

            // Sign in with custom token
            await signInWithCustomToken(auth, data.token);
            navigate('/productos'); // Or wherever

        } catch (error: any) {
            console.error(error);
            // Don't change status to 'error' here, otherwise it switches back to Step 1.
            // setStatus('otp_sent') is redundant but safe.
            setErrorMessage(error.message || 'Código incorrecto. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/productos');
        } catch (error: any) {
            console.error("Google Login Error:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                setLoading(false); // Just reset loading, no error message needed
                return;
            }
            setErrorMessage('Error al iniciar sesión con Google. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f9f8f6] selection:bg-gold selection:text-white flex flex-col">

            <Navbar />

            <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
                <div className="absolute top-0 left-0 w-96 h-96 bg-gold/10 rounded-full blur-[120px] pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white border border-gray-100 p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-xl">

                        <div className="text-center mb-10">
                            <h1 className="font-serif text-3xl text-black mb-2">Bienvenido</h1>
                            <p className="text-gray-500 text-sm font-light">
                                {status === 'otp_sent'
                                    ? `Ingresa el código enviado a ${email}`
                                    : 'Accede a tu cuenta para gestionar tus pedidos'}
                            </p>
                        </div>

                        {/* Google Login Button */}
                        {status === 'idle' && (
                            <>
                                <div className="mb-8">
                                    <button
                                        onClick={handleGoogleLogin}
                                        type="button"
                                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        Continuar con Google
                                    </button>
                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-100"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white px-2 text-gray-400 tracking-widest">O usa tu email</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 text-left px-2 mb-6">
                                    <div className="text-gray-400 mt-0.5 min-w-[18px]">
                                        <Info size={18} />
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        <span className="font-semibold text-gray-600">Nota:</span> Para conservar tu historial de pedidos, asegúrate de iniciar sesión con el <span className="font-semibold">mismo correo electrónico</span> que has usado anteriormente.
                                    </p>
                                </div>
                            </>
                        )}

                        {status === 'otp_sent' ? (
                            <form onSubmit={handleVerifyCode} className="space-y-6">
                                {errorMessage && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-xl text-center">
                                        {errorMessage}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-gray-400 ml-1">Código de Seguridad</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                            required
                                            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-black text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all placeholder:text-gray-200"
                                            placeholder="000000"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full relative overflow-hidden bg-black text-white font-bold uppercase tracking-[0.2em] py-4 rounded-xl transition-all duration-300 hover:bg-gold hover:text-black hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group mt-4 border border-transparent"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {loading ? 'Verificando...' : 'Verificar y Entrar'}
                                        {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStatus('idle')}
                                    className="w-full text-center text-xs text-gray-400 hover:text-black transition-colors"
                                >
                                    Enviar código a otro correo
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleSendCode} className="space-y-6">
                                {status === 'idle' && errorMessage && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-xl text-center">
                                        {errorMessage}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-gray-400 ml-1">Email</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-black focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all pl-12 placeholder:text-gray-300"
                                            placeholder="tu@email.com"
                                        />
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    </div>
                                </div>

                                {/* Admin Password Field */}
                                {email === 'isauradorado@rostrodorado.com' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-2 overflow-hidden"
                                    >
                                        <label className="text-xs uppercase tracking-widest text-gray-400 ml-1">Contraseña Admin</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-black focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all pl-12 placeholder:text-gray-300"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full relative overflow-hidden bg-black text-white font-bold uppercase tracking-[0.2em] py-4 rounded-xl transition-all duration-300 hover:bg-gold hover:text-black hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group mt-4 border border-transparent"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {loading ? 'Procesando...' : (email === 'isauradorado@rostrodorado.com' ? 'Iniciar Sesión Admin' : 'Enviar Código')}
                                        {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                                    </span>
                                </button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
