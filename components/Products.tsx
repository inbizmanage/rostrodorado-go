import React, { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Star, Search } from 'lucide-react';
import { Product } from '../types';
import Loader from './Loader';
import { Link, useNavigate } from 'react-router-dom';
import { products as FALLBACK_PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { normalizeImageUrl } from '../utils/imageUrl';

interface ProductsProps {
    preview?: boolean;
}

const Products: React.FC<ProductsProps> = ({ preview = false }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { addToCart } = useCart();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        // 5-second timeout to prevent infinite loading if Firebase blocks or lags
        const timeoutId = setTimeout(() => {
            setLoading(false);
            console.warn('⚠️ Firebase loading timed out. Falling back.');
        }, 5000);

        try {
            const querySnapshot = await getDocs(collection(db, 'products'));
            clearTimeout(timeoutId);
            const productsData: Product[] = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                image: normalizeImageUrl((doc.data() as Product).image)
            } as Product));

            setProducts(productsData);
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('❌ Error cargando productos de Firebase:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    // Flag temporal para ocultar/mostrar productos en la página web
    const OCULTAR_PRODUCTOS = true;

    // Calculate unique categories from available products
    const availableProducts = OCULTAR_PRODUCTOS ? [] : products.filter(p => p.stock && p.stock > 0);

    // Get unique leaf categories and create a map to full category paths
    const categoryMap = availableProducts.reduce((acc, product) => {
        if (product.category) {
            const parts = product.category.split('>');
            const leaf = parts[parts.length - 1].trim();
            if (!acc[leaf]) {
                acc[leaf] = product.category;
            }
        }
        return acc;
    }, {} as Record<string, string>);

    const sortedLabels = Object.keys(categoryMap).sort();
    const categories = ['Todas', ...sortedLabels];

    const filteredProducts = availableProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesCategory = true;
        if (selectedCategory !== 'Todas') {
            const parts = p.category.split('>');
            const leaf = parts[parts.length - 1].trim();
            matchesCategory = leaf === selectedCategory;
        }

        return matchesSearch && matchesCategory;
    });
    const displayProducts = preview ? filteredProducts.slice(0, 4) : filteredProducts;

    const handleBuy = (e: React.MouseEvent, product: Product) => {
        e.stopPropagation(); // Prevent card click
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

    const handleCardClick = (id: string, name: string) => {
        const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        navigate(`/productos/${slugify(name)}/${id}`);
    };

    if (loading) {
        return (
            <section id="productos" className="bg-[#f9f8f6] py-24 relative overflow-hidden min-h-[60vh] flex items-center justify-center">
                <div className="container mx-auto px-6 text-center">
                    <Loader className="text-gold" size={120} />
                </div>
            </section>
        );
    }

    // Custom view if no products are available
    if (displayProducts.length === 0) {
        if (preview) {
            return null;
        } else {
            return (
                <section id="productos" className="bg-[#f9f8f6] py-24 relative overflow-hidden min-h-[60vh] flex items-center justify-center">
                    <div className="container mx-auto px-6 relative z-10 text-center max-w-2xl">
                        <h2 className="font-serif text-2xl md:text-3xl text-black mb-3">
                            {OCULTAR_PRODUCTOS ? 'Catálogo en Mantenimiento Temporal' : 'Catálogo en Preparación'}
                        </h2>
                        <p className="font-sans text-gray-500 text-sm font-light leading-relaxed mb-6">
                            {OCULTAR_PRODUCTOS 
                              ? 'Estamos actualizando nuestro inventario de productos. Por favor regresa más tarde para ver las novedades de Rostro Dorado Clinic.'
                              : 'Nuestra tienda virtual está preparándose para ofrecerte la mejor experiencia de compra. Muy pronto podrás ver y adquirir todos nuestros productos dermatológicos desde aquí.'
                            }
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-3 bg-transparent border border-black/20 hover:border-gold text-black hover:text-gold px-8 py-3 uppercase tracking-widest text-xs transition-all duration-300"
                        >
                            Volver al Inicio
                        </Link>
                    </div>
                </section>
            );
        }
    }

    return (
        <section id="productos" className="bg-[#f9f8f6] py-12 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-gold/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-gray-100 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-8">
                    <span className="inline-block py-0.5 px-2 border border-gold/50 rounded-full text-gold text-[10px] uppercase tracking-widest mb-2">
                        Tienda Exclusiva
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl text-black mb-3">
                        {preview ? 'Productos Destacados' : 'Catálogo Completo'}
                    </h2>
                    <p className="font-sans text-gray-500 max-w-2xl mx-auto font-light text-sm">
                        Complementa tus tratamientos con nuestra línea de productos de grado dermatológico.
                    </p>
                </div>

                {/* Banner: Envíos a toda Colombia */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="max-w-3xl mx-auto mb-12 p-6 bg-white/70 backdrop-blur-md border border-gold/20 rounded-2xl text-center shadow-[0_10px_30px_rgba(198,168,124,0.05)] relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-28 h-28 bg-gold/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gold/10 rounded-full blur-xl pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-1">
                            <ShoppingBag size={18} />
                        </div>
                        <h3 className="font-serif text-lg md:text-xl text-black tracking-wide">
                            Próximamente: Productos a toda Colombia
                        </h3>
                        <p className="font-sans text-gray-500 text-xs md:text-sm font-light leading-relaxed max-w-xl">
                            Llevamos la excelencia del cuidado de Rostro Dorado Clinic más allá de nuestras fronteras locales. Muy pronto podrás adquirir nuestra selección exclusiva de skincare dermatológico de grado médico con envíos seguros y rápidos a cualquier rincón del país.
                        </p>
                    </div>
                </motion.div>

                {/* Category Filter - Only show when NOT in preview mode */}
                {!preview && (
                    <div className="mb-10">
                        <div className="flex overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0 md:flex-wrap md:justify-center gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`whitespace-nowrap px-4 py-2 text-xs uppercase tracking-widest transition-all duration-300 relative group ${selectedCategory === cat
                                        ? 'text-black font-bold'
                                        : 'text-gray-400 hover:text-gold'
                                        }`}
                                >
                                    {cat}
                                    {/* Underline indicator */}
                                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px bg-gold transition-all duration-300 ${selectedCategory === cat ? 'w-full' : 'w-0 group-hover:w-full'
                                        }`}></span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Bar - Only show when NOT in preview mode or if preferred */}
                {!preview && (
                    <div className="max-w-md mx-auto mb-12 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all placeholder:text-gray-400 text-black"
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {displayProducts.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
                            onClick={() => handleCardClick(product.id, product.name)}
                            className="group bg-white border border-gray-100 hover:border-gold/50 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-lg cursor-pointer flex flex-col sm:flex-row h-auto sm:h-72"
                        >
                            {/* Image Container */}
                            <div className="h-64 sm:h-auto sm:w-2/5 relative shrink-0">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    loading="lazy"
                                    width="400"
                                    height="400"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    referrerPolicy="no-referrer"
                                />
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
                            </div>

                            <div className="p-6 md:p-8 flex flex-col flex-grow justify-center">

                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-serif text-lg sm:text-xl md:text-[22px] text-black group-hover:text-gold transition-colors leading-snug pr-4">
                                        {product.name}
                                    </h3>
                                </div>

                                <div className="flex text-gold text-[10px] gap-0.5 mb-4">
                                    <Star size={10} fill="currentColor" />
                                    <Star size={10} fill="currentColor" />
                                    <Star size={10} fill="currentColor" />
                                    <Star size={10} fill="currentColor" />
                                    <Star size={10} fill="currentColor" />
                                </div>

                                <p className="text-gray-500 text-xs md:text-[13px] mb-6 font-light leading-relaxed opacity-90 line-clamp-3">
                                    {product.description}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                    <span className="text-2xl font-serif text-black">
                                        ${product.price.toLocaleString()}
                                    </span>

                                    <button
                                        onClick={(e) => handleBuy(e, product)}
                                        className="flex items-center gap-3 text-xs uppercase tracking-widest text-black font-medium hover:text-gold transition-colors group/btn z-10"
                                    >
                                        Agregar
                                        <div className="bg-gray-100 p-2.5 rounded-full group-hover/btn:bg-gold group-hover/btn:text-black transition-all">
                                            <ShoppingBag size={18} />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* View All Button - Only in Preview Mode */}
                {preview && (
                    <div className="text-center mt-12">
                        <Link
                            to="/productos"
                            onClick={(e) => {
                                // Scroll to top when navigating
                                window.scrollTo(0, 0);
                            }}
                            className="inline-flex items-center gap-3 bg-transparent border border-black/20 hover:border-gold text-black hover:text-gold px-8 py-4 uppercase tracking-[0.2em] text-xs transition-all duration-300 group"
                        >
                            Ver Todos Los Productos
                            <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Products;
