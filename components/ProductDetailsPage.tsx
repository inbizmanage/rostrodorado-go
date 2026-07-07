import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { m as motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Star, Check, Play, ChevronDown, ChevronUp, Sparkles, Droplets, Info } from 'lucide-react';
import Navbar from './Layout/Navbar';
import Footer from './Layout/Footer';
import LegalModal from './LegalModal';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Loader from './Loader';

const ProductDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeMedia, setActiveMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);
    const [openSection, setOpenSection] = useState<string | null>('benefits');

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchProduct = async () => {
            if (!id) {
                navigate('/productos');
                return;
            }
            try {
                const docRef = doc(db, 'products', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Product;
                    setProduct(data);
                    setActiveMedia({ type: 'image', url: data.image });

                    // Meta Pixel: ViewContent
                    import('../utils/pixel').then(({ trackEvent }) => {
                        trackEvent('ViewContent', {
                            content_ids: [data.id],
                            content_name: data.name,
                            content_type: 'product',
                            currency: 'COP',
                            value: data.price
                        });
                    });

                } else {
                    navigate('/productos');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                navigate('/productos');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, navigate]);

    if (loading || !product) {
        return (
            <div className="min-h-screen bg-[#f9f8f6] flex items-center justify-center">
                <Loader className="text-gold" size={120} />
            </div>
        );
    }

    const handleBuy = () => {
        addToCart(product);
        // Meta Pixel: AddToCart
        import('../utils/pixel').then(({ trackEvent }) => {
            trackEvent('AddToCart', {
                content_ids: [product.id],
                content_name: product.name,
                content_type: 'product',
                currency: 'COP',
                value: product.price
            });
        });
    };

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    return (
        <div className="min-h-screen bg-[#f9f8f6] selection:bg-gold selection:text-white flex flex-col overflow-x-hidden">
            <Navbar />

            <main className="flex-grow pt-20">
                {/* Back Button - Sticky */}
                <div className="sticky top-[72px] z-30 bg-gradient-to-b from-[#f9f8f6] via-[#f9f8f6]/90 to-transparent pb-4 -mx-4 md:mx-0 px-4 md:px-0">
                    <div className="max-w-6xl mx-auto px-4">
                        <button
                            onClick={() => navigate('/productos')}
                            className="flex items-center gap-2 text-gray-400 hover:text-gold transition-colors text-xs uppercase tracking-widest py-3"
                        >
                            <ArrowLeft size={14} />
                            Catálogo
                        </button>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 pb-12">
                    {/* Main Product Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                        {/* Left: Image Gallery */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-5"
                        >

                            {/* Main Image */}
                            <div className="relative rounded-2xl overflow-hidden aspect-square bg-white border border-gray-100 shadow-sm">
                                {activeMedia?.type === 'video' ? (
                                    <video
                                        src={activeMedia.url}
                                        controls
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <img
                                        src={activeMedia?.url || product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                )}

                                {/* Stock Badge */}
                                {product.stock !== undefined && (
                                    <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${product.stock > 0
                                        ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                                        : 'bg-red-500/20 text-red-500 border border-red-500/30'
                                        }`}>
                                        {product.stock > 0 ? 'Disponible' : 'Agotado'}
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {product.media && product.media.length > 0 && (
                                <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                                    <button
                                        onClick={() => setActiveMedia({ type: 'image', url: product.image })}
                                        className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeMedia?.url === product.image
                                            ? 'border-gold shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                                            : 'border-gray-200 opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <img src={product.image} className="w-full h-full object-cover" />
                                    </button>
                                    {product.media.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveMedia(item)}
                                            className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeMedia?.url === item.url
                                                ? 'border-gold shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                                                : 'border-gray-200 opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            {item.type === 'video' ? (
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                    <Play size={18} className="text-gray-500" />
                                                </div>
                                            ) : (
                                                <img src={item.url} className="w-full h-full object-cover" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Detalles Técnicos */}
                            <div className="border border-border/50 rounded-lg overflow-hidden mt-6">
                                <button
                                    onClick={() => setOpenSection(openSection === 'specs' ? '' : 'specs')}
                                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Info className="w-5 h-5 text-gold" />
                                        <span className="text-black text-sm font-medium">Especificaciones Técnicas</span>
                                    </div>
                                    {openSection === 'specs' ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                                <AnimatePresence>
                                    {openSection === 'specs' && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: "auto" }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-4 border-t border-border/50 bg-white space-y-3">
                                                {product.weight && (
                                                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                                                        <span className="text-gray-600 font-medium">Peso (Envío)</span>
                                                        <span className="text-black font-semibold text-right">
                                                            {product.weight >= 1000
                                                                ? `${(product.weight / 1000).toFixed(2)} kg`
                                                                : `${product.weight} g`}
                                                        </span>
                                                    </div>
                                                )}
                                                {product.dimensions && (
                                                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                                                        <span className="text-gray-600 font-medium">Dimensiones</span>
                                                        <span className="text-black font-semibold text-right">
                                                            {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm
                                                        </span>
                                                    </div>
                                                )}
                                                {!product.weight && !product.dimensions && (
                                                    <p className="text-gray-500 italic text-center text-sm">Sin especificaciones registradas.</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Right: Product Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-7 space-y-4"
                        >
                            {/* Category Breadcrumb */}
                            <p className="text-gold/60 text-[10px] uppercase tracking-widest">
                                {product.category}
                            </p>

                            {/* Title & Rating */}
                            <div>
                                <h1 className="font-serif text-2xl md:text-3xl text-black leading-tight mb-2">
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-1 text-gold">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} fill="currentColor" />
                                    ))}
                                    <span className="text-gray-400 text-xs ml-1">(5.0)</span>
                                </div>
                            </div>

                            {/* Price Card */}
                            <div className="bg-white border border-gold/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Precio</p>
                                    <p className="text-3xl font-serif text-gold">${product.price.toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={handleBuy}
                                    disabled={!product.stock || product.stock <= 0}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all ${!product.stock || product.stock <= 0
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gold text-black hover:bg-white border border-gold hover:shadow-lg'
                                        }`}
                                >
                                    <ShoppingBag size={16} />
                                    {!product.stock || product.stock <= 0 ? 'Agotado' : 'Agregar'}
                                </button>
                            </div>

                            {/* Short Description */}
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {product.description}
                            </p>

                            {/* Accordion Sections */}
                            <div className="space-y-2 pt-2">
                                {/* Benefits Section */}
                                {product.benefits && product.benefits.length > 0 && (
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleSection('benefits')}
                                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Sparkles size={16} className="text-gold" />
                                                <span className="text-black text-sm font-medium">Beneficios</span>
                                            </div>
                                            <ChevronDown
                                                size={16}
                                                className={`text-gray-400 transition-transform ${openSection === 'benefits' ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        <AnimatePresence>
                                            {openSection === 'benefits' && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {product.benefits.map((benefit, i) => (
                                                            <div key={i} className="flex items-start gap-2 text-gray-600 text-xs">
                                                                <Check size={12} className="text-gold mt-0.5 shrink-0" />
                                                                <span>{benefit}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* Ingredients Section */}
                                {product.ingredients && product.ingredients.length > 0 && (
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleSection('ingredients')}
                                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Droplets size={16} className="text-gold" />
                                                <span className="text-black text-sm font-medium">Ingredientes Clave</span>
                                            </div>
                                            <ChevronDown
                                                size={16}
                                                className={`text-gray-400 transition-transform ${openSection === 'ingredients' ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        <AnimatePresence>
                                            {openSection === 'ingredients' && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4">
                                                        <p className="text-gray-600 text-xs leading-relaxed">
                                                            {product.ingredients.join('. ')}.
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* Usage Section */}
                                {product.usage && (
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleSection('usage')}
                                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Info size={16} className="text-gold" />
                                                <span className="text-black text-sm font-medium">Modo de Uso</span>
                                            </div>
                                            <ChevronDown
                                                size={16}
                                                className={`text-gray-400 transition-transform ${openSection === 'usage' ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        <AnimatePresence>
                                            {openSection === 'usage' && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4">
                                                        <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">
                                                            {product.usage}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* Long Description Section */}
                                {product.longDescription && (
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleSection('details')}
                                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Info size={16} className="text-gold" />
                                                <span className="text-black text-sm font-medium">Descripción Completa</span>
                                            </div>
                                            <ChevronDown
                                                size={16}
                                                className={`text-gray-400 transition-transform ${openSection === 'details' ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        <AnimatePresence>
                                            {openSection === 'details' && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4">
                                                        <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">
                                                            {product.longDescription}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />
            <LegalModal />
        </div>
    );
};

export default ProductDetailsPage;
