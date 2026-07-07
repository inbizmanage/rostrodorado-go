import React, { useState } from 'react';
import { m as motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../../firebase'; // Assuming db is exported
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import Navbar from '../Layout/Navbar';


const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',

        password: '',
        confirmPassword: ''
    });
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!termsAccepted) {
            setError('Debes aceptar los términos y condiciones.');
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        try {
            // 1. Create User in Auth
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Update Profile (Display Name)
            await updateProfile(user, {
                displayName: `${formData.firstName} ${formData.lastName}`
            });

            // 3. Create User Document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                firstName: formData.firstName,
                lastName: formData.lastName,
                displayName: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,

                createdAt: serverTimestamp(),
                role: formData.email === 'isauradorado@rostrodorado.com' ? 'admin' : 'customer'
            });

            // Show success message - user is already logged in by Firebase
            setSuccess(true);

            // Wait a moment to show success, then redirect
            setTimeout(() => {
                // Check if admin and redirect accordingly
                if (formData.email === 'isauradorado@rostrodorado.com') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            }, 1500);
        } catch (err: any) {
            console.error("Firebase Registration Error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Este email ya está registrado.');
            } else if (err.code === 'auth/weak-password') {
                setError('La contraseña debe tener al menos 6 caracteres.');
            } else if (err.code === 'auth/operation-not-allowed') {
                setError('El registro con email/contraseña no está habilitado. Contacta al soporte.');
            } else if (err.code === 'auth/invalid-email') {
                setError('El email ingresado no es válido.');
            } else {
                setError(`Error al registrarse: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] selection:bg-gold selection:text-white flex flex-col">

            <Navbar />

            <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-3xl relative overflow-hidden backdrop-blur-sm">

                        <div className="text-center mb-8">
                            <h1 className="font-serif text-3xl text-white mb-2">Crear Cuenta</h1>
                            <p className="text-white/50 text-sm font-light">Únete a Rostro Dorado Clinic</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-100 text-sm py-4 px-6 rounded-xl mb-6 flex items-center justify-center backdrop-blur-sm">
                                <span className="font-light tracking-wide">{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-100 text-sm py-4 px-6 rounded-xl mb-6 flex items-center justify-center backdrop-blur-sm">
                                <span className="font-light tracking-wide">✓ Cuenta creada exitosamente. Redirigiendo...</span>
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-white/50 ml-1">Nombre</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white focus:outline-none focus:border-gold transition-colors"
                                        placeholder="Tu nombre"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-white/50 ml-1">Apellido</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white focus:outline-none focus:border-gold transition-colors"
                                        placeholder="Tu apellido"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-white/50 ml-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white focus:outline-none focus:border-gold transition-colors"
                                    placeholder="tu@email.com"
                                />
                            </div>



                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-white/50 ml-1">Contraseña</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white focus:outline-none focus:border-gold transition-colors pr-12"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-white/50 ml-1">Confirmar Contraseña</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white focus:outline-none focus:border-gold transition-colors pr-12"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold focus:ring-gold focus:ring-offset-0"
                                />
                                <label htmlFor="terms" className="text-xs text-white/60 font-light select-none cursor-pointer">
                                    Acepto los <button type="button" onClick={() => setShowTerms(true)} className="text-gold hover:underline hover:text-white transition-colors">términos y condiciones</button> y la política de tratamiento de datos.
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative overflow-hidden bg-gold text-black font-bold uppercase tracking-[0.2em] py-4 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group mt-6"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? 'Registrando...' : 'Crear Cuenta'}
                                    {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                                </span>
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-white/40 text-xs font-light">
                                ¿Ya tienes una cuenta?{' '}
                                <Link to="/login" className="text-gold hover:text-white transition-colors font-medium hover:underline">
                                    Inicia Sesión
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Terms Modal */}
            {showTerms && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                    >
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
                            <h2 className="text-xl font-serif text-white">Términos y Condiciones</h2>
                            <button onClick={() => setShowTerms(false)} className="text-white/50 hover:text-white transition-colors">
                                <span className="sr-only">Cerrar</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto text-white/80 text-sm leading-relaxed space-y-4 custom-scrollbar">
                            <p><strong>1. Aceptación de los Términos:</strong> Al registrarse y utilizar los servicios de Rostro Dorado Clinic, usted acepta cumplir con estos términos y condiciones.</p>
                            <p><strong>2. Servicios:</strong> Ofrecemos tratamientos estéticos y venta de productos dermatológicos. Nos reservamos el derecho de modificar o retirar servicios sin previo aviso.</p>
                            <p><strong>3. Registro de Usuario:</strong> La información proporcionada debe ser veraz y actualizada. Usted es responsable de mantener la confidencialidad de su cuenta.</p>
                            <p><strong>4. Tratamiento de Datos:</strong> Sus datos personales (nombre, correo) serán tratados conforme a nuestra Política de Privacidad y la ley vigente de protección de datos. Serán utilizados para gestionar su cuenta, procesar pedidos y enviar información relevante.</p>
                            <p><strong>5. Compras y Pagos:</strong> Al realizar una compra, usted se compromete a pagar el precio indicado. Nos reservamos el derecho de cancelar pedidos sospechosos.</p>
                            <p><strong>6. Responsabilidad:</strong> Rostro Dorado Clinic no se hace responsable por el mal uso de los productos adquiridos. Consulte a un especialista si tiene dudas.</p>
                            <p><strong>7. Modificaciones:</strong> Podemos actualizar estos términos en cualquier momento. Se notificará a los usuarios sobre cambios importantes.</p>
                            <p className="pt-4 text-xs text-white/50 italic">Última actualización: Diciembre 2024</p>
                        </div>
                        <div className="p-6 border-t border-white/10 bg-[#1a1a1a] flex justify-end">
                            <button
                                onClick={() => {
                                    setTermsAccepted(true);
                                    setShowTerms(false);
                                }}
                                className="bg-gold text-black font-bold uppercase text-xs tracking-widest px-6 py-3 rounded-lg hover:bg-white transition-colors"
                            >
                                Aceptar y Cerrar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default RegisterPage;
