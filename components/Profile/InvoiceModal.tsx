import React, { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { Order } from '../../types';
import { parseFirestoreDate } from '../../utils/dateUtils';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface InvoiceModalProps {
    order: Order;
    onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            setDownloading(true);
            const functions = getFunctions();
            const downloadInvoicePdf = httpsCallable(functions, 'downloadInvoicePdf');

            const result: any = await downloadInvoicePdf({ orderId: order.id });
            const pdfBase64 = result.data.pdfBase64;

            // Convert Base64 to Blob
            const byteCharacters = atob(pdfBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            // Create Download Link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Factura_${order.id.slice(0, 8)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Error downloading PDF:", error);
            alert("Error al descargar la factura. Inténtalo de nuevo.");
        } finally {
            setDownloading(false);
        }
    };

    const date = parseFirestoreDate(order.createdAt);
    const dateStr = date ? date.toLocaleDateString('es-CO') : 'N/A';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="flex justify-between items-center p-4 border-b border-white/10 bg-[#111]">
                        <h3 className="text-white font-serif">Factura</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="px-4 py-2 rounded-lg text-sm bg-gold text-black font-bold hover:bg-yellow-500 transition-colors flex items-center gap-2"
                            >
                                <Download size={16} />
                                {downloading ? 'Descargando...' : 'Descargar PDF'}
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto p-6 bg-[#eee] flex justify-center">
                        <div className="bg-white text-black p-6 w-full max-w-[384px] shadow-lg font-mono text-xs leading-relaxed" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                            {/* Receipt Header */}
                            <div className="text-center border-b border-black pb-4 mb-4">
                                <div className="mb-2 flex justify-center">
                                    <img src="https://i.imgur.com/93IWNqy.png" alt="Rostro Dorado Logo" className="w-14 h-auto" />
                                </div>
                                <p className="text-[10px]">Nit: 1124048278-9</p>
                                <p className="text-[10px]">Calle 12 #12-03 local 2</p>
                                <p className="text-[10px]">Riohacha, La Guajira</p>
                            </div>

                            {/* Order Info */}
                            <div className="mb-4 space-y-1">
                                <div className="flex justify-between">
                                    <span className="font-bold">Recibo No:</span>
                                    <span>#{order.id.slice(0, 8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold">Fecha:</span>
                                    <span>{dateStr}</span>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-4 border-b border-black pb-4">
                                <p className="font-bold mb-1 uppercase">CLIENTE:</p>
                                <p className="uppercase">{order.customer.name}</p>
                                <p className="uppercase">{order.customer.address} {order.customer.apartment ? `Apto ${order.customer.apartment}` : ''}</p>
                                <p className="uppercase">{order.customer.city}, {order.customer.department}</p>
                                <p>Tel: {order.customer.phone}</p>
                            </div>

                            {/* Items Table */}
                            <table className="w-full border-collapse mb-4">
                                <thead>
                                    <tr className="border-b border-black text-left">
                                        <th className="py-1">DESCRIPCIÓN</th>
                                        <th className="py-1 text-center">CANT</th>
                                        <th className="py-1 text-right">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-dashed border-gray-300">
                                            <td className="py-2 pr-2">{item.name}</td>
                                            <td className="py-2 text-center">{item.quantity}</td>
                                            <td className="py-2 text-right">${(item.price * item.quantity).toLocaleString('es-CO')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className="border-t border-black pt-2 space-y-1">
                                <div className="flex justify-between text-base font-bold">
                                    <span>TOTAL:</span>
                                    <span>${order.total.toLocaleString('es-CO')}</span>
                                </div>
                                <div className="flex justify-between text-[10px] mt-2">
                                    <span>Método de Pago:</span>
                                    <span className="uppercase">{order.paymentMethod === 'wompi' ? 'ONLINE / TARJETA' : order.paymentMethod}</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="text-center mt-6 pt-4 border-t border-black text-[10px]">
                                <p className="font-bold mb-1">¡GRACIAS POR SU COMPRA!</p>
                                <p>Este recibo es un comprobante de pago.</p>
                                <p className="mt-2">Rostro Dorado Clinic</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default InvoiceModal;
