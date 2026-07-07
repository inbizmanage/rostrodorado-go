import React, { useState, useEffect } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Activity, Server, Shield, Globe, Cpu, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { m as motion } from 'framer-motion';

interface ConnectionState {
    name: string;
    status: 'online' | 'offline' | 'checking' | 'error';
    details: string;
    latency?: number; // in ms
}

const SystemStatus: React.FC = () => {
    const [connections, setConnections] = useState<ConnectionState[]>([
        { name: 'Red e Internet', status: 'checking', details: 'Verificando conexion local...' },
        { name: 'Firebase Firestore', status: 'checking', details: 'Conectando con base de datos...' },
        { name: 'Firebase Autenticacion', status: 'checking', details: 'Verificando sesion...' },
        { name: 'Cloudflare Turnstile CAPTCHA', status: 'checking', details: 'Verificando scripts...' },
        { name: 'Meta Pixel (Rastreo)', status: 'checking', details: 'Verificando integracion...' },
        { name: 'API Google Gemini (IA)', status: 'checking', details: 'Verificando variables...' },
    ]);
    const [checking, setChecking] = useState(false);

    const checkAllConnections = async () => {
        setChecking(true);

        // 1. Check Local Internet & Latency
        const netStart = performance.now();
        let netStatus: 'online' | 'offline' = navigator.onLine ? 'online' : 'offline';
        let netDetails = navigator.onLine ? 'Conectado a la red local' : 'Sin conexion a Internet';
        let netLatency: number | undefined = undefined;

        if (navigator.onLine) {
            try {
                // Ping a tiny public file to measure latency
                await fetch('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png', {
                    mode: 'no-cors',
                    cache: 'no-store',
                });
                netLatency = Math.round(performance.now() - netStart);
                netDetails = `Conectado. Latencia de red: ${netLatency} ms`;
            } catch (err) {
                netStatus = 'offline';
                netDetails = 'Fallo de ping a red publica. Posible bloqueo de DNS o proxy.';
            }
        }

        // Update net state
        updateConnectionState('Red e Internet', netStatus, netDetails, netLatency);

        // 2. Check Firebase Firestore (Target database: rostrodorado-db)
        const firestoreStart = performance.now();
        let firestoreStatus: 'online' | 'offline' | 'error' = 'checking';
        let firestoreDetails = '';
        let firestoreLatency: number | undefined = undefined;

        try {
            // Attempt to query a small document or the products collection with limit 1
            const q = query(collection(db, 'products'), limit(1));
            await getDocs(q);
            firestoreLatency = Math.round(performance.now() - firestoreStart);
            firestoreStatus = 'online';
            firestoreDetails = `Conectado exitosamente. Base de datos: ${db.databaseId.database || 'default'}. Proyecto: ${db.app.options.projectId}. Latencia: ${firestoreLatency} ms`;
        } catch (err: any) {
            firestoreStatus = 'error';
            console.error('Error de diagnostico Firestore:', err);
            
            const errStr = String(err);
            if (errStr.includes('Failed to get document') || errStr.includes('offline') || errStr.includes('network')) {
                firestoreDetails = 'Error de conexion. El navegador bloqueo la peticion (ERR_BLOCKED_BY_CLIENT). Revisa bloqueadores de anuncios (AdBlock) o VPNs.';
            } else if (err.code === 'permission-denied') {
                firestoreDetails = 'Conectado, pero acceso denegado por Reglas de Seguridad (Firestore Rules).';
            } else {
                firestoreDetails = `Error: ${err.message || err.code || 'Desconocido'}`;
            }
        }
        updateConnectionState('Firebase Firestore', firestoreStatus, firestoreDetails, firestoreLatency);

        // 3. Check Firebase Auth
        let authStatus: 'online' | 'offline' = 'offline';
        let authDetails = 'No autenticado o sesion inactiva';
        if (auth.currentUser) {
            authStatus = 'online';
            authDetails = `Usuario autenticado: ${auth.currentUser.email || auth.currentUser.uid}`;
        } else if (auth) {
            authStatus = 'online';
            authDetails = 'Servicio inicializado. Esperando credenciales en pantalla de acceso.';
        }
        updateConnectionState('Firebase Autenticacion', authStatus, authDetails);

        // 4. Check Cloudflare Turnstile
        let turnstileStatus: 'online' | 'offline' | 'error' = 'checking';
        let turnstileDetails = '';
        try {
            const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/api.js', {
                mode: 'no-cors',
                cache: 'no-store',
            });
            if (res) {
                turnstileStatus = 'online';
                turnstileDetails = 'Script de Cloudflare accesible desde tu red.';
            }
        } catch (err) {
            turnstileStatus = 'error';
            turnstileDetails = 'Bloqueado por el cliente. El script de Turnstile fue rechazado por tu navegador (AdBlocker / Escudos).';
        }
        updateConnectionState('Cloudflare Turnstile CAPTCHA', turnstileStatus, turnstileDetails);

        // 5. Check Meta Pixel
        let pixelStatus: 'online' | 'offline' = 'offline';
        let pixelDetails = '';
        const hasPixel = typeof (window as any).fbq !== 'undefined';
        if (hasPixel) {
            pixelStatus = 'online';
            pixelDetails = 'Script inicializado y cargado correctamente en memoria.';
        } else {
            pixelStatus = 'offline';
            pixelDetails = 'Script bloqueado o no cargado. Posible proteccion contra rastreo activa.';
        }
        updateConnectionState('Meta Pixel (Rastreo)', pixelStatus, pixelDetails);

        // 6. Check Gemini API
        let geminiStatus: 'online' | 'offline' = 'offline';
        let geminiDetails = '';
        const geminiKey = (import.meta.env as Record<string, string>).VITE_GOOGLE_GEN_AI_KEY;
        if (geminiKey) {
            geminiStatus = 'online';
            geminiDetails = `Configurada. Clave API detectada en variables de entorno (${geminiKey.slice(0, 8)}...).`;
        } else {
            geminiStatus = 'offline';
            geminiDetails = 'No configurada. Falta VITE_GOOGLE_GEN_AI_KEY en el archivo de entorno.';
        }
        updateConnectionState('API Google Gemini (IA)', geminiStatus, geminiDetails);

        setChecking(false);
    };

    const updateConnectionState = (name: string, status: 'online' | 'offline' | 'checking' | 'error', details: string, latency?: number) => {
        setConnections(prev => prev.map(conn => {
            if (conn.name === name) {
                return { ...conn, status, details, latency };
            }
            return conn;
        }));
    };

    useEffect(() => {
        checkAllConnections();
    }, []);

    const getStatusStyles = (status: ConnectionState['status']) => {
        switch (status) {
            case 'online':
                return {
                    bg: 'bg-green-500/10 border-green-500/30 hover:bg-green-500/15',
                    dot: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]',
                    text: 'text-green-500',
                    label: 'En linea / OK'
                };
            case 'error':
                return {
                    bg: 'bg-red-500/10 border-red-500/30 hover:bg-red-500/15',
                    dot: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]',
                    text: 'text-red-500',
                    label: 'Error / Bloqueado'
                };
            case 'offline':
                return {
                    bg: 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/15',
                    dot: 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]',
                    text: 'text-yellow-500',
                    label: 'Sin conexion'
                };
            default:
                return {
                    bg: 'bg-zinc-800/40 border-zinc-700/30',
                    dot: 'bg-zinc-500 animate-pulse',
                    text: 'text-zinc-500',
                    label: 'Verificando...'
                };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-serif text-white flex items-center gap-3">
                        <Server className="text-gold" />
                        Monitoreo de Conexiones
                    </h2>
                    <p className="text-white/50 text-sm mt-1">Verificacion en tiempo real del estado de los servicios externos y base de datos.</p>
                </div>
                <button
                    onClick={checkAllConnections}
                    disabled={checking}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-gold hover:text-gold rounded-xl transition-all text-sm text-white disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                    Volver a verificar
                </button>
            </div>

            {/* Diagnostics Box if errors are present */}
            {connections.some(c => c.status === 'error') && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4"
                >
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-serif text-white font-medium text-sm">Problemas de Conexion Detectados</h4>
                        <p className="text-white/75 text-xs mt-1 leading-relaxed">
                            Uno o mas servicios indispensables presentan problemas para cargar. En entornos locales de desarrollo, esto suele ser provocado por extensiones de navegador como bloqueadores de anuncios (AdBlockers, Brave Shields) o proxys VPN que interceptan las peticiones hacia los servidores de Google y Cloudflare. Prueba desactivando dichos bloqueadores para localhost.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Connection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connections.map((conn, idx) => {
                    const styles = getStatusStyles(conn.status);
                    return (
                        <motion.div
                            key={conn.name}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            className={`p-6 border rounded-2xl transition-all duration-300 ${styles.bg}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-serif text-lg text-white font-medium">{conn.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase tracking-widest text-white/50">{styles.label}</span>
                                    <span className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
                                </div>
                            </div>
                            
                            <p className="text-white/60 text-xs md:text-sm font-light leading-relaxed min-h-[40px]">
                                {conn.details}
                            </p>

                            {conn.latency !== undefined && (
                                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-white/40 uppercase tracking-widest">
                                    <span>Latencia / Ping</span>
                                    <span className={styles.text}>{conn.latency} ms</span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default SystemStatus;
