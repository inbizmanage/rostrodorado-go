import React, { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product, Category } from '../../types';
import AiAssistant from './AiAssistant';
import { Package, Plus, Edit, Trash2, X, Upload, ChevronRight, Settings, Image as ImageIcon, Sparkles } from 'lucide-react';
import { products as staticProducts } from '../../data/products';
import FileUpload from './FileUpload';
import { showToast } from '../ToastContainer';
import ConfirmModal from '../ConfirmModal';
import CategoryManagerModal from './CategoryManagerModal';
import CustomSelect from '../CustomSelect';

const AdminProducts: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedRoot, setSelectedRoot] = useState<string>('');
    const [selectedSub, setSelectedSub] = useState<string>('');
    const [selectedSubSub, setSelectedSubSub] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; productId: string | null }>({ show: false, productId: null });
    const [confirmMigrate, setConfirmMigrate] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        description: '',
        price: 0,
        image: '',
        category: '',
        longDescription: '',
        ingredients: [],
        usage: '',
        benefits: [],
        costPrice: 0,
        weight: 1, // Default 1kg
        dimensions: {
            width: 10,
            height: 10,
            length: 10
        }
    });
    const [weightUnit, setWeightUnit] = useState<'kg' | 'g'>('kg');

    // CSS to hide spin buttons
    const noSpinnerStyle = `
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
        }
        input[type=number] {
            -moz-appearance: textfield;
        }
    `;

    const STORAGE_KEY = 'admin_product_draft';

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    // Load draft on mount or when opening "New Product"
    useEffect(() => {
        if (isAdding && !editingProduct) {
            const savedDraft = localStorage.getItem(STORAGE_KEY);
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    setFormData(parsed.formData);
                    // Restore category selectors if saved
                    if (parsed.selectors) {
                        setSelectedRoot(parsed.selectors.root || '');
                        setSelectedSub(parsed.selectors.sub || '');
                        setSelectedSubSub(parsed.selectors.subSub || '');
                    }
                    console.log('📝 Borrador restaurado del almacenamiento local');
                } catch (e) {
                    console.error('Error parsing draft:', e);
                }
            }
        }
    }, [isAdding, editingProduct]);

    // Save draft when data changes (only for new products)
    useEffect(() => {
        if (isAdding && !editingProduct) {
            const draft = {
                formData,
                selectors: {
                    root: selectedRoot,
                    sub: selectedSub,
                    subSub: selectedSubSub
                }
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        }
    }, [formData, selectedRoot, selectedSub, selectedSubSub, isAdding, editingProduct]);

    const fetchCategories = async () => {
        try {
            const q = query(collection(db, 'categories'), orderBy('name'));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Category));
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchProducts = async () => {
        console.log('=== FETCHING PRODUCTS ===');

        // Create a timeout promise that rejects after 10 seconds (increased from 3s)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firestore timeout - connection too slow')), 10000)
        );

        try {
            console.log('Attempting to fetch from Firestore...');

            // Race between Firestore query and timeout
            const querySnapshot = await Promise.race([
                getDocs(collection(db, 'products')),
                timeoutPromise
            ]) as any;

            const productsData: Product[] = querySnapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            } as Product));

            console.log('✅ Firestore products loaded:', productsData.length);
            setProducts(productsData);
        } catch (error: any) {
            console.error("❌ Error fetching products from Firestore:", error.message);
            setProducts([]);
        } finally {
            setLoading(false);
            console.log('=== PRODUCTS LOADED ===');
        }
    };

    const migrateProducts = async () => {
        try {
            for (const product of staticProducts) {
                const { id, ...productData } = product;
                await addDoc(collection(db, 'products'), productData);
            }
            showToast('Productos migrados exitosamente', 'success');
            fetchProducts();
        } catch (error) {
            console.error("Error migrating products:", error);
            showToast('Error al migrar productos', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent double submission
        if (isSubmitting) return;
        setIsSubmitting(true);

        console.log('💾 Guardando producto con formData:', formData);
        console.log('🖼️ Campo image:', formData.image);

        // Timeout check for AdBlocker/Connection issues
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT_BLOCK')), 5000)
        );

        try {
            if (editingProduct) {
                await Promise.race([
                    updateDoc(doc(db, 'products', editingProduct.id), formData),
                    timeoutPromise
                ]);
                setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...formData } as Product : p));
                showToast('Producto actualizado exitosamente', 'success');
            } else {
                const docRef = await Promise.race([
                    addDoc(collection(db, 'products'), formData),
                    timeoutPromise
                ]) as any; // Cast as any because race returns unknown
                setProducts([...products, { id: docRef.id, ...formData } as Product]);
                showToast('Producto creado exitosamente', 'success');
            }
            resetForm(); // This resets state
            localStorage.removeItem(STORAGE_KEY); // Explicitly clear draft on success
        } catch (error: any) {
            console.error("Error saving product:", error);
            if (error.message === 'TIMEOUT_BLOCK' || error.code === 'unavailable') {
                showToast('Error de conexión: Desactiva el AdBlocker para guardar cambios', 'error');
            } else {
                showToast('Error al guardar el producto', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        setIsProcessing(true);

        // Timeout check for AdBlocker/Connection issues
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT_BLOCK')), 5000)
        );

        try {
            // Simulate network delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 1000));

            await Promise.race([
                deleteDoc(doc(db, 'products', id)),
                timeoutPromise
            ]);

            setProducts(products.filter(p => p.id !== id));
            showToast('Producto eliminado exitosamente', 'success');
            setConfirmDelete({ show: false, productId: null });
        } catch (error: any) {
            console.error("Error deleting product:", error);
            if (error.message === 'TIMEOUT_BLOCK' || error.code === 'unavailable') {
                showToast('Error: Base de datos bloqueada. Desactiva tu AdBlocker.', 'error');
            } else {
                showToast('Error al eliminar el producto', 'error');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const startEdit = (product: Product) => {
        setEditingProduct(product);
        // Ensure basePrice is populated. If it's a legacy product without basePrice, derive it from price.
        const effectiveBasePrice = product.basePrice !== undefined
            ? product.basePrice
            : Math.round(product.price * 0.968465 - 833);

        setFormData({ ...product, basePrice: effectiveBasePrice });
        // Auto-detect unit preference: if weight < 1 (e.g. 0.5kg), assume user prefers seeing 500g
        if (product.weight && product.weight < 1) {
            setWeightUnit('g');
        } else {
            setWeightUnit('kg');
        }

        // Try to reconstruct selectors from category path string if possible
        // Ideally we would need to search the tree, but for now we just load the form data
        // and let the user re-select if they want to change the category.
        // Or specific logic could be added here to parse "Category > Sub > Detail"
        // But for persistence task, we focus on New Product.

        setIsAdding(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: 0,
            image: '',
            category: '',
            longDescription: '',
            ingredients: [],
            usage: '',
            benefits: [],
            costPrice: 0,
            stock: 0,
            basePrice: 0,
            weight: 1,
            dimensions: { width: 10, height: 10, length: 10 },
            brand: 'Rostro Dorado' // Default brand
        });
        setSelectedRoot('');
        setSelectedSub('');
        setSelectedSubSub('');
        setEditingProduct(null);
        setWeightUnit('kg');
        setIsAdding(false);
        localStorage.removeItem(STORAGE_KEY); // Clear draft
    };

    if (loading) {
        return <div className="text-white/50">Cargando productos...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-serif text-white">Gestión de Productos</h2>
                <div className="flex gap-3">
                    {products.length === 0 && (
                        <button
                            onClick={() => setConfirmMigrate(true)}
                            className="bg-blue-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold hover:bg-blue-600 transition-colors"
                        >
                            <Upload size={18} /> Migrar Productos Iniciales
                        </button>
                    )}
                    <button
                        onClick={() => {
                            // Do not reset form here to allow persistence
                            setIsAdding(!isAdding);
                        }}
                        className="bg-gold text-black px-6 py-3 rounded-xl flex items-center gap-2 font-bold hover:bg-white transition-colors"
                    >
                        {isAdding ? <><X size={18} /> Cancelar</> : <><Plus size={18} /> Agregar Producto</>}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setIsAdding(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#111] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                    <h3 className="text-xl md:text-2xl text-white font-serif">
                                        {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                    </h3>
                                    <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setIsAiOpen(true)}
                                            className="flex-1 md:flex-none text-xs bg-gold/10 hover:bg-gold/20 text-gold px-4 py-2 rounded-lg flex justify-center items-center gap-2 transition-colors border border-gold/20 font-bold"
                                        >
                                            <Sparkles size={14} /> Redactar con Alex
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                resetForm();
                                                setIsAdding(false);
                                            }}
                                            className="text-white/50 hover:text-white transition-colors p-1"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-white/50">Nombre *</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 p-3 rounded-lg text-white focus:border-gold outline-none"
                                            placeholder="Ej: Sérum Hialurónico"
                                        />
                                    </div>

                                    <style>{noSpinnerStyle}</style>

                                    <style>{noSpinnerStyle}</style>

                                    {/* Brand Field */}
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-gold font-bold">Marca</label>
                                        <input
                                            type="text"
                                            value={formData.brand || ''}
                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 p-3 rounded-lg text-white focus:border-gold outline-none focus:bg-white/5 transition-colors"
                                            placeholder="Ej: Rostro Dorado"
                                        />
                                        <p className="text-[10px] text-white/40 h-8">Marca del producto (opcional)</p>
                                    </div>

                                    {/* Categories Section */}
                                    <div className="bg-white/5 border border-white/5 rounded-xl p-6 space-y-4">
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <label className="text-xs uppercase tracking-widest text-white/50">Categorización</label>
                                            <button
                                                type="button"
                                                onClick={() => setIsCategoryModalOpen(true)}
                                                className="text-[10px] bg-gold/10 hover:bg-gold/20 text-gold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border border-gold/20"
                                            >
                                                <Settings size={14} /> Gestionar Estructura
                                            </button>
                                        </div>

                                        {/* Category Hierarchy Selectors Grid */}
                                        <div className="grid md:grid-cols-3 gap-4 items-start">
                                            {/* Root Category */}
                                            <div className="space-y-1">
                                                <CustomSelect
                                                    label="Principal"
                                                    placeholder="Seleccionar..."
                                                    value={selectedRoot}
                                                    onChange={(val) => {
                                                        setSelectedRoot(val);
                                                        setSelectedSub('');
                                                        setSelectedSubSub('');
                                                        const cat = categories.find(c => c.id === val);
                                                        if (cat) setFormData({ ...formData, category: cat.name });
                                                    }}
                                                    options={categories
                                                        .filter(c => !c.parentId && c.level === 0)
                                                        .map(c => ({ value: c.id, label: c.name }))}
                                                />
                                            </div>

                                            {/* Sub Category */}
                                            <div className="space-y-1">
                                                <CustomSelect
                                                    label="Subcategoría"
                                                    placeholder={selectedRoot ? "Seleccionar..." : "-"}
                                                    value={selectedSub}
                                                    onChange={(val) => {
                                                        setSelectedSub(val);
                                                        setSelectedSubSub('');
                                                        const root = categories.find(c => c.id === selectedRoot);
                                                        const sub = categories.find(c => c.id === val);
                                                        if (root && sub) {
                                                            setFormData({ ...formData, category: `${root.name} > ${sub.name}` });
                                                        }
                                                    }}
                                                    options={categories
                                                        .filter(c => c.parentId === selectedRoot)
                                                        .map(c => ({ value: c.id, label: c.name }))}
                                                    disabled={!selectedRoot}
                                                />
                                            </div>

                                            {/* Sub-Sub Category */}
                                            <div className="space-y-1">
                                                <CustomSelect
                                                    label="Detalle"
                                                    placeholder={selectedSub ? "Seleccionar..." : "-"}
                                                    value={selectedSubSub}
                                                    onChange={(val) => {
                                                        setSelectedSubSub(val);
                                                        const root = categories.find(c => c.id === selectedRoot);
                                                        const sub = categories.find(c => c.id === selectedSub);
                                                        const subsub = categories.find(c => c.id === val);
                                                        if (root && sub && subsub) {
                                                            setFormData({ ...formData, category: `${root.name} > ${sub.name} > ${subsub.name}` });
                                                        }
                                                    }}
                                                    options={categories
                                                        .filter(c => c.parentId === selectedSub)
                                                        .map(c => ({ value: c.id, label: c.name }))}
                                                    disabled={!selectedSub}
                                                />
                                            </div>
                                        </div>

                                        {/* Helper Text shows current full path */}
                                        <div className="text-[10px] text-white/30 font-mono bg-black/20 p-2 rounded border border-white/5 flex items-center gap-2">
                                            <span className="uppercase text-white/20">Ruta Seleccionada:</span>
                                            <span className="text-gold">{formData.category || 'Sin categoría'}</span>
                                        </div>
                                    </div>

                                    {/* Prices Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-gold font-bold">Costo de Producción *</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                                                <input
                                                    required
                                                    type="number"
                                                    min="0"
                                                    value={formData.costPrice || ''}
                                                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                                                    className="w-full bg-black/20 border border-white/10 p-3 pl-8 rounded-lg text-white focus:border-gold outline-none focus:bg-white/5 transition-colors"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p className="text-[10px] text-white/40 h-8">Costo base del producto (interno)</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-gold font-bold">Stock Disponible *</label>
                                            <input
                                                required
                                                type="number"
                                                min="0"
                                                value={formData.stock || ''}
                                                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                                                className="w-full bg-black/20 border border-white/10 p-3 rounded-lg text-white focus:border-gold outline-none focus:bg-white/5 transition-colors"
                                                placeholder="0"
                                            />
                                            <p className="text-[10px] text-white/40 h-8">Unidades disponibles para venta</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-gold font-bold">Precio al Público (Base) *</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold">$</span>
                                                <input
                                                    required
                                                    type="number"
                                                    min="0"
                                                    value={formData.basePrice || ''}
                                                    onChange={(e) => {
                                                        const baseInput = Number(e.target.value);
                                                        // Calculate Final Price: (Base + Fixed) / (1 - Rate)
                                                        const finalPrice = Math.ceil((baseInput + 833) / 0.968465);

                                                        setFormData({
                                                            ...formData,
                                                            basePrice: baseInput,
                                                            price: baseInput > 0 ? finalPrice : 0
                                                        });
                                                    }}
                                                    className="w-full bg-gold/10 border border-gold/30 p-3 pl-8 rounded-lg text-gold focus:border-gold outline-none font-bold placeholder-gold/30 focus:bg-gold/20 transition-colors"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p className="text-[10px] text-gold/60 h-8">Valor que deseas recibir (antes de Wompi)</p>
                                        </div>
                                    </div>

                                    {/* Shipping Section */}
                                    <div className="bg-white/5 border border-white/5 rounded-xl p-6 space-y-4">
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <label className="text-xs uppercase tracking-widest text-white/50 flex items-center gap-2">
                                                <Package size={14} /> Configuración de Envío (MiPaquete)
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[10px] uppercase tracking-widest text-white/40">Peso</label>
                                                    <div className="flex bg-black/20 rounded border border-white/10 overflow-hidden">
                                                        <button
                                                            type="button"
                                                            onClick={() => setWeightUnit('kg')}
                                                            className={`text-[8px] px-1.5 py-0.5 ${weightUnit === 'kg' ? 'bg-gold text-black font-bold' : 'text-white/50 hover:text-white'}`}
                                                        >
                                                            KG
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setWeightUnit('g')}
                                                            className={`text-[8px] px-1.5 py-0.5 ${weightUnit === 'g' ? 'bg-gold text-black font-bold' : 'text-white/50 hover:text-white'}`}
                                                        >
                                                            G
                                                        </button>
                                                    </div>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step={weightUnit === 'kg' ? "0.01" : "1"}
                                                    value={formData.weight ? (weightUnit === 'kg' ? formData.weight : Math.round(formData.weight * 1000)) : ''}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setFormData({
                                                            ...formData,
                                                            weight: weightUnit === 'kg' ? val : val / 1000
                                                        })
                                                    }}
                                                    className="w-full bg-black/20 border border-white/10 p-2 rounded text-white text-sm focus:border-gold outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-widest text-white/40">Alto (cm)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={formData.dimensions?.height || ''}
                                                    onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions!, height: Number(e.target.value) } })}
                                                    className="w-full bg-black/20 border border-white/10 p-2 rounded text-white text-sm focus:border-gold outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-widest text-white/40">Ancho (cm)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={formData.dimensions?.width || ''}
                                                    onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions!, width: Number(e.target.value) } })}
                                                    className="w-full bg-black/20 border border-white/10 p-2 rounded text-white text-sm focus:border-gold outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-widest text-white/40">Largo (cm)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={formData.dimensions?.length || ''}
                                                    onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions!, length: Number(e.target.value) } })}
                                                    className="w-full bg-black/20 border border-white/10 p-2 rounded text-white text-sm focus:border-gold outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Calculated Fields Display */}
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-center mb-6">
                                            <label className="text-xs uppercase tracking-widest text-white/60 flex items-center gap-2">
                                                <Settings size={14} />
                                                Resultado Final
                                            </label>
                                            <span className="text-[10px] text-white/30 uppercase border border-white/10 px-2 py-1 rounded">Cálculo Automático</span>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4">
                                            {/* Final Public Price */}
                                            <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20 flex flex-col justify-between">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-[10px] text-green-400 uppercase tracking-wider">Precio Final</p>
                                                    <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">En Tienda</span>
                                                </div>
                                                <p className="text-2xl text-white font-mono font-bold">
                                                    ${formData.price ? formData.price.toLocaleString() : '0'}
                                                </p>
                                                <p className="text-[10px] text-white/30 mt-1">Lo que paga el cliente</p>
                                            </div>

                                            {/* Commission */}
                                            <div className="bg-white/5 p-4 rounded-lg border border-white/5 flex flex-col justify-between">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Recargo Wompi</p>
                                                    <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">Tarifa</span>
                                                </div>
                                                <p className="text-xl text-white/60 font-mono">
                                                    + ${formData.price ? Math.round(formData.price - (formData.price * 0.968465 - 833)).toLocaleString() : '0'}
                                                </p>
                                                <p className="text-[10px] text-white/20 mt-1">Se suma al precio base</p>
                                            </div>

                                            {/* Profit */}
                                            <div className="bg-gold/10 p-4 rounded-lg border border-gold/20 flex flex-col justify-between">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-[10px] text-gold/60 uppercase tracking-wider">Tu Ganancia</p>
                                                    <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded">Neto</span>
                                                </div>
                                                <p className="text-2xl text-gold font-bold">
                                                    ${formData.price ? Math.round((formData.price * 0.968465 - 833) - (formData.costPrice || 0)).toLocaleString() : '0'}
                                                </p>
                                                <p className="text-[10px] text-gold/40 mt-1">Precio Base - Costo</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-white/50">Imagen Principal *</label>
                                    <FileUpload
                                        value={formData.image || ''}
                                        onChange={(url) => {
                                            console.log('📥 AdminProducts recibió URL:', url);
                                            setFormData({ ...formData, image: url });
                                            console.log('✅ formData.image actualizado a:', url);
                                        }}
                                    />
                                </div>

                                {/* Media Gallery Section */}
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs uppercase tracking-widest text-gold font-bold flex items-center gap-2">
                                            <ImageIcon size={14} /> Galería Adicional
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newMedia = [...(formData.media || [])];
                                                newMedia.push({ type: 'image', url: '' });
                                                setFormData({ ...formData, media: newMedia });
                                            }}
                                            className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            + Agregar Item
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {formData.media?.map((item, index) => (
                                            <div key={index} className="bg-white/5 p-4 rounded-xl border border-white/10 relative group">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newMedia = formData.media?.filter((_, i) => i !== index);
                                                        setFormData({ ...formData, media: newMedia });
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500/20 text-red-500 p-1.5 rounded-lg hover:bg-red-500/30 transition-colors z-10"
                                                >
                                                    <Trash2 size={14} />
                                                </button>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] text-white/40 uppercase tracking-wider">Item {index + 1}</span>
                                                        <select
                                                            value={item.type}
                                                            onChange={(e) => {
                                                                const newMedia = [...(formData.media || [])];
                                                                newMedia[index].type = e.target.value as 'image' | 'video';
                                                                setFormData({ ...formData, media: newMedia });
                                                            }}
                                                            className="bg-black/40 text-xs text-white border border-white/10 rounded px-2 py-1 outline-none focus:border-gold"
                                                        >
                                                            <option value="image">Imagen</option>
                                                            <option value="video">Video</option>
                                                        </select>
                                                    </div>
                                                    <FileUpload
                                                        value={item.url}
                                                        accept={item.type === 'image' ? 'image/*' : 'video/*'}
                                                        onChange={(url) => {
                                                            const newMedia = [...(formData.media || [])];
                                                            newMedia[index].url = url;
                                                            setFormData({ ...formData, media: newMedia });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {(!formData.media || formData.media.length === 0) && (
                                            <p className="text-center text-white/20 text-xs py-4 italic">
                                                No hay items adicionales en la galería
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-white/50">Descripción Corta *</label>
                                    <textarea
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        className="w-full bg-black/20 border border-white/10 p-3 rounded-lg text-white focus:border-gold outline-none"
                                        placeholder="Descripción breve que aparece en las tarjetas de producto"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-white/50">Descripción Larga</label>
                                    <textarea
                                        value={formData.longDescription || ''}
                                        onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                                        rows={3}
                                        className="w-full bg-black/20 border border-white/10 p-3 rounded-lg text-white focus:border-gold outline-none"
                                        placeholder="Descripción detallada del producto"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-white/50">Ingredientes</label>
                                    <input
                                        value={formData.ingredients?.join(', ') || ''}
                                        onChange={(e) => setFormData({ ...formData, ingredients: e.target.value.split(',').map(i => i.trim()).filter(i => i) })}
                                        className="w-full bg-black/20 border border-white/10 p-3 rounded-lg text-white focus:border-gold outline-none"
                                        placeholder="Separados por comas: Ácido Hialurónico, Aloe Vera, Vitamina E"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-white/50">Modo de Uso</label>
                                    <textarea
                                        value={formData.usage || ''}
                                        onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                                        rows={2}
                                        className="w-full bg-black/20 border border-white/10 p-3 rounded-lg text-white focus:border-gold outline-none"
                                        placeholder="Instrucciones de uso del producto"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-white/50">Beneficios</label>
                                    <input
                                        value={formData.benefits?.join(', ') || ''}
                                        onChange={(e) => setFormData({ ...formData, benefits: e.target.value.split(',').map(b => b.trim()).filter(b => b) })}
                                        className="w-full bg-black/20 border border-white/10 p-3 rounded-lg text-white focus:border-gold outline-none"
                                        placeholder="Separados por comas: Hidratación intensa, Efecto relleno, Mejora textura"
                                    />
                                </div>

                                <div className="flex flex-col-reverse md:flex-row gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            resetForm();
                                            setIsAdding(false);
                                        }}
                                        className="w-full md:w-auto px-8 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-center"
                                    >
                                        Cancelar
                                    </button>

                                    {!editingProduct && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (window.confirm('¿Estás seguro de que quieres borrar todo el formulario?')) {
                                                    setFormData({
                                                        name: '',
                                                        description: '',
                                                        price: 0,
                                                        image: '',
                                                        category: '',
                                                        longDescription: '',
                                                        ingredients: [],
                                                        usage: '',
                                                        benefits: [],
                                                        costPrice: 0,
                                                        stock: 0,
                                                        brand: 'Rostro Dorado'
                                                    });
                                                    setSelectedRoot('');
                                                    setSelectedSub('');
                                                    setSelectedSubSub('');
                                                    localStorage.removeItem(STORAGE_KEY);
                                                }
                                            }}
                                            className="w-full md:w-auto px-4 py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors flex justify-center items-center"
                                            title="Borrar todo"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`w-full md:flex-1 font-bold uppercase tracking-widest px-8 py-3 rounded-xl transition-colors ${isSubmitting
                                            ? 'bg-white/20 text-white/50 cursor-not-allowed'
                                            : 'bg-gold text-black hover:bg-white'
                                            }`}
                                    >
                                        {isSubmitting ? 'Guardando...' : (editingProduct ? 'Actualizar' : 'Crear Producto')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group"
                    >
                        <div className="aspect-square overflow-hidden bg-white/5">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="p-4">
                            <h3 className="text-white font-bold mb-1">{product.name}</h3>
                            <p className="text-white/60 text-sm mb-2 line-clamp-2">{product.description}</p>
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-gold font-bold text-lg">${product.price.toLocaleString()}</p>
                                <span className={`text-xs px-2 py-1 rounded ${product.stock && product.stock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {product.stock && product.stock > 0 ? `${product.stock} un.` : 'Agotado'}
                                </span>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => startEdit(product)}
                                    className="flex-1 bg-blue-500/20 text-blue-500 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-500/30 transition-colors"
                                >
                                    <Edit size={16} /> Editar
                                </button>
                                <button
                                    onClick={() => setConfirmDelete({ show: true, productId: product.id })}
                                    className="flex-1 bg-red-500/20 text-red-500 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors"
                                >
                                    <Trash2 size={16} /> Eliminar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {products.length === 0 && !isAdding && (
                <div className="bg-white/5 border border-white/10 p-12 rounded-xl text-center">
                    <Package size={48} className="text-white/20 mx-auto mb-4" />
                    <p className="text-white/50">No hay productos registrados</p>
                </div>
            )}

            {/* Confirmation Modals */}
            <ConfirmModal
                isOpen={confirmDelete.show}
                title="Eliminar Producto"
                message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                type="danger"
                isLoading={isProcessing}
                onConfirm={() => {
                    if (confirmDelete.productId) {
                        handleDelete(confirmDelete.productId);
                    }
                }}
                onCancel={() => {
                    if (!isProcessing) {
                        setConfirmDelete({ show: false, productId: null });
                    }
                }}
            />

            <ConfirmModal
                isOpen={confirmMigrate}
                title="Migrar Productos"
                message="¿Deseas migrar los productos estáticos a Firestore? Esto agregará todos los productos del archivo data/products.ts a la base de datos."
                confirmText="Sí, migrar"
                cancelText="Cancelar"
                type="info"
                onConfirm={migrateProducts}
                onCancel={() => setConfirmMigrate(false)}
            />

            <CategoryManagerModal
                isOpen={isCategoryModalOpen}
                onClose={() => {
                    setIsCategoryModalOpen(false);
                    fetchCategories(); // Refresh categories when modal closes
                }}
            />

            {isAiOpen && (
                <AiAssistant
                    mode="product"
                    contextId={`product_${editingProduct?.id || 'new'}`}
                    onClose={() => setIsAiOpen(false)}
                    currentContext={{
                        title: formData.name,
                        content: formData.longDescription,
                        excerpt: formData.description
                    }}
                    onApplyContent={() => { }}
                    onApplyImage={() => { }}
                    onApplyProduct={(aiData) => {
                        console.log("Applying AI Data to Product:", aiData);

                        // 1. Basic Fields & Shipping
                        setFormData(prev => ({
                            ...prev,
                            name: aiData.name || prev.name,
                            description: aiData.description || prev.description,
                            longDescription: aiData.longDescription || prev.longDescription,
                            ingredients: aiData.ingredients || prev.ingredients,
                            usage: aiData.usage || prev.usage,
                            benefits: aiData.benefits || prev.benefits,
                            // AI returns weight in grams, we store in KG
                            weight: aiData.weight ? aiData.weight / 1000 : prev.weight,
                            dimensions: aiData.dimensions || prev.dimensions,
                            brand: aiData.brand || prev.brand // Apply AI Brand
                        }));

                        // 2. Category Matching Logic
                        if (aiData.categoryPath && Array.isArray(aiData.categoryPath)) {
                            console.group("🧠 AI Category Matching Debug");
                            console.log("Raw AI Path:", aiData.categoryPath);

                            const [rootName, subName, subSubName] = aiData.categoryPath;
                            // NEW: Improved normalization ignores accents (tildes) and case
                            const normalize = (s: string) => s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() || '';

                            // Debug: Log available root categories
                            const userRoots = categories.filter(c => c.level === 0).map(c => c.name);
                            console.log("Available Root Categories in DB:", userRoots);

                            let rId = '', fullPathStr = '';

                            // Find Root
                            const root = categories.find(c => normalize(c.name) === normalize(rootName) && c.level === 0);

                            if (root) {
                                console.log("✅ Match Root:", root.name);
                                rId = root.id;
                                setSelectedRoot(rId);
                                fullPathStr = root.name;

                                // Reset children
                                setSelectedSub('');
                                setSelectedSubSub('');

                                // Find Sub
                                if (subName) {
                                    const sub = categories.find(c => normalize(c.name) === normalize(subName) && c.parentId === rId);
                                    if (sub) {
                                        console.log("✅ Match Sub:", sub.name);
                                        setSelectedSub(sub.id);
                                        fullPathStr += ` > ${sub.name}`;

                                        // Find SubSub
                                        if (subSubName) {
                                            const subsub = categories.find(c => normalize(c.name) === normalize(subSubName) && c.parentId === sub.id);
                                            if (subsub) {
                                                console.log("✅ Match SubSub:", subsub.name);
                                                setSelectedSubSub(subsub.id);
                                                fullPathStr += ` > ${subsub.name}`;
                                            } else {
                                                console.warn("❌ Failed to match SubSub:", subSubName);
                                                console.log("Available SubSubs:", categories.filter(c => c.parentId === sub.id).map(c => c.name));
                                            }
                                        }
                                    } else {
                                        console.warn("❌ Failed to match Sub:", subName);
                                        console.log("Available Subs for Root:", categories.filter(c => c.parentId === rId).map(c => c.name));
                                    }
                                }
                            } else {
                                console.warn("❌ Failed to match Root:", rootName);
                            }

                            if (fullPathStr) {
                                setFormData(prev => ({ ...prev, category: fullPathStr }));
                            }
                            console.groupEnd();
                        }

                        // 3. Auto-adjust Weight Unit for UX
                        if (aiData.weight && aiData.weight < 1000) {
                            setWeightUnit('g');
                        } else {
                            setWeightUnit('kg');
                        }
                    }}
                    siteKnowledge={{
                        brand: "Rostro Dorado Clinic: Lujo, ciencia y resultados visibles.",
                        products: `
                            ESTRUCTURA DE CATEGORÍAS VÁLIDA (Usa estas para clasificar):
                            ${categories.filter(c => c.level === 0).map(root => {
                            const subs = categories.filter(s => s.parentId === root.id);
                            return `- ${root.name}\n${subs.map(s => {
                                const subsubs = categories.filter(ss => ss.parentId === s.id);
                                return `  * ${s.name} ${subsubs.length > 0 ? `[${subsubs.map(ss => ss.name).join(', ')}]` : ''}`;
                            }).join('\n')}`;
                        }).join('\n')}
                        `,
                        articles: ""
                    }}
                />
            )}
        </div>
    );
};

export default AdminProducts;
