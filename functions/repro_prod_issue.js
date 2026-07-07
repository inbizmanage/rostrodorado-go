const envioclick = require('./envioclick');

async function run() {
    const mockOrder = {
        customer: {
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
            phone: "3001234567",
            address: "Calle 123",
            city: "Bogotá",
            department: "Cundinamarca",
            neighborhood: "Chapinero", // Explicit neighborhood
            notes: "Apartment 101"
        },
        items: [
            {
                name: "Product 1",
                category: "Beauty",
                price: 50000,
                weight: 150,
                quantity: 1,
                dimensions: { length: 10, width: 10, height: 10 }
            }
        ],
        total: 50000,
        shippingOption: {
            carrier: "COORDINADORA" // Force Coordinadora to see if it needs specific fields
        }
    };

    console.log("Running createShipment with mock data...");
    const result = await envioclick.createShipment(mockOrder);
    console.log("Result:", result);
}

run();
