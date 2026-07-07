import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FormResponse, DynamicForm } from '../../types';
import { Table, Trash2, Search, Filter, FileSpreadsheet, Download } from 'lucide-react';
import { showToast } from '../ToastContainer';
import ConfirmModal from '../ConfirmModal';

const AdminResponses: React.FC = () => {
    const [responses, setResponses] = useState<FormResponse[]>([]);
    const [forms, setForms] = useState<DynamicForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFormId, setSelectedFormId] = useState<string>('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [respSnapshot, formsSnapshot] = await Promise.all([
                getDocs(collection(db, 'form_responses')),
                getDocs(collection(db, 'forms'))
            ]);
            
            const respData = respSnapshot.docs
                .map(d => ({ id: d.id, ...d.data() } as FormResponse))
                .sort((a, b) => {
                    const timeA = a.submittedAt?.toMillis?.() || a.submittedAt?.seconds * 1000 || 0;
                    const timeB = b.submittedAt?.toMillis?.() || b.submittedAt?.seconds * 1000 || 0;
                    return timeB - timeA;
                });
            
            const formsData = formsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as DynamicForm));
            
            setResponses(respData);
            setForms(formsData);
        } catch (error) {
            console.error("Error fetching data:", error);
            showToast("Error al cargar datos", "error");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteDoc(doc(db, 'form_responses', deleteId));
            setResponses(prev => prev.filter(r => r.id !== deleteId));
            showToast("Respuesta eliminada", "success");
        } catch (error) {
            console.error("Error deleting response:", error);
            showToast("Error al eliminar", "error");
        } finally {
            setDeleteId(null);
        }
    };

    const formatDate = (dateObj: any) => {
        if (!dateObj) return 'N/A';
        try {
            if (typeof dateObj.toDate === 'function') return dateObj.toDate().toLocaleString('es-CO');
            if (dateObj.seconds) return new Date(dateObj.seconds * 1000).toLocaleString('es-CO');
            return 'N/A';
        } catch {
            return 'N/A';
        }
    };

    const filtered = responses.filter(r => {
        const matchesForm = selectedFormId === 'all' || r.formId === selectedFormId;
        if (!matchesForm) return false;
        
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (r.formTitle || '').toLowerCase().includes(term) ||
            (r.customerName || '').toLowerCase().includes(term) ||
            (r.customerEmail || '').toLowerCase().includes(term) ||
            Object.values(r.answers || {}).some(v =>
                String(v).toLowerCase().includes(term)
            )
        );
    });

    // Determine columns based on selected form
    const selectedForm = forms.find(f => f.id === selectedFormId);
    const dynamicColumns = selectedForm 
        ? selectedForm.fields.filter(f => f.type !== 'image').map(f => ({ id: f.id, label: f.label }))
        : [];

    if (loading) {
        return (
            <div className="text-center py-20 text-white/50">
                <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                Cargando base de datos...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Toolbar */}
            <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-serif text-gold flex items-center gap-3">
                            <FileSpreadsheet size={24} />
                            Base de Datos de Respuestas
                        </h2>
                        <p className="text-white/50 text-sm mt-1">Vista de hoja de cálculo para tus formularios.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {/* Form Selector */}
                    <div className="relative">
                        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <select
                            value={selectedFormId}
                            onChange={(e) => setSelectedFormId(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-gold/50 appearance-none transition-colors"
                        >
                            <option value="all">Todos los Formularios</option>
                            {forms.map(f => (
                                <option key={f.id} value={f.id}>{f.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative md:col-span-2">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder="Buscar en la tabla..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Spreadsheet Table */}
            <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                            <tr className="bg-black/50 border-b border-white/10">
                                <th className="p-4 text-[10px] uppercase tracking-widest text-white/40 font-bold border-r border-white/5">Acciones</th>
                                <th className="p-4 text-[10px] uppercase tracking-widest text-white/40 font-bold border-r border-white/5">Fecha de Envío</th>
                                {selectedFormId === 'all' && (
                                    <th className="p-4 text-[10px] uppercase tracking-widest text-white/40 font-bold border-r border-white/5">Formulario</th>
                                )}
                                <th className="p-4 text-[10px] uppercase tracking-widest text-white/40 font-bold border-r border-white/5">Paciente</th>
                                <th className="p-4 text-[10px] uppercase tracking-widest text-white/40 font-bold border-r border-white/5">Email</th>
                                
                                {/* Dynamic columns for specific form */}
                                {dynamicColumns.map(col => (
                                    <th key={col.id} className="p-4 text-[10px] uppercase tracking-widest text-gold/60 font-bold border-r border-white/5 bg-gold/5 min-w-[200px]">
                                        {col.label}
                                    </th>
                                ))}

                                {/* Generic columns for 'all' view if there are answers not in dynamic columns */}
                                {selectedFormId === 'all' && (
                                    <th className="p-4 text-[10px] uppercase tracking-widest text-white/20 font-bold italic">Respuestas (Vista General)</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-20 text-center text-white/20 italic">
                                        No hay datos que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((response) => (
                                    <tr key={response.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 border-r border-white/5">
                                            <button
                                                onClick={() => setDeleteId(response.id!)}
                                                className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Eliminar fila"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                        <td className="p-4 text-white/60 whitespace-nowrap border-r border-white/5 font-mono text-xs">
                                            {formatDate(response.submittedAt)}
                                        </td>
                                        {selectedFormId === 'all' && (
                                            <td className="p-4 border-r border-white/5">
                                                <span className="text-[10px] bg-white/5 text-white/50 px-2 py-0.5 rounded border border-white/10 uppercase tracking-tighter">
                                                    {response.formTitle}
                                                </span>
                                            </td>
                                        )}
                                        <td className="p-4 text-white font-medium border-r border-white/5">
                                            {response.customerName || <span className="text-white/20">Anónimo</span>}
                                        </td>
                                        <td className="p-4 text-white/50 border-r border-white/5 font-mono text-xs">
                                            {response.customerEmail || '-'}
                                        </td>

                                        {/* Dynamic Answer Cells */}
                                        {dynamicColumns.map(col => {
                                            const val = response.answers[col.id];
                                            return (
                                                <td key={col.id} className="p-4 border-r border-white/5 bg-white/[0.01]">
                                                    {Array.isArray(val) ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {val.map((v, i) => (
                                                                <span key={i} className="text-[10px] bg-gold/10 text-gold/80 px-1.5 py-0.5 rounded">{v}</span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-white/80">{String(val || '-')}</span>
                                                    )}
                                                </td>
                                            );
                                        })}

                                        {/* General Summary for 'all' view */}
                                        {selectedFormId === 'all' && (
                                            <td className="p-4 text-[11px] text-white/30 italic max-w-xs truncate">
                                                {Object.entries(response.answers).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="¿Eliminar este registro?"
                message="Se eliminará permanentemente de la hoja de cálculo."
            />
        </div>
    );
};

export default AdminResponses;
