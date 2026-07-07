import React from 'react';
import LegalLayout from './LegalLayout';

const PoliticaEnvios = () => {
    return (
        <LegalLayout title="Política de Envíos">
            <p className="text-sm text-gray-400">Última actualización: Enero 2026</p>

            <h3>1. Política de Envíos</h3>
            <p>
                Realizamos envíos a todo el territorio nacional de Colombia.
            </p>
            <ul className="list-disc pl-5 space-y-2">
                <li><strong>Tiempos de Entrega:</strong> El tiempo estimado de entrega es de 2 a 5 días hábiles para ciudades principales y hasta 8 días hábiles para destinos reexpedidos o zonas rurales.</li>
                <li><strong>Costos:</strong> El costo del envío se calcula al momento del checkout según la ciudad de destino y el peso del paquete. Envíos gratis pueden aplicar según promociones vigentes.</li>
                <li><strong>Transportadora:</strong> Utilizamos empresas transportadoras certificadas (como Interrapidísimo, Servientrega, Coordinadora). Una vez despachado, recibirá un número de guía para rastrear su pedido.</li>
            </ul>

            <h3>2. Estado del Pedido</h3>
            <p>
                Una vez confirmado el pago, su pedido entrará en proceso de alistamiento (1-2 días hábiles). Recibirá notificaciones vía correo electrónico en cada etapa: Confirmación de Pago, Pedido Enviado (con guía) y Pedido Entregado.
            </p>

            <h3>3. Devoluciones y Reembolsos</h3>
            <p>
                Para consultar nuestra política detallada de cambios, garantías, derecho de retracto y reembolsos, por favor visita nuestra página dedicada de <a href="/politica-devoluciones" className="text-gold underline">Política de Devoluciones y Reembolso</a>.
            </p>

            <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-serif mb-4">Información de Contacto</h3>
                <p className="text-sm">
                    <strong>Rostro Dorado Clinic</strong><br />
                    Calle 12 #12-03 local 2<br />
                    Riohacha, La Guajira, Colombia<br />
                    Tel: +57 312 619 6527<br />
                    Email: contacto@rostrodorado.com
                </p>
            </div>
        </LegalLayout>
    );
};

export default PoliticaEnvios;
