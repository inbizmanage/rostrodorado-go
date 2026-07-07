import { Timestamp } from 'firebase/firestore';

export const parseFirestoreDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;

    // If it's already a JS Date
    if (timestamp instanceof Date) return timestamp;

    // If it's a Firestore Timestamp (has toDate method)
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }

    // If it's a serialized Timestamp (from JSON import)
    if (timestamp.seconds !== undefined) {
        return new Date(timestamp.seconds * 1000);
    }

    // If it's a string (ISO format)
    if (typeof timestamp === 'string') {
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) return d;
    }

    return null;
};
