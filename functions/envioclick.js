const axios = require('axios');
const { findDaneCode, ORIGIN_CODE, ORIGIN_STATE } = require('./dane_codes');

const API_KEY = "6118c7fb-4b7d-4be9-92ce-503c55f40444";
const API_URL = "https://api.envioclickpro.com.co/api/v2";

const getHeaders = () => ({
    'Authorization': API_KEY, // Note: Docs say "key", check if "Bearer" needed. Docs example: "Authorization: 54ac..." (No Bearer)
    'Content-Type': 'application/json'
});

const ORIGIN_DATA = {
    "company": "Rostro Dorado Clinic",
    "firstName": "Rostro",
    "lastName": "Dorado",
    "email": "contacto@rostrodorado.com",
    "phone": "3000000000",
    "address": "Calle 12 #12-03 local 2",
    "suburb": "Centro",
    "crossStreet": "Calle 12",
    "reference": "Local 2",
    "daneCode": ORIGIN_CODE // Riohacha
};

/**
 * Quote Shipping Cost
 * Maps Envioclick response to our standard format.
 */
async function quoteShipping(data) {
    try {
        const { city, department, items, total } = data;
        console.log(`[Envioclick Quote] Request: ${city}, ${department}, Items: ${items?.length}, Total: ${total}`);

        const destination = findDaneCode(city, department);
        if (!destination) {
            console.error(`[Envioclick Quote] DANE Code NOT FOUND for: ${city}, ${department}`);
            return { success: false, error: `Ciudad no cubierta (${city}).` };
        }
        console.log(`[Envioclick Quote] DANE Match: ${destination.cityCode}`);

        // Calculate dimensional weight roughly if needed, or use provided dimensions
        // Envioclick requires packages array
        // FIX: Normalise weight (Grams -> Kg)
        const totalWeightRaw = items.reduce((acc, i) => acc + (i.weight || 500) * i.quantity, 0);
        const weightKg = totalWeightRaw > 10 ? totalWeightRaw / 1000 : totalWeightRaw;

        const packageData = {
            weight: Math.max(0.5, weightKg),
            height: 10, // Default or calculate max
            width: 10,
            length: 10
        };

        const payload = {
            "packages": [packageData],
            "description": "Productos de Belleza",
            "contentValue": total > 0 ? total : 20000,
            "origin": {
                "daneCode": ORIGIN_CODE,
                "address": ORIGIN_DATA.address
            },
            "destination": {
                "daneCode": destination.cityCode,
                "address": "Calle Principal" // Placeholder for quote
            }
        };

        const res = await axios.post(`${API_URL}/quotation`, payload, { headers: getHeaders() });
        // console.log("[Envioclick Quote] API Response Status:", res.status);

        if (res.data.status === 'OK' && res.data.data.rates) {
            console.log("RAW RATES EXTRACT:", JSON.stringify(res.data.data.rates.slice(0, 2), null, 2));
            // Map keys to match previous Envia format for Frontend compatibility
            const quotes = res.data.data.rates.map(rate => ({
                // Standard internal fields
                carrier: rate.carrier,
                service: rate.product,
                shippingCost: rate.flete,
                deliveryDay: rate.deliveryDays,

                // Envia-like structure for Frontend (CheckoutPage.tsx)
                deliveryCompany: {
                    companyName: rate.carrier,
                    deliveryEstimate: `${rate.deliveryDays} días hábiles`,
                    shippingCost: rate.flete,
                    service: rate.product
                },

                // Critical for Envioclick Generation
                idRate: rate.idRate,
                idProduct: rate.idProduct
            }));

            // Filter out non-viable options if needed
            return { success: true, quotes };
        } else {
            return { success: false, error: "No se encontraron cotizaciones." };
        }

    } catch (error) {
        console.error("[Envioclick Quote] API Error Payload:", JSON.stringify(error.response?.data || {}));
        console.error("Envioclick Quote Error Msg:", error.message);
        return { success: false, error: "Error al cotizar con Envioclick." };
    }
}

/**
 * Create Shipment
 * Uses idRate if fresh, or re-quotes if needed.
 */
async function createShipment(data) {
    try {
        const { customer, items, total, shippingOption } = data;

        const destination = findDaneCode(customer.city, customer.department);
        if (!destination) throw new Error("Invalid destination city.");

        // We assume shippingOption has idRate from the quote step.
        // But if it expired, we might fail. 
        // Strategy: Try with stored idRate. If fail, re-quote to get new idRate.

        let idRate = shippingOption?.idRate;

        // Construct Packages Object (Reusable)
        // Construct Packages Object (Reusable)
        // CRITICAL FIX: Convert weight from Grams to Kg.
        // If weight is > 10, assume it's Grams and divide. If < 10, assume it's already Kg.
        // This is a heuristic because DB has mixed units potentially.
        const totalWeightRaw = items.reduce((acc, i) => acc + (i.weight || 500) * i.quantity, 0);
        const weightKg = totalWeightRaw > 10 ? totalWeightRaw / 1000 : totalWeightRaw;

        const packageData = {
            weight: Math.max(0.5, weightKg), // Min 0.5 Kg
            height: 10,
            width: 10,
            length: 10
        };

        const buildShipmentPayload = (rateId) => ({
            "idRate": rateId,
            "myShipmentReference": `ORD-${Date.now()}`,
            "requestPickup": false,
            "insurance": true,
            "description": "Productos de Belleza",
            "contentValue": total > 0 ? total : 20000,
            "packages": [packageData],
            "origin": {
                ...ORIGIN_DATA,
                "firstName": "Rostro",
                "lastName": "Dorado",
            },
            "destination": {
                "company": "Particular", // Required min 2 chars, cannot be empty
                "firstName": customer.firstName,
                "lastName": customer.lastName,
                "email": customer.email,
                "phone": (customer.phone || '3000000000').replace(/\D/g, '').slice(-10) || '3000000000',
                "address": (customer.address || 'Calle Principal').slice(0, 40),
                "suburb": customer.neighborhood || "Centro", // Required field
                "crossStreet": "N/A",
                "reference": customer.notes || "Residencial",
                "daneCode": destination.cityCode
            }
        });

        // Try generation (Defaults to Sandbox for now, change URL for Prod)
        // CHECKOUT: Use `shipment_sandbox` for testing as per docs?
        // User wants to move to production eventually? 
        // Let's make it configurable. 
        // For now, let's assume PRODUCTION unless configured otherwise?
        // Actually, user gave up on Envia sandbox. 
        // Envioclick has specific sandbox endpoint: /shipment_sandbox

        const isSandbox = false; // PRODUCTION MODE
        const endpoint = isSandbox ? '/shipment_sandbox' : '/shipment';

        if (idRate) {
            try {
                const payload = buildShipmentPayload(idRate);
                console.log(`[CreateShipment] Attempting with ID: ${idRate}`);
                const res = await axios.post(`${API_URL}${endpoint}`, payload, { headers: getHeaders() });

                if (res.data.status === 'OK') {
                    return {
                        success: true,
                        trackingNumber: res.data.data.tracker,
                        labelUrl: res.data.data.url,
                        carrier: shippingOption?.carrier || "Envioclick"
                    };
                }
            } catch (e) {
                console.warn(`[CreateShipment] IdRate failed (${e.message}). Re-quoting...`);
            }
        }

        // Fallback: Re-Quote to get fresh idRate
        console.log("[CreateShipment] Re-quoting...");
        const quoteResult = await quoteShipping({
            city: customer.city,
            department: customer.department,
            items,
            total
        });

        if (quoteResult.success && quoteResult.quotes.length > 0) {
            const bestQuote = quoteResult.quotes.find(q => q.carrier === shippingOption?.carrier) || quoteResult.quotes[0];
            console.log(`[CreateShipment] New Quote ID: ${bestQuote.idRate} (${bestQuote.carrier})`);

            const payload = buildShipmentPayload(bestQuote.idRate);
            const res = await axios.post(`${API_URL}${endpoint}`, payload, { headers: getHeaders() });

            if (res.data.status === 'OK') {
                return {
                    success: true,
                    trackingNumber: res.data.data.tracker,
                    labelUrl: res.data.data.url,
                    carrier: bestQuote.carrier
                };
            }
        }

        throw new Error("Failed to generate shipment after retry.");

    } catch (error) {
        // ERROR HANDLING & PARSING
        const apiError = error.response?.data || {};
        let readableError = "Envioclick API Failed: Unknown error";

        // Try to extract specific message from Envioclick's nested structure
        // Structure: { status_messages: [ { error: [ "Unprocessed Entity", "No tiene suficiente crédito..." ] } ] }
        if (apiError.status_messages && Array.isArray(apiError.status_messages)) {
            const firstMsg = apiError.status_messages[0];
            if (firstMsg?.error && Array.isArray(firstMsg.error)) {
                // Join all error strings, e.g. "Unprocessed Entity. No tiene suficiente crédito..."
                readableError = firstMsg.error.join(' ');
            }
        } else if (apiError.message) {
            readableError = apiError.message;
        } else if (error.message) {
            readableError = error.message;
        }

        console.error("[CreateShipment] FINAL ERROR:", readableError);
        // Return success: false with the readable error so the Admin UI displays it
        return { success: false, error: readableError };
    }
}

/**
 * Track Shipment
 */
async function trackShipment(trackingCode) {
    try {
        const payload = { "trackingCode": trackingCode };
        // Post to /track
        const res = await axios.post(`${API_URL}/track`, payload, { headers: getHeaders() });

        if (res.data.status === 'OK' && res.data.data) {
            return {
                success: true,
                status: res.data.data.status,
                detail: res.data.data.statusDetail
            };
        }
        return { success: false, error: "Tracking not found" };
    } catch (error) {
        console.error("Envioclick Track Error:", error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { quoteShipping, createShipment, trackShipment };
