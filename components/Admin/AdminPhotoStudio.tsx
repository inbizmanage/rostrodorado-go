import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product } from '../../types';
import {
    Sparkles, Download, Copy, RefreshCw, ChevronLeft, ChevronRight,
    ImageIcon, Loader2, Wand2, X, CheckCircle, AlertCircle, Camera
} from 'lucide-react';
import { showToast } from '../ToastContainer';

const WAVESPEED_API_KEY = import.meta.env.VITE_WAVESPEED_API_KEY;
const WAVESPEED_BASE = 'https://api.wavespeed.ai/api/v3';

// --- Prompt Templates ---
const PROMPT_TEMPLATES = [
    {
        label: 'Editorial de Lujo',
        icon: '✨',
        prompt: 'A high-end luxury editorial product photo, soft studio lighting with a gradient cream background, elegant and minimal. The product is perfectly centered with cinematic depth of field, professional beauty photography.',
    },
    {
        label: 'Estilo Clínico',
        icon: '🏥',
        prompt: 'Clinical aesthetic, clean white background, professional medical product photography, sharp focus, neutral and trustworthy tones, minimalist lab setting.',
    },
    {
        label: 'Lifestyle Natural',
        icon: '🌿',
        prompt: 'Organic lifestyle flat lay, surrounded by soft botanicals and dried flowers, warm afternoon golden light, linen surface, natural beauty brand aesthetic.',
    },
    {
        label: 'Dark Luxury',
        icon: '🖤',
        prompt: 'Dark luxury product photography, deep charcoal and gold background, dramatic chiaroscuro lighting, premium cosmetics editorial, moody and sophisticated.',
    },
    {
        label: 'Instagram Ready',
        icon: '📱',
        prompt: 'Vibrant social media product shot, pastel pink marble background, trendy beauty aesthetics, bright and airy, perfect for Instagram.',
    },
    {
        label: 'Personalizado',
        icon: '✏️',
        prompt: '',
    },
];

type GeneratedImage = {
    id: string;
    url: string;
    prompt: string;
    productName: string;
    timestamp: number;
};

const AdminPhotoStudio: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState(0);
    const [customPrompt, setCustomPrompt] = useState('');
    const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
    const [resolution, setResolution] = useState<'1k' | '2k'>('1k');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState<string>('');
    const [history, setHistory] = useState<GeneratedImage[]>([]);
    const [activeResult, setActiveResult] = useState<GeneratedImage | null>(null);
    const [productSearch, setProductSearch] = useState('');
    const [calendarPromptBanner, setCalendarPromptBanner] = useState<{prompt: string; productName: string} | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        fetchProducts();
        const saved = localStorage.getItem('rd_photo_studio_history');
        if (saved) setHistory(JSON.parse(saved));

        // Check for pending prompt from Content Calendar
        const pending = localStorage.getItem('rd_photo_studio_pending_prompt');
        if (pending) {
            try {
                const data = JSON.parse(pending);
                setCalendarPromptBanner(data);
                setCustomPrompt(data.prompt);
                setSelectedTemplate(PROMPT_TEMPLATES.length - 1); // Switch to custom
                localStorage.removeItem('rd_photo_studio_pending_prompt');
            } catch {}
        }
    }, []);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const snap = await getDocs(query(collection(db, 'products'), orderBy('name')));
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
            setProducts(data);
        } catch (err) {
            console.error(err);
            showToast('Error al cargar productos', 'error');
        } finally {
            setLoadingProducts(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(productSearch.toLowerCase())
    );

    const getActivePrompt = () => {
        if (selectedTemplate === PROMPT_TEMPLATES.length - 1) return customPrompt;
        return PROMPT_TEMPLATES[selectedTemplate].prompt;
    };

    const pollResult = async (requestId: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const max = 60; // max 60 * 2s = 2 minutes

            pollRef.current = setInterval(async () => {
                attempts++;
                if (attempts > max) {
                    clearInterval(pollRef.current!);
                    reject(new Error('Timeout esperando resultado'));
                    return;
                }

                try {
                    const res = await fetch(`${WAVESPEED_BASE}/predictions/${requestId}`, {
                        headers: { Authorization: `Bearer ${WAVESPEED_API_KEY}` },
                    });
                    const data = await res.json();

                    if (data.data?.status === 'completed') {
                        clearInterval(pollRef.current!);
                        const output = data.data?.outputs?.[0];
                        if (output) resolve(output);
                        else reject(new Error('No se recibió imagen en el resultado'));
                    } else if (data.data?.status === 'failed') {
                        clearInterval(pollRef.current!);
                        reject(new Error(data.data?.error || 'La generación falló'));
                    } else {
                        setGenerationStatus(
                            data.data?.status === 'processing'
                                ? '⚙️ Procesando con IA...'
                                : '⏳ En cola...'
                        );
                    }
                } catch (e) {
                    clearInterval(pollRef.current!);
                    reject(e);
                }
            }, 2000);
        });
    };

    const handleGenerate = async () => {
        if (!selectedImageUrl) {
            showToast('Selecciona un producto primero', 'error');
            return;
        }
        const prompt = getActivePrompt();
        if (!prompt.trim()) {
            showToast('Escribe o elige un estilo primero', 'error');
            return;
        }
        if (!WAVESPEED_API_KEY || WAVESPEED_API_KEY === 'your_api_key_here') {
            showToast('Configura VITE_WAVESPEED_API_KEY en .env.local', 'error');
            return;
        }

        setIsGenerating(true);
        setGenerationStatus('🚀 Enviando imagen...');
        setActiveResult(null);

        try {
            // 1. Submit generation request
            const submitRes = await fetch(`${WAVESPEED_BASE}/openai/gpt-image-2/edit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${WAVESPEED_API_KEY}`,
                },
                body: JSON.stringify({
                    enable_base64_output: false,
                    enable_sync_mode: false,
                    images: [selectedImageUrl],
                    prompt,
                    quality,
                    resolution,
                    output_format: 'png',
                }),
            });

            const submitData = await submitRes.json();
            const requestId = submitData?.data?.id || submitData?.id;
            if (!requestId) throw new Error('No se recibió ID de solicitud');

            setGenerationStatus('⏳ En cola...');

            // 2. Poll for result
            const resultUrl = await pollResult(requestId);

            // 3. Save to history
            const generated: GeneratedImage = {
                id: requestId,
                url: resultUrl,
                prompt,
                productName: selectedProduct?.name || '',
                timestamp: Date.now(),
            };
            const newHistory = [generated, ...history].slice(0, 20); // keep last 20
            setHistory(newHistory);
            localStorage.setItem('rd_photo_studio_history', JSON.stringify(newHistory));
            setActiveResult(generated);
            showToast('¡Imagen generada con éxito!', 'success');
        } catch (err: any) {
            console.error(err);
            showToast(err.message || 'Error al generar imagen', 'error');
        } finally {
            setIsGenerating(false);
            setGenerationStatus('');
        }
    };

    const handleDownload = async (url: string, name: string) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${name.replace(/\s+/g, '_')}_ai_edit.png`;
            a.click();
        } catch {
            window.open(url, '_blank');
        }
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        showToast('URL copiada al portapapeles', 'success');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-serif text-gold flex items-center gap-3">
                        <Camera size={24} />
                        Photo Studio <span className="text-sm font-sans text-white/40 font-normal ml-1">powered by GPT-Image-2</span>
                    </h2>
                    <p className="text-white/50 text-sm mt-1">Edita y regenera las fotos de tus productos con IA.</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30">
                    <span className="bg-gold/10 text-gold px-2 py-1 rounded border border-gold/20">WaveSpeed API</span>
                    <span className="bg-white/5 px-2 py-1 rounded">OpenAI GPT-Image-2</span>
                </div>
            </div>

            {/* Calendar Prompt Banner */}
            {calendarPromptBanner && (
                <div className="flex items-start gap-3 bg-gold/10 border border-gold/30 rounded-2xl p-4">
                    <Wand2 size={18} className="text-gold flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gold font-semibold">Prompt del Calendario de Contenido cargado</p>
                        <p className="text-xs text-white/50 mt-0.5 truncate">Producto sugerido: <strong className="text-white/70">{calendarPromptBanner.productName}</strong></p>
                        <p className="text-xs text-white/40 mt-1 line-clamp-2 italic">{calendarPromptBanner.prompt.slice(0, 100)}...</p>
                    </div>
                    <button onClick={() => setCalendarPromptBanner(null)} className="text-white/30 hover:text-white transition-colors flex-shrink-0">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Product Picker */}
                <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest">1. Elige un Producto</h3>
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50"
                    />
                    <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                        {loadingProducts ? (
                            <div className="text-center py-8"><Loader2 size={24} className="animate-spin text-gold mx-auto" /></div>
                        ) : filteredProducts.length === 0 ? (
                            <p className="text-white/30 text-sm text-center py-8">Sin resultados</p>
                        ) : (
                            filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => {
                                        setSelectedProduct(product);
                                        setSelectedImageUrl(product.image || '');
                                        setActiveResult(null);
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                        selectedProduct?.id === product.id
                                            ? 'border-gold/50 bg-gold/5'
                                            : 'border-white/5 bg-black/20 hover:border-white/20'
                                    }`}
                                >
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-white/5"
                                            onError={e => (e.currentTarget.style.display = 'none')}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                            <ImageIcon size={16} className="text-white/20" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm text-white truncate">{product.name}</p>
                                        <p className="text-xs text-white/30 truncate">{product.category}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* CENTER: Controls */}
                <div className="space-y-4">
                    {/* Selected Product Preview */}
                    <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-5">
                        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-4">2. Imagen Base</h3>
                        {selectedProduct ? (
                            <div className="space-y-3">
                                {/* Main image */}
                                <div className="relative aspect-square rounded-xl overflow-hidden bg-black/30 border border-white/10">
                                    {selectedImageUrl ? (
                                        <img
                                            src={selectedImageUrl}
                                            alt={selectedProduct.name}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20">
                                            <ImageIcon size={40} />
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-white font-medium text-center">{selectedProduct.name}</p>
                            </div>
                        ) : (
                            <div className="aspect-square rounded-xl bg-black/20 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-white/20">
                                <ImageIcon size={40} className="mb-2" />
                                <p className="text-sm">Elige un producto</p>
                            </div>
                        )}
                    </div>

                    {/* Style / Prompt */}
                    <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest">3. Estilo</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {PROMPT_TEMPLATES.map((t, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedTemplate(i)}
                                    className={`p-2 rounded-xl border text-xs transition-all flex flex-col items-center gap-1 ${
                                        selectedTemplate === i
                                            ? 'border-gold/60 bg-gold/10 text-gold'
                                            : 'border-white/5 bg-black/20 text-white/50 hover:border-white/20'
                                    }`}
                                >
                                    <span className="text-lg">{t.icon}</span>
                                    <span className="text-center leading-tight">{t.label}</span>
                                </button>
                            ))}
                        </div>
                        {selectedTemplate === PROMPT_TEMPLATES.length - 1 ? (
                            <textarea
                                value={customPrompt}
                                onChange={e => setCustomPrompt(e.target.value)}
                                placeholder="Describe el estilo que quieres lograr..."
                                rows={4}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 resize-none"
                            />
                        ) : (
                            <p className="text-xs text-white/30 bg-black/20 rounded-xl p-3 leading-relaxed">
                                {PROMPT_TEMPLATES[selectedTemplate].prompt}
                            </p>
                        )}
                    </div>

                    {/* Quality / Resolution */}
                    <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest">4. Calidad</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-white/40 mb-2 block">Calidad</label>
                                <div className="flex gap-1">
                                    {(['low', 'medium', 'high'] as const).map(q => (
                                        <button
                                            key={q}
                                            onClick={() => setQuality(q)}
                                            className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                                                quality === q
                                                    ? 'border-gold/60 bg-gold/10 text-gold'
                                                    : 'border-white/5 text-white/40 hover:border-white/20'
                                            }`}
                                        >
                                            {q === 'low' ? 'Bajo' : q === 'medium' ? 'Medio' : 'Alto'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-white/40 mb-2 block">Resolución</label>
                                <div className="flex gap-1">
                                    {(['1k', '2k'] as const).map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setResolution(r)}
                                            className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                                                resolution === r
                                                    ? 'border-gold/60 bg-gold/10 text-gold'
                                                    : 'border-white/5 text-white/40 hover:border-white/20'
                                            }`}
                                        >
                                            {r.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Generate CTA */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !selectedImageUrl}
                        className="w-full py-4 bg-gold text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-base"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                {generationStatus || 'Generando...'}
                            </>
                        ) : (
                            <>
                                <Wand2 size={20} />
                                Generar con IA
                            </>
                        )}
                    </button>
                </div>

                {/* RIGHT: Result + History */}
                <div className="space-y-4">
                    {/* Active Result */}
                    <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-5">
                        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-4">Resultado</h3>
                        {activeResult ? (
                            <div className="space-y-3">
                                <div className="relative rounded-xl overflow-hidden bg-black/30 border border-white/10">
                                    <img
                                        src={activeResult.url}
                                        alt="Resultado AI"
                                        className="w-full object-contain"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <button
                                            onClick={() => handleDownload(activeResult.url, activeResult.productName)}
                                            className="p-2 bg-black/70 backdrop-blur-sm text-white rounded-lg hover:bg-gold hover:text-black transition-all"
                                            title="Descargar"
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleCopyUrl(activeResult.url)}
                                            className="p-2 bg-black/70 backdrop-blur-sm text-white rounded-lg hover:bg-gold hover:text-black transition-all"
                                            title="Copiar URL"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-white/30 italic line-clamp-2">{activeResult.prompt}</p>
                                <p className="text-xs text-white/50">{activeResult.productName} · {new Date(activeResult.timestamp).toLocaleTimeString('es-CO')}</p>
                            </div>
                        ) : isGenerating ? (
                            <div className="aspect-square rounded-xl bg-black/20 border border-white/10 flex flex-col items-center justify-center gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
                                    <Sparkles size={24} className="absolute inset-0 m-auto text-gold animate-pulse" />
                                </div>
                                <p className="text-white/50 text-sm">{generationStatus}</p>
                            </div>
                        ) : (
                            <div className="aspect-square rounded-xl bg-black/20 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-white/20">
                                <Wand2 size={40} className="mb-2" />
                                <p className="text-sm">La imagen generada aparecerá aquí</p>
                            </div>
                        )}
                    </div>

                    {/* History */}
                    {history.length > 0 && (
                        <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest">Historial</h3>
                                <button
                                    onClick={() => {
                                        setHistory([]);
                                        localStorage.removeItem('rd_photo_studio_history');
                                    }}
                                    className="text-xs text-white/20 hover:text-red-400 transition-colors"
                                >
                                    Limpiar
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                {history.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveResult(item)}
                                        className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                                            activeResult?.id === item.id
                                                ? 'border-gold'
                                                : 'border-white/10 hover:border-white/30'
                                        }`}
                                    >
                                        <img
                                            src={item.url}
                                            alt="historia"
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPhotoStudio;
