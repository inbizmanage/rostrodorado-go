import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { DynamicForm, FormField, FormResponse } from '../../types';
import { Plus, Edit, Trash2, X, Eye, FileText, Settings, Copy, BarChart, Sparkles } from 'lucide-react';
import { showToast } from '../ToastContainer';
import ConfirmModal from '../ConfirmModal';
import FileUpload from './FileUpload';
import AiAssistant from './AiAssistant';

const AdminForms: React.FC = () => {
    const [forms, setForms] = useState<DynamicForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingForm, setEditingForm] = useState<DynamicForm | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    
    // View Responses State
    const [viewingResponsesId, setViewingResponsesId] = useState<string | null>(null);
    const [responses, setResponses] = useState<FormResponse[]>([]);
    const [loadingResponses, setLoadingResponses] = useState(false);
    
    // AI State
    const [showAiAssistant, setShowAiAssistant] = useState(false);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'forms'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DynamicForm));
            setForms(data);
        } catch (error) {
            console.error("Error fetching forms:", error);
            showToast("Error al cargar formularios", "error");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateObj: any) => {
        if (!dateObj) return 'Pendiente...';
        if (typeof dateObj.toDate === 'function') return dateObj.toDate().toLocaleDateString();
        if (dateObj.seconds) return new Date(dateObj.seconds * 1000).toLocaleDateString();
        if (dateObj instanceof Date) return dateObj.toLocaleDateString();
        if (typeof dateObj === 'string' || typeof dateObj === 'number') return new Date(dateObj).toLocaleDateString();
        return 'Pendiente...';
    };

    const fetchResponses = async (formId: string) => {
        setViewingResponsesId(formId);
        setLoadingResponses(true);
        try {
            const q = query(collection(db, 'form_responses')); // Ideally filter by formId, but we need an index. For now we fetch all and filter in memory, or just query without order
            const snapshot = await getDocs(q);
            const data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as FormResponse))
                .filter(res => res.formId === formId)
                .sort((a, b) => {
                    const timeA = a.submittedAt?.toMillis() || 0;
                    const timeB = b.submittedAt?.toMillis() || 0;
                    return timeB - timeA;
                });
            setResponses(data);
        } catch (error) {
            console.error("Error fetching responses:", error);
            showToast("Error al cargar respuestas", "error");
        } finally {
            setLoadingResponses(false);
        }
    };

    const handleCreateNew = () => {
        setEditingForm({
            title: 'Nuevo Formulario',
            description: '',
            fields: [],
            isActive: true,
            createdAt: serverTimestamp()
        });
        setIsEditing(true);
    };

    const handleEdit = (form: DynamicForm) => {
        // Safe copy to avoid mutating state, without breaking Firebase Timestamps like JSON.parse does
        const formCopy = { 
            ...form, 
            fields: form.fields.map(f => ({ 
                ...f, 
                options: f.options ? [...f.options] : undefined 
            })) 
        };
        setEditingForm(formCopy);
        setIsEditing(true);
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteDoc(doc(db, 'forms', deleteId));
            showToast("Formulario eliminado", "success");
            fetchForms();
        } catch (error) {
            console.error("Error deleting form:", error);
            showToast("Error al eliminar", "error");
        } finally {
            setDeleteId(null);
        }
    };

    const copyToClipboard = async (formId: string) => {
        const url = `${window.location.origin}/kiosko/${formId}`;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(url);
                showToast("Enlace del Kiosko copiado", "success");
            } else {
                throw new Error("Clipboard API no disponible");
            }
        } catch (err) {
            // Fallback for non-secure contexts (like local network IPs)
            const textArea = document.createElement("textarea");
            textArea.value = url;
            // Make it invisible
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                showToast("Enlace del Kiosko copiado", "success");
            } catch (e) {
                console.error('Fallback: Oops, unable to copy', e);
                showToast("Copia manual requerida: " + url, "error");
            }
            textArea.remove();
        }
    };

    // --- FORM BUILDER LOGIC ---

    const saveForm = async () => {
        if (!editingForm) return;
        if (!editingForm.title.trim()) {
            showToast("El título es obligatorio", "error");
            return;
        }

        try {
            // Remove id and createdAt to avoid overwriting them or storing id inside the document
            const { id, createdAt, ...dataToUpdate } = editingForm;
            
            // Clean undefined values from fields which Firestore rejects
            const cleanedFields = dataToUpdate.fields.map((f, i) => {
                const newF = { ...f, order: i };
                if (newF.options === undefined) delete newF.options;
                if (newF.imageUrl === undefined) delete newF.imageUrl;
                if (newF.description === undefined) delete newF.description;
                return newF;
            });

            const formData: any = {
                ...dataToUpdate,
                fields: cleanedFields,
                updatedAt: serverTimestamp()
            };

            if (editingForm.id) {
                await updateDoc(doc(db, 'forms', editingForm.id), formData);
                showToast("Formulario actualizado", "success");
            } else {
                formData.createdAt = serverTimestamp();
                // Generate a simpler 6-character short ID
                const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
                await setDoc(doc(db, 'forms', shortId), formData);
                showToast("Formulario creado", "success");
            }
            setIsEditing(false);
            setEditingForm(null);
            fetchForms();
        } catch (error) {
            console.error("Error saving form:", error);
            showToast("Error al guardar", "error");
        }
    };

    const addField = (type: FormField['type']) => {
        setEditingForm(prev => {
            if (!prev) return prev;
            const newField: FormField = {
                id: `field_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                type,
                label: type === 'image' ? 'Imagen de apoyo' : 'Nueva Pregunta',
                required: type !== 'image',
                order: prev.fields.length
            };
            if (type === 'single_choice' || type === 'multiple_choice') {
                newField.options = ['Opción 1', 'Opción 2'];
            }
            return { ...prev, fields: [...prev.fields, newField] };
        });
    };

    const updateField = (index: number, updates: Partial<FormField>) => {
        setEditingForm(prev => {
            if (!prev) return prev;
            const updatedFields = [...prev.fields];
            updatedFields[index] = { ...updatedFields[index], ...updates };
            return { ...prev, fields: updatedFields };
        });
    };

    const removeField = (index: number) => {
        setEditingForm(prev => {
            if (!prev) return prev;
            const updatedFields = prev.fields.filter((_, i) => i !== index);
            return { ...prev, fields: updatedFields };
        });
    };

    const updateFieldOption = (fieldIndex: number, optionIndex: number, value: string) => {
        setEditingForm(prev => {
            if (!prev) return prev;
            const updatedFields = [...prev.fields];
            const field = updatedFields[fieldIndex];
            if (!field.options) return prev;
            const newOptions = [...field.options];
            newOptions[optionIndex] = value;
            updatedFields[fieldIndex] = { ...field, options: newOptions };
            return { ...prev, fields: updatedFields };
        });
    };

    const addFieldOption = (fieldIndex: number) => {
        setEditingForm(prev => {
            if (!prev) return prev;
            const updatedFields = [...prev.fields];
            const field = updatedFields[fieldIndex];
            const newOptions = [...(field.options || []), `Opción ${(field.options?.length || 0) + 1}`];
            updatedFields[fieldIndex] = { ...field, options: newOptions };
            return { ...prev, fields: updatedFields };
        });
    };

    const removeFieldOption = (fieldIndex: number, optionIndex: number) => {
        setEditingForm(prev => {
            if (!prev) return prev;
            const updatedFields = [...prev.fields];
            const field = updatedFields[fieldIndex];
            if (!field.options) return prev;
            const newOptions = field.options.filter((_, i) => i !== optionIndex);
            updatedFields[fieldIndex] = { ...field, options: newOptions };
            return { ...prev, fields: updatedFields };
        });
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        setEditingForm(prev => {
            if (!prev) return prev;
            const newFields = [...prev.fields];
            if (direction === 'up' && index > 0) {
                [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
            } else if (direction === 'down' && index < newFields.length - 1) {
                [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
            }
            return { ...prev, fields: newFields };
        });
    };

    const handleApplyAiForm = (draft: any) => {
        if (!draft) return;
        
        // Re-map IDs to ensure uniqueness on generation
        const newFields = (draft.fields || []).map((f: any, i: number) => ({
            ...f,
            id: `ai_field_${Date.now()}_${i}`
        }));

        setEditingForm(prev => {
            if (!prev) {
                return {
                    title: draft.title || 'Formulario Generado',
                    description: draft.description || '',
                    fields: newFields,
                    isActive: true,
                    createdAt: serverTimestamp()
                };
            }
            return {
                ...prev,
                title: draft.title || prev.title,
                description: draft.description || prev.description,
                fields: [...prev.fields, ...newFields] // Append to existing or replace
            };
        });
        
        if (!isEditing) {
            setIsEditing(true);
        }
    };


    if (viewingResponsesId) {
        const formObj = forms.find(f => f.id === viewingResponsesId);
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#1A1A1A] p-6 rounded-2xl border border-white/5">
                    <div>
                        <h2 className="text-2xl font-serif text-gold">Respuestas: {formObj?.title}</h2>
                        <p className="text-white/50 text-sm mt-1">{responses.length} respuestas recibidas</p>
                    </div>
                    <button
                        onClick={() => setViewingResponsesId(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                    >
                        Volver a Formularios
                    </button>
                </div>

                {loadingResponses ? (
                    <div className="text-center py-12 text-white/50">Cargando respuestas...</div>
                ) : responses.length === 0 ? (
                    <div className="text-center py-12 bg-[#1A1A1A] rounded-2xl border border-white/5 text-white/50">
                        Aún no hay respuestas para este formulario.
                    </div>
                ) : (
                    <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-black/50 border-b border-white/10">
                                        <th className="p-4 text-xs uppercase tracking-widest text-white/50 font-medium">Fecha</th>
                                        <th className="p-4 text-xs uppercase tracking-widest text-white/50 font-medium">Cliente / Email</th>
                                        {/* Dynamically generate column headers based on form fields */}
                                        {formObj?.fields.filter(f => f.type !== 'image').map(f => (
                                            <th key={f.id} className="p-4 text-xs uppercase tracking-widest text-white/50 font-medium max-w-[200px] truncate" title={f.label}>
                                                {f.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-white/5">
                                    {responses.map((response) => (
                                        <tr key={response.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-white/70 whitespace-nowrap">
                                                {response.submittedAt ? response.submittedAt.toDate().toLocaleString('es-CO') : 'N/A'}
                                            </td>
                                            <td className="p-4 text-white">
                                                {response.customerName || response.customerEmail ? (
                                                    <div>
                                                        <div>{response.customerName}</div>
                                                        <div className="text-xs text-white/50">{response.customerEmail}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-white/30 italic">Anónimo</span>
                                                )}
                                            </td>
                                            {formObj?.fields.filter(f => f.type !== 'image').map(f => {
                                                const ans = response.answers[f.id];
                                                let displayVal = 'N/A';
                                                if (Array.isArray(ans)) {
                                                    displayVal = ans.join(', ');
                                                } else if (ans !== undefined) {
                                                    displayVal = String(ans);
                                                }
                                                return (
                                                    <td key={f.id} className="p-4 text-white/70 max-w-[250px] truncate" title={displayVal}>
                                                        {displayVal}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (isEditing && editingForm) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 sticky top-0 z-10">
                    <h2 className="text-2xl font-serif text-gold whitespace-nowrap">
                        {editingForm.id ? 'Editar Formulario' : 'Nuevo Formulario'}
                    </h2>
                    <div className="flex flex-col sm:flex-row flex-wrap md:flex-nowrap gap-3 w-full md:w-auto md:ml-auto">
                        <button
                            onClick={() => setShowAiAssistant(true)}
                            className="flex items-center justify-center flex-1 sm:flex-none gap-2 px-4 py-2 bg-gradient-to-r from-gold to-yellow-400 text-black rounded-xl hover:opacity-90 transition-opacity font-bold text-sm shadow-lg shadow-gold/20"
                        >
                            <Sparkles size={16} /> Alex AI
                        </button>
                        <button
                            onClick={() => { setIsEditing(false); setEditingForm(null); }}
                            className="px-4 py-2 text-white/70 hover:text-white transition-colors flex-1 sm:flex-none text-center"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={saveForm}
                            className="px-6 py-2 bg-gold text-black rounded-xl font-medium hover:bg-white transition-colors w-full sm:w-auto text-center"
                        >
                            Guardar Formulario
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT: Builder Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 space-y-4">
                            <input
                                type="text"
                                placeholder="Título del Formulario (ej. Encuesta de Recepción)"
                                value={editingForm.title}
                                onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value })}
                                className="w-full bg-transparent text-3xl font-serif text-white border-b border-white/10 focus:border-gold outline-none py-2 placeholder-white/20"
                            />
                            <textarea
                                placeholder="Descripción opcional..."
                                value={editingForm.description || ''}
                                onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold outline-none resize-none h-20"
                            />
                        </div>

                        {/* Fields List */}
                        <div className="space-y-4">
                            {editingForm.fields.map((field, index) => (
                                <div key={field.id} className="bg-[#1A1A1A] p-5 rounded-2xl border border-white/5 relative group">
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => moveField(index, 'up')} disabled={index === 0} className="p-1 text-white/30 hover:text-white disabled:opacity-20">↑</button>
                                        <button onClick={() => moveField(index, 'down')} disabled={index === editingForm.fields.length - 1} className="p-1 text-white/30 hover:text-white disabled:opacity-20">↓</button>
                                        <button onClick={() => removeField(index)} className="p-1 text-red-500/50 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>

                                    <div className="flex items-center gap-4 mb-4 pr-20">
                                        <span className="text-xs uppercase tracking-widest text-gold bg-gold/10 px-2 py-1 rounded">
                                            {field.type === 'text' ? 'Texto Corto' :
                                             field.type === 'textarea' ? 'Texto Largo' :
                                             field.type === 'single_choice' ? 'Selección Única' :
                                             field.type === 'multiple_choice' ? 'Selección Múltiple' :
                                             field.type === 'image' ? 'Imagen' :
                                             field.type}
                                        </span>
                                        {field.type !== 'image' && (
                                            <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={field.required}
                                                    onChange={(e) => updateField(index, { required: e.target.checked })}
                                                    className="rounded border-white/20 bg-black/50 text-gold focus:ring-gold focus:ring-offset-0"
                                                />
                                                Obligatorio
                                            </label>
                                        )}
                                    </div>

                                    {field.type === 'image' ? (
                                        <div className="space-y-4">
                                            <FileUpload
                                                onChange={(url: string) => updateField(index, { imageUrl: url })}
                                                onUpload={(url: string) => updateField(index, { imageUrl: url })}
                                                value={field.imageUrl || ''}
                                            />
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="Escribe tu pregunta aquí..."
                                            value={field.label}
                                            onChange={(e) => updateField(index, { label: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold outline-none font-medium mb-3"
                                        />
                                    )}

                                    {/* Options for choices */}
                                    {(field.type === 'single_choice' || field.type === 'multiple_choice') && (
                                        <div className="space-y-2 mt-4 pl-4 border-l-2 border-white/5">
                                            {field.options?.map((opt, optIndex) => (
                                                <div key={optIndex} className="flex items-center gap-2">
                                                    <div className={`w-4 h-4 border border-white/20 ${field.type === 'single_choice' ? 'rounded-full' : 'rounded'}`}></div>
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => updateFieldOption(index, optIndex, e.target.value)}
                                                        className="flex-1 bg-transparent border-b border-white/10 focus:border-gold outline-none text-white/70 text-sm py-1"
                                                    />
                                                    <button onClick={() => removeFieldOption(index, optIndex)} className="text-white/30 hover:text-red-400 p-1"><X size={14}/></button>
                                                </div>
                                            ))}
                                            <button 
                                                onClick={() => addFieldOption(index)}
                                                className="text-gold text-sm flex items-center gap-1 mt-2 hover:underline"
                                            >
                                                <Plus size={14}/> Agregar opción
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {editingForm.fields.length === 0 && (
                                <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl text-white/30">
                                    Agrega el primer campo para tu formulario desde el menú lateral.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Toolbar */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 sticky top-24 space-y-6">
                            <div>
                                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                                    <Plus size={18} className="text-gold"/> Agregar Campo
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => addField('text')} className="p-3 bg-black/30 border border-white/5 hover:border-gold/50 rounded-xl text-left text-sm text-white/70 transition-colors">Texto Corto</button>
                                    <button onClick={() => addField('textarea')} className="p-3 bg-black/30 border border-white/5 hover:border-gold/50 rounded-xl text-left text-sm text-white/70 transition-colors">Texto Largo</button>
                                    <button onClick={() => addField('single_choice')} className="p-3 bg-black/30 border border-white/5 hover:border-gold/50 rounded-xl text-left text-sm text-white/70 transition-colors">Selec. Única</button>
                                    <button onClick={() => addField('multiple_choice')} className="p-3 bg-black/30 border border-white/5 hover:border-gold/50 rounded-xl text-left text-sm text-white/70 transition-colors">Selec. Múltiple</button>
                                    <button onClick={() => addField('email')} className="p-3 bg-black/30 border border-white/5 hover:border-gold/50 rounded-xl text-left text-sm text-white/70 transition-colors">Email</button>
                                    <button onClick={() => addField('phone')} className="p-3 bg-black/30 border border-white/5 hover:border-gold/50 rounded-xl text-left text-sm text-white/70 transition-colors">Teléfono</button>
                                    <button onClick={() => addField('image')} className="p-3 bg-black/30 border border-white/5 hover:border-gold/50 rounded-xl text-left text-sm text-white/70 transition-colors col-span-2 flex justify-center items-center gap-2 text-gold"><Plus size={14}/> Imagen Decorativa</button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                                    <Settings size={18} className="text-gold"/> Configuración
                                </h3>
                                <label className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-xl cursor-pointer">
                                    <span className="text-sm text-white/70">Estado Activo</span>
                                    <input 
                                        type="checkbox" 
                                        checked={editingForm.isActive}
                                        onChange={(e) => setEditingForm({ ...editingForm, isActive: e.target.checked })}
                                        className="rounded border-white/20 bg-black/50 text-green-500 focus:ring-green-500 focus:ring-offset-0"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {showAiAssistant && (
                    <AiAssistant
                        mode="form"
                        onApplyForm={handleApplyAiForm}
                        onApplyContent={() => {}}
                        onApplyImage={() => {}}
                        onClose={() => setShowAiAssistant(false)}
                        contextId="forms"
                    />
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1A1A1A] p-6 rounded-2xl border border-white/5">
                <div>
                    <h2 className="text-2xl font-serif text-gold flex items-center gap-3">
                        <FileText size={24} />
                        Formularios Dinámicos
                    </h2>
                    <p className="text-white/50 text-sm mt-1">Crea encuestas o formularios de ingreso para la sala de espera.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gold text-black rounded-xl hover:bg-white transition-colors font-medium w-full md:w-auto"
                >
                    <Plus size={20} />
                    Crear Formulario
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/50">Cargando formularios...</p>
                </div>
            ) : forms.length === 0 ? (
                <div className="text-center py-16 bg-[#1A1A1A] rounded-2xl border border-white/5">
                    <FileText size={48} className="mx-auto text-white/20 mb-4" />
                    <h3 className="text-xl text-white font-medium mb-2">No hay formularios</h3>
                    <p className="text-white/50 mb-6">Comienza creando tu primer formulario de ingreso o encuesta.</p>
                    <button
                        onClick={handleCreateNew}
                        className="px-6 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                    >
                        Crear el primero
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {forms.map((form) => (
                        <div key={form.id} className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 flex flex-col h-full group hover:border-gold/30 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded ${form.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {form.isActive ? 'Activo' : 'Inactivo'}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(form)} className="p-1.5 bg-black/50 text-white/70 hover:text-gold rounded-lg transition-colors" title="Editar">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(form.id!)} className="p-1.5 bg-black/50 text-white/70 hover:text-red-400 rounded-lg transition-colors" title="Eliminar">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-medium text-white mb-2 line-clamp-1">{form.title}</h3>
                            <p className="text-sm text-white/50 mb-6 line-clamp-2 flex-1">
                                {form.description || 'Sin descripción'}
                            </p>

                            <div className="flex items-center justify-between text-sm text-white/40 mb-6 border-t border-white/5 pt-4">
                                <span className="flex items-center gap-1"><FileText size={14}/> {form.fields.length} campos</span>
                                <span>{formatDate(form.createdAt)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-auto">
                                <button
                                    onClick={() => copyToClipboard(form.id!)}
                                    className="flex items-center justify-center gap-2 py-2.5 bg-black/30 text-gold border border-white/5 rounded-xl hover:bg-gold/10 transition-colors text-sm"
                                >
                                    <Copy size={16} />
                                    Copiar Link
                                </button>
                                <button
                                    onClick={() => fetchResponses(form.id!)}
                                    className="flex items-center justify-center gap-2 py-2.5 bg-white/5 text-white border border-white/5 rounded-xl hover:bg-white/10 transition-colors text-sm"
                                >
                                    <BarChart size={16} />
                                    Respuestas
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="¿Eliminar Formulario?"
                message="Esta acción no se puede deshacer. Perderás la estructura del formulario, aunque las respuestas pasadas seguirán en la base de datos."
                confirmText="Sí, Eliminar"
                cancelText="Cancelar"
            />
            
            {showAiAssistant && (
                <AiAssistant
                    mode="form"
                    onApplyForm={handleApplyAiForm}
                    onApplyContent={() => {}}
                    onApplyImage={() => {}}
                    onClose={() => setShowAiAssistant(false)}
                    contextId="forms"
                />
            )}
        </div>
    );
};

export default AdminForms;