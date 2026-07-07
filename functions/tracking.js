const functions = require('firebase-functions');
const admin = require('firebase-admin');
const envioclick = require('./envioclick');

/**
 * Update Tracking Status for active orders
 */
async function updateTracking() {
    try {
        console.log("Starting Tracking Update Job (Envioclick)...");

        // 1. Get orders that are "processing" or "shipped" AND have a tracking number
        const ordersRef = admin.firestore().collection('orders');
        const snapshot = await ordersRef
            .where('status', 'in', ['processing', 'shipped'])
            .get();

        if (snapshot.empty) {
            console.log("No active orders to track.");
            return;
        }

        const updates = [];

        for (const doc of snapshot.docs) {
            const order = doc.data();
            const trackingNumber = order.trackingNumber;

            if (!trackingNumber) continue;

            // 2. Call Envioclick Tracking API
            try {
                const trackResult = await envioclick.trackShipment(trackingNumber);

                if (trackResult.success) {
                    const currentStatus = trackResult.status;
                    const statusLower = (currentStatus || '').toLowerCase();

                    let newStatus = null;

                    // Map Status
                    // Envioclick statuses: "Pendiente de Recolección", "En Tránsito", "Entregado", etc.
                    if (statusLower.includes('entregado') || statusLower.includes('delivered')) {
                        newStatus = 'completed'; // Or 'delivered' if we use that in our system
                    } else if (statusLower.includes('transito') || statusLower.includes('recolección') || statusLower.includes('camino')) {
                        newStatus = 'shipped';
                    } else if (statusLower.includes('cancelado') || statusLower.includes('error')) {
                        newStatus = 'error'; // Or handle differently
                    }

                    // Only update if status changed
                    // Note: 'completed' usually maps to 'delivered' in some systems, but our Order type says 'delivered'
                    // Type: 'pending' | 'processing' | 'shipped' | 'delivered' | ...
                    if (newStatus === 'completed') newStatus = 'delivered';

                    if (newStatus && newStatus !== order.status) {
                        console.log(`Order ${doc.id} status changed: ${order.status} -> ${newStatus}`);
                        updates.push(doc.ref.update({
                            status: newStatus,
                            trackingStatus: currentStatus, // Save raw status description
                            trackingUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
                        }));
                    }
                }

            } catch (err) {
                console.error(`Failed to track order ${doc.id}:`, err.message);
            }
        }

        await Promise.all(updates);
        console.log(`Tracking Job Completed. Updated ${updates.length} orders.`);

    } catch (error) {
        console.error("Tracking Job Error:", error);
    }
}

module.exports = {
    updateTracking
};
