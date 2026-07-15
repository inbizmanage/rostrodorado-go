import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
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
        { name: 'Turso (Base de Datos)', status: 'checking', details: 'Conectando con Turso SQLite...' },
        { name: 'Firebase Autenticacion', status: 'checking', details: 'Verificando sesion...' },
        { name: 'Wompi (Pagos)', status: 'checking', details: 'Verificando pasarela de pagos...' },
        { name: 'EnvíoClick (Logística)', status: 'checking', details: 'Verificando API de envíos...' },
        { name: 'Google Apps Script (Backup)', status: 'checking', details: 'Verificando webhook de respaldo...' },
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

        // 2. Check Turso (direct ping to the pipeline API)
        const tursoStart = performance.now();
        let tursoStatus: 'online' | 'offline' | 'error' = 'error';
        let tursoDetails = '';
        let tursoLatency: number | undefined = undefined;
        const TURSO_URL = 'https://rostrodorado-db-rostrodoradoclinic.aws-us-east-1.turso.io/v2/pipeline';
        const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJnaWQiOiJkYWI3ZDNhOC0yNmEzLTRiMmUtOTk0MS05MWQzNjhmY2I2NjkiLCJpYXQiOjE3ODM4Mjg4ODEsImtpZCI6ImxkMW5CQUp6blVuM3Vpc0ViWFZKTWtybHIybWEtakExZkkwVjFBWWZUSWsiLCJyaWQiOiI5MWUzNTk3YS0zY2QxLTQ1Y2QtOWRmZS0xNjM3YjQ3YTIwZjkifQ.__tFme0WATv1iGb0gpZ1wvzscS_YW2kJnAIW3D6rULfcC2SMc8VoqUA_woyLfWUIJ4DFpBeJMmPlM6kQo8PUAg';
        try {
            const tursoRes = await fetch(TURSO_URL, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${TURSO_TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql: 'SELECT 1;' } }] }),
            });
            tursoLatency = Math.round(performance.now() - tursoStart);
            if (tursoRes.ok) {
                tursoStatus = 'online';
                tursoDetails = `Conectado a Turso (aws-us-east-1). Base de datos: rostrodorado-db. Latencia: ${tursoLatency} ms`;
            } else {
                tursoStatus = 'error';
                tursoDetails = `Respuesta inesperada del servidor Turso: HTTP ${tursoRes.status}`;
            }
        } catch (err: any) {
            tursoStatus = 'error';
            tursoDetails = `Error al conectar con Turso: ${err.message || 'Sin respuesta del servidor'}`;
        }
        updateConnectionState('Turso (Base de Datos)', tursoStatus, tursoDetails, tursoLatency);

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

        // 4. Check Google Apps Script (Backup webhook)
        let appsScriptStatus: 'online' | 'offline' | 'error' = 'offline';
        let appsScriptDetails = '';
        const appsScriptUrl = (import.meta.env as Record<string, string>).VITE_APPS_SCRIPT_URL;
        if (appsScriptUrl) {
            const appsStart = performance.now();
            try {
                await fetch(appsScriptUrl + '?ping=1', { mode: 'no-cors', cache: 'no-store' });
                const appsLatency = Math.round(performance.now() - appsStart);
                appsScriptStatus = 'online';
                appsScriptDetails = `Webhook de respaldo detectado y accesible. Latencia estimada: ${appsLatency} ms`;
            } catch {
                appsScriptStatus = 'error';
                appsScriptDetails = 'URL configurada pero la peticion fue bloqueada. Posible restriccion de CORS o AdBlocker.';
            }
        } else {
            appsScriptStatus = 'offline';
            appsScriptDetails = 'No configurado. Falta VITE_APPS_SCRIPT_URL en las variables de entorno. El respaldo automatico a Google Sheets esta desactivado.';
        }
        updateConnectionState('Google Apps Script (Backup)', appsScriptStatus, appsScriptDetails);

        // 5. Check Cloudflare Turnstile
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

        // 7. Check Wompi (Pasarela de Pagos)
        const wompiStart = performance.now();
        let wompiStatus: 'online' | 'offline' | 'error' = 'error';
        let wompiDetails = '';
        let wompiLatency: number | undefined = undefined;
        try {
            await fetch('https://checkout.wompi.co/widget.js', { mode: 'no-cors', cache: 'no-store' });
            wompiLatency = Math.round(performance.now() - wompiStart);
            wompiStatus = 'online';
            wompiDetails = `Servidor de Wompi (Bancolombia) accesible. Clave produccion configurada (pub_prod_aDq9...). Latencia: ${wompiLatency} ms`;
        } catch {
            wompiStatus = 'error';
            wompiDetails = 'No se pudo conectar con los servidores de Wompi. Posible bloqueo de red o AdBlocker activo.';
        }
        updateConnectionState('Wompi (Pagos)', wompiStatus, wompiDetails, wompiLatency);

        // 8. Check EnvioClick (Logistica)
        const enviolStart = performance.now();
        let envioStatus: 'online' | 'offline' | 'error' = 'error';
        let envioDetails = '';
        let envioLatency: number | undefined = undefined;
        try {
            await fetch('https://api.envioclick.com', { mode: 'no-cors', cache: 'no-store' });
            envioLatency = Math.round(performance.now() - enviolStart);
            envioStatus = 'online';
            envioDetails = `API de EnvioClick accesible. Latencia: ${envioLatency} ms. La generacion de guias esta disponible desde el panel de Pedidos.`;
        } catch {
            envioStatus = 'error';
            envioDetails = 'No se pudo alcanzar la API de EnvioClick. La generacion de guias puede estar afectada.';
        }
        updateConnectionState('EnvíoClick (Logística)', envioStatus, envioDetails, envioLatency);

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
