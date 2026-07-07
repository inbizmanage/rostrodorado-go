import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Category } from '../../types';
import { FolderTree, Plus, Trash2, Edit2, ChevronRight, ChevronDown, Save, X } from 'lucide-react';
import { showToast } from '../ToastContainer';
import ConfirmModal from '../ConfirmModal';
import { m as motion, AnimatePresence } from 'framer-motion';

interface CategoryManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [isAdding, setIsAdding] = useState<{ parentId: string | null, level: number } | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<{ id: string, name: string } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ show: boolean, id: string | null }>({ show: false, id: null });

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            const q = query(collection(db, 'categories'), orderBy('name'));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Category));
            setCategories(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching categories:", error);
            showToast('Error al cargar categorías', 'error');
            setLoading(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim() || !isAdding) return;

        try {
            const newCategory: Omit<Category, 'id'> = {
                name: newCategoryName.trim(),
                parentId: isAdding.parentId,
                level: isAdding.level,
                createdAt: new Date()
            };

            const docRef = await addDoc(collection(db, 'categories'), newCategory);
            setCategories([...categories, { id: docRef.id, ...newCategory } as Category]);

            // Auto expand parent if adding subcategory
            if (isAdding.parentId) {
                const newExpanded = new Set(expandedCategories);
                newExpanded.add(isAdding.parentId);
                setExpandedCategories(newExpanded);
            }

            showToast('Categoría creada', 'success');
            setIsAdding(null);
            setNewCategoryName('');
        } catch (error) {
            console.error("Error adding category:", error);
            showToast('Error al crear categoría', 'error');
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory || !editingCategory.name.trim()) return;

        try {
            await updateDoc(doc(db, 'categories', editingCategory.id), {
                name: editingCategory.name.trim()
            });

            setCategories(categories.map(cat =>
                cat.id === editingCategory.id ? { ...cat, name: editingCategory.name.trim() } : cat
            ));

            showToast('Categoría actualizada', 'success');
            setEditingCategory(null);
        } catch (error) {
            console.error("Error updating category:", error);
            showToast('Error al actualizar categoría', 'error');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        try {
            // Check for children
            const hasChildren = categories.some(cat => cat.parentId === id);
            if (hasChildren) {
                showToast('No puedes eliminar una categoría con subcategorías. Elimina primero las subcategorías.', 'warning');
                return;
            }

            await deleteDoc(doc(db, 'categories', id));
            setCategories(categories.filter(cat => cat.id !== id));
            showToast('Categoría eliminada', 'success');
            setConfirmDelete({ show: false, id: null });
        } catch (error) {
            console.error("Error deleting category:", error);
            showToast('Error al eliminar categoría', 'error');
        }
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedCategories(newExpanded);
    };

    const renderCategoryTree = (parentId: string | null = null, level: number = 0) => {
        const currentLevelCategories = categories.filter(cat => cat.parentId === parentId);

        if (level > 2) return null; // Max nesting level

        if (currentLevelCategories.length === 0 && parentId !== null && !isAdding) return (
            <div className="pl-4 py-2 text-sm text-white/30 italic">No hay subcategorías</div>
        );

        return (
            <div className={`space-y-2 ${level > 0 ? 'pl-6 border-l border-white/10 ml-2' : ''}`}>
                {currentLevelCategories.map(category => (
                    <div key={category.id} className="group">
                        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                            {/* Expand/Collapse logic for non-leaf nodes */}
                            <button
                                onClick={() => toggleExpand(category.id)}
                                className={`p-1 rounded hover:bg-white/10 ${level < 2 ? 'text-white/50' : 'invisible'}`}
                            >
                                {categories.some(c => c.parentId === category.id) ? (
                                    expandedCategories.has(category.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                                ) : (
                                    <div className="w-4 h-4" /> // Spacer
                                )}
                            </button>

                            {editingCategory?.id === category.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        autoFocus
                                        value={editingCategory.name}
                                        onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                        className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-gold outline-none flex-1"
                                        onKeyDown={e => e.key === 'Enter' && handleUpdateCategory()}
                                    />
                                    <button onClick={handleUpdateCategory} className="text-green-500 hover:text-green-400"><Save size={16} /></button>
                                    <button onClick={() => setEditingCategory(null)} className="text-red-500 hover:text-red-400"><X size={16} /></button>
                                </div>
                            ) : (
                                <span className={`flex-1 text-sm font-medium ${level === 0 ? 'text-gold' : 'text-white'}`}>
                                    {category.name}
                                </span>
                            )}

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setEditingCategory({ id: category.id, name: category.name })}
                                    className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded"
                                    title="Editar"
                                >
                                    <Edit2 size={14} />
                                </button>

                                {level < 2 && (
                                    <button
                                        onClick={() => {
                                            setIsAdding({ parentId: category.id, level: level + 1 });
                                            if (!expandedCategories.has(category.id)) toggleExpand(category.id);
                                        }}
                                        className="p-1.5 text-green-400 hover:bg-green-500/10 rounded"
                                        title="Agregar subcategoría"
                                    >
                                        <Plus size={14} />
                                    </button>
                                )}

                                <button
                                    onClick={() => setConfirmDelete({ show: true, id: category.id })}
                                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"
                                    title="Eliminar"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {(expandedCategories.has(category.id) || isAdding?.parentId === category.id) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    {renderCategoryTree(category.id, level + 1)}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}

                {/* Add New Category Input */}
                {isAdding?.parentId === parentId && (
                    <div className="pl-8 pr-2 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <input
                            autoFocus
                            placeholder={`Nombre de ${level === 0 ? 'Categoría Principal' : 'Subcategoría'}...`}
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                            className="flex-1 bg-black/40 border border-gold/50 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                        />
                        <button
                            onClick={handleAddCategory}
                            className="p-1.5 bg-gold text-black rounded hover:bg-white transition-colors"
                        >
                            <Save size={16} />
                        </button>
                        <button
                            onClick={() => {
                                setIsAdding(null);
                                setNewCategoryName('');
                            }}
                            className="p-1.5 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#111] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
                    >
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-serif text-white">Gestionar Categorías</h2>
                                <p className="text-white/50 text-xs">Crea y organiza la jerarquía de productos</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white/50 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={() => setIsAdding({ parentId: null, level: 0 })}
                                    className="flex items-center gap-2 bg-gold/10 text-gold px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gold hover:text-black transition-colors"
                                >
                                    <Plus size={16} /> Nueva Principal
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-white/50 text-center py-8">Cargando...</div>
                            ) : categories.length === 0 && !isAdding ? (
                                <div className="text-center py-12 text-white/30">
                                    <FolderTree size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No hay categorías</p>
                                </div>
                            ) : (
                                renderCategoryTree(null, 0)
                            )}
                        </div>
                    </motion.div>

                    <ConfirmModal
                        isOpen={confirmDelete.show}
                        title="Eliminar Categoría"
                        message="¿Estás seguro? Esta acción no se puede deshacer."
                        confirmText="Sí, eliminar"
                        cancelText="Cancelar"
                        type="danger"
                        onConfirm={() => confirmDelete.id && handleDeleteCategory(confirmDelete.id)}
                        onCancel={() => setConfirmDelete({ show: false, id: null })}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CategoryManagerModal;
