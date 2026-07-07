import React, { useState, useEffect, useRef } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, Lock } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ChatMessage, Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { parseFirestoreDate } from '../utils/dateUtils';

interface OrderChatProps {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
    isAdmin?: boolean;
}

const OrderChat: React.FC<OrderChatProps> = ({ order, isOpen, onClose, isAdmin = false }) => {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Real-time messages subscription
    useEffect(() => {
        if (!isOpen || !order.id) return;

        const messagesRef = collection(db, 'orders', order.id, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: ChatMessage[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ChatMessage));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [isOpen, order.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || !currentUser) return;

        setSending(true);
        try {
            const messagesRef = collection(db, 'orders', order.id, 'messages');
            await addDoc(messagesRef, {
                orderId: order.id,
                senderId: currentUser.uid,
                senderName: isAdmin ? 'Rostro Dorado' : (currentUser.displayName || 'Cliente'),
                senderRole: isAdmin ? 'admin' : 'customer',
                message: newMessage.trim(),
                createdAt: serverTimestamp()
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#111] border border-white/20 rounded-2xl w-full max-w-lg h-[70vh] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-gold/20 p-2 rounded-lg">
                                    <MessageCircle size={20} className="text-gold" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">Chat del Pedido</h3>
                                    <p className="text-white/50 text-xs">#{order.id?.slice(-6).toUpperCase() || 'N/A'}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white/50 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Order Details */}
                        <div className="p-3 bg-white/5 border-b border-white/10">
                            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-black/30 rounded-lg p-2 flex-shrink-0">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="max-w-[120px]">
                                            <p className="text-white text-xs font-medium truncate">{item.name}</p>
                                            <p className="text-white/40 text-[10px]">x{item.quantity} · ${item.price?.toLocaleString() || 0}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-2 text-xs">
                                <span className="text-white/40">{order.customer?.firstName ? `${order.customer.firstName} ${order.customer.lastName}` : 'Cliente'}</span>
                                <span className="text-gold font-bold">Total: ${order.total?.toLocaleString() || 0}</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-white/30 text-center text-sm">
                                        No hay mensajes aún.<br />
                                        {isAdmin ? 'Inicia la conversación con el cliente.' : 'Envía un mensaje si tienes dudas.'}
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = (isAdmin && msg.senderRole === 'admin') || (!isAdmin && msg.senderRole === 'customer');
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] p-3 rounded-xl ${isMe
                                                    ? 'bg-gold text-black rounded-br-sm'
                                                    : 'bg-white/10 text-white rounded-bl-sm'
                                                    }`}
                                            >
                                                <p className={`text-[10px] uppercase tracking-wider mb-1 ${isMe ? 'text-black/60' : 'text-white/50'}`}>
                                                    {msg.senderName}
                                                </p>
                                                <p className="text-sm">{msg.message}</p>
                                                <p className={`text-[10px] mt-1 ${isMe ? 'text-black/40' : 'text-white/30'}`}>
                                                    {parseFirestoreDate(msg.createdAt)?.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) || '...'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10">
                            {order.status === 'delivered' ? (
                                <div className="flex flex-col items-center justify-center py-6 space-y-2 opacity-50">
                                    <div className="p-3 rounded-full bg-white/5">
                                        <Lock size={16} className="text-white" />
                                    </div>
                                    <p className="text-xs uppercase tracking-widest text-white font-medium">
                                        Chat Finalizado
                                    </p>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Escribe un mensaje..."
                                        className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-gold transition-colors"
                                        disabled={sending}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!newMessage.trim() || sending}
                                        className={`p-3 rounded-xl transition-colors ${newMessage.trim() && !sending
                                            ? 'bg-gold text-black hover:bg-white'
                                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                                            }`}
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OrderChat;
