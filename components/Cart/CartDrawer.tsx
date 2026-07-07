import React from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

const CartDrawer: React.FC = () => {
    const { cart, isCartOpen, toggleCart, updateQuantity, removeFromCart, cartTotal } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        toggleCart();
        navigate('/checkout');
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleCart}
                        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0f0f0f] border-l border-white/10 z-[70] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-white font-serif text-2xl flex items-center gap-2">
                                Tu Bolsa <ShoppingBag size={20} className="text-gold" />
                            </h2>
                            <button aria-label="Cerrar carrito" onClick={toggleCart} className="text-white/50 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-white/30 text-center">
                                    <ShoppingBag size={48} className="mb-4 opacity-50" />
                                    <p className="font-light">Tu bolsa está vacía</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="w-20 h-20 bg-white/5 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-white font-medium text-sm mb-1">{item.name}</h3>
                                            <p className="text-gold text-sm font-serif mb-3">${item.price.toLocaleString()}</p>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center bg-white/5 rounded-full border border-white/10">
                                                    <button
                                                        aria-label="Disminuir cantidad"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-1 px-2 text-white/50 hover:text-white transition-colors"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="text-white text-xs font-medium w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        aria-label="Aumentar cantidad"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 px-2 text-white/50 hover:text-white transition-colors"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                                <button
                                                    aria-label="Eliminar producto"
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-white/30 hover:text-red-400 transition-colors ml-auto"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {cart.length > 0 && (
                            <div className="p-6 border-t border-white/10 bg-[#0f0f0f]">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-white/50 font-light">Subtotal</span>
                                    <span className="text-white font-serif text-xl">${cartTotal.toLocaleString()}</span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    className="w-full relative overflow-hidden bg-gold text-black font-bold uppercase tracking-[0.2em] py-4 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] group"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Proceder al Pago
                                        <ShoppingBag size={16} className="group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300" />
                                    </span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
