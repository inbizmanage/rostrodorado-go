import { collection, doc, setDoc, getDocs, writeBatch, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { products } from '../data/products';

export const initializeDatabase = async (onLog?: (msg: string) => void) => {
    const batch = writeBatch(db);

    const log = (msg: string) => {
        console.log(msg);
        if (onLog) onLog(msg);
    };

    try {
        log('🚀 Iniciando configuración de base de datos...');

        // 1. Initialize Products
        const productsRef = collection(db, 'products');
        const productsSnapshot = await getDocs(productsRef);

        if (productsSnapshot.empty) {
            log('📦 Creando colección de productos...');
            products.forEach((product) => {
                // Use the ID from the static data or generate a new one
                const docRef = doc(productsRef, product.id);
                // Remove id from data to avoid duplication in fields
                const { id, ...productData } = product;
                batch.set(docRef, productData);
            });
            log(`✅ ${products.length} productos preparados para inserción.`);
        } else {
            log('ℹ️ La colección de productos ya existe. Saltando...');
        }

        // 2. Initialize Orders (Force Sample)
        const ordersRef = collection(db, 'orders');
        const sampleOrderRef = doc(ordersRef, 'ejemplo_pedido');
        const sampleOrderSnap = await getDoc(sampleOrderRef);

        if (!sampleOrderSnap.exists()) {
            await setDoc(sampleOrderRef, {
                id: 'ejemplo_pedido',
                customer: { name: 'Cliente de Prueba', email: 'prueba@ejemplo.com' },
                total: 0,
                status: 'pending',
                createdAt: new Date(),
                isSample: true,
                note: 'Este es un pedido de ejemplo para que la colección sea visible.'
            });
            log('🛒 Pedido de ejemplo creado (Colección visible).');
        } else {
            log('ℹ️ El pedido de ejemplo ya existe.');
        }

        // 3. Initialize Users (Force Sample)
        const usersRef = collection(db, 'users');
        const sampleUserRef = doc(usersRef, 'usuario_ejemplo');
        const sampleUserSnap = await getDoc(sampleUserRef);

        if (!sampleUserSnap.exists()) {
            await setDoc(sampleUserRef, {
                uid: 'usuario_ejemplo',
                displayName: 'Usuario Ejemplo',
                email: 'usuario@ejemplo.com',
                role: 'customer',
                createdAt: new Date(),
                isSample: true
            });
            log('👥 Usuario de ejemplo creado.');
        } else {
            log('ℹ️ El usuario de ejemplo ya existe.');
        }

        // 4. Initialize Addresses (Force Sample)
        const addressesRef = collection(db, 'addresses');
        const sampleAddressRef = doc(addressesRef, 'direccion_ejemplo');
        const sampleAddressSnap = await getDoc(sampleAddressRef);

        if (!sampleAddressSnap.exists()) {
            await setDoc(sampleAddressRef, {
                address: 'Calle Falsa 123',
                city: 'Bogotá',
                createdAt: new Date(),
                isSample: true
            });
            log('📍 Dirección de ejemplo creada.');
        } else {
            log('ℹ️ La dirección de ejemplo ya existe.');
        }

        // Commit all batched writes
        await batch.commit();
        log('✨ ¡Base de datos inicializada y estructuras creadas!');

        return { success: true };
    } catch (error: any) {
        console.error("Database init error:", error);
        log(`❌ Error crítico: ${error.message}`);
        return { success: false };
    }
};
