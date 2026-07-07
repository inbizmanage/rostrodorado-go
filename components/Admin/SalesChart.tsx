import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface SalesChartProps {
    data: { date: string; sales: number }[];
}

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl h-[400px]">
            <h3 className="text-xl font-serif text-white mb-6">Ventas de los Últimos 30 Días</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                            tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                            tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                            itemStyle={{ color: '#D4AF37' }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
                        />
                        <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="#D4AF37"
                            fillOpacity={1}
                            fill="url(#colorSales)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SalesChart;
