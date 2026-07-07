import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Coupon } from '../types';
import { showToast } from '../components/ToastContainer';

const toast = {
    success: (msg: string) => showToast(msg, 'success'),
    error: (msg: string) => showToast(msg, 'error'),
    info: (msg: string) => showToast(msg, 'info'),
};

export interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    cart: CartItem[];
    isCartOpen: boolean;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    cartTotal: number;
    cartCount: number;

    // Coupon Logic
    appliedCoupon: Coupon | null;
    discountAmount: number;
    totalWithDiscount: number;
    applyCoupon: (code: string) => Promise<boolean>;
    removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Coupon State
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
        // Reset coupon if cart is empty? Maybe not necessary but good UX
        if (cart.length === 0) setAppliedCoupon(null);
    }, [cart]);

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) return;
        setCart((prev) =>
            prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
        );
    };

    const clearCart = () => {
        setCart([]);
        setAppliedCoupon(null);
    };

    const toggleCart = () => {
        setIsCartOpen((prev) => !prev);
    };

    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    // Coupon Functions
    const applyCoupon = async (code: string): Promise<boolean> => {
        try {
            const { db } = await import('../firebase');
            const { collection, query, where, getDocs } = await import('firebase/firestore');

            const q = query(
                collection(db, 'coupons'),
                where('code', '==', code.toUpperCase()),
                where('isActive', '==', true)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                toast.error('Cupón no válido o expirado');
                return false;
            }

            const couponData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Coupon;

            // Advanced Validations
            if (couponData.expirationDate && new Date(couponData.expirationDate) < new Date()) {
                toast.error('El cupón ha expirado');
                return false;
            }

            if (couponData.usageLimit && couponData.usageCount >= couponData.usageLimit) {
                toast.error('Este cupón ha alcanzado su límite de uso');
                return false;
            }

            if (couponData.minPurchase && cartTotal < couponData.minPurchase) {
                toast.error(`La compra mínima para este cupón es $${couponData.minPurchase.toLocaleString()}`);
                return false;
            }

            setAppliedCoupon(couponData);
            toast.success(`Cupón ${code} aplicado correctamente`);
            return true;

        } catch (error) {
            console.error('Error applying coupon:', error);
            toast.error('Error al validar el cupón');
            return false;
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        toast.info('Cupón eliminado');
    };

    // Calculate Discount
    let discountAmount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'percentage') {
            discountAmount = (cartTotal * appliedCoupon.value) / 100;
        } else {
            discountAmount = appliedCoupon.value;
        }
    }
    // Prevent negative total
    const totalWithDiscount = Math.max(0, cartTotal - discountAmount);


    return (
        <CartContext.Provider
            value={{
                cart,
                isCartOpen,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                toggleCart,
                cartTotal,
                cartCount,
                appliedCoupon,
                discountAmount,
                totalWithDiscount,
                applyCoupon,
                removeCoupon
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
