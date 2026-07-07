import React, { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    LogOut,
    Menu,
    X,
    TrendingUp,
    AlertCircle,
    CreditCard,
    Activity,
    Clock,
    FolderTree,
    MessageCircle,
    Tag,
    FileText,
    Server,
} from 'lucide-react';

import { parseFirestoreDate } from '../../utils/dateUtils';

import AdminOrders from './AdminOrders';
import AdminProducts from './AdminProducts';
import AdminUsers from './AdminUsers';
import AdminPayments from './AdminPayments';
import AdminCoupons from './AdminCoupons';
import AdminBlog from './AdminBlog';
import SalesChart from './SalesChart';
import AdminChats from './AdminChats';
import AdminAnalytics from './AdminAnalytics';
import AdminLeads from './AdminLeads';
import AdminForms from './AdminForms';
import SystemStatus from './SystemStatus';



const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    // Persist active tab in localStorage
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('adminActiveTab') || 'overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        localStorage.setItem('adminActiveTab', activeTab);
    }, [activeTab]);
    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        paidOrders: 0,
        pendingOrders: 0,
        totalUsers: 0
    });
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [salesData, setSalesData] = useState<{ date: string; sales: number }[]>([]);

    const [recentActivities, setRecentActivities] = useState<any[]>([]);

    useEffect(() => {
        // Handle responsive sidebar on mount
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        // Initial check
        handleResize();

        // Optional: Listen for resize if dynamic resizing is desired
        window.addEventListener('resize', handleResize);

        fetchStats();
        fetchRecentActivity();
        fetchSalesData();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchSalesData = async () => {
        try {
            const now = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);

            const q = query(collection(db, 'orders'), orderBy('createdAt', 'asc'));
            const querySnapshot = await getDocs(q);

            const dailySales: { [key: string]: number } = {};

            // Initialize last 30 days with 0
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                const dateKey = d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
                dailySales[dateKey] = 0;
            }

            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.createdAt && data.paymentStatus === 'approved') {
                    const date = parseFirestoreDate(data.createdAt);
                    if (date && date >= thirtyDaysAgo) {
                        const dateKey = date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
                        if (dailySales[dateKey] !== undefined) {
                            dailySales[dateKey] += data.total || 0;
                        }
                    }
                }
            });

            const formattedData = Object.keys(dailySales).map(date => ({
                date,
                sales: dailySales[date]
            }));

            setSalesData(formattedData);

        } catch (error) {
            console.error("Error fetching sales data:", error);
        }
    };

    const fetchStats = async () => {
        try {
            const ordersSnapshot = await getDocs(collection(db, 'orders'));
            const usersSnapshot = await getDocs(collection(db, 'users'));

            const orders = ordersSnapshot.docs.map(doc => doc.data());
            const paidOrders = orders.filter((order: any) => order.paymentStatus === 'approved');
            const pendingOrders = orders.filter((order: any) => order.paymentStatus !== 'approved');
            const totalSales = paidOrders.reduce((sum, order: any) => sum + (order.total || 0), 0);

            setStats({
                totalSales,
                totalOrders: orders.length,
                paidOrders: paidOrders.length,
                pendingOrders: pendingOrders.length,
                totalUsers: usersSnapshot.size
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchRecentActivity = async () => {
        try {
            // Fetch last 5 orders
            const ordersQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
            const ordersSnapshot = await getDocs(ordersQ);
            const orders = ordersSnapshot.docs.map(doc => ({
                id: doc.id,
                type: 'ORDER',
                data: doc.data(),
                date: doc.data().createdAt
            }));

            // Fetch last 5 payments
            const paymentsQ = query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(5));
            const paymentsSnapshot = await getDocs(paymentsQ);
            const payments = paymentsSnapshot.docs.map(doc => ({
                id: doc.id,
                type: 'PAYMENT',
                data: doc.data(),
                date: doc.data().createdAt
            }));

            // Fetch last 5 users
            const usersQ = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5));
            const usersSnapshot = await getDocs(usersQ);
            const users = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                type: 'USER',
                data: doc.data(),
                date: doc.data().createdAt
            }));

            // Combine and sort
            const combined = [...orders, ...payments, ...users]
                .sort((a, b) => {
                    const dateA = parseFirestoreDate(a.date)?.getTime() || 0;
                    const dateB = parseFirestoreDate(b.date)?.getTime() || 0;
                    return dateB - dateA;
                })
                .slice(0, 10); // keep top 10 most recent across all categories

            setRecentActivities(combined);

        } catch (error) {
            console.error("Error fetching recent activity:", error);
        }
    };

    const formatDate = (timestamp: any) => {
        const date = parseFirestoreDate(timestamp);
        if (!date) return 'Reciente';

        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
        if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} horas`;
        return new Intl.DateTimeFormat('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
    };

    const handleViewOrder = (orderId: string) => {
        setSelectedOrderId(orderId);
        setActiveTab('orders');
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const menuItems = [
        { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
        { id: 'chats', label: 'Chats', icon: MessageCircle },
        { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
        { id: 'payments', label: 'Pagos', icon: CreditCard },
        { id: 'products', label: 'Productos', icon: Package },
        { id: 'users', label: 'Usuarios', icon: Users },
        { id: 'coupons', label: 'Cupones', icon: Tag },
        { id: 'leads', label: 'Leads (Citas)', icon: MessageCircle },
        { id: 'forms', label: 'Formularios', icon: FileText },
        { id: 'blog', label: 'Blog', icon: FileText },
        { id: 'analytics', label: 'Analítica', icon: Activity },
        { id: 'status', label: 'Conexiones', icon: Server },
    ];

    const renderActivityItem = (item: any) => {
        switch (item.type) {
            case 'ORDER':
                return (
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg">
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium">Nuevo Pedido <span className="text-gold font-mono">#{item.id.slice(0, 6)}</span></p>
                                <p className="text-white/50 text-xs">de {item.data.customer?.name || 'Cliente'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-medium text-sm">${item.data.total?.toLocaleString()}</p>
                            <p className="text-white/40 text-xs flex items-center gap-1 justify-end">
                                <Clock size={10} /> {formatDate(item.date)}
                            </p>
                        </div>
                    </div>
                );
            case 'PAYMENT':
                return (
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-green-500/20 text-green-500 rounded-lg">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium">Pago Recibido</p>
                                <p className="text-white/50 text-xs">Ref: {item.id}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-green-500 font-medium text-sm">+${(item.data.amountInCents / 100)?.toLocaleString()}</p>
                            <p className="text-white/40 text-xs flex items-center gap-1 justify-end">
                                <Clock size={10} /> {formatDate(item.date)}
                            </p>
                        </div>
                    </div>
                );
            case 'USER':
                return (
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-purple-500/20 text-purple-500 rounded-lg">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium">Nuevo Usuario</p>
                                <p className="text-white/50 text-xs">{item.data.displayName || item.data.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white/40 text-xs flex items-center gap-1 justify-end">
                                <Clock size={10} /> {formatDate(item.date)}
                            </p>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    // ... existing overview code ...
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-serif text-white mb-8">Panel de Control</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { title: 'Ventas Totales', value: `$${stats.totalSales.toLocaleString()}`, icon: TrendingUp, color: 'text-green-500' },
                                    { title: 'Pedidos', value: stats.paidOrders.toString(), icon: ShoppingBag, color: 'text-blue-500' },
                                    { title: 'Usuarios', value: <span className="text-2xl font-bold text-white">{stats.totalUsers}</span>, icon: Users, color: 'text-purple-500' },
                                ].map((stat, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white/5 border border-white/10 p-6 rounded-2xl"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 bg-white/5 rounded-xl ${stat.color}`}>
                                                <stat.icon size={24} />
                                            </div>
                                        </div>
                                        <h3 className="text-white/50 text-sm uppercase tracking-wide mb-1">{stat.title}</h3>
                                        <div>{stat.value}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>


                        {/* Sales Chart Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <SalesChart data={salesData} />
                        </motion.div>

                        {/* Recent Activity Section */}
                        <div>
                            <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                                <Activity className="text-gold" />
                                Actividad Reciente
                            </h3>
                            <div className="grid gap-4">
                                {recentActivities.length > 0 ? (
                                    recentActivities.map(item => (
                                        <motion.div
                                            key={`${item.type}-${item.id}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                        >
                                            {renderActivityItem(item)}
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-white/30 bg-white/5 rounded-xl border border-white/5">
                                        No hay actividad reciente.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'chats':
                return <AdminChats />;
            case 'orders':
                return <AdminOrders highlightOrderId={selectedOrderId} />;
            case 'payments':
                return <AdminPayments onViewOrder={handleViewOrder} />;
            case 'products':
                return <AdminProducts />;
            case 'users':
                return <AdminUsers />;
            case 'coupons':
                return <AdminCoupons />;
            case 'blog':
                return <AdminBlog />;
            case 'leads':
                return <AdminLeads />;
            case 'forms':
                return <AdminForms />;
            case 'analytics':
                return <AdminAnalytics />;
            case 'status':
                return <SystemStatus />;

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ x: isSidebarOpen ? 0 : -300 }}
                className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 bg-[#111] border-r border-white/10 transform transition-transform duration-300 ease-in-out flex flex-col h-screen ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <div className="p-8 border-b border-white/10 flex-shrink-0 flex flex-col items-center">
                    <div className="h-12 w-auto text-gold">
                        <svg
                            version="1.2"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 825 82"
                            className="w-full h-full fill-current"
                            aria-label="Rostro Dorado"
                        >
                            <path d="m784.75 4.34c17.7-1.86 33.61 10.89 35.63 28.58 2.03 17.69-10.58 33.71-28.25 35.9-17.91 2.21-34.18-10.59-36.23-28.52-2.05-17.92 10.9-34.07 28.85-35.96zm7.4 63.21c6.22-1.67 11.58-4.45 14.6-10.43 9.83-19.43 5.83-53.5-22.42-51.34-15.83 4.24-20.28 19.86-19.43 34.4 1 16.98 9.23 28.36 27.25 27.37z" />
                            <path d="m505.07 4.4c17.74-1.55 33.4 11.51 35.06 29.23 1.67 17.73-11.28 33.48-29 35.26-17.88 1.8-33.81-11.3-35.49-29.2-1.68-17.89 11.53-33.73 29.43-35.29zm6.73 63.08c16.91-4.84 20.62-19.77 19.3-35.54-1.32-15.66-9.31-27.37-26.71-26.2-6.25 1.52-11.9 4.47-14.93 10.42-9.99 19.57-6.27 53.43 22.34 51.32z" />
                            <path d="m108.02 4.86c6.42-0.94 16.53 2.1 21.2 6.27 20.7 18.5 13.89 56.31-16.82 58.23-42.49 1.58-44.85-60.23-4.38-64.5zm6.79 62.64c18.44-4.89 20.71-27.9 16.41-43.62-3.48-12.68-12.19-17.87-25.05-17.13-3.03 0.87-5.63 1.79-8.19 3.79-14.59 11.44-14.81 45.75 2.14 55.15 4.56 2.52 9.66 2.51 14.69 1.81z" />
                            <path d="m366.18 4.84c13.14-2.05 27.1 7.4 30.95 19.69 6.49 20.69-1.26 41.39-24.27 44.63-8.66 0.28-15.22-0.15-22.65-5.56-14.46-10.52-16.23-33.61-5.7-47.43 5.53-7.27 12.86-10.31 21.67-11.33zm6.74 62.78c2.15-0.54 4.88-1.3 6.75-2.47 16.32-10.12 16.04-46.36-0.69-56.05-4.38-2.53-8.85-2.66-13.73-2.36-6.33 1.78-11.69 4.91-14.64 11.01-9.49 19.64-6.05 52.05 22.31 49.87z" />
                            <path d="m409.9 5.24q10.07-0.16 20.15-0.19c26.95 0.16 39.72 17.14 32.93 43.73-1.36 5.33-5.11 10.03-9.12 13.73-13.97 9.48-28.06 5.12-45.01 5.93 6.04-11.09 2.67-28.45 3.49-41.12 0.46-7.02 0.07-15.48-2.44-22.08zm9.7 61.34c10.82 0.78 19.83 0.67 28.52-6.91l0.39-0.35c13.45-15.18 11.24-43.84-10.11-50.75-6.7-2.17-11.91-1.99-18.92-1.88 0.03 18.3-0.78 42.15 0.12 59.89z" />
                            <path d="m690.46 5.17c24.38 0.11 54.69-4.15 55.11 32.48 0.11 9.73-3.17 17.37-10.21 24.25-11.81 9.56-30.02 6.12-45.11 6.52 4.62-8.57 4.44-54.31 0.21-63.25zm10.21 61.65c10.22 0.8 19.37 0.69 27.61-6.37q0.59-0.51 1.17-1.04c16.07-18.6 8.3-51.48-18.94-52.62-3.35-0.14-6.44-0.09-9.79 0.01q-0.39 18.14-0.27 36.29c0 7.05-0.28 16.9 0.22 23.73z" />
                            <path d="m553.87 5.17c10.27 0.07 34.89-1.61 42.78 2 15.88 7.25 13.85 27.84-3.99 34.13 10.44 6.48 11.13 15.06 19.05 25.19 8.11 10.37 16.66 15.77 30.47 11.36 2.44-0.78 7.46-5.7 9.78-5.38-1.83 3.15-7.82 6.38-11.16 7.62q-1.16 0.37-2.33 0.66c-5.48 1.4-11.16 1.2-16.56 0.09-22.42-4.6-23.55-30.9-37.49-39.27q-10.42-0.03-20.83 0.08c0.19 8.74-1.7 19.2 2.59 26.53l-13.19 0.23c0.62-1.02 1.24-2.05 1.72-3.14 2.56-5.83 2.16-46.37 1.07-53.98-0.3-2.13-1.11-4.13-1.91-6.12zm9.6 34.97c9.59 0.09 23.58 1.61 31-4.19 3.88-4.15 5.12-7.01 5.06-12.72-0.18-19.8-22.08-16.64-35.68-16.36-0.7 10.15-0.45 22.94-0.38 33.27z" />
                            <path d="m11.63 6.18c9.72-0.29 35.77-1.47 43.18 2 4.35 2.03 7.8 5.62 9.34 10.21 1.6 4.79 1.49 9.73-0.89 14.16-3 5.59-6.55 7.97-12.54 9.74 12.44 6.88 15.74 30.43 32.71 36.26 12.16 4.19 17.03-1.18 25.68-5.27l0.55-0.26c-5.02 5.22-7.33 6.59-14.26 8.5-16.81 2.27-29.28-3.35-37.57-18.27-4.66-8.4-6.85-15.24-15.16-20.7-7.37-0.62-14.13 0.25-21.23-0.32 0.38 9.79-1.72 17.44 2.51 26.32-4.23 0.14-8.7 0.1-12.95 0.13 6.3-10.96 2.52-41.97 2.89-55.32 0.05-1.65-1.54-5.47-2.26-7.18zm9.83 34.93c9.61 0.01 23.44 1.42 31.04-4.27 8.68-10.38 5.64-27.14-9.17-28.95-6.58-0.8-15.16-0.26-21.95-0.21 0.48 10.13 0.11 23.07 0.08 33.43z" />
                            <path d="m270.54 5.89c10.56 0.06 35.7-1.46 44.03 2.97 4.22 2.25 7.29 5.98 8.53 10.62 1.27 4.83 0.99 10.19-1.73 14.48-2.56 4.05-6.46 6.66-11.1 7.69q-0.32 0.07-0.64 0.13l-0.1 0.62c11.62 4.84 14.57 26 25.98 33.38 2.29 1.48 4.36 2.32 6.82 3.41-6.67-0.55-9.94-0.58-15.86-3.96-12.46-8.09-11.1-24.15-24.97-32.74-7.28-0.49-14.28 0.22-21.4-0.2 0.26 9.44-2.18 18.49 2.59 26.19-4.08 0.23-8.71 0.15-12.84 0.16 5.56-10.23 1.85-30.87 2.93-42.79 0.52-5.78 0.09-14.66-2.24-19.96zm9.72 35.1c9.77 0.3 23.02 1.59 30.86-4.08 5.87-7.24 7.64-18.28-0.24-25.12-6.66-5.78-21.49-4.18-30.44-4.09-0.48 9.85-0.51 23.34-0.18 33.29z" />
                            <path d="m649.57 3.99c1.68 1.95 4.44 9.28 5.59 12.06l11.82 28.81c3.45 8.47 6.04 17.79 13.04 23.84-2.62-0.34-13.8-0.26-14.98-0.85 2.46-5.11-2.26-13.17-4.15-18.52-3.59 0.13-7.95 0-11.6-0.02q-8.05 0.39-16.1 0.31c-2.11 5.15-5.72 11.53-4.11 16.95l0.29 0.93-0.43 0.75c-1.47 0.72-5.06 0.04-8.37 0.57l-0.73 0.12c6.55-4.67 9.04-13.71 11.9-21.01l10.09-25.87c2.24-5.73 4.81-12.75 7.74-18.07zm-15.74 43.8c4.61 0.28 8.34 0.3 12.96 0.26h13.41c-1.91-4.89-11.6-30.77-13.52-33.03-4.2 10.66-8.49 22.3-12.85 32.77z" />
                            <path d="m174.71 4.9c10.57 0.21 15.83 2.81 23.79 9.07-0.89 1.48-2.11 3.13-3.12 4.57-6.78-8.98-17.59-15.58-29.68-10.01-3.94 1.82-5.46 5.52-6.55 9.54 5.46 17.08 37.54 15.49 40.53 33.38 2.08 12.42-10.73 17.2-21.58 17.82-9.85 0.07-18.14-1.96-25.57-8.72l3.08-4.56c6.21 8.22 12.01 11.64 22.52 11.62 4.55-0.01 9.91-1.25 13.11-4.74 1.74-1.93 2.58-4.51 2.32-7.1-1.66-17.28-55.51-17.72-36.71-44.4 3.58-5.06 12.13-6.15 17.86-6.47z" />
                            <path d="m207.78 5.7c6.14 0.64 14.58 0.46 20.85 0.45l31.26-0.13 0.08 6.6c-8.08-6.13-12.6-5.14-22.31-5.01 0.35 13.49-0.13 29.69-0.16 43.43-0.13 7.36-0.45 10.79 2.52 17.62l-12.65-0.04c4.42-6.85 3.13-17.8 3.12-25.89l-0.1-35.18c-10.45-0.56-14.99-0.42-23.51 5.58 0.21-2.43 0.59-5.01 0.9-7.43z" />
                        </svg>
                    </div>
                    <p className="text-xs text-white/50 uppercase tracking-widest">Admin Panel</p>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${activeTab === item.id ? 'bg-gold text-black font-bold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-2 flex-shrink-0 bg-[#111]">

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#0a0a0a] relative">
                <header className="bg-[#111] border-b border-white/10 p-4 sticky top-0 z-40 flex justify-between items-center lg:hidden">
                    <div className="text-gold font-serif text-lg tracking-widest uppercase">
                        Admin Panel
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white">
                        {isSidebarOpen ? <X /> : <Menu />}
                    </button>
                </header>

                <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
