import React from 'react';
import { Truck, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import LegalLayout from './LegalLayout';

const PoliticaReembolso: React.FC = () => {
    return (
        <LegalLayout title="Política de Devoluciones y Reembolsos">
            <div className="prose prose-lg prose-slate max-w-none">
                <p className="lead text-xl text-charcoal/70 mb-12">
                    En Rostro Dorado Clinic, tu satisfacción y seguridad son nuestra prioridad. Debido a la naturaleza de nuestros productos (dermocosméticos y cuidado personal), aplicamos una política estricta de higiene y calidad. Por favor, lee atentamente nuestras condiciones de devolución y reembolso.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-charcoal/5 p-8 rounded-xl border border-charcoal/10">
                        <div className="text-gold mb-4">
                            <RotateCcw size={32} />
                        </div>
                        <h3 className="font-serif text-xl mb-3">Plazo de Devolución</h3>
                        <p className="text-sm opacity-80">
                            Tienes un plazo de <strong>5 días hábiles</strong> a partir de la recepción de tu pedido para reportar cualquier novedad, defecto o error en el envío.
                        </p>
                    </div>

                    <div className="bg-charcoal/5 p-8 rounded-xl border border-charcoal/10">
                        <div className="text-gold mb-4">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="font-serif text-xl mb-3">Condiciones del Producto</h3>
                        <p className="text-sm opacity-80">
                            El producto debe estar <strong>totalmente nuevo, sellado y sin usar</strong>. No aceptamos devoluciones de productos abiertos por razones de higiene y seguridad sanitaria.
                        </p>
                    </div>
                </div>

                <div className="space-y-12">
                    {/* Sección 1: Motivos Aceptados */}
                    <div className="border-b border-charcoal/10 pb-12">
                        <h2 className="font-serif text-2xl mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center text-sm font-bold">1</span>
                            Motivos Aceptados para Devolución
                        </h2>
                        <ul className="list-disc pl-6 space-y-3 marker:text-gold">
                            <li><strong>Producto Defectuoso:</strong> Si recibes un producto con el envase roto, dañado o con defectos de fábrica evidentes.</li>
                            <li><strong>Error en el Envío:</strong> Si recibes un producto diferente al que compraste en tu orden.</li>
                            <li><strong>Producto Vencido:</strong> En el caso excepcional de recibir un producto con fecha de caducidad cumplida.</li>
                        </ul>
                    </div>

                    {/* Sección 2: Proceso */}
                    <div className="border-b border-charcoal/10 pb-12">
                        <h2 className="font-serif text-2xl mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center text-sm font-bold">2</span>
                            Proceso de Solicitud
                        </h2>
                        <p className="mb-4">Para iniciar un proceso de devolución, por favor sigue estos pasos:</p>
                        <ol className="list-decimal pl-6 space-y-4 marker:font-serif">
                            <li>
                                <strong>Contáctanos:</strong> Envía un correo a <a href="mailto:contacto@rostrodorado.com" className="text-gold underline">contacto@rostrodorado.com</a> o escríbenos a nuestro WhatsApp con el número de orden.
                            </li>
                            <li>
                                <strong>Evidencia:</strong> Adjunta fotos y/o videos claros donde se evidencie el defecto o el error en el producto recibido.
                            </li>
                            <li>
                                <strong>Evaluación:</strong> Nuestro equipo de calidad revisará tu caso en un plazo máximo de 24-48 horas hábiles.
                            </li>
                        </ol>
                    </div>

                    {/* Sección 3: Reembolsos */}
                    <div className="border-b border-charcoal/10 pb-12">
                        <h2 className="font-serif text-2xl mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center text-sm font-bold">3</span>
                            Tiempos y Tipos de Reembolso
                        </h2>
                        <p className="mb-4">Una vez aprobada la devolución y recibido el producto en nuestras instalaciones:</p>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 my-6">
                            <h4 className="font-bold text-yellow-800 flex items-center gap-2 mb-2">
                                <AlertTriangle size={18} />
                                Importante
                            </h4>
                            <p className="text-sm text-yellow-700">
                                Rostro Dorado Clinic se reserva el derecho de rechazar devoluciones que no cumplan con las condiciones de higiene y estado del producto.
                            </p>
                        </div>
                        <ul className="list-disc pl-6 space-y-3 marker:text-gold">
                            <li><strong>Cambio de Producto:</strong> Te enviaremos el producto correcto sin costo adicional de envío.</li>
                            <li><strong>Bono de Tienda:</strong> Crédito por el valor total de la compra para usar en futuros pedidos (Vigencia 1 año).</li>
                            <li><strong>Reembolso Monetario:</strong> Reversión a tu método de pago original. (Puede tardar entre 5 a 15 días hábiles dependiendo de tu entidad bancaria y la pasarela de pagos Wompi).</li>
                        </ul>
                    </div>

                    {/* Sección 4: Derecho de Retracto */}
                    <div className="">
                        <h2 className="font-serif text-2xl mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center text-sm font-bold">4</span>
                            Derecho de Retracto (Ley 1480 de 2011)
                        </h2>
                        <p className="mb-4">
                            De acuerdo con el Estatuto del Consumidor de Colombia, tienes derecho a retractarte de tu compra dentro de los <strong>5 días hábiles</strong> siguientes a la entrega del producto.
                        </p>
                        <p className="mb-4">
                            <strong>Condiciones para el Retracto:</strong>
                            <br />
                            El cliente deberá asumir los costos de transporte y devolución del producto a nuestras instalaciones en Riohacha, La Guajira. El producto debe devolverse en las mismas condiciones en que se recibió: <strong>nuevo, sin abrir, con sellos intactos y en su empaque original</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </LegalLayout>
    );
};

export default PoliticaReembolso;
