import React, { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { collection, getDocs, query, orderBy, collectionGroup, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Order, ChatMessage } from '../../types';
import { MessageCircle, Package, User, ChevronRight } from 'lucide-react';
import OrderChat from '../OrderChat';
import { parseFirestoreDate } from '../../utils/dateUtils';

const AdminChats: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [chatCounts, setChatCounts] = useState<{ [orderId: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetchOrdersWithChats();
    }, []);

    const fetchOrdersWithChats = async () => {
        try {
            // Fetch all orders
            const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
            const ordersSnapshot = await getDocs(ordersQuery);
            const ordersData: Order[] = ordersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Order));

            setOrders(ordersData);

            // Count messages for each order
            const counts: { [orderId: string]: number } = {};
            for (const order of ordersData) {
                const messagesRef = collection(db, 'orders', order.id, 'messages');
                const messagesSnapshot = await getDocs(messagesRef);
                counts[order.id] = messagesSnapshot.docs.length;
            }
            setChatCounts(counts);

        } catch (error) {
            console.error('Error fetching orders with chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: any) => {
        const date = parseFirestoreDate(timestamp);
        if (!date) return '';
        return new Intl.DateTimeFormat('es-CO', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-serif text-white">Chats de Clientes</h2>
                <div className="flex items-center gap-4">
                    <p className="text-white/50 text-sm">{orders.length} pedidos totales</p>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'all', label: 'Todos' },
                    { id: 'paid', label: 'Pagados' },
                    { id: 'pending_payment', label: 'Pendientes de Pago' },
                    { id: 'processing', label: 'En Proceso' },
                    { id: 'shipped', label: 'Enviados' },
                    { id: 'delivered', label: 'Entregados' },
                    { id: 'cancelled', label: 'Cancelados' },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-colors border ${filter === f.id
                                ? 'bg-gold text-black border-gold'
                                : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="grid gap-4">
                {orders.filter(order => {
                    // CRITICAL RULE: NEVER SHOW CHATS FOR UNPAID ORDERS
                    if (order.paymentStatus !== 'approved') return false;

                    if (filter === 'all') return true;
                    if (filter === 'paid') return order.paymentStatus === 'approved';
                    if (filter === 'pending_payment') return order.paymentStatus !== 'approved';
                    return order.status === filter;
                }).map((order) => {
                    const messageCount = chatCounts[order.id] || 0;
                    const hasMessages = messageCount > 0;
                    const isPaid = order.paymentStatus === 'approved';

                    return (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => {
                                if (isPaid || hasMessages) setSelectedOrder(order);
                            }}
                            className={`bg-white/5 border rounded-xl p-4 transition-all group ${
                                isPaid || hasMessages ? 'cursor-pointer hover:bg-white/10' : 'cursor-not-allowed opacity-60'
                            } ${hasMessages ? 'border-gold/30' : 'border-white/10'}`}
                        >
                            <div className="flex items-center gap-4">
                                {/* Chat Icon with Count */}
                                <div className={`relative p-3 rounded-xl ${hasMessages ? 'bg-gold/20' : 'bg-white/5'}`}>
                                    <MessageCircle size={24} className={hasMessages ? 'text-gold' : 'text-white/30'} />
                                    {hasMessages && (
                                        <span className="absolute -top-1 -right-1 bg-gold text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                            {messageCount}
                                        </span>
                                    )}
                                </div>

                                {/* Order Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-mono text-gold text-sm">#{order.id?.slice(0, 8) || 'N/A'}</span>
                                        <span className="text-white/50 text-xs">{formatDate(order.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/70 text-sm">
                                        <User size={14} />
                                        <span className="truncate">{order.customer?.firstName ? `${order.customer.firstName} ${order.customer.lastName}` : 'Cliente'}</span>
                                    </div>
                                </div>

                                {/* Products Preview */}
                                <div className="hidden md:flex items-center gap-2">
                                    {order.items?.slice(0, 2).map((item, idx) => (
                                        <div key={idx} className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    {order.items && order.items.length > 2 && (
                                        <span className="text-white/30 text-xs">+{order.items.length - 2}</span>
                                    )}
                                </div>

                                {/* Arrow */}
                                <ChevronRight size={20} className="text-white/30 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                            </div>

                            {/* Product List (condensed) */}
                            <div className="mt-3 pt-3 border-t border-white/5">
                                <div className="flex items-center gap-2 text-xs text-white/40">
                                    <Package size={12} />
                                    <span className="truncate">
                                        {order.items?.map(i => i.name).join(', ') || 'Sin productos'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {orders.filter(order => {
                    // CRITICAL RULE: NEVER SHOW CHATS FOR UNPAID ORDERS
                    if (order.paymentStatus !== 'approved') return false;

                    if (filter === 'all') return true;
                    if (filter === 'paid') return order.paymentStatus === 'approved';
                    if (filter === 'pending_payment') return order.paymentStatus !== 'approved';
                    return order.status === filter;
                }).length === 0 && (
                        <div className="bg-white/5 border border-white/10 p-12 rounded-xl text-center">
                            <MessageCircle size={48} className="text-white/20 mx-auto mb-4" />
                            <p className="text-white/50">No hay chats para este filtro</p>
                        </div>
                    )}
            </div>

            {/* Chat Modal */}
            {selectedOrder && (
                <OrderChat
                    order={selectedOrder}
                    isOpen={!!selectedOrder}
                    onClose={() => {
                        setSelectedOrder(null);
                        fetchOrdersWithChats(); // Refresh counts
                    }}
                    isAdmin={true}
                />
            )}
        </div>
    );
};

export default AdminChats;
