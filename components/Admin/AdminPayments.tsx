import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Payment } from '../../types';
import { DollarSign, Calendar, CreditCard, CheckCircle, XCircle, ExternalLink, Download } from 'lucide-react';
import { parseFirestoreDate } from '../../utils/dateUtils';

interface AdminPaymentsProps {
    onViewOrder?: (orderId: string) => void;
}

const AdminPayments: React.FC<AdminPaymentsProps> = ({ onViewOrder }) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    // ... existing fetch payments logic ...

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const paymentsData: Payment[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Payment));
            setPayments(paymentsData);
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: any) => {
        const date = parseFirestoreDate(timestamp);
        if (!date) return '';
        return new Intl.DateTimeFormat('es-CO', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    };

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(cents / 100);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-500/20 text-green-500';
            case 'DECLINED': return 'bg-red-500/20 text-red-500';
            case 'VOIDED': return 'bg-yellow-500/20 text-yellow-500';
            case 'ERROR': return 'bg-red-500/20 text-red-500';
            default: return 'bg-gray-500/20 text-gray-500';
        }
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Pedido Ref', 'Usuario', 'Monto', 'Metodo', 'Estado', 'Fecha'];
        const rows = payments.map(payment => [
            payment.id,
            payment.orderId || '',
            payment.customerEmail || 'No registrado',
            payment.amountInCents / 100,
            payment.paymentMethod || '',
            payment.status,
            parseFirestoreDate(payment.createdAt)?.toLocaleDateString() || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `pagos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="text-white/50">Cargando pagos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-serif text-white">Transacciones</h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
                    >
                        <Download size={18} />
                        <span className="text-sm">Exportar CSV</span>
                    </button>
                    <div className="text-white/50 text-sm">Total: {payments.length} transacciones</div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-white/70">
                        <thead className="bg-black/20 text-xs uppercase tracking-wider text-white/50 font-medium">
                            <tr>
                                <th className="p-4">ID Transacción</th>
                                <th className="p-4">Pedido Ref</th>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Monto</th>
                                <th className="p-4">Método</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono text-xs">{payment.id}</td>
                                    <td className="p-4 font-mono text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gold">{payment.orderId ? payment.orderId.slice(0, 8) : 'N/A'}</span>
                                            {payment.orderId && onViewOrder && (
                                                <button
                                                    onClick={() => onViewOrder(payment.orderId)}
                                                    className="p-1 hover:bg-white/10 rounded text-blue-400 hover:text-blue-300 transition-colors"
                                                    title="Ver Pedido"
                                                >
                                                    <ExternalLink size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-white/70">{payment.customerEmail || 'No registrado'}</td>
                                    <td className="p-4 font-medium text-white">{formatCurrency(payment.amountInCents)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={14} className="text-white/30" />
                                            {payment.paymentMethod}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(payment.status)}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-white/50">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            {formatDate(payment.createdAt)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {payments.length === 0 && (
                    <div className="p-12 text-center text-white/50">
                        No hay transacciones registradas.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPayments;
