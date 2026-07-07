import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReturnsPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-base pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-gold hover:text-gold-dark transition-colors mb-8">
                    <ArrowLeft size={20} />
                    Volver al Inicio
                </Link>

                <h1 className="text-4xl md:text-5xl font-serif text-charcoal mb-8">Política de Devoluciones y Reembolsos</h1>

                <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gold/10 space-y-8 text-charcoal-light leading-relaxed">
                    <p className="text-sm text-gray-400">Última actualización: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-2xl font-serif text-charcoal mb-4">1. Visión General</h2>
                        <p>
                            En Rostro Dorado Clinic, nuestra prioridad es asegurar la satisfacción de nuestros clientes con nuestros productos dermocosméticos.
                            Nuestra política de devoluciones tiene una duración de 30 días. Si han pasado 30 días desde su compra, lamentablemente no podemos ofrecerle un reembolso o cambio.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-serif text-charcoal mb-4">2. Condiciones para Devoluciones</h2>
                        <p className="mb-4">Para ser elegible para una devolución, su artículo debe cumplir con las siguientes condiciones:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>El artículo debe estar sin usar y en las mismas condiciones en que lo recibió.</li>
                            <li>Debe estar en su embalaje original y sellado.</li>
                            <li>Debe presentar el recibo o comprobante de compra.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-serif text-charcoal mb-4">3. Artículos No Retornables</h2>
                        <p className="mb-4">Debido a la naturaleza de nuestros productos (salud y cuidado personal), no aceptamos devoluciones de:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Productos abiertos o con el sello de seguridad roto.</li>
                            <li>Productos que hayan sido usados.</li>
                            <li>Tarjetas de regalo.</li>
                            <li>Servicios o tratamientos estéticos ya realizados.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-serif text-charcoal mb-4">4. Reembolsos (si aplica)</h2>
                        <p>
                            Una vez que su devolución sea recibida e inspeccionada, le enviaremos un correo electrónico para notificarle que hemos recibido su artículo devuelto.
                            También le notificaremos sobre la aprobación o rechazo de su reembolso.
                            Si es aprobado, entonces su reembolso será procesado y se aplicará un crédito automáticamente a su tarjeta de crédito o método de pago original, dentro de una cierta cantidad de días.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-serif text-charcoal mb-4">5. Envío de Devoluciones</h2>
                        <p className="mb-4">
                            Usted será responsable de pagar sus propios costos de envío para devolver su artículo. Los costos de envío no son reembolsables.
                            Si recibe un reembolso, el costo del envío de devolución se deducirá de su reembolso.
                        </p>
                        <p>
                            Para iniciar una devolución, por favor contáctenos primero en <strong>info@rostrodorado.com</strong> o a través de nuestro WhatsApp de atención al cliente.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ReturnsPolicy;
