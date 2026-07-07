import React, { useEffect, useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../Layout/Navbar';
import Footer from '../Layout/Footer';

import { Order } from '../../types';
import { Package, Calendar, MapPin, ChevronDown, ChevronUp, MessageCircle, User, X, Trash2, FileText, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import OrderChat from '../OrderChat';
import InvoiceModal from './InvoiceModal';
import AddressBook from './AddressBook';
import { parseFirestoreDate } from '../../utils/dateUtils';
import {
    loadWompiScript,
    generateSignature,
    WOMPI_PUBLIC_KEY,
    WOMPI_INTEGRITY_SECRET,
    WompiWidgetConfig
} from '../../utils/wompi';
import { showToast } from '../../components/ToastContainer';



const OrdersPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [chatOrder, setChatOrder] = useState<Order | null>(null);
    const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [retryingPaymentId, setRetryingPaymentId] = useState<string | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null); // State for delete modal

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        console.log('👤 Escuchando pedidos para:', currentUser.email);
        setLoading(true);

        const q = query(
            collection(db, 'orders'),
            where('customer.email', '==', currentUser.email)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('📦 Actualización de pedidos. Docs:', snapshot.docs.length);

            const ordersData: Order[] = snapshot.docs.map(doc => {
                const data = doc.data();
                // Debug log for every order to trace status
                console.log(`DETAILS: ID=${doc.id}, Status=${data.status}, Email=${data.customer?.email}`);
                return {
                    id: doc.id,
                    ...data
                } as Order;
            });

            // Sort newest first
            ordersData.sort((a, b) => {
                const timeA = parseFirestoreDate(a.createdAt)?.getTime() || 0;
                const timeB = parseFirestoreDate(b.createdAt)?.getTime() || 0;
                return timeB - timeA;
            });

            setOrders(ordersData);
            setLoading(false);
        }, (error) => {
            console.error("❌ Error en listener de pedidos:", error);
            showToast('Error al cargar pedidos en tiempo real.', 'error');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);
    // RE-INJECTING useEffect details is risky if I don't copy exactly.
    // I'll try to target specific blocks. 

    const toggleOrder = (orderId: string) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    const formatDate = (timestamp: any) => {
        const date = parseFirestoreDate(timestamp);
        if (!date) return '';
        return new Intl.DateTimeFormat('es-CO', {
            dateStyle: 'long',
            timeStyle: 'short'
        }).format(date);
    };

    const handleDeleteOrder = (orderId: string) => {
        setOrderToDelete(orderId);
    };

    const confirmDelete = async () => {
        if (!orderToDelete) return;

        try {
            await deleteDoc(doc(db, 'orders', orderToDelete));
            setOrders(prev => prev.filter(o => o.id !== orderToDelete));
            showToast('Pedido eliminado correctamente', 'success');
        } catch (error) {
            console.error("Error elimination order:", error);
            showToast('Error al eliminar el pedido', 'error');
        } finally {
            setOrderToDelete(null);
        }
    };

    // Status Helpers
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-yellow-500 bg-yellow-500/10';
            case 'processing': return 'text-blue-500 bg-blue-500/10';
            case 'shipped': return 'text-purple-500 bg-purple-500/10';
            case 'delivered': return 'text-green-500 bg-green-500/10';
            case 'cancelled': return 'text-red-500 bg-red-500/10';
            case 'rejected':
            case 'declined':
            case 'error': return 'text-red-600 bg-red-600/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'processing': return 'En Proceso';
            case 'shipped': return 'Enviado';
            case 'delivered': return 'Entregado';
            case 'cancelled': return 'Cancelado';
            case 'rejected': return 'Rechazado';
            case 'declined': return 'Rechazado';
            case 'error': return 'Error Pago';
            default: return status;
        }
    };

    const handleRetryPayment = async (order: Order) => {
        setRetryingPaymentId(order.id);
        try {
            await loadWompiScript();
            const amountInCents = Math.round(order.total * 100);
            const currency = 'COP';
            // Unique ref for retry
            const reference = `${order.id}-${Date.now().toString().slice(-6)}`;
            const integritySignature = await generateSignature(reference, amountInCents, currency, WOMPI_INTEGRITY_SECRET);

            // Clean phone logic
            const cleanPhone = (order.customer.phone || '').replace(/\D/g, '').slice(-10);

            const checkoutConfig: WompiWidgetConfig = {
                currency,
                amountInCents,
                reference,
                publicKey: WOMPI_PUBLIC_KEY,
                signature: { integrity: integritySignature },
                redirectUrl: 'https://rostrodorado-clinic.web.app/mis-pedidos',
                customerData: {
                    email: order.customer.email,
                    fullName: order.customer.name || `${order.customer.firstName} ${order.customer.lastName}`,
                    phoneNumber: cleanPhone,
                    phoneNumberPrefix: '+57',
                    legalId: order.customer.identification || '',
                    legalIdType: 'CC'
                },
                shippingAddress: {
                    addressLine1: order.customer.address,
                    city: order.customer.city,
                    phoneNumber: order.customer.phone || '',
                    region: order.customer.department,
                    country: 'CO'
                }
            };

            // @ts-ignore
            const checkout = new WidgetCheckout(checkoutConfig);

            checkout.open(async (result: any) => {
                const transaction = result.transaction;
                if (transaction.status === 'APPROVED') {
                    // Update Local State
                    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'processing', paymentStatus: 'approved' } : o));
                    showToast('¡Pago exitoso!', 'success');

                    // In background update DB
                    /* This relies on the callback working but since we are client side, we might ideally refresh or update doc */
                } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
                    showToast(transaction.statusMessage || 'Transacción rechazada.', 'error');
                }
            });

        } catch (e) {
            console.error(e);
            showToast('Error al reintentar pago', 'error');
        } finally {
            setRetryingPaymentId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#0a0a0a] selection:bg-gold selection:text-white">
            <Navbar />

            <main className="flex-grow pt-32 pb-24 px-6 md:px-12 max-w-[1000px] mx-auto w-full">
                {/* Header Profile Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                    <div>
                        <h1 className="font-serif text-4xl text-white mb-2">Mi Perfil</h1>
                        {currentUser?.displayName ? (
                            <div className="mb-1">
                                <p className="text-xl text-gold font-serif">{currentUser.displayName}</p>
                                <p className="text-white/50 text-sm">{currentUser.email}</p>
                            </div>
                        ) : (
                            <p className="text-xl text-gold font-serif mb-1">{currentUser?.email}</p>
                        )}
                        <p className="text-white/50 text-xs">Gestiona tus pedidos y direcciones</p>
                    </div>

                    <button
                        onClick={() => setShowAddressModal(true)}
                        className="flex items-center gap-2 bg-white/5 hover:bg-gold hover:text-black border border-white/10 text-white px-6 py-3 rounded-xl transition-all font-bold text-sm uppercase tracking-wider"
                    >
                        <MapPin size={18} />
                        Gestionar Direcciones
                    </button>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                        <Package size={48} className="text-white/20 mx-auto mb-4" />
                        <h3 className="text-xl text-white font-serif mb-2">No tienes pedidos aún</h3>
                        <p className="text-white/50 mb-8">Cuando realices una compra, aparecerá aquí.</p>
                        <Link
                            to="/productos"
                            className="inline-block bg-gold text-black uppercase tracking-widest text-xs font-bold px-8 py-4 hover:bg-white transition-colors rounded-lg"
                        >
                            Ir a la Tienda
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <h2 className="text-white font-serif text-2xl mb-6">Mis Pedidos</h2>
                        {orders.map((order) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                            >
                                <div
                                    className="p-6 cursor-pointer hover:bg-white/5 transition-colors flex flex-col md:flex-row gap-6 md:items-center justify-between"
                                    onClick={() => toggleOrder(order.id)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-2">
                                            <span className="font-mono text-gold text-sm">#{order.id.slice(0, 8)}</span>
                                            <span className={`text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold ${getStatusColor(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                            {/* Payment Status Badge */}
                                            {order.paymentStatus === 'approved' && (
                                                <span className="text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold bg-green-500/20 text-green-500">
                                                    PAGADO
                                                </span>
                                            )}
                                            {(order.status === 'pending' || order.status === 'rejected' || order.status === 'declined' || order.status === 'error') && order.paymentStatus !== 'approved' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRetryPayment(order);
                                                        }}
                                                        disabled={retryingPaymentId === order.id}
                                                        className="text-xs px-4 py-1.5 rounded-full uppercase tracking-wider font-bold bg-gold text-black hover:bg-white transition-colors disabled:opacity-50"
                                                    >
                                                        {retryingPaymentId === order.id ? '...' : 'Pagar Ahora'}
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteOrder(order.id);
                                                        }}
                                                        className="p-1.5 text-white/30 hover:text-red-500 transition-colors"
                                                        title="Eliminar pedido"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1 items-end text-sm">
                                            <p className="text-white/70">
                                                <span className="text-gold">Guía{order.shippingProvider && order.shippingProvider !== 'Envioclick' ? ` (${order.shippingProvider})` : ''}:</span> {order.trackingNumber}
                                            </p>
                                            {order.trackingStatus && (
                                                <p className="text-white/50 text-xs uppercase tracking-wider">
                                                    Estado: {order.trackingStatus}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-white/50 text-sm">
                                            <Calendar size={14} />
                                            {formatDate(order.createdAt)}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:gap-12">
                                        <div className="text-right">
                                            <p className="text-xs uppercase tracking-widest text-white/50 mb-1">Total</p>
                                            <p className="font-serif text-xl text-white">${order.total.toLocaleString()}</p>
                                        </div>
                                        {expandedOrder === order.id ? <ChevronUp className="text-gold" /> : <ChevronDown className="text-white/50" />}
                                    </div>
                                </div>

                                {expandedOrder === order.id && (
                                    <div className="border-t border-white/10 bg-black/20 p-6">
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div>
                                                <h4 className="text-xs uppercase tracking-widest text-gold mb-4">Productos</h4>
                                                <div className="space-y-4">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex gap-4 items-center">
                                                            <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <p className="text-white text-sm font-medium">{item.name}</p>
                                                                <p className="text-white/50 text-xs">Cant: {item.quantity} x ${item.price.toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-xs uppercase tracking-widest text-gold mb-4">Detalles de Envío</h4>
                                                <div className="space-y-2 text-sm text-white/70">
                                                    <p><span className="text-white/30 block text-xs mb-1 uppercase tracking-wider">Dirección</span> {order.customer.address}</p>
                                                    <p><span className="text-white/30 block text-xs mb-1 uppercase tracking-wider">Ubicación</span> {order.customer.city}, {order.customer.department}</p>
                                                    {order.trackingNumber && (
                                                        <div className="mt-2 bg-white/5 p-3 rounded-lg border border-white/10">

                                                            {/* Only show Carrier if it's not the generic 'Envioclick' */}
                                                            {order.shippingProvider && order.shippingProvider !== 'Envioclick' && (
                                                                <p className="flex justify-between items-center mb-1">
                                                                    <span className="text-white/30 text-xs uppercase tracking-wider">Transportadora</span>
                                                                    <span className="text-gold font-bold text-xs uppercase">{order.shippingProvider}</span>
                                                                </p>
                                                            )}

                                                            <p className="flex justify-between items-center mb-1">
                                                                <span className="text-white/30 text-xs uppercase tracking-wider">Guía</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-white select-all">{order.trackingNumber}</span>
                                                                    {order.shippingProvider && order.shippingProvider !== 'Envioclick' && (
                                                                        <a
                                                                            href={(() => {
                                                                                const carrier = order.shippingProvider?.toLowerCase() || '';
                                                                                const tracking = order.trackingNumber || '';
                                                                                if (carrier.includes('coordinadora')) return `https://www.coordinadora.com/portafolio-de-servicios/herramientas-cliente/rastrear-guias/?guia=${tracking}`;
                                                                                if (carrier.includes('interrapidisimo')) return `https://www.interrapidisimo.com/sigue-tu-envio/?guia=${tracking}`;
                                                                                if (carrier.includes('servientrega')) return `https://www.servientrega.com/wps/portal/rastreo-envio?guia=${tracking}`;
                                                                                if (carrier.includes('tcc')) return `https://tcc.com.co/logistica/rastrear?guia=${tracking}`;
                                                                                if (carrier.includes('envia')) return `https://envia.co/rastreo?guia=${tracking}`;
                                                                                return `https://www.google.com/search?q=rastreo+guia+${carrier}+${tracking}`;
                                                                            })()}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-gold hover:text-white transition-colors"
                                                                            title={`Rastrear en ${order.shippingProvider}`}
                                                                        >
                                                                            <ExternalLink size={14} />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </p>
                                                            {order.trackingStatus && (
                                                                <p className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                                                                    <span className="text-white/30 text-xs uppercase tracking-wider">Estado</span>
                                                                    <span className="text-white/70 text-xs uppercase font-bold">{order.trackingStatus}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {order.customer.notes && (
                                                        <p className="mt-4"><span className="text-white/30 block text-xs mb-1 uppercase tracking-wider">Notas</span> "{order.customer.notes}"</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (order.paymentStatus === 'approved') {
                                                        setChatOrder(order);
                                                    }
                                                }}
                                                disabled={order.paymentStatus !== 'approved'}
                                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
                                                    order.paymentStatus === 'approved' 
                                                    ? 'bg-gold/20 hover:bg-gold/30 text-gold border-gold/30'
                                                    : 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed'
                                                }`}
                                            >
                                                <MessageCircle size={18} />
                                                <span className="text-sm font-bold uppercase tracking-wider">
                                                    {order.paymentStatus === 'approved' ? 'Chat / Ayuda' : 'Chat no disponible'}
                                                </span>
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setInvoiceOrder(order);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
                                            >
                                                <FileText size={18} />
                                                <span className="text-sm font-bold uppercase tracking-wider">Ver Recibo</span>
                                            </button>

                                            {order.shippingLabelUrl && (
                                                <a
                                                    href={order.shippingLabelUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors border border-purple-500/30"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Package size={18} />
                                                    <span className="text-sm font-bold uppercase tracking-wider">Ver Guía</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />

            {/* Address Modal */}
            <AnimatePresence>
                {showAddressModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl"
                        >
                            <div className="p-2">
                                <AddressBook isModal={true} onClose={() => setShowAddressModal(false)} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Invoice Modal */}
            <AnimatePresence>
                {invoiceOrder && (
                    <InvoiceModal
                        order={invoiceOrder}
                        onClose={() => setInvoiceOrder(null)}
                    />
                )}
            </AnimatePresence>

            {/* Order Chat Modal */}
            {chatOrder && (
                <OrderChat
                    order={chatOrder}
                    isOpen={!!chatOrder}
                    onClose={() => setChatOrder(null)}
                    isAdmin={false}
                />
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {orderToDelete && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl"
                        >
                            <h3 className="text-xl font-serif text-white mb-2">Eliminar Pedido</h3>
                            <p className="text-white/60 text-sm mb-6">
                                ¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setOrderToDelete(null)}
                                    className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold transition-all"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrdersPage;
