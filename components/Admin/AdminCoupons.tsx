import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { Coupon } from '../../types';
import { Plus, Trash2, Tag, Calendar, AlertCircle, X } from 'lucide-react';
import Loader from '../Loader';

const AdminCoupons: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
        code: '',
        type: 'percentage',
        value: 0,
        isActive: true,
        usageCount: 0,
    });
    const [expirationDate, setExpirationDate] = useState('');

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'coupons'), orderBy('code'));
            const querySnapshot = await getDocs(q);
            const couponsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Coupon[];
            setCoupons(couponsData);
        } catch (error) {
            console.error("Error fetching coupons:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCoupon = async () => {
        if (!newCoupon.code || !newCoupon.value) return;

        try {
            const couponData = {
                ...newCoupon,
                code: newCoupon.code.toUpperCase().trim(),
                expirationDate: expirationDate ? new Date(expirationDate).toISOString() : undefined,
                createdAt: Timestamp.now(),
            };

            await addDoc(collection(db, 'coupons'), couponData);
            setIsModalOpen(false);
            setNewCoupon({ code: '', type: 'percentage', value: 0, isActive: true, usageCount: 0 });
            setExpirationDate('');
            fetchCoupons();
        } catch (error) {
            console.error("Error creating coupon:", error);
            alert("Error al crear el cupón");
        }
    };

    const handleDeleteCoupon = async (id: string | undefined) => {
        if (!id || !window.confirm('¿Estás seguro de eliminar este cupón?')) return;
        try {
            await deleteDoc(doc(db, 'coupons', id));
            fetchCoupons();
        } catch (error) {
            console.error("Error deleting coupon:", error);
        }
    };

    const toggleStatus = async (coupon: Coupon) => {
        if (!coupon.id) return;
        try {
            await updateDoc(doc(db, 'coupons', coupon.id), {
                isActive: !coupon.isActive
            });
            fetchCoupons();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif text-white">Gestión de Cupones</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-gold text-black font-bold px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors"
                >
                    <Plus size={20} /> Nuevo Cupón
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((coupon) => (
                    <div key={coupon.id} className={`bg-[#111] p-6 rounded-xl border ${coupon.isActive ? 'border-white/10' : 'border-white/5 opacity-60'} shadow-sm relative group`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <Tag className="text-gold" size={20} />
                                <h3 className="text-xl font-bold font-mono tracking-wider text-white bg-white/5 px-2 py-1 rounded">
                                    {coupon.code}
                                </h3>
                            </div>
                            <button
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="text-red-400 hover:text-red-600 p-1"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="space-y-2 text-sm text-gray-300">
                            <div className="flex justify-between">
                                <span>Descuento:</span>
                                <span className="font-bold text-gold">
                                    {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value.toLocaleString()}`}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Usos:</span>
                                <span>{coupon.usageCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ''}</span>
                            </div>
                            {coupon.expirationDate && (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="flex items-center gap-1"><Calendar size={12} /> Expira:</span>
                                    <span>{new Date(coupon.expirationDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            {coupon.minPurchase && (
                                <div className="flex justify-between">
                                    <span>Min. Compra:</span>
                                    <span>${coupon.minPurchase.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                            <span className={`text-xs px-2 py-1 rounded-full ${coupon.isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400'}`}>
                                {coupon.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                            <button
                                onClick={() => toggleStatus(coupon)}
                                className="text-xs text-gold underline hover:text-white"
                            >
                                {coupon.isActive ? 'Desactivar' : 'Activar'}
                            </button>
                        </div>
                    </div>
                ))}

                {coupons.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white/5 rounded-xl border-dashed border-2 border-white/10">
                        <Tag className="mx-auto text-gray-500 mb-2" size={48} />
                        <p className="text-gray-400">No hay cupones creados aún.</p>
                    </div>
                )}
            </div>

            {/* Modal de Creación */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-xl font-serif text-white mb-6">Crear Nuevo Cupón</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Código</label>
                                <input
                                    type="text"
                                    value={newCoupon.code}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                    placeholder="EJ: VERANO2026"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-gold font-mono uppercase text-white placeholder-gray-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Tipo</label>
                                    <select
                                        value={newCoupon.type}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as 'percentage' | 'fixed' })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-gold text-white"
                                    >
                                        <option value="percentage" className="bg-[#111]">Porcentaje (%)</option>
                                        <option value="fixed" className="bg-[#111]">Monto Fijo ($)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Valor</label>
                                    <input
                                        type="number"
                                        value={newCoupon.value || ''}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                                        placeholder="10 o 50000"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-gold text-white placeholder-gray-600"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Fecha de Expiración (Opcional)</label>
                                <input
                                    type="date"
                                    value={expirationDate}
                                    onChange={(e) => setExpirationDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-gold text-white color-scheme-dark"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Límite de Usos (Opc)</label>
                                    <input
                                        type="number"
                                        value={newCoupon.usageLimit || ''}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: Number(e.target.value) })}
                                        placeholder="∞"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-gold text-white placeholder-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Min. Compra (Opc)</label>
                                    <input
                                        type="number"
                                        value={newCoupon.minPurchase || ''}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, minPurchase: Number(e.target.value) })}
                                        placeholder="$0"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-gold text-white placeholder-gray-600"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveCoupon}
                                className="w-full bg-gold text-black py-3 rounded-lg font-bold uppercase tracking-wider hover:bg-gold/90 transition-colors mt-2"
                            >
                                Guardar Cupón
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCoupons;
