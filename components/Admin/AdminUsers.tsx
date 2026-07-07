import React, { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, Order, Payment } from '../../types';
import { Users, Mail, Calendar, Shield, X, ShoppingBag, CreditCard } from 'lucide-react';
import { parseFirestoreDate } from '../../utils/dateUtils';

const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [userOrders, setUserOrders] = useState<Order[]>([]);
    const [userPayments, setUserPayments] = useState<Payment[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firestore timeout')), 3000)
        );

        try {
            const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            const querySnapshot = await Promise.race([getDocs(q), timeoutPromise]) as any;
            const usersData: UserProfile[] = querySnapshot.docs.map((doc: any) => ({
                ...doc.data()
            } as UserProfile));
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserHistory = async (user: UserProfile) => {
        setSelectedUser(user);
        setLoadingHistory(true);
        setUserOrders([]);
        setUserPayments([]);

        try {
            // Fetch Orders
            const ordersQ = query(collection(db, 'orders'), where('userId', '==', user.uid));
            const ordersSnapshot = await getDocs(ordersQ);
            const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
                .sort((a, b) => {
                    const dateA = parseFirestoreDate(a.createdAt)?.getTime() || 0;
                    const dateB = parseFirestoreDate(b.createdAt)?.getTime() || 0;
                    return dateB - dateA;
                });
            setUserOrders(orders);

            // Fetch Payments
            const paymentsQ = query(collection(db, 'payments'), where('userId', '==', user.uid));
            const paymentsSnapshot = await getDocs(paymentsQ);
            const payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment))
                .sort((a, b) => {
                    const dateA = parseFirestoreDate(a.createdAt)?.getTime() || 0;
                    const dateB = parseFirestoreDate(b.createdAt)?.getTime() || 0;
                    return dateB - dateA;
                });
            setUserPayments(payments);

        } catch (error) {
            console.error("Error fetching user history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const formatDate = (timestamp: any) => {
        const date = parseFirestoreDate(timestamp);
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('es-CO', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'processing': return 'Procesando';
            case 'shipped': return 'Enviado';
            case 'delivered': return 'Entregado';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    if (loading) {
        return <div className="text-white/50">Cargando usuarios...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-serif text-white">Usuarios Registrados</h2>
                <div className="text-white/50 text-sm">Total: {users.length} usuarios</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user, idx) => (
                    <motion.div
                        key={user.uid}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 cursor-pointer transition-all"
                        onClick={() => fetchUserHistory(user)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                                <span className="text-gold font-bold text-lg">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                </span>
                            </div>
                            {user.role === 'admin' && (
                                <div className="bg-gold/20 text-gold px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1">
                                    <Shield size={12} />
                                    Admin
                                </div>
                            )}
                        </div>

                        <h3 className="text-white font-bold text-lg mb-1">{user.displayName}</h3>

                        <div className="space-y-2 text-sm text-white/60">
                            <div className="flex items-center gap-2">
                                <Mail size={14} />
                                <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span>Registro: {formatDate(user.createdAt)}</span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10 text-gold text-xs font-bold uppercase tracking-wider text-center">
                                Ver Historial
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* User Details Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#111] z-10">
                            <div>
                                <h3 className="text-2xl font-serif text-white">{selectedUser.displayName}</h3>
                                <p className="text-white/50 text-sm">{selectedUser.email}</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-white/50 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {loadingHistory ? (
                                <div className="text-center py-8 text-white/50">Cargando historial...</div>
                            ) : (
                                <>
                                    {/* Contact Info from Latest Order */}
                                    <div className="bg-white/5 p-6 rounded-lg border border-white/10 mb-8">
                                        <h4 className="text-gold uppercase tracking-widest text-sm font-bold mb-4 flex items-center gap-2">
                                            <Users size={16} /> Datos de Contacto (Último Pedido)
                                        </h4>
                                        {userOrders.length > 0 && userOrders[0].customer ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
                                                <div>
                                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Teléfono</p>
                                                    <p>{userOrders[0].customer.phone || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Cédula</p>
                                                    <p>{userOrders[0].customer.identification || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Dirección</p>
                                                    <p>{userOrders[0].customer.address}</p>
                                                    {userOrders[0].customer.notes && <p className="text-white/50 text-xs italic mt-1">"{userOrders[0].customer.notes}"</p>}
                                                </div>
                                                <div>
                                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Ubicación</p>
                                                    <p>{userOrders[0].customer.city}, {userOrders[0].customer.department}</p>
                                                    {userOrders[0].customer.postalCode && <p className="text-white/50 text-xs">CP: {userOrders[0].customer.postalCode}</p>}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-white/30 text-sm italic">
                                                Este usuario no tiene pedidos recientes con información de contacto.
                                            </p>
                                        )}
                                    </div>

                                    {/* Orders Section */}
                                    <div>
                                        <h4 className="flex items-center gap-2 text-gold uppercase tracking-widest text-sm font-bold mb-4">
                                            <ShoppingBag size={16} /> Pedidos ({userOrders.length})
                                        </h4>
                                        {userOrders.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm text-white/70">
                                                    <thead className="bg-white/5 text-xs uppercase">
                                                        <tr>
                                                            <th className="p-3">ID</th>
                                                            <th className="p-3">Estado</th>
                                                            <th className="p-3">Total</th>
                                                            <th className="p-3">Fecha</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {userOrders.map(order => (
                                                            <tr key={order.id}>
                                                                <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                                                                <td className="p-3">{getStatusText(order.status)}</td>
                                                                <td className="p-3">{formatCurrency(order.total)}</td>
                                                                <td className="p-3">{formatDate(order.createdAt)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-white/30 text-sm italic">Sin pedidos registrados.</p>
                                        )}
                                    </div>

                                    {/* Payments Section */}
                                    <div>
                                        <h4 className="flex items-center gap-2 text-gold uppercase tracking-widest text-sm font-bold mb-4">
                                            <CreditCard size={16} /> Pagos ({userPayments.length})
                                        </h4>
                                        {userPayments.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm text-white/70">
                                                    <thead className="bg-white/5 text-xs uppercase">
                                                        <tr>
                                                            <th className="p-3">ID Transacción</th>
                                                            <th className="p-3">Estado</th>
                                                            <th className="p-3">Monto</th>
                                                            <th className="p-3">Método</th>
                                                            <th className="p-3">Ref. Pedido</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {userPayments.map(payment => (
                                                            <tr key={payment.id}>
                                                                <td className="p-3 font-mono text-xs">{payment.id}</td>
                                                                <td className="p-3">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${payment.status === 'APPROVED' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                                                        }`}>
                                                                        {payment.status}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3">{formatCurrency(payment.amountInCents / 100)}</td>
                                                                <td className="p-3">{payment.paymentMethod}</td>
                                                                <td className="p-3 font-mono text-xs">{payment.orderId.slice(0, 8)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-white/30 text-sm italic">Sin pagos registrados.</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            {users.length === 0 && (
                <div className="bg-white/5 border border-white/10 p-12 rounded-xl text-center">
                    <Users size={48} className="text-white/20 mx-auto mb-4" />
                    <p className="text-white/50">No hay usuarios registrados</p>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
