import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { parseFirestoreDate } from '../../utils/dateUtils';
import { MessageCircle, Trash2, CheckCircle, Clock, AlertTriangle, X, MapPin } from 'lucide-react';
import { m as motion, AnimatePresence } from 'framer-motion';

interface Lead {
    id: string;
    name: string;
    phone: string;
    email: string;
    treatment: string;
    details: string;
    city?: string;
    department?: string;
    createdAt: any;
    status: 'new' | 'contacted' | 'junk';
    source: string;
}

const AdminLeads: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const leadsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Lead[];

            setLeads(leadsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching leads:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const markAsContacted = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'contacted' ? 'new' : 'contacted';
            await updateDoc(doc(db, 'leads', id), {
                status: newStatus
            });
        } catch (error) {
            console.error("Error updating lead:", error);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await deleteDoc(doc(db, 'leads', deleteConfirm.id));
        } catch (error) {
            console.error("Error deleting lead:", error);
        }
        setDeleteConfirm(null);
    };

    const openWhatsApp = (lead: Lead) => {
        const text = `Hola ${lead.name.split(' ')[0]}, somos de Rostro Dorado Clinic.

Vimos que recientemente dejaste tus datos en nuestra pagina web interesada en nuestros servicios y queriamos ponernos en contacto contigo.

Nos comentaste que te interesa lo siguiente:
- Tratamiento: ${lead.treatment || 'No especificado'}
- Ubicacion: ${lead.city || 'No especificada'}${lead.department ? `, ${lead.department}` : ''}
${lead.details ? `- Detalles adicionales: ${lead.details}\n` : ''}
¿Te gustaria que te enviaramos una cotizacion o tienes alguna duda al respecto sobre este tratamiento? Quedamos muy atentos para ayudarte.`;

        const searchParams = new URLSearchParams();
        searchParams.append('phone', `57${lead.phone.replace(/\D/g, '')}`);
        searchParams.append('text', text);
        const urlParams = searchParams.toString();

        // Detect Mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            window.location.href = `whatsapp://send?${urlParams}`;
        } else {
            window.open(`https://api.whatsapp.com/send?${urlParams}`, '_blank');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-serif text-white mb-8">Solicitudes de Cita (Leads)</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <h3 className="text-white/50 text-xs uppercase tracking-widest mb-1">Total Leads</h3>
                    <p className="text-2xl font-bold text-gold">{leads.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <h3 className="text-white/50 text-xs uppercase tracking-widest mb-1">Sin Contactar</h3>
                    <p className="text-2xl font-bold text-red-400">{leads.filter(l => l.status === 'new').length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <h3 className="text-white/50 text-xs uppercase tracking-widest mb-1">Contactados</h3>
                    <p className="text-2xl font-bold text-green-400">{leads.filter(l => l.status === 'contacted').length}</p>
                </div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-widest text-white/50">
                                <th className="p-4 font-medium">Fecha</th>
                                <th className="p-4 font-medium">Cliente</th>
                                <th className="p-4 font-medium">Interés</th>
                                <th className="p-4 font-medium">Detalles</th>
                                <th className="p-4 font-medium">Estado</th>
                                <th className="p-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm text-white/80">
                            <AnimatePresence>
                                {leads.map((lead) => (
                                    <motion.tr
                                        key={lead.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <td className="p-4 whitespace-nowrap">
                                            {parseFirestoreDate(lead.createdAt)?.toLocaleString('es-CO') || 'N/A'}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-white">{lead.name}</div>
                                            <div className="text-xs text-white/50">{lead.email}</div>
                                            <div
                                                className="text-xs text-gold hover:underline cursor-pointer flex items-center gap-1 mt-1"
                                                onClick={() => openWhatsApp(lead)}
                                            >
                                                <MessageCircle size={10} /> {lead.phone}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="bg-white/10 px-2 py-1 rounded text-xs truncate max-w-[150px]" title={lead.treatment || '-'}>
                                                    {lead.treatment || '-'}
                                                </span>
                                                {(lead.city || lead.department) && (
                                                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                                                        <MapPin size={10} className="text-gold" />
                                                        {lead.city}{lead.city && lead.department ? ', ' : ''}{lead.department}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 max-w-xs truncate" title={lead.details}>
                                            {lead.details || '-'}
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider cursor-pointer border ${lead.status === 'contacted'
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}
                                                onClick={() => markAsContacted(lead.id, lead.status)}
                                            >
                                                {lead.status === 'contacted' ? 'Contactado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => markAsContacted(lead.id, lead.status)}
                                                    className={`p-2 rounded-lg transition-colors ${lead.status === 'contacted' ? 'text-white/20 hover:text-white' : 'text-green-500 hover:bg-green-500/10'}`}
                                                    title={lead.status === 'contacted' ? "Marcar como pendiente" : "Marcar como contactado"}
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openWhatsApp(lead)}
                                                    className="p-2 text-white/20 hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                                                    title="Enviar WhatsApp"
                                                >
                                                    <MessageCircle size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ id: lead.id, name: lead.name })}
                                                    className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>

                            {leads.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-white/30">
                                        No hay leads registrados aún.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                </div>
                                <h3 className="text-white font-serif text-lg">Eliminar Registro</h3>
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="ml-auto p-1 text-white/30 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-white/60 text-sm mb-6">
                                ¿Estás seguro de eliminar el registro de <strong className="text-white">{deleteConfirm.name}</strong>? Esta acción no se puede deshacer.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-3 px-4 text-xs uppercase tracking-widest text-white/60 border border-white/10 rounded-lg hover:border-white/30 hover:text-white transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 px-4 text-xs uppercase tracking-widest text-white bg-red-600 rounded-lg hover:bg-red-500 transition-all font-bold"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminLeads;
