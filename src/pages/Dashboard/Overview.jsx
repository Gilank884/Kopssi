import React, { useLayoutEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, AlertCircle, CreditCard } from 'lucide-react';
import gsap from 'gsap';

const dataSimpanan = [
    { name: 'Jan', amount: 4000000 },
    { name: 'Feb', amount: 4500000 },
    { name: 'Mar', amount: 5000000 },
    { name: 'Apr', amount: 5500000 },
    { name: 'May', amount: 6200000 },
    { name: 'Jun', amount: 7000000 },
];

const dataPinjaman = [
    { name: 'Bulan 1', sisa: 10000000 },
    { name: 'Bulan 2', sisa: 9200000 },
    { name: 'Bulan 3', sisa: 8400000 },
    { name: 'Bulan 4', sisa: 7600000 },
];

const Card = ({ title, value, subtext, icon, type }) => {
    // Type: primary (red), secondary (gray), success (red-light)
    const bgClass = type === 'primary' ? 'bg-red-600 text-white' : 'bg-white text-gray-800';
    const subtextClass = type === 'primary' ? 'text-red-100' : 'text-gray-500';
    const iconBg = type === 'primary' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600';

    return (
        <div className={`card-anim p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between ${bgClass}`}>
            <div>
                <p className={`${type === 'primary' ? 'text-red-100' : 'text-gray-500'} text-sm font-medium mb-1`}>{title}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
                <p className={`text-xs mt-2 ${subtextClass}`}>{subtext}</p>
            </div>
            <div className={`p-3 rounded-xl ${iconBg}`}>
                {icon}
            </div>
        </div>
    )
};

const Overview = () => {
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".card-anim", {
                y: 30,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "back.out(1.5)"
            });
            gsap.from(".chart-anim", {
                scale: 0.95,
                opacity: 0,
                duration: 0.8,
                delay: 0.3,
                ease: "power2.out"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="space-y-6">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title="Total Simpanan"
                    value="Rp 7.000.000"
                    subtext="+12% dari bulan lalu"
                    icon={<DollarSign size={24} />}
                    type="primary"
                />
                <Card
                    title="Pinjaman Aktif"
                    value="Rp 8.500.000"
                    subtext="Jatuh tempo: 25 Des 2024"
                    icon={<CreditCard size={24} />}
                />
                <Card
                    title="Sisa Pinjaman"
                    value="Rp 4.200.000"
                    subtext="Tenor tersisa: 5 bulan"
                    icon={<AlertCircle size={24} />}
                />
                <Card
                    title="Estimasi SHU"
                    value="Rp 450.000"
                    subtext="Tahun Buku 2024"
                    icon={<TrendingUp size={24} />}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Simpanan Chart */}
                <div className="chart-anim bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Pertumbuhan Simpanan</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataSimpanan}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}Jt`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#FEF2F2' }}
                                />
                                <Bar dataKey="amount" fill="#DC2626" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pinjaman Chart */}
                <div className="chart-anim bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Sisa Pinjaman</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dataPinjaman}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="sisa" stroke="#DC2626" strokeWidth={3} dot={{ r: 4, fill: '#DC2626', strokeWidth: 2, stroke: '#fff' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Additional Info */}
            <div className="chart-anim bg-gradient-to-r from-red-50 to-white border border-red-100 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-full text-red-600 shadow-sm">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-900">Jadwal Angsuran Terdekat</h4>
                        <p className="text-gray-600">Angsuran Pinjaman Mikro sebesar <span className="font-bold text-red-600">Rp 850.000</span> jatuh tempo pada <span className="font-bold text-red-600">25 Desember 2024</span>.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
