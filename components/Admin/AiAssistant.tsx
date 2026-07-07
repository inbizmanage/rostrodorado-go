import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Image as ImageIcon, Check, Bot, X, Trash2 } from 'lucide-react';
import { showToast } from '../ToastContainer';
import ConfirmModal from '../ConfirmModal';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';

interface AiAssistantProps {
    onApplyContent: (data: { title?: string; content?: string; excerpt?: string }) => void;
    onApplyImage: (url: string) => void;
    onClose: () => void;
    currentContext?: {
        title?: string;
        content?: string;
        excerpt?: string;
    };
    siteKnowledge?: {
        products: string;
        articles: string;
        brand: string;
    };
    contextId?: string;
    mode?: 'blog' | 'product' | 'form';
    onApplyProduct?: (data: any) => void;
    onApplyForm?: (data: any) => void;
}

// Initialize Gemini
// WARNING: In a production app, calls should go through a backend to hide the key.
const API_KEY = (import.meta.env as Record<string, string>).VITE_GOOGLE_GEN_AI_KEY || "AIzaSyDEGeQXpaXdBrcA7oZFO7rIrsEiO4KTmLU";
const genAI = new GoogleGenerativeAI(API_KEY);

const AiAssistant: React.FC<AiAssistantProps> = ({ onApplyContent, onApplyImage, onApplyProduct, onApplyForm, onClose, currentContext, siteKnowledge, contextId = 'default', mode = 'blog' }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'preview'>('chat');
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Persistence Key
    const storageKey = `alex_chat_${contextId}`;

    // Initialize state from LocalStorage or default
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>(() => {
        const saved = localStorage.getItem(`${storageKey}_msgs`);
        return saved ? JSON.parse(saved) : [{ role: 'model', content: 'Hola, soy Alex, tu asistente inteligente. ¿Qué deseas crear hoy?' }];
    });

    const [generatedDraft, setGeneratedDraft] = useState<any | null>(() => {
        const saved = localStorage.getItem(`${storageKey}_draft`);
        return saved ? JSON.parse(saved) : null;
    });

    // Save to LocalStorage on changes
    useEffect(() => {
        localStorage.setItem(`${storageKey}_msgs`, JSON.stringify(messages));
    }, [messages, storageKey]);

    useEffect(() => {
        if (generatedDraft) {
            localStorage.setItem(`${storageKey}_draft`, JSON.stringify(generatedDraft));
        } else {
            localStorage.removeItem(`${storageKey}_draft`);
        }
    }, [generatedDraft, storageKey]);

    const clearChat = () => {
        setShowClearConfirm(true);
    };

    const performClearChat = () => {
        setMessages([{ role: 'model', content: 'Conversación reiniciada. ¿En qué te ayudo ahora?' }]);
        setGeneratedDraft(null);
        localStorage.removeItem(`${storageKey}_msgs`);
        localStorage.removeItem(`${storageKey}_draft`);
        showToast("Memoria de Alex borrada", "success");
        setShowClearConfirm(false);
    };
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!prompt.trim()) return;

        const userMsg = prompt;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setPrompt('');
        setLoading(true);

        try {
            // Context injection for specific persona
            let systemContext = '';
            
            if (mode === 'blog') {
                systemContext = `
            Eres Alex, un experto editor de contenido para "Rostro Dorado Clinic", una clínica de medicina estética de alto nivel.
            Tu tono es profesional, elegante, empático y educativo.

            CONTEXTO ACTUAL DEL EDITOR (Lo que el usuario ya tiene escrito):
            Título: "${currentContext?.title || ''}"
            Resumen: "${currentContext?.excerpt || ''}"
            Contenido Actual (Fragmento): "${(currentContext?.content || '').substring(0, 1000)}..."
            
            BASE DE CONOCIMIENTO GLOBAL DE ROSTRO DORADO:
            [INFORMACIÓN DE MARCA]
            ${siteKnowledge?.brand || 'Clínica de medicina estética de alto nivel.'}
            
            [CATÁLOGO DE PRODUCTOS Y SERVICIOS]
            Usa esta información para recomendar productos específicos cuando sea relevante en el artículo (cross-selling sutil):
            ${siteKnowledge?.products || 'No hay información de productos disponible.'}
            
            [OTROS ARTÍCULOS PUBLICADOS]
            Usa esto para conectar temas o evitar repeticiones:
            ${siteKnowledge?.articles || ''}
            
            INSTRUCCIONES DE FORMATO HTML (CRÍTICO):
            Cuando generes contenido, DEBES usar clases de Tailwind inline para asegurar el espaciado y estilo, ya que el visualizador lo requiere.
            
            Usa EXACTAMENTE estas etiquetas y clases para asegurar limpieza y legibilidad:
            - Párrafos: <p class="mb-6 leading-relaxed">...</p>
            - Subtítulos (H2): <h2 class="text-3xl font-serif text-gold mt-10 mb-6 font-bold">...</h2>
            - Subtítulos menores (H3): <h3 class="text-xl font-serif mt-8 mb-4 font-bold">...</h3>
            - Negritas: <strong class="font-bold">...</strong>
            - Listas: <ul class="list-disc pl-6 mb-6 space-y-2">...</ul>
            - Elementos de lista: <li class="pl-2">...</li>
            - Citas: <blockquote class="border-l-4 border-gold pl-6 italic my-8 bg-gray-50/5 p-6 rounded-r-lg font-serif text-lg">...</blockquote>
            
            ESTRUCTURA DE ARTÍCULO DE REVISTA:
            - Introduce con un "Gancho" poderoso.
            - Usa subtítulos frecuentes (cada 2-3 párrafos).
            - Haz preguntas retóricas al lector.
            
            Si el usuario pide escribir un artículo, GENERA UN JSON con la siguiente estructura (sin markdown de código, solo el JSON):
            {
                "title": "Título atractivo y SEO",
                "excerpt": "Resumen corto y enganchador (max 150 caracteres)",
                "content": "<p class='mb-6 leading-relaxed'>Párrafo intro...</p><h2 class='text-3xl font-serif text-gold mt-10 mb-6'>Subtítulo Grande</h2><ul class='list-disc pl-6 mb-6 space-y-2'><li class='pl-2'>Beneficio 1</li></ul>"
            }
            
            Si es una conversación normal, responde texto plano amablemente, PERO usa Markdown (**negritas**, listados) para que sea fácil de leer.
            
            Si el usuario te dice "cambia el segundo párrafo" o hace referencia a lo que ya está escrito, USA EL CONTEXTO ACTUAL proporcionado arriba para entender a qué se refiere.
        `;
            } else if (mode === 'product') {
                systemContext = `
            Eres Alex, experto en productos dermocosméticos de lujo para "Rostro Dorado Clinic".
            Tu objetivo es crear descripciones de productos que vendan, eduquen y transmitan exclusividad.
            
            INSTRUCCIÓN CLAVE:
            El usuario te dará información básica de un producto. Tú debes generar TODO el contenido textual detallado.
            NO generes precios, ni stock, ni imágenes. Solo texto.
            
            ADEMÁS:
            1. CLASIFICACIÓN: Basado en la "ESTRUCTURA DE CATEGORÍAS VÁLIDA" que se te provee a continuación, elige la ruta más lógica (Principal > Sub > Detalle).
            
            [ESTRUCTURA DE CATEGORÍAS VÁLIDA]
            ${siteKnowledge?.products || 'No hay categorías definidas.'}

            2. ENVÍO: Estima el peso (gramos) y dimensiones (cm) lógicos para el tipo de producto (ej: un sérum es pequeño y ligero, un kit es grande).
            IMPORTANTE: El peso debe ser en GRAMOS ENTEROS (ej: 50 para 50g, 500 para 0.5kg). NO uses decimales para kilos.

            3. MARCA: Asegúrate de mencionar "Rostro Dorado" o "Rostro Dorado Clinic" en la Descripción Larga para reforzar el branding.

            Tu salida debe ser SIEMPRE un JSON con esta estructura exacta para autocompletar el formulario:
            {
                "name": "Nombre comercial y atrayente del producto",
                "brand": "Rostro Dorado (o la marca específica)",
                "description": "Descripción corta (1-2 frases) para tarjetas de producto.",
                "longDescription": "Descripción detallada y vendedora. Menciona 'Rostro Dorado'. Enfatiza resultados, lujo y ciencia.",
                "ingredients": ["Ingrediente 1", "Ingrediente 2", ...],
                "usage": "Instrucciones paso a paso de cómo usarlo.",
                "benefits": ["Beneficio clave 1", "Beneficio clave 2", ...],
                "categoryPath": ["Categoría Principal", "Subcategoría", "Detalle (Opcional)"],
                "weight": 50,
                "dimensions": { "height": 10, "width": 5, "length": 5 }
            }
            
            Si solo estás charlando, responde normal. Pero si detectas que el usuario pide crear o completar un producto, RESPONDE SOLO EL JSON.
        `;
            } else if (mode === 'form') {
                systemContext = `
            Eres Alex, un experto en diseño de encuestas clínicas y formularios de atención al paciente para "Rostro Dorado Clinic".
            Tu objetivo es generar la estructura JSON completa para formularios dinámicos según las intenciones del usuario (ej: "Crear una encuesta de satisfacción post-tratamiento de botox" o "Formulario de registro para nuevos pacientes en recepción").

            INSTRUCCIÓN CLAVE:
            El usuario te describirá qué tipo de información quiere recolectar de los pacientes.
            Debes generar el JSON que representa ese formulario.
            
            TIPOS DE CAMPO VÁLIDOS (type): 'text', 'textarea', 'email', 'phone', 'single_choice', 'multiple_choice', 'image'
            - Usa 'single_choice' para preguntas de SI/NO, o de seleccionar una sola opción.
            - Usa 'multiple_choice' para seleccionar varias opciones (ej: síntomas, áreas de interés).
            - Siempre incluye la propiedad 'required' (true o false) lógicamente. Un email de contacto suele ser opcional si el formulario de kiosko ya lo pide por defecto, pero síntomas médicos o consentimiento son true.

            Tu salida debe ser SIEMPRE un JSON con esta estructura exacta:
            {
                "title": "Título Oficial del Formulario",
                "description": "Breve instrucción para el paciente antes de llenar la encuesta.",
                "fields": [
                    {
                        "id": "generado_automaticamente_1",
                        "type": "single_choice",
                        "label": "¿Es tu primera visita a la clínica?",
                        "required": true,
                        "options": ["Sí, es mi primera vez", "No, ya soy paciente"],
                        "order": 0
                    },
                    {
                        "id": "generado_automaticamente_2",
                        "type": "multiple_choice",
                        "label": "¿En qué tratamientos estás interesado/a hoy? (Selecciona varios)",
                        "required": false,
                        "options": ["Armonización Facial", "Botox", "Limpieza Profunda", "Asesoría Dermocosmética", "Otro"],
                        "order": 1
                    },
                    {
                        "id": "generado_automaticamente_3",
                        "type": "textarea",
                        "label": "¿Tienes alguna alergia o condición médica relevante?",
                        "required": true,
                        "order": 2
                    }
                ]
            }
            
            Si solo estás charlando, responde texto normal. Pero si detectas que el usuario pide un formulario, RESPONDE SOLO EL JSON.
        `;
            }

            // Updated to use the user-requested Gemini 3.0 model
            const primaryModel = "gemini-3-flash-preview";
            const fallbackModel = "gemini-2.0-flash";

            const sendMsg = async (modelId: string) => {
                const modelConfig: any = { model: modelId };

                // Enable Google Search for Gemini 3.0 Flash
                if (modelId === "gemini-3-flash-preview") {
                    modelConfig.tools = [{ googleSearch: {} }];
                }

                const model = genAI.getGenerativeModel(modelConfig);
                const chatObj = model.startChat({
                    history: [
                        { role: "user", parts: [{ text: systemContext }] },
                        { role: "model", parts: [{ text: "Entendido. Soy Alex, listo para redactar contenido de excelencia para Rostro Dorado Clinic." }] }
                    ],
                });
                return await chatObj.sendMessage(userMsg);
            };

            let result;
            let currentModel = primaryModel;
            try {
                result = await sendMsg(currentModel);
            } catch (error: any) {
                console.warn(`Model ${currentModel} failed:`, error.message);
                if (error.message?.includes('404') || error.message?.includes('not found')) {
                    console.log(`Falling back to ${fallbackModel}`);
                    currentModel = fallbackModel;
                    result = await sendMsg(currentModel);
                } else {
                    throw error;
                }
            }

            const responseText = result.response.text();

            // Check if response tries to be a JSON draft
            let cleanResponse = responseText;
            try {
                // Try to extract JSON if wrapped in markdown blocks or just raw
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const jsonStr = jsonMatch[0];
                    const draftData = JSON.parse(jsonStr);
                    setGeneratedDraft(draftData);
                    cleanResponse = `¡He redactado una propuesta para "${draftData.title || draftData.name || 'tu solicitud'}"! Revisa el panel lateral. ¿Te gustaría ajustar algo?`;
                }
            } catch (e) {
                // Not JSON or failed parsing, just normal conversation
            }

            setMessages(prev => [...prev, { role: 'model', content: cleanResponse }]);

        } catch (error) {
            console.error(error);
            showToast("Error comunicando con Alex (Gemini)", "error");
            setMessages(prev => [...prev, { role: 'model', content: "Lo siento, tuve un problema de conexión. ¿Podrías intentarlo de nuevo?" }]);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!generatedDraft?.title) return;
        setLoading(true);
        try {
            // Use Gemini 3.0 Pro Image Preview for Image Generation
            const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });
            const contextForImage = `Title: ${generatedDraft.title}\nExcerpt: ${generatedDraft.excerpt}\nSubject: ${generatedDraft.content.substring(0, 300)}...`;
            const imagePrompt = `Create a sophisticated STILL LIFE photography composition (NO HUMAN FACES, NO PEOPLE) representing the following article context:
            ${contextForImage}
            
            SCENE DESCRIPTION:
            A clean, luxury white marble surface. Arrange high-end medical aesthetic tools (abstract, silver/gold instruments, glass vials, premium skincare packaging) RELEVANT TO THE ARTICLE TOPIC alongside delicate natural elements (white orchids, gold leaves, water droplets).
            
            LIGHTING & MOOD:
            Soft natural golden hour sunlight, gentle shadows, depth of field (bokeh). Clean, minimalist, trustworthy, spa-clinic atmosphere. Gold and White color palette. 8K resolution, commercial product photography.`;

            const result = await model.generateContent(imagePrompt);
            const response = await result.response;

            // Check for inline image data
            const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

            if (imagePart && imagePart.inlineData) {
                const base64Image = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

                // Pre-load
                const img = new Image();
                img.src = base64Image;
                img.onload = () => {
                    onApplyImage(base64Image);
                    // Also update local state so we can see it in valid preview!
                    setGeneratedDraft(prev => prev ? { ...prev, coverImage: base64Image } : null);
                    showToast("Imagen generada con Nano Banana", "success");
                    setLoading(false);
                };
            } else {
                console.warn("No image data in Nano response, checking for text fallback...");
                // If model returns no image, it might have refused or just chatted. Fallback.
                throw new Error("No image data received");
            }

        } catch (error) {
            console.error("Image Gen Error:", error);
            showToast("Usando banco de imágenes (IA falló)", "error");
            // Fallback to Unsplash if custom model fails
            const mockImage = `https://source.unsplash.com/random/1280x720/?${encodeURIComponent(generatedDraft.title.split(' ')[0])},medical,luxury`;
            onApplyImage(mockImage);
            setLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 md:bg-black/90 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
            <div className="bg-[#1a1a1a] rounded-none md:rounded-xl w-full max-w-5xl h-full md:h-[85vh] flex flex-col overflow-hidden shadow-2xl border-none md:border border-gold/20">
                {/* Header */}
                <div className="bg-[#111] p-4 flex justify-between items-center border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-tr from-gold to-yellow-200 rounded-lg text-black shadow-lg shadow-gold/20">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h2 className="font-serif text-xl font-bold text-white tracking-wide">ALEX <span className="text-xs font-sans font-normal text-white/30 ml-2 hidden sm:inline">{contextId === 'default' ? '(Nuevo)' : '(Editando)'}</span></h2>
                            <p className="text-[10px] text-white/50 uppercase tracking-widest font-sans">Asistente {mode === 'blog' ? 'Editorial' : 'Productos'}</p>
                        </div>
                    </div>

                    {/* Mobile Tabs */}
                    <div className="flex md:hidden bg-black/50 rounded-lg p-1 mx-2">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'chat' ? 'bg-gold text-black shadow-lg' : 'text-white/50 hover:text-white'}`}
                        >
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'preview' ? 'bg-gold text-black shadow-lg' : 'text-white/50 hover:text-white'}`}
                        >
                            Preview
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearChat}
                            className="p-2 rounded-full hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                            title="Borrar memoria"
                        >
                            <Trash2 size={20} />
                        </button>
                        <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors text-white/50 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                    {/* Chat Area */}
                    <div className={`w-full md:w-1/2 flex-col border-r border-white/5 bg-[#0f0f0f] ${activeTab === 'chat' ? 'flex' : 'hidden md:flex'}`}>
                        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 custom-scrollbar">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-white/10 text-white rounded-tr-sm'
                                        : 'bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 text-gray-200 rounded-tl-sm shadow-sm'
                                        }`}>
                                        {msg.role === 'model' && <span className="text-gold text-xs font-bold block mb-1">ALEX</span>}
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
                                                ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-4 mb-2" />,
                                                li: ({ node, ...props }) => <li {...props} className="mb-1" />,
                                                h1: ({ node, ...props }) => <h1 {...props} className="text-lg font-bold mb-2 text-gold" />,
                                                h2: ({ node, ...props }) => <h2 {...props} className="text-base font-bold mb-2 text-gold" />,
                                                strong: ({ node, ...props }) => <strong {...props} className="font-bold text-gold/90" />,
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>


                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2 text-gold text-sm">
                                        <Loader2 className="animate-spin" size={16} />
                                        <span>Alex está escribiendo...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-[#111] border-t border-white/5">
                            <div className="flex gap-2 relative">
                                <input
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={mode === 'blog' ? "Escribe sobre..." : "Describe el producto..."}
                                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 md:px-5 md:py-4 text-white placeholder:text-gray-600 focus:border-gold/50 outline-none transition-colors text-sm"
                                    disabled={loading}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={loading || !prompt.trim()}
                                    className="bg-gold text-black p-3 md:p-4 rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold/10"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview / Draft Area */}
                    <div className={`w-full md:w-1/2 flex-col bg-[#141414] p-4 md:p-8 overflow-y-auto custom-scrollbar relative ${activeTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
                        {generatedDraft ? (
                            <div className="space-y-8 animate-in slide-in-from-right duration-500">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gold mb-2">Vista Previa del Borrador</h3>
                                    <span className="text-green-500 text-xs flex items-center gap-1"><Sparkles size={12} /> Generado con IA</span>
                                </div>

                                {/* Preview Logic based on Mode */}
                                {mode === 'blog' ? (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 uppercase font-bold">Título Sugerido</label>
                                            <h2 className="text-2xl font-serif text-white leading-tight">{generatedDraft.title}</h2>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Imagen de Portada</label>
                                            <div className="w-full h-56 bg-black/50 rounded-lg flex flex-col items-center justify-center border border-white/10 relative overflow-hidden group">
                                                {generatedDraft.coverImage && (
                                                    <img
                                                        src={generatedDraft.coverImage}
                                                        alt="Portada generada"
                                                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-300"
                                                    />
                                                )}
                                                <button
                                                    onClick={handleGenerateImage}
                                                    className="z-10 bg-white/10 hover:bg-gold hover:text-black text-white backdrop-blur-md transition-all duration-300 px-6 py-3 rounded-full flex items-center gap-2 text-sm font-bold border border-white/20 hover:border-transparent cursor-pointer shadow-xl"
                                                >
                                                    <ImageIcon size={18} />
                                                    {loading ? 'Generando...' : (generatedDraft.coverImage ? 'Regenerar Imagen' : 'Sugerir Imagen')}
                                                </button>
                                                {!generatedDraft.coverImage && (
                                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 uppercase font-bold">Resumen SEO</label>
                                            <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-gray-400 text-sm leading-relaxed">
                                                {generatedDraft.excerpt}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 uppercase font-bold">Vista Previa del Contenido</label>
                                            <div
                                                className="prose prose-invert prose-sm max-w-none bg-black/20 p-6 rounded-lg border border-white/5"
                                                dangerouslySetInnerHTML={{ __html: generatedDraft.content }}
                                            />
                                        </div>
                                    </>
                                ) : mode === 'product' ? (
                                    // PRODUCT MODE PREVIEW
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 uppercase font-bold">Marca</label>
                                            <div className="text-gold font-serif">{generatedDraft.brand || 'Rostro Dorado'}</div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 uppercase font-bold">Nombre del Producto</label>
                                            <h2 className="text-2xl font-serif text-white leading-tight">{generatedDraft.name}</h2>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 uppercase font-bold">Descripción Corta</label>
                                            <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-gray-400 text-sm">
                                                {generatedDraft.description}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 uppercase font-bold">Descripción Larga</label>
                                            <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-gray-300 text-sm whitespace-pre-wrap">
                                                {generatedDraft.longDescription}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 uppercase font-bold">Categoría Sugerida</label>
                                            <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-sm text-gold">
                                                {generatedDraft.categoryPath?.join(' > ') || 'Sin categoría'}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 uppercase font-bold">Datos de Envío (Estimados)</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                                    <span className="text-xs text-gray-500 block">Peso</span>
                                                    <span className="text-white font-mono">{generatedDraft.weight} g</span>
                                                </div>
                                                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                                    <span className="text-xs text-gray-500 block">Dimensiones (Al/An/Lar)</span>
                                                    <span className="text-white font-mono">
                                                        {generatedDraft.dimensions?.height}x{generatedDraft.dimensions?.width}x{generatedDraft.dimensions?.length} cm
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 uppercase font-bold">Ingredientes</label>
                                            <div className="flex flex-wrap gap-2">
                                                {generatedDraft.ingredients?.map((ing: string, i: number) => (
                                                    <span key={i} className="bg-white/10 text-white/70 text-xs px-2 py-1 rounded-md">{ing}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 uppercase font-bold">Beneficios</label>
                                            <ul className="list-disc list-inside text-sm text-gold/80">
                                                {generatedDraft.benefits?.map((ben: string, i: number) => (
                                                    <li key={i}>{ben}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </>
                                ) : mode === 'form' ? (
                                    // FORM MODE PREVIEW
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 uppercase font-bold">Título del Formulario</label>
                                            <h2 className="text-2xl font-serif text-white leading-tight">{generatedDraft.title}</h2>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 uppercase font-bold">Descripción</label>
                                            <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-gray-400 text-sm">
                                                {generatedDraft.description}
                                            </div>
                                        </div>

                                        <div className="space-y-4 mt-6">
                                            <label className="text-xs text-gray-500 uppercase font-bold flex items-center justify-between">
                                                <span>Estructura de Preguntas</span>
                                                <span className="bg-gold/20 text-gold px-2 py-0.5 rounded-full">{generatedDraft.fields?.length || 0} campos</span>
                                            </label>
                                            
                                            <div className="space-y-3">
                                                {generatedDraft.fields?.map((field: any, idx: number) => (
                                                    <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-white font-medium pr-8">{field.label}</span>
                                                            {field.required && <span className="text-red-400 text-lg absolute right-4 top-4">*</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className="text-[10px] uppercase tracking-widest bg-black/50 text-white/50 px-2 py-1 rounded">
                                                                {field.type}
                                                            </span>
                                                        </div>
                                                        
                                                        {(field.type === 'single_choice' || field.type === 'multiple_choice') && field.options && (
                                                            <div className="mt-2 pl-3 border-l-2 border-white/10 space-y-1">
                                                                {field.options.map((opt: string, optIdx: number) => (
                                                                    <div key={optIdx} className="text-sm text-white/60 flex items-center gap-2">
                                                                        <div className={`w-3 h-3 border border-white/30 ${field.type === 'single_choice' ? 'rounded-full' : 'rounded'}`}></div>
                                                                        {opt}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : null}

                                {/* Main Action Button */}
                                <div className="sticky bottom-0 pt-4 pb-2 bg-[#141414]/95 backdrop-blur-sm border-t border-white/10">
                                    <button
                                        onClick={() => {
                                            if (mode === 'blog') {
                                                onApplyContent(generatedDraft);
                                            } else if (mode === 'product') {
                                                if (onApplyProduct) onApplyProduct(generatedDraft);
                                            } else if (mode === 'form') {
                                                if (onApplyForm) onApplyForm(generatedDraft);
                                            }
                                            showToast(mode === 'blog' ? "Borrador de blog aplicado" : mode === 'form' ? "Estructura de formulario aplicada" : "Datos de producto aplicados", "success");
                                            onClose();
                                        }}
                                        className="w-full bg-gold text-black font-bold py-4 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 transform hover:scale-[1.02] shadow-lg shadow-gold/20"
                                    >
                                        <Check size={20} /> APLICAR DATOS
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-white/20 text-center select-none">
                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                                    <Sparkles size={40} className="text-gold/50" />
                                </div>
                                <h3 className="text-xl font-serif text-white/40 mb-2">Alex está esperando</h3>
                                <p className="text-sm max-w-xs mx-auto">
                                    {mode === 'blog'
                                        ? "Cuéntale tu idea, tema o palabras clave en el chat para comenzar a redactar."
                                        : "Pega la info del producto o descríbelo brevemente, y Alex generará los textos de venta."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showClearConfirm}
                title="¿Borrar Conversación?"
                message="Se perderá todo el historial de chat con Alex para este contexto. Esto no se puede deshacer."
                confirmText="Sí, borrar todo"
                cancelText="Cancelar"
                type="warning"
                onConfirm={performClearChat}
                onCancel={() => setShowClearConfirm(false)}
            />
        </div>
    );
};

export default AiAssistant;
