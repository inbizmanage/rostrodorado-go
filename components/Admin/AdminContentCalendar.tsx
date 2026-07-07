import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product } from '../../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    CalendarDays, Sparkles, Loader2, ChevronLeft, ChevronRight,
    Copy, Wand2, X, Clock, Tag, Image as ImageIcon, FileText,
    RefreshCw, Download, ChevronDown, ChevronUp
} from 'lucide-react';
import { showToast } from '../ToastContainer';

// Re-use same key as AiAssistant
const GEMINI_KEY = (import.meta.env as Record<string, string>).VITE_GOOGLE_GEN_AI_KEY;

// ─── Types ──────────────────────────────────────────────────────────────────
type TimeSlot = '08:00' | '11:00' | '14:00' | '17:00' | '20:00';

interface CalendarPost {
    timeSlot: TimeSlot;
    concept: string;
    productName: string;
    productId?: string;
    imagePrompt: string;
    copyText: string;
    hashtags: string[];
}

interface CalendarDay {
    day: number;
    posts: CalendarPost[];
}

interface GeneratedCalendar {
    month: number;
    year: number;
    days: CalendarDay[];
    generatedAt: number;
}

const TIME_SLOTS: { key: TimeSlot; label: string; emoji: string }[] = [
    { key: '08:00', label: 'Mañana', emoji: '☀️' },
    { key: '11:00', label: 'Educativo', emoji: '📚' },
    { key: '14:00', label: 'Lifestyle', emoji: '🌿' },
    { key: '17:00', label: 'Interacción', emoji: '💬' },
    { key: '20:00', label: 'Nocturno', emoji: '🌙' },
];

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const buildProductContext = (products: Product[]): string => {
    return products.slice(0, 30).map(p => (
        `• ${p.name} | Categoría: ${p.category} | Precio: $${p.price?.toLocaleString()} | Descripción: ${p.description?.slice(0, 120) || ''}`
    )).join('\n');
};

// ─── Main Component ──────────────────────────────────────────────────────────
const AdminContentCalendar: React.FC = () => {
    const today = new Date();
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState('');
    const [calendar, setCalendar] = useState<GeneratedCalendar | null>(null);
    const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
    const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
    const [expandedSlot, setExpandedSlot] = useState<TimeSlot | null>(null);
    const [daysToGenerate, setDaysToGenerate] = useState(7); // Default: 1 week

    // Load products & saved calendar
    useEffect(() => {
        fetchProducts();
        const saved = localStorage.getItem(`rd_calendar_${viewMonth}_${viewYear}`);
        if (saved) {
            try { setCalendar(JSON.parse(saved)); } catch { }
        }
    }, [viewMonth, viewYear]);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const snap = await getDocs(query(collection(db, 'products'), orderBy('name')));
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        } catch (err) {
            showToast('Error al cargar productos', 'error');
        } finally {
            setLoadingProducts(false);
        }
    };

    // ── Generate Calendar with Gemini ─────────────────────────────────────────
    const generateCalendar = useCallback(async () => {
        if (products.length === 0) {
            showToast('No hay productos cargados', 'error');
            return;
        }
        if (!GEMINI_KEY) {
            showToast('Configura VITE_GOOGLE_GEN_AI_KEY en .env.local', 'error');
            return;
        }
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        setGenerating(true);
        setGenerationStep('Analizando catálogo de productos...');

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const productContext = buildProductContext(products);
            const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
            const actualDays = Math.min(daysToGenerate, daysInMonth);

            setGenerationStep(`Generando ${actualDays} días de contenido...`);

            const systemPrompt = `Eres un experto en marketing digital para clínicas de medicina estética de lujo. 
Tu cliente es "Rostro Dorado Clinic" de la Dra. Isaura Dorado en Riohacha, Colombia.
Crea contenido elegante, clínico y aspiracional. El tono es sofisticado pero cercano. En español colombiano.

CATÁLOGO DE PRODUCTOS DISPONIBLES:
${productContext}

Genera un calendario de contenido para ${actualDays} días del mes de ${MONTH_NAMES[viewMonth]} ${viewYear}.
Por cada día necesito EXACTAMENTE 5 posts, uno por franja horaria:
- 08:00 (Mañana motivacional)
- 11:00 (Post educativo/infografía)
- 14:00 (Lifestyle/estética visual)
- 17:00 (Interacción/engagement)
- 20:00 (Ritual nocturno)

Devuelve SOLO un objeto JSON válido, sin markdown, sin explicaciones, con esta estructura exacta:
{
  "days": [
    {
      "day": 1,
      "posts": [
        {
          "timeSlot": "08:00",
          "concept": "Nombre del concepto del post (máx 6 palabras)",
          "productName": "Nombre exacto del producto",
          "imagePrompt": "Prompt en inglés para generar la foto del producto con IA. Debe ser detallado, describir estilo visual editorial de lujo, iluminación, superficie, ambiente. Mínimo 50 palabras.",
          "copyText": "Texto del post para Facebook/Instagram en español. Debe incluir emoji, llamado a la acción, y mencionar el beneficio clave. Máximo 3 párrafos.",
          "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
        }
      ]
    }
  ]
}

Rota los productos de forma que cada uno aparezca múltiples veces durante el mes con diferentes ángulos.
USA productos REALES del catálogo. El imagePrompt debe ser específico para ese producto.`;

            const result = await model.generateContent(systemPrompt);
            const text = result.response.text();

            setGenerationStep('Procesando respuesta...');

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No se recibió JSON válido del modelo');

            const parsed = JSON.parse(jsonMatch[0]);

            const newCalendar: GeneratedCalendar = {
                month: viewMonth,
                year: viewYear,
                days: parsed.days || [],
                generatedAt: Date.now(),
            };

            setCalendar(newCalendar);
            localStorage.setItem(`rd_calendar_${viewMonth}_${viewYear}`, JSON.stringify(newCalendar));
            showToast(`¡Calendario generado: ${newCalendar.days.length} días!`, 'success');
            if (newCalendar.days.length > 0) setSelectedDay(newCalendar.days[0]);
        } catch (err: any) {
            console.error(err);
            const is403 = err?.message?.includes('403') || err?.message?.includes('denied');
            showToast(
                is403
                    ? 'API Key de Gemini inválida o expirada. Revisa VITE_GOOGLE_GEN_AI_KEY en .env.local'
                    : (err.message || 'Error al generar el calendario'),
                'error'
            );
        } finally {
            setGenerating(false);
            setGenerationStep('');
        }
    }, [products, viewMonth, viewYear, daysToGenerate]);

    const copyToClipboard = (text: string, label = 'Texto') => {
        navigator.clipboard.writeText(text);
        showToast(`${label} copiado`, 'success');
    };

    const sendToPhotoStudio = (post: CalendarPost) => {
        // Store prompt in localStorage so PhotoStudio can pick it up
        localStorage.setItem('rd_photo_studio_pending_prompt', JSON.stringify({
            prompt: post.imagePrompt,
            productName: post.productName,
        }));
        showToast('Prompt enviado al Photo Studio ✨', 'success');
    };

    const exportCalendarText = () => {
        if (!calendar) return;
        let text = `CALENDARIO DE CONTENIDO - ${MONTH_NAMES[calendar.month]} ${calendar.year}\n`;
        text += `Generado: ${new Date(calendar.generatedAt).toLocaleString('es-CO')}\n\n`;
        calendar.days.forEach(day => {
            text += `═══════════════ DÍA ${day.day} ═══════════════\n`;
            day.posts.forEach(post => {
                text += `\n[${post.timeSlot}] ${post.concept}\n`;
                text += `Producto: ${post.productName}\n`;
                text += `COPY:\n${post.copyText}\n`;
                text += `HASHTAGS: ${post.hashtags.map(h => `#${h}`).join(' ')}\n`;
                text += `IMAGE PROMPT:\n${post.imagePrompt}\n`;
                text += '─'.repeat(40) + '\n';
            });
        });
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `calendario_${MONTH_NAMES[calendar.month]}_${calendar.year}.txt`;
        a.click();
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* ── API Key Warning ── */}
            {!GEMINI_KEY && (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                    <span className="text-amber-400 text-lg flex-shrink-0">⚠️</span>
                    <div>
                        <p className="text-sm text-amber-400 font-semibold">API Key de Gemini no configurada</p>
                        <p className="text-xs text-white/50 mt-0.5">
                            Añade <code className="bg-black/30 px-1 rounded text-amber-300">VITE_GOOGLE_GEN_AI_KEY=tu_clave</code> en el archivo <strong>.env.local</strong> y reinicia el servidor.
                        </p>
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-amber-400 underline mt-1 inline-block hover:text-amber-300"
                        >
                            Obtener API Key gratis en Google AI Studio →
                        </a>
                    </div>
                </div>
            )}

            {/* ── Header ── */}
            <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-serif text-gold flex items-center gap-3">
                            <CalendarDays size={24} />
                            Calendario de Contenido
                            <span className="text-sm font-sans text-white/40 font-normal">IA</span>
                        </h2>
                        <p className="text-white/50 text-sm mt-1">
                            Genera un plan de publicaciones para redes sociales basado en tu catálogo de productos.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {calendar && (
                            <button
                                onClick={exportCalendarText}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/70 rounded-xl border border-white/10 hover:border-gold/40 transition-all text-sm"
                            >
                                <Download size={16} />
                                Exportar
                            </button>
                        )}
                        {/* Month navigation */}
                        <div className="flex items-center gap-2 bg-black/30 rounded-xl border border-white/10 px-3 py-1.5">
                            <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }}
                                className="p-1 text-white/40 hover:text-white transition-colors">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-white text-sm font-medium w-28 text-center">
                                {MONTH_NAMES[viewMonth]} {viewYear}
                            </span>
                            <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }}
                                className="p-1 text-white/40 hover:text-white transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Generation Controls */}
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-white/50 whitespace-nowrap">Días a generar:</label>
                        <div className="flex gap-1.5">
                            {[7, 14, 31].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDaysToGenerate(d)}
                                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${daysToGenerate === d
                                        ? 'bg-gold/20 border-gold/50 text-gold'
                                        : 'border-white/10 text-white/40 hover:border-white/30'
                                        }`}
                                >
                                    {d === 31 ? 'Mes completo' : `${d} días`}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={generateCalendar}
                        disabled={generating || loadingProducts}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gold text-black font-bold rounded-xl hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                    >
                        {generating ? (
                            <><Loader2 size={18} className="animate-spin" />{generationStep || 'Generando...'}</>
                        ) : (
                            <><Sparkles size={18} />{calendar ? 'Regenerar Calendario' : 'Generar con IA'}</>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Content Area ── */}
            {!calendar && !generating ? (
                <div className="text-center py-24 bg-[#1A1A1A] rounded-2xl border border-white/5 border-dashed">
                    <CalendarDays size={56} className="text-white/10 mx-auto mb-4" />
                    <p className="text-white/30 text-lg">El calendario está vacío</p>
                    <p className="text-white/20 text-sm mt-1">
                        {loadingProducts
                            ? 'Cargando productos...'
                            : `${products.length} productos listos. Haz clic en "Generar con IA" para empezar.`}
                    </p>
                </div>
            ) : generating ? (
                <div className="text-center py-24 bg-[#1A1A1A] rounded-2xl border border-white/5">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="w-20 h-20 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
                        <Sparkles size={28} className="absolute inset-0 m-auto text-gold animate-pulse" />
                    </div>
                    <p className="text-white text-lg font-medium">{generationStep}</p>
                    <p className="text-white/40 text-sm mt-2">Esto puede tomar 20-40 segundos...</p>
                </div>
            ) : calendar && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left: Day List ── */}
                    <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
                                {calendar.days.length} días generados
                            </h3>
                            <span className="text-xs text-white/30">
                                {new Date(calendar.generatedAt).toLocaleDateString('es-CO')}
                            </span>
                        </div>
                        <div className="overflow-y-auto max-h-[70vh]">
                            {calendar.days.map(day => (
                                <button
                                    key={day.day}
                                    onClick={() => { setSelectedDay(day); setSelectedPost(null); setExpandedSlot(null); }}
                                    className={`w-full flex items-center gap-4 p-4 border-b border-white/5 text-left transition-all hover:bg-white/5 ${selectedDay?.day === day.day ? 'bg-gold/5 border-l-2 border-l-gold' : ''
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold ${selectedDay?.day === day.day ? 'bg-gold text-black' : 'bg-white/5 text-white/50'
                                        }`}>
                                        {day.day}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-white font-medium">
                                            {MONTH_NAMES[calendar.month].slice(0, 3)} {day.day}
                                        </p>
                                        <p className="text-xs text-white/30 truncate">
                                            {day.posts[0]?.concept || '–'}
                                        </p>
                                    </div>
                                    <span className="ml-auto text-xs text-white/20">{day.posts.length} posts</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Right: Day Detail ── */}
                    <div className="lg:col-span-2 space-y-4">
                        {!selectedDay ? (
                            <div className="text-center py-20 bg-[#1A1A1A] rounded-2xl border border-white/5 text-white/20">
                                <CalendarDays size={40} className="mx-auto mb-3" />
                                Selecciona un día para ver el contenido
                            </div>
                        ) : (
                            <>
                                <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-5">
                                    <h3 className="text-xl font-serif text-gold">
                                        {MONTH_NAMES[calendar.month]} {selectedDay.day}, {calendar.year}
                                    </h3>
                                    <p className="text-white/40 text-sm">{selectedDay.posts.length} publicaciones programadas</p>
                                </div>

                                {selectedDay.posts.map((post) => {
                                    const slot = TIME_SLOTS.find(s => s.key === post.timeSlot);
                                    const isExpanded = expandedSlot === post.timeSlot;

                                    return (
                                        <div
                                            key={post.timeSlot}
                                            className={`bg-[#1A1A1A] rounded-2xl border transition-all ${isExpanded ? 'border-gold/30' : 'border-white/5'}`}
                                        >
                                            {/* Post Header / Toggle */}
                                            <button
                                                onClick={() => setExpandedSlot(isExpanded ? null : post.timeSlot)}
                                                className="w-full flex items-center gap-4 p-5 text-left"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-black/30 border border-white/10 flex flex-col items-center justify-center flex-shrink-0">
                                                    <span className="text-xs text-gold font-mono font-bold leading-none">{post.timeSlot}</span>
                                                    <span className="text-[9px] text-white/30 mt-0.5">{slot?.emoji}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium">{post.concept}</p>
                                                    <p className="text-sm text-white/40 flex items-center gap-1.5 mt-0.5">
                                                        <Tag size={12} />
                                                        {post.productName}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 ml-2">
                                                    <span className="text-xs text-gold/60 bg-gold/10 px-2 py-1 rounded border border-gold/20 hidden sm:block">
                                                        {slot?.label}
                                                    </span>
                                                    {isExpanded
                                                        ? <ChevronUp size={18} className="text-gold" />
                                                        : <ChevronDown size={18} className="text-white/30" />
                                                    }
                                                </div>
                                            </button>

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">

                                                    {/* Copy Text */}
                                                    <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <FileText size={14} className="text-gold" />
                                                                <span className="text-xs uppercase tracking-widest text-gold/70 font-bold">Copy para Redes</span>
                                                            </div>
                                                            <button
                                                                onClick={() => copyToClipboard(post.copyText + '\n\n' + post.hashtags.map(h => `#${h}`).join(' '), 'Copy')}
                                                                className="flex items-center gap-1 text-xs text-white/30 hover:text-white transition-colors"
                                                            >
                                                                <Copy size={12} /> Copiar
                                                            </button>
                                                        </div>
                                                        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{post.copyText}</p>
                                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                                            {post.hashtags.map(h => (
                                                                <span key={h} className="text-[11px] text-gold/60 bg-gold/5 px-2 py-0.5 rounded border border-gold/10">
                                                                    #{h}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Image Prompt */}
                                                    <div className="bg-black/30 rounded-xl p-4 border border-gold/10">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <ImageIcon size={14} className="text-gold" />
                                                                <span className="text-xs uppercase tracking-widest text-gold/70 font-bold">Prompt Photo Studio</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => copyToClipboard(post.imagePrompt, 'Prompt')}
                                                                    className="flex items-center gap-1 text-xs text-white/30 hover:text-white transition-colors"
                                                                >
                                                                    <Copy size={12} /> Copiar
                                                                </button>
                                                                <button
                                                                    onClick={() => sendToPhotoStudio(post)}
                                                                    className="flex items-center gap-1.5 text-xs bg-gold/20 text-gold border border-gold/30 px-2.5 py-1 rounded-lg hover:bg-gold/30 transition-colors font-medium"
                                                                >
                                                                    <Wand2 size={12} />
                                                                    Enviar al Photo Studio
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="text-white/60 text-sm leading-relaxed italic">{post.imagePrompt}</p>
                                                    </div>

                                                    {/* Quick Instructions */}
                                                    <div className="bg-gold/5 border border-gold/20 rounded-xl p-4">
                                                        <p className="text-xs text-gold/70 font-semibold uppercase tracking-widest mb-2">📸 Instrucciones Photo Studio</p>
                                                        <ol className="text-xs text-white/50 space-y-1 list-decimal list-inside">
                                                            <li>Ve a <strong className="text-white/70">Photo Studio</strong> en el menú lateral</li>
                                                            <li>Busca y selecciona <strong className="text-white/70">{post.productName}</strong></li>
                                                            <li>Elige el estilo <strong className="text-white/70">"Personalizado"</strong> y pega el prompt de arriba</li>
                                                            <li>Ajusta la calidad y genera la imagen</li>
                                                            <li>Descarga y usa en la publicación con el copy de arriba</li>
                                                        </ol>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminContentCalendar;
