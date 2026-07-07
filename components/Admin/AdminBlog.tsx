import React, { useState, useEffect } from 'react'; // React is required
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { BlogPost } from '../../types';
import { Plus, Edit, Trash2, X, Eye, Sparkles } from 'lucide-react';
import FileUpload from './FileUpload';
import { showToast } from '../ToastContainer';
import AiAssistant from './AiAssistant';
import ConfirmModal from '../ConfirmModal';

const AdminBlog: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [products, setProducts] = useState<any[]>([]); // Store products for AI context
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showAiAssistant, setShowAiAssistant] = useState(false); // New AI State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [formData, setFormData] = useState<Partial<BlogPost>>({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        coverImage: '',
        published: true,
        author: 'Dra. Isaura Dorado'
    });

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            // Fetch Posts
            const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
            setPosts(data);

            // Fetch Products for AI Context
            const prodQ = query(collection(db, 'products'));
            const prodSnap = await getDocs(prodQ);
            const prodData = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(prodData);

        } catch (error) {
            console.error("Error fetching data:", error);
            showToast("Error al cargar datos", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        // Auto-generate slug from title if not manually edited (or just always)
        // Simple slugify: lowercase, replace spaces with dashes, remove special chars
        const slug = title
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');

        setFormData({ ...formData, title, slug });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const postData = {
                ...formData,
                updatedAt: serverTimestamp()
            };

            if (editingPost && editingPost.id) {
                await updateDoc(doc(db, 'posts', editingPost.id), postData);
                showToast("Artículo actualizado", "success");
            } else {
                const docRef = await addDoc(collection(db, 'posts'), {
                    ...postData,
                    createdAt: serverTimestamp()
                });

                // MIGRAR CHAT DE 'default' A NUEVO ID
                // Si el usuario conversó con Alex mientras creaba este nuevo artículo (contexto 'default'),
                // ahora migramos esa conversación al ID del documento real para que persista al volver a editar.
                const defaultMsgs = localStorage.getItem('alex_chat_default_msgs');
                const defaultDraft = localStorage.getItem('alex_chat_default_draft');

                if (defaultMsgs) {
                    localStorage.setItem(`alex_chat_${docRef.id}_msgs`, defaultMsgs);
                    localStorage.removeItem('alex_chat_default_msgs');
                }
                if (defaultDraft) {
                    localStorage.setItem(`alex_chat_${docRef.id}_draft`, defaultDraft);
                    localStorage.removeItem('alex_chat_default_draft');
                }

                showToast("Artículo creado y chat guardado", "success");
            }
            setIsEditing(false);
            setEditingPost(null);
            resetForm();
            fetchPosts();
        } catch (error) {
            console.error("Error saving post:", error);
            showToast("Error al guardar", "error");
        }
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteDoc(doc(db, 'posts', deleteId));
            showToast("Artículo eliminado", "success");
            fetchPosts();
        } catch (error) {
            console.error("Error deleting post:", error);
            showToast("Error al eliminar", "error");
        } finally {
            setDeleteId(null);
        }
    };

    const startEdit = (post: BlogPost) => {
        setEditingPost(post);
        setFormData(post);
        setIsEditing(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            coverImage: '',
            published: true,
            author: 'Dra. Isaura Dorado'
        });
    };

    // AI Integrations
    const handleAiContent = (data: { title?: string; content?: string; excerpt?: string }) => {
        setFormData(prev => ({ ...prev, ...data }));
        // If we have a title but no slug, generate it
        if (data.title && !formData.slug) {
            const slug = data.title
                .toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-');
            setFormData(prev => ({ ...prev, slug }));
        }
        showToast("Contenido aplicado desde Gemini", "success");
    };

    const handleAiImage = (url: string) => {
        setFormData(prev => ({ ...prev, coverImage: url }));
    };


    if (loading && !isEditing) return <div className="text-white">Cargando blog...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-serif text-white">Gestión del Blog</h2>
                {!isEditing && (
                    <button
                        onClick={() => { setIsEditing(true); setEditingPost(null); resetForm(); }}
                        className="bg-gold text-black px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-white transition-colors"
                    >
                        <Plus size={18} /> Nuevo Artículo
                    </button>
                )}
            </div>

            {showAiAssistant && (
                <AiAssistant
                    onApplyContent={handleAiContent}
                    onApplyImage={handleAiImage}
                    onClose={() => setShowAiAssistant(false)}
                    currentContext={{
                        title: formData.title,
                        content: formData.content,
                        excerpt: formData.excerpt
                    }}
                    siteKnowledge={{
                        brand: "Rostro Dorado Clinic: Clínica de medicina estética líder, enfocada en resultados naturales, seguridad médica y tecnología de vanguardia. Especialistas en rejuvenecimiento facial sin cirugía.",
                        products: products.map((p: any) => `- ${p.name} (Usa este enlace: <a href="/productos/${p.id}" class="text-gold hover:underline font-bold">Ver Tratamiento</a>): ${p.description}`).join('\n'),
                        articles: posts.map(p => `- ${p.title} (/blog/${p.slug})`).join('\n')
                    }}
                    contextId={editingPost ? editingPost.id : 'default'}
                />
            )}

            <ConfirmModal
                isOpen={!!deleteId}
                title="¿Eliminar Artículo?"
                message="Esta acción no se puede deshacer. ¿Seguro que deseas eliminar este post permanentemente?"
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
            />

            {isEditing ? (
                <div className="bg-[#111] p-6 rounded-xl border border-white/10 relative">
                    {/* AI Button inside Editor */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex justify-between w-full md:w-auto items-center">
                            <h3 className="text-xl text-white font-serif">{editingPost ? 'Editar Artículo' : 'Nuevo Artículo'}</h3>
                            <button onClick={() => { setIsEditing(false); setEditingPost(null); }} className="md:hidden text-white/50 hover:text-white"><X size={24} /></button>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={() => setShowAiAssistant(true)}
                                className="flex-1 md:flex-none bg-gold/20 text-gold px-4 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-gold hover:text-black transition-all border border-gold/50 shadow-gold/10 shadow-lg"
                            >
                                <Sparkles size={16} /> Llamar a Alex
                            </button>
                            <button onClick={() => { setIsEditing(false); setEditingPost(null); }} className="hidden md:block text-white/50 hover:text-white p-2"><X size={24} /></button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase text-white/50">Título</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    className="w-full bg-black/20 border border-white/10 p-3 rounded text-white focus:border-gold outline-none"
                                    placeholder="Ej: Beneficios del Botox"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase text-white/50">Slug (URL)</label>
                                <input
                                    required
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 p-3 rounded text-white/60 focus:border-gold outline-none font-mono text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase text-white/50">Imagen de Portada</label>
                            <FileUpload
                                value={formData.coverImage || ''}
                                onChange={(url) => setFormData({ ...formData, coverImage: url })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase text-white/50">Resumen (Excerpt)</label>
                            <textarea
                                required
                                value={formData.excerpt}
                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                rows={2}
                                className="w-full bg-black/20 border border-white/10 p-3 rounded text-white focus:border-gold outline-none"
                                placeholder="Breve descripción para la tarjeta y SEO..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase text-white/50">Contenido (HTML soportado)</label>
                            <div className="text-xs text-white/30 mb-2">Puedes usar etiquetas &lt;p&gt;, &lt;b&gt;, &lt;ul&gt;, etc. O simplemente escribir párrafos.</div>
                            <textarea
                                required
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                rows={15}
                                className="w-full bg-black/20 border border-white/10 p-4 rounded text-white focus:border-gold outline-none font-mono text-sm leading-relaxed"
                            />
                        </div>

                        <div className="flex justify-between items-center border-t border-white/10 pt-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white/50">Estado:</span>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, published: !formData.published })}
                                    className={`px-3 py-1 rounded text-xs font-bold ${formData.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}
                                >
                                    {formData.published ? 'PUBLICADO' : 'BORRADOR'}
                                </button>
                            </div>
                            <button
                                type="submit"
                                className="bg-gold text-black px-8 py-3 rounded-xl font-bold hover:bg-white transition-colors"
                            >
                                {editingPost ? 'Actualizar Artículo' : 'Publicar Artículo'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid gap-4">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 items-center">
                            <div className="w-full md:w-24 h-24 bg-black/30 rounded-lg overflow-hidden shrink-0">
                                {post.coverImage && <img src={post.coverImage} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-xl text-white font-serif">{post.title}</h3>
                                <div className="text-xs text-white/40 font-mono mt-1">/blog/{post.slug}</div>
                                <div className="flex gap-2 justify-center md:justify-start mt-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded ${post.published ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                        {post.published ? 'Publicado' : 'Borrador'}
                                    </span>
                                    <span className="text-[10px] text-white/30">{new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60 flex items-center gap-1">
                                        <Eye size={10} /> {post.views || 0}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
                                    <Eye size={18} />
                                </a>
                                <button onClick={() => startEdit(post)} className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(post.id!)} className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {posts.length === 0 && <p className="text-center text-white/30 py-10">No hay artículos aún.</p>}
                </div>
            )}
        </div>
    );
};

export default AdminBlog;
