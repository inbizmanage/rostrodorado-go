import React, { useRef } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { X, Printer } from 'lucide-react';
import { Order } from '../../types';
import Barcode from 'react-barcode';
import QRCode from 'react-qr-code';

interface ShippingLabelModalProps {
    order: Order | null;
    onClose: () => void;
}

const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({ order, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);

    if (!order) return null;

    const handlePrint = () => {
        if (!printRef.current) return;

        const printWindow = window.open('', '', 'width=450,height=600');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Guía de Envío</title>');
            printWindow.document.write('<style>');
            printWindow.document.write(`
                @page { size: 100mm 150mm; margin: 0; }
                body { font-family: 'Courier New', monospace; margin: 0; padding: 10px; }
                .print-container { width: 100%; max-width: 384px; margin: 0 auto; box-sizing: border-box; font-size: 12px; }
                @media print {
                  .no-print { display: none; }
                }
            `);
            printWindow.document.write('</style></head><body>');
            printWindow.document.write(printRef.current.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };

    const dateStr = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('es-CO') : new Date().toLocaleDateString();

    // Data to encode in the QR code for instant scanning (Logistics Focus)
    const qrData = `ORDEN: #${order.id.slice(0, 8).toUpperCase()}
FECHA: ${dateStr}
REMITENTE: Rostro Dorado Clinic (Nit: 1124048278-9)
PARA:
${order.customer.firstName} ${order.customer.lastName}
CC/NIT: ${order.customer.identification || 'N/A'}
TEL: ${order.customer.phone}
DIR: ${order.customer.address} ${order.customer.apartment ? 'Apto ' + order.customer.apartment : ''}
CIUDAD: ${order.customer.city}, ${order.customer.department}
CONTENIDO:
${order.items.map(i => `- ${i.quantity}x ${i.name}`).join('\n')}`;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-white/10 bg-[#1a1a1a]">
                        <h2 className="text-white font-medium flex items-center gap-2">
                            <Printer size={18} className="text-gold" />
                            Guía de Envío (Admin)
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Label Content */}
                    <div className="overflow-y-auto p-6 bg-[#333] flex justify-center">
                        {/* The Label Itself - White Paper Look */}
                        <div
                            ref={printRef}
                            className="bg-white text-black p-4 w-full max-w-[384px] shadow-lg font-mono text-xs leading-tight print-container"
                            style={{ fontFamily: "'Courier New', Courier, monospace" }}
                        >
                            {/* Shipping Label Header */}
                            <div className="border-b-2 border-black pb-2 mb-2 flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold uppercase tracking-tighter">ENVIO</h1>
                                    <p className="text-[10px] font-bold">STANDARD SHIPPING</p>
                                </div>
                                <div className="text-right w-16 h-16">
                                    {/* Small QR at top right for easy scanning */}
                                    <QRCode
                                        value={qrData}
                                        size={64}
                                        level="L" // Lower error correction = less dots = easier to scan
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        viewBox={`0 0 256 256`}
                                    />
                                </div>
                            </div>

                            {/* FROM / TO Grid */}
                            <div className="border-b-2 border-black pb-2 mb-2">
                                <div className="mb-2">
                                    <p className="text-[10px] font-bold uppercase text-gray-600">DE (REMITENTE):</p>
                                    <p className="font-bold text-sm">ROSTRO DORADO CLINIC</p>
                                    <p>Calle 12 #12-03 local 2</p>
                                    <p>Riohacha, La Guajira</p>
                                    <p>Nit: 1124048278-9</p>
                                </div>
                                <div className="pt-2 border-t border-black border-dashed mt-2">
                                    <p className="text-[10px] font-bold uppercase text-gray-600">PARA (DESTINATARIO):</p>
                                    <p className="text-lg font-bold uppercase leading-none mb-1">{order.customer.name || `${order.customer.firstName} ${order.customer.lastName}`}</p>
                                    <p className="uppercase text-sm">{order.customer.address}</p>
                                    {order.customer.apartment && <p className="uppercase text-sm">Apto/Int: {order.customer.apartment}</p>}
                                    <p className="uppercase font-bold text-sm">{order.customer.city}, {order.customer.department}</p>
                                    <p className="font-bold mt-1">TEL: {order.customer.phone}</p>
                                    {order.customer.identification && <p className="text-[10px]">ID: {order.customer.identification}</p>}
                                </div>
                            </div>

                            {/* Order Details (Package Content) */}
                            <div className="mb-2 border-b-2 border-black pb-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold">ORDEN:</span>
                                    <span className="font-bold text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold">FECHA:</span>
                                    <span>{dateStr}</span>
                                </div>

                                {/* Items Summary - Truncated for label */}
                                <div className="bg-gray-100 p-2 mt-2 rounded">
                                    <p className="text-[9px] font-bold uppercase mb-1">CONTENIDO ({order.items.reduce((acc, i) => acc + i.quantity, 0)} items):</p>
                                    <div className="text-[9px] uppercase leading-snug">
                                        {order.items.slice(0, 3).map((item, idx) => (
                                            <div key={idx} className="truncate">{item.quantity} x {item.name}</div>
                                        ))}
                                        {order.items.length > 3 && <div>... (+{order.items.length - 3} más)</div>}
                                    </div>
                                </div>
                            </div>

                            {/* Barcode Footer */}
                            <div className="text-center pt-2 flex flex-col items-center">
                                <p className="text-[10px] font-bold tracking-[0.2em] mb-1">TRACKING NUMBER</p>
                                <Barcode
                                    value={order.id.toUpperCase()}
                                    width={1.5}
                                    height={40}
                                    fontSize={12}
                                    displayValue={true}
                                />
                            </div>

                            {/* Footer Warning */}
                            <div className="mt-2 pt-1 border-t border-gray-300 text-[8px] text-center text-gray-500">
                                <p>GUÍA GENERADA POR ROSTRO DORADO CLINIC</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-white/10 bg-[#1a1a1a] flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 rounded-lg text-sm bg-gold text-black font-bold hover:bg-yellow-500 transition-colors flex items-center gap-2"
                        >
                            <Printer size={16} />
                            Imprimir Guía
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ShippingLabelModal;
