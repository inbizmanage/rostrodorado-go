import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { products } from '../data/products';

export const migrateProductsToFirestore = async () => {
    console.log('Starting product migration...');

    try {
        for (const product of products) {
            // Remove the id field since Firestore will generate one
            const { id, ...productData } = product;

            const docRef = await addDoc(collection(db, 'products'), productData);
            console.log(`Migrated product: ${product.name} with ID: ${docRef.id}`);
        }

        console.log('✅ All products migrated successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error migrating products:', error);
        return false;
    }
};
