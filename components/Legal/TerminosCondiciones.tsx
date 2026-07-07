import React from 'react';
import LegalLayout from './LegalLayout';

const TerminosCondiciones = () => {
    return (
        <LegalLayout title="Términos y Condiciones">
            <p className="text-sm text-gray-400">Última actualización: Enero 2026</p>

            <h3>1. Aceptación de los Términos</h3>
            <p>
                Al acceder y utilizar el sitio web de <strong>Rostro Dorado Clinic</strong>, usted acepta estar sujeto a los siguientes términos y condiciones.
                Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.
            </p>

            <h3>2. Naturaleza de los Productos y Servicios</h3>
            <p>
                Rostro Dorado Clinic ofrece productos dermocosméticos y servicios de medicina estética.
                <strong className="text-black block mt-2">Descargo de Responsabilidad Médica:</strong>
                El contenido de este sitio web es solo para fines informativos y no sustituye el consejo, diagnóstico o tratamiento médico profesional.
                Los productos comercializados son de venta libre o bajo recomendación profesional, pero <strong>no son medicamentos</strong> a menos que se indique lo contrario.
                Los resultados de los tratamientos y productos pueden variar de una persona a otra según factores individuales.
            </p>

            <h3>3. Uso del Sitio y Cuenta</h3>
            <p>
                Usted es responsable de mantener la confidencialidad de su cuenta y contraseña.
                Acepta la responsabilidad de todas las actividades que ocurran bajo su cuenta.
                Nos reservamos el derecho de rechazar el servicio, cancelar cuentas o cancelar pedidos a nuestra discreción.
            </p>

            <h3>4. Precios y Pagos</h3>
            <p>
                Todos los precios están expresados en Pesos Colombianos (COP). Nos reservamos el derecho de modificar los precios en cualquier momento sin previo aviso.
                Los pagos son procesados de forma segura a través de la pasarela de pagos <strong>Wompi</strong> (Bancolombia).
                No almacenamos información financiera completa de sus tarjetas de crédito/débito en nuestros servidores.
            </p>

            <h3>5. Responsabilidad Limitada</h3>
            <p>
                Rostro Dorado Clinic no será responsable por daños directos, indirectos, incidentales o consecuentes que resulten del uso o la imposibilidad de uso de nuestros productos o servicios,
                incluyendo, pero no limitado a, reacciones alérgicas no reportadas previamente o mal uso de los productos.
                Es responsabilidad del cliente leer los ingredientes y las instrucciones de uso antes de aplicar cualquier producto.
            </p>

            <h3>6. Comunicaciones y Marketing</h3>
            <p>
                Al registrarse o realizar una compra en nuestro sitio, usted <strong>acepta automáticamente</strong> recibir correos electrónicos promocionales,
                boletines informativos y ofertas exclusivas de Rostro Dorado Clinic. Utilizamos estos datos internamente para análisis de mercado y mejora de nuestros servicios.
                Puede optar por no recibir estas comunicaciones en cualquier momento siguiendo el enlace de cancelación de suscripción en los correos.
            </p>

            <h3>7. Ley Aplicable</h3>
            <p>
                Estos términos se regirán e interpretarán de acuerdo con las leyes de la República de Colombia.
                Cualquier disputa relacionada con estos términos será sometida a la jurisdicción exclusiva de los tribunales colombianos.
            </p>

            <h3>8. Cambios en los Términos</h3>
            <p>
                Nos reservamos el derecho de actualizar o cambiar nuestros Términos y Condiciones en cualquier momento.
                Es su responsabilidad revisar esta página periódicamente para ver los cambios.
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

export default TerminosCondiciones;
