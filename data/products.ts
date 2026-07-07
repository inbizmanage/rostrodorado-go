import { Product } from '../types';

export const products: Product[] = [
    {
        id: '1',
        name: 'Kit Post-Care RostroDorado',
        description: 'Rutina completa para maximizar los resultados de tu armonización.',
        longDescription: 'Nuestro Kit Post-Care ha sido diseñado específicamente para la recuperación y mantenimiento después de procedimientos estéticos. Combina limpieza suave, hidratación profunda y protección solar para asegurar que tu piel sane correctamente y los resultados perduren.',
        price: 250000,
        image: 'https://images.unsplash.com/photo-1556228720-198307a659cc?auto=format&fit=crop&q=80&w=800',
        category: 'Kits',
        ingredients: ['Ácido Hialurónico', 'Aloe Vera', 'Vitamina E', 'Pantenol'],
        usage: 'Usar mañana y noche. Paso 1: Limpiador. Paso 2: Sérum. Paso 3: Hidratante (solo noche). Paso 4: Protector Solar (solo día).',
        benefits: ['Acelera la recuperación', 'Reduce la inflamación', 'Protege de rayos UV', 'Mantiene la hidratación'],
        weight: 1 // Estimated kg
    },
    {
        id: '2',
        name: 'Sérum Hialurónico Puro',
        description: 'Hidratación profunda para mantener el volumen y brillo.',
        longDescription: 'Concentrado de Ácido Hialurónico de bajo y alto peso molecular. Penetra en las capas profundas de la piel para rellenar arrugas finas mientras crea una barrera protectora en la superficie para retener la humedad.',
        price: 120000,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
        category: 'Cuidado Facial',
        ingredients: ['Ácido Hialurónico 2%', 'Niacinamida', 'Agua Termal'],
        usage: 'Aplicar 3-4 gotas sobre la piel limpia y húmeda antes de tu crema hidratante.',
        benefits: ['Hidratación intensa', 'Efecto relleno inmediato', 'Mejora la textura de la piel'],
        weight: 0.2
    },
    {
        id: '3',
        name: 'Protector Solar Toque Seco',
        description: 'Protección esencial SPF 50+ sin efecto graso.',
        longDescription: 'Protector solar de amplio espectro (UVA/UVB) con textura ligera y acabado mate. Ideal para pieles mixtas a grasas y para uso diario después de tratamientos faciales.',
        price: 85000,
        image: 'https://images.unsplash.com/photo-1556228578-8d8959d5771c?auto=format&fit=crop&q=80&w=800',
        category: 'Protección',
        ingredients: ['Dióxido de Titanio', 'Óxido de Zinc', 'Vitamina C'],
        usage: 'Aplicar generosamente 15 minutos antes de la exposición solar. Reaplicar cada 4 horas.',
        benefits: ['Protección SPF 50+', 'No comedogénico', 'Acabado invisible', 'Antioxidante'],
        weight: 0.2
    },
    {
        id: '4',
        name: 'Crema Reparadora Noche',
        description: 'Regeneración celular intensiva mientras duermes.',
        longDescription: 'Fórmula rica en péptidos y ceramidas que trabaja durante el ciclo nocturno de reparación de la piel. Restaura la barrera cutánea y mejora la firmeza.',
        price: 95000,
        image: 'https://images.unsplash.com/photo-1617220029071-29eac1115849?auto=format&fit=crop&q=80&w=800',
        category: 'Cuidado Facial',
        ingredients: ['Ceramidas', 'Péptidos', 'Retinol Suave'],
        usage: 'Aplicar en rostro y cuello como último paso de tu rutina nocturna.',
        benefits: ['Reparación barrera cutánea', 'Estimula colágeno', 'Nutrición profunda'],
        weight: 0.3
    },
    {
        id: '5',
        name: 'Jabón Facial pH Balanceado',
        description: 'Limpieza suave que respeta la barrera natural de la piel.',
        longDescription: 'Limpiador facial sin sulfatos que elimina impurezas y maquillaje sin resecar la piel. Su pH balanceado es ideal para pieles sensibles o sensibilizadas por tratamientos.',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&q=80&w=800',
        category: 'Limpieza',
        ingredients: ['Extracto de Avena', 'Glicerina', 'Caléndula'],
        usage: 'Masajear sobre la piel húmeda y enjuagar con agua tibia.',
        benefits: ['Limpieza efectiva', 'Calma la irritación', 'No reseca'],
        weight: 0.3
    },
    {
        id: '6',
        name: 'Mascarilla Hidratante',
        description: 'Boost de hidratación instantánea para eventos especiales.',
        longDescription: 'Mascarilla de biocelulosa impregnada en un suero concentrado de vitaminas y antioxidantes. Proporciona un efecto "glow" inmediato, ideal para preparar la piel antes de maquillaje o eventos.',
        price: 60000,
        image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=800',
        category: 'Mascarillas',
        ingredients: ['Vitamina C', 'Ácido Hialurónico', 'Colágeno Hidrolizado'],
        usage: 'Dejar actuar por 20 minutos. Masajear el exceso de producto.',
        benefits: ['Luminosidad instantánea', 'Hidratación flash', 'Piel descansada'],
        weight: 0.1
    }
];

