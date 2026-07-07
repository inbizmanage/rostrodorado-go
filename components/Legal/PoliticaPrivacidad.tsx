import React from 'react';
import LegalLayout from './LegalLayout';

const PoliticaPrivacidad = () => {
    return (
        <LegalLayout title="Política de Privacidad y Tratamiento de Datos">
            <p className="text-sm text-gray-400">Última actualización: Enero 2026</p>

            <h3>1. Introducción</h3>
            <p>
                En <strong>Rostro Dorado Clinic</strong>, valoramos su privacidad y estamos comprometidos a proteger sus datos personales.
                Esta política explica cómo recopilamos, usamos y protegemos su información, en cumplimiento con la <strong>Ley 1581 de 2012</strong> y el Decreto 1377 de 2013 (Habeas Data) de Colombia.
            </p>

            <h3>2. Recolección de Datos</h3>
            <p>
                Podemos recopilar información personal que incluye, entre otros: nombre, dirección de correo electrónico, número de teléfono, dirección de envío y facturación, e información de pago.
                Estos datos se recopilan cuando usted:
            </p>
            <ul className="list-disc pl-5 space-y-2">
                <li>Se registra en nuestro sitio web.</li>
                <li>Realiza una compra.</li>
                <li>Se suscribe a nuestro boletín.</li>
                <li>Se comunica con nosotros a través de formularios o chat.</li>
            </ul>

            <h3>3. Finalidad del Tratamiento de Datos</h3>
            <p>
                Sus datos personales serán utilizados para los siguientes fines:
            </p>
            <ul className="list-disc pl-5 space-y-2">
                <li>Procesar y gestionar sus pedidos y envíos.</li>
                <li>Mejorar nuestro sitio web y servicio al cliente.</li>
                <li><strong>Análisis Interno:</strong> Utilizamos sus datos para realizar estudios de mercado internos, análisis de tendencias y perfiles de consumo para mejorar nuestra oferta.</li>
                <li>
                    <strong className="text-gold">Marketing y Promoción:</strong> Al proporcionar sus datos (compra o registro), usted <strong>autoriza expresamente</strong> a Rostro Dorado Clinic a enviarle información sobre nuevos productos, ofertas especiales y actualizaciones de servicios.
                </li>
            </ul>

            <h3>4. Consentimiento Automático para Marketing</h3>
            <div className="bg-gray-50 p-6 rounded-lg border border-gold/30">
                <p className="text-sm italic text-gray-700 m-0">
                    "De conformidad con nuestros términos de servicio, al completar un registro o realizar una compra en este portal, el usuario manifiesta su consentimiento automático e inequívoco para ser incluido en nuestra base de datos de marketing y recibir comunicaciones promocionales. Este consentimiento puede ser revocado en cualquier momento."
                </p>
            </div>

            <h3>5. Compartir Información</h3>
            <p>
                No vendemos, intercambiamos ni transferimos a terceros sus datos personales identificables, excepto a terceros de confianza que nos asisten en la operación de nuestro sitio web (como procesadores de pagos Wompi o servicios de envío), siempre que dichas partes acuerden mantener esta información confidencial.
            </p>

            <h3>6. Derechos del Titular (Habeas Data)</h3>
            <p>
                Como titular de los datos, usted tiene derecho a:
            </p>
            <ul className="list-disc pl-5 space-y-2">
                <li>Conocer, actualizar y rectificar sus datos personales.</li>
                <li>Solicitar prueba de la autorización otorgada.</li>
                <li>Ser informado sobre el uso que se le ha dado a sus datos.</li>
                <li>Revocar la autorización y/o solicitar la supresión del dato (cuando no exista un deber legal o contractual de permanecer en la base de datos).</li>
            </ul>
            <p>
                Para ejercer estos derechos, puede contactarnos en: <strong>contacto@rostrodorado.com</strong>
            </p>

            <h3>7. Seguridad</h3>
            <p>
                Implementamos una variedad de medidas de seguridad para mantener la seguridad de su información personal. Su información personal está contenida detrás de redes seguras y solo es accesible para un número limitado de personas con derechos especiales de acceso.
            </p>

            <h3>8. Cookies</h3>
            <p>
                Utilizamos cookies para mejorar su experiencia en nuestro sitio, comprender el tráfico y personalizar el contenido. Puede elegir desactivar las cookies a través de la configuración de su navegador.
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

export default PoliticaPrivacidad;
