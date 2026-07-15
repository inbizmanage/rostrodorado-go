import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import {
    Users, Clock, Globe, Activity, TrendingUp, Eye,
    Smartphone, Monitor, ArrowUpRight, ArrowDownRight,
    ShoppingBag, BarChart3, MousePointerClick
} from 'lucide-react';

// ─── Source Normalization ───────────────────────────────────
const normalizeSource = (raw: string): string => {
    if (!raw || raw === '' || raw === 'Direct') return 'Directo';
    const lower = raw.toLowerCase();
    // Facebook variants
    if (lower.includes('facebook') || lower === 'fb' || lower.includes('fbclid') ||
        lower.includes('l.facebook') || lower.includes('lm.facebook') ||
        lower.includes('m.facebook') || lower.includes('fb.com') ||
        lower.includes('web.facebook')) return 'Facebook';
    // Instagram variants
    if (lower.includes('instagram') || lower === 'ig' || lower.includes('l.instagram') ||
        lower.includes('instagr.am')) return 'Instagram';
    // Google variants
    if (lower.includes('google') || lower === 'gclid') return 'Google';
    // Twitter / X
    if (lower.includes('t.co') || lower.includes('twitter') || lower.includes('x.com')) return 'X (Twitter)';
    // TikTok
    if (lower.includes('tiktok') || lower === 'tt') return 'TikTok';
    // WhatsApp
    if (lower.includes('whatsapp') || lower === 'wa') return 'WhatsApp';
    // YouTube
    if (lower.includes('youtube') || lower.includes('youtu.be')) return 'YouTube';
    // Pinterest
    if (lower.includes('pinterest')) return 'Pinterest';
    // Self-referral
    if (lower.includes('rostrodorado')) return 'Interno';
    return raw; // Keep as-is if unknown
};

// ─── Friendly Page Name ────────────────────────────────────
const PAGE_LABELS: Record<string, string> = {
    '/': '🏠 Inicio',
    '/productos': '🛍️ Catálogo de Productos',
    '/checkout': '💳 Checkout',
    '/login': '🔐 Iniciar Sesión',
    '/register': '📝 Registro',
    '/blog': '📰 Blog',
    '/mis-pedidos': '📦 Mis Pedidos',
    '/admin': '⚙️ Admin Panel',
    '/terminos-y-condiciones': '📄 Términos y Condiciones',
    '/politica-de-privacidad': '🔒 Política de Privacidad',
    '/politica-de-envios': '🚚 Política de Envíos',
    '/politica-devoluciones': '↩️ Devoluciones',
};

const friendlyPageName = (path: string, title?: string, productsMap?: Record<string, string>): string => {
    if (PAGE_LABELS[path]) return PAGE_LABELS[path];

    // Product detail page: try local map first, then extract name from title if available
    if (path.startsWith('/productos/')) {
        if (productsMap) {
            const parts = path.split('/');
            const id = parts[parts.length - 1]; // ID is always the last part of the route
            if (id && productsMap[id]) {
                return `💄 ${productsMap[id]}`;
            }
        }

        if (title && !title.includes('undefined') && title !== 'Dra. Isaura Dorado | Medicina Estética en Riohacha Clinic') {
            // Title is usually set by the ProductDetailsPage component
            const cleanTitle = title.replace(' | Rostro Dorado', '')
                .replace(' - Rostro Dorado', '')
                .replace('Dra. Isaura Dorado | Medicina Estética en Riohacha Clinic', '')
                .trim();
            if (cleanTitle) {
                return `💄 ${cleanTitle}`;
            }
        }
        return '💄 Producto (detalle)';
    }
    if (path.startsWith('/blog/')) {
        if (title) return `📰 ${title.replace(' | Rostro Dorado', '')}`;
        return '📰 Artículo del Blog';
    }
    if (path.startsWith('/admin')) return '⚙️ Admin Panel';
    return path;
};

// ─── Source Colors & Icons ─────────────────────────────────
const SOURCE_COLORS: Record<string, string> = {
    'Facebook': '#1877F2',
    'Instagram': '#E4405F',
    'Google': '#34A853',
    'WhatsApp': '#25D366',
    'TikTok': '#000000',
    'X (Twitter)': '#1DA1F2',
    'YouTube': '#FF0000',
    'Directo': '#D4AF37',
    'Interno': '#6B7280',
    'Pinterest': '#E60023',
};

const AdminAnalytics: React.FC = () => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [views, setViews] = useState<any[]>([]);
    const [productsMap, setProductsMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const qSessions = query(collection(db, 'analytics_sessions'), orderBy('startTime', 'desc'), limit(500));
                const snapSessions = await getDocs(qSessions);
                const sessionsData = snapSessions.docs.map(d => d.data());

                const qViews = query(collection(db, 'analytics_views'), orderBy('timestamp', 'desc'), limit(1000));
                const snapViews = await getDocs(qViews);
                const viewsData = snapViews.docs.map(d => d.data());

                const qProducts = query(collection(db, 'products'));
                const snapProducts = await getDocs(qProducts);
                const pMap: Record<string, string> = {};
                snapProducts.docs.forEach(d => {
                    pMap[d.id] = d.data().name;
                });

                setProductsMap(pMap);
                setSessions(sessionsData);
                setViews(viewsData);
            } catch (error) {
                console.error("Error loading analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // ─── Computed Stats ────────────────────────────────────
    const stats = useMemo(() => {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        const active = sessions.filter(s => s.lastActive?.toDate() > fiveMinsAgo).length;

        // Avg Duration
        let totalDur = 0, counted = 0;
        sessions.forEach(s => {
            if (s.startTime && s.lastActive) {
                const diff = (s.lastActive.toDate().getTime() - s.startTime.toDate().getTime()) / 1000;
                if (diff > 0 && diff < 3600) { totalDur += diff; counted++; }
            }
        });
        const avgSec = counted > 0 ? Math.round(totalDur / counted) : 0;

        // Bounce Rate (sessions with only 1 page view)
        const sessionsWithViews = sessions.filter(s => s.pageViews !== undefined);
        const bounced = sessionsWithViews.filter(s => (s.pageViews || 0) <= 1).length;
        const bounceRate = sessionsWithViews.length > 0 ? Math.round((bounced / sessionsWithViews.length) * 100) : 0;

        // Avg pages per session
        const totalPages = sessions.reduce((sum, s) => sum + (s.pageViews || 0), 0);
        const avgPages = sessions.length > 0 ? (totalPages / sessions.length).toFixed(1) : '0';

        // Top Source
        const sourceCounts: Record<string, number> = {};
        sessions.forEach(s => {
            const src = normalizeSource(s.referrer);
            sourceCounts[src] = (sourceCounts[src] || 0) + 1;
        });
        const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
        const topSource = sortedSources.length > 0 ? sortedSources[0][0] : 'Directo';

        return {
            totalSessions: sessions.length,
            activeNow: active,
            avgDuration: `${Math.floor(avgSec / 60)}m ${avgSec % 60}s`,
            topSource,
            bounceRate,
            avgPages,
            totalPageViews: views.length
        };
    }, [sessions, views]);

    // ─── Traffic Sources (Normalized) ──────────────────────
    const trafficData = useMemo(() => {
        const counts: Record<string, number> = {};
        sessions.forEach(s => {
            const src = normalizeSource(s.referrer);
            counts[src] = (counts[src] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({
                name,
                count,
                pct: sessions.length > 0 ? Math.round((count / sessions.length) * 100) : 0,
                color: SOURCE_COLORS[name] || '#8884d8'
            }));
    }, [sessions]);

    // ─── Top Pages (with friendly names) ───────────────────
    const topPages = useMemo(() => {
        const pageMap: Record<string, { count: number; title?: string }> = {};
        views.forEach(v => {
            const p = v.path || '/';
            if (!pageMap[p]) pageMap[p] = { count: 0, title: v.title };
            pageMap[p].count++;
            if (v.title && !pageMap[p].title) pageMap[p].title = v.title;
        });
        return Object.entries(pageMap)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 8)
            .map(([path, data]) => ({
                name: friendlyPageName(path, data.title, productsMap),
                path,
                count: data.count,
                pct: views.length > 0 ? Math.round((data.count / views.length) * 100) : 0
            }));
    }, [views, productsMap]);

    // ─── Top Products (subset of top pages) ────────────────
    const topProducts = useMemo(() => {
        const productMap: Record<string, { count: number; title?: string }> = {};
        views.forEach(v => {
            if (v.path?.startsWith('/productos/')) {
                const p = v.path;
                if (!productMap[p]) productMap[p] = { count: 0, title: v.title };
                productMap[p].count++;
                if (v.title) productMap[p].title = v.title;
            }
        });
        return Object.entries(productMap)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([path, data]) => ({
                name: friendlyPageName(path, data.title, productsMap).replace('💄 ', ''),
                count: data.count
            }));
    }, [views, productsMap]);

    // ─── Device Data ───────────────────────────────────────
    const deviceData = useMemo(() => {
        const counts = { Desktop: 0, Mobile: 0 };
        sessions.forEach(s => {
            if (s.device === 'Mobile') counts.Mobile++;
            else counts.Desktop++;
        });
        const total = counts.Mobile + counts.Desktop || 1;
        return [
            { name: 'Móvil', value: counts.Mobile, pct: Math.round((counts.Mobile / total) * 100), color: '#D4AF37' },
            { name: 'Desktop', value: counts.Desktop, pct: Math.round((counts.Desktop / total) * 100), color: '#ffffff' }
        ];
    }, [sessions]);

    // ─── Daily Trend (last 7 days) ─────────────────────────
    const dailyTrend = useMemo(() => {
        const dayMap: Record<string, { sessions: number; views: number }> = {};
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = `${d.getDate()}/${d.getMonth() + 1}`;
            dayMap[key] = { sessions: 0, views: 0 };
        }

        sessions.forEach(s => {
            if (s.startTime?.toDate) {
                const d = s.startTime.toDate();
                const key = `${d.getDate()}/${d.getMonth() + 1}`;
                if (dayMap[key] !== undefined) dayMap[key].sessions++;
            }
        });

        views.forEach(v => {
            if (v.timestamp?.toDate) {
                const d = v.timestamp.toDate();
                const key = `${d.getDate()}/${d.getMonth() + 1}`;
                if (dayMap[key] !== undefined) dayMap[key].views++;
            }
        });

        return Object.entries(dayMap).map(([date, data]) => ({
            date,
            sesiones: data.sessions,
            vistas: data.views
        }));
    }, [sessions, views]);

    // ─── Hourly Distribution ───────────────────────────────
    const hourlyData = useMemo(() => {
        const hours: number[] = Array(24).fill(0);
        sessions.forEach(s => {
            if (s.startTime?.toDate) {
                const h = s.startTime.toDate().getHours();
                hours[h]++;
            }
        });
        return hours.map((count, h) => ({
            hora: `${h}:00`,
            visitas: count
        }));
    }, [sessions]);

    // ─── Conversion Funnel ─────────────────────────────────
    const funnel = useMemo(() => {
        const uniqueSessionsOnHome = new Set<string>();
        const uniqueSessionsOnProducts = new Set<string>();
        const uniqueSessionsOnProductDetail = new Set<string>();
        const uniqueSessionsOnCheckout = new Set<string>();

        views.forEach(v => {
            const sid = v.sessionId;
            const p = v.path || '';
            if (p === '/') uniqueSessionsOnHome.add(sid);
            if (p === '/productos') uniqueSessionsOnProducts.add(sid);
            if (p.startsWith('/productos/')) uniqueSessionsOnProductDetail.add(sid);
            if (p === '/checkout') uniqueSessionsOnCheckout.add(sid);
        });

        const total = sessions.length || 1;
        return [
            { name: 'Inicio', count: uniqueSessionsOnHome.size, pct: Math.round((uniqueSessionsOnHome.size / total) * 100) },
            { name: 'Catálogo', count: uniqueSessionsOnProducts.size, pct: Math.round((uniqueSessionsOnProducts.size / total) * 100) },
            { name: 'Ver Producto', count: uniqueSessionsOnProductDetail.size, pct: Math.round((uniqueSessionsOnProductDetail.size / total) * 100) },
            { name: 'Checkout', count: uniqueSessionsOnCheckout.size, pct: Math.round((uniqueSessionsOnCheckout.size / total) * 100) },
        ];
    }, [sessions, views]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif text-white">Analítica</h2>
                <span className="text-xs text-white/30">Últimas {sessions.length} sesiones</span>
            </div>

            {/* ── KPI Cards ─────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <KPICard
                    icon={<Users className="text-gold" size={20} />}
                    value={stats.totalSessions.toString()}
                    label="Sesiones Totales"
                    badge={<span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> {stats.activeNow} ahora
                    </span>}
                />
                <KPICard
                    icon={<Clock className="text-blue-400" size={20} />}
                    value={stats.avgDuration}
                    label="Duración Promedio"
                />
                <KPICard
                    icon={<Globe className="text-purple-400" size={20} />}
                    value={stats.topSource}
                    label="Fuente Principal"
                />
                <KPICard
                    icon={<Activity className="text-pink-400" size={20} />}
                    value={stats.totalPageViews.toString()}
                    label="Páginas Vistas"
                />
                <KPICard
                    icon={<MousePointerClick className="text-red-400" size={20} />}
                    value={`${stats.bounceRate}%`}
                    label="Tasa de Rebote"
                    trend={stats.bounceRate > 60 ? 'bad' : 'good'}
                />
                <KPICard
                    icon={<Eye className="text-cyan-400" size={20} />}
                    value={stats.avgPages}
                    label="Págs/Sesión"
                />
            </div>

            {/* ── Row 1: Daily Trend + Funnel ───────────────── */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-[#111] p-6 rounded-xl border border-white/10 md:col-span-2">
                    <h3 className="text-lg text-white font-serif mb-1">Tendencia de Tráfico</h3>
                    <p className="text-xs text-white/40 mb-6">Últimos 7 días — sesiones y páginas vistas</p>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyTrend}>
                                <defs>
                                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: 12 }} />
                                <Area type="monotone" dataKey="sesiones" stroke="#D4AF37" fill="url(#goldGrad)" strokeWidth={2} />
                                <Area type="monotone" dataKey="vistas" stroke="#3B82F6" fill="url(#blueGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-3">
                        <LegendDot color="#D4AF37" label="Sesiones" />
                        <LegendDot color="#3B82F6" label="Páginas Vistas" />
                    </div>
                </div>

                {/* Conversion Funnel */}
                <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                    <h3 className="text-lg text-white font-serif mb-1">Embudo de Conversión</h3>
                    <p className="text-xs text-white/40 mb-6">Recorrido del visitante</p>
                    <div className="space-y-3">
                        {funnel.map((step, i) => (
                            <div key={step.name}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-white/70">{step.name}</span>
                                    <span className="text-white/50">{step.count} <span className="text-white/30">({step.pct}%)</span></span>
                                </div>
                                <div className="h-6 bg-white/5 rounded-lg overflow-hidden">
                                    <div
                                        className="h-full rounded-lg transition-all duration-1000"
                                        style={{
                                            width: `${Math.max(step.pct, 2)}%`,
                                            background: `linear-gradient(90deg, ${['#D4AF37', '#A855F7', '#3B82F6', '#10B981'][i]}, ${['#D4AF3780', '#A855F780', '#3B82F680', '#10B98180'][i]})`
                                        }}
                                    />
                                </div>
                                {i < funnel.length - 1 && (
                                    <div className="text-center my-1">
                                        <span className="text-[10px] text-white/20">▼</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Row 2: Traffic Sources + Devices ──────────── */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Traffic Sources */}
                <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                    <h3 className="text-lg text-white font-serif mb-1">Fuentes de Tráfico</h3>
                    <p className="text-xs text-white/40 mb-6">¿De dónde vienen tus visitantes?</p>
                    <div className="space-y-3">
                        {trafficData.map((src) => (
                            <div key={src.name} className="group">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: src.color }} />
                                        <span className="text-sm text-white/80">{src.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white">{src.count}</span>
                                        <span className="text-xs text-white/40">({src.pct}%)</span>
                                    </div>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${Math.max(src.pct, 1)}%`, backgroundColor: src.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Device Breakdown */}
                <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                    <h3 className="text-lg text-white font-serif mb-1">Dispositivos</h3>
                    <p className="text-xs text-white/40 mb-6">Móvil vs Escritorio</p>
                    <div className="h-48 flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={deviceData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                                    {deviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <Smartphone className="text-white/20 mb-1" size={18} />
                            <span className="text-xs text-white/40">vs</span>
                            <Monitor className="text-white/20 mt-1" size={18} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {deviceData.map(d => (
                            <div key={d.name} className="text-center p-3 bg-white/5 rounded-lg">
                                <div className="text-2xl font-bold text-white">{d.pct}%</div>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                    <span className="text-xs text-white/50">{d.name} ({d.value})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Row 3: Top Pages + Top Products ───────────── */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Top Pages */}
                <div className="bg-[#111] p-4 md:p-6 rounded-xl border border-white/10 w-full overflow-hidden">
                    <h3 className="text-lg text-white font-serif mb-1">Páginas Más Vistas</h3>
                    <p className="text-xs text-white/40 mb-6">¿Qué páginas visitan más?</p>
                    <div className="space-y-2">
                        {topPages.map((page, i) => (
                            <div key={page.path} className="flex items-center gap-2 md:gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <span className="text-xs text-white/30 w-4 md:w-5 text-right font-mono shrink-0">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-white/80 truncate">{page.name}</div>
                                    <div className="h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                                        <div
                                            className="h-full bg-gold rounded-full transition-all"
                                            style={{ width: `${page.pct}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-sm font-medium text-white">{page.count}</div>
                                    <div className="text-[10px] text-white/30">{page.pct}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-[#111] p-4 md:p-6 rounded-xl border border-white/10 w-full overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                        <ShoppingBag className="text-gold" size={18} />
                        <h3 className="text-lg text-white font-serif">Productos Más Vistos</h3>
                    </div>
                    <p className="text-xs text-white/40 mb-6">¿Qué productos generan más interés?</p>
                    {topProducts.length > 0 ? (
                        <div className="space-y-3">
                            {topProducts.map((product, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-gold/20 text-gold' : i === 1 ? 'bg-white/10 text-white/60' : 'bg-white/5 text-white/30'}`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-white truncate">{product.name}</div>
                                    </div>
                                    <div className="flex items-center gap-1 text-gold">
                                        <Eye size={12} />
                                        <span className="text-sm font-medium">{product.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-white/30 py-8">
                            <ShoppingBag className="mx-auto mb-2 opacity-30" size={32} />
                            <p className="text-sm">Sin datos de productos todavía</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Row 4: Hourly Activity ────────────────────── */}
            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                <h3 className="text-lg text-white font-serif mb-1">Actividad por Hora del Día</h3>
                <p className="text-xs text-white/40 mb-6">¿A qué hora te visitan más? — Ideal para programar publicaciones</p>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="hora" tick={{ fill: '#9ca3af', fontSize: 9 }} interval={2} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                                formatter={(value: number) => [`${value} visitas`, 'Sesiones']}
                            />
                            <Bar dataKey="visitas" radius={[4, 4, 0, 0]} barSize={16}>
                                {hourlyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.visitas > 0 ? '#D4AF37' : 'rgba(255,255,255,0.05)'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// ─── KPI Card Component ────────────────────────────────────
const KPICard: React.FC<{
    icon: React.ReactNode;
    value: string;
    label: string;
    badge?: React.ReactNode;
    trend?: 'good' | 'bad';
}> = ({ icon, value, label, badge, trend }) => (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
        <div className="flex justify-between items-start mb-2">
            {icon}
            {badge}
            {trend && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${trend === 'good' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {trend === 'good' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                </span>
            )}
        </div>
        <div className="text-2xl font-bold text-white truncate">{value}</div>
        <div className="text-xs text-white/40 mt-0.5">{label}</div>
    </div>
);

// ─── Legend Dot ────────────────────────────────────────────
const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
    <div className="flex items-center gap-2 text-xs text-white/60">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        {label}
    </div>
);

class AnalyticsErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Analytics Error Boundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-950/20 border border-red-500/30 rounded-lg text-white m-4 font-sans">
          <h2 className="text-xl font-bold text-red-400 mb-2">⚠️ Error en el panel de Analíticas</h2>
          <p className="text-sm text-white/70 mb-4">
            Ocurrió un error inesperado al renderizar los datos de analíticas. Por favor copia y reporta el siguiente error:
          </p>
          <pre className="text-xs font-mono bg-black/60 p-4 rounded border border-white/10 overflow-auto max-w-full text-red-300 whitespace-pre-wrap">
            {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminAnalyticsWithBoundary: React.FC = () => (
    <AnalyticsErrorBoundary>
        <AdminAnalytics />
    </AnalyticsErrorBoundary>
);

export default AdminAnalyticsWithBoundary;

