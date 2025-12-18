import React from 'react';
import { Users, DollarSign, Briefcase, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminOverview = () => {
    const data = [
        { name: 'Jan', revenue: 4000 },
        { name: 'Feb', revenue: 3000 },
        { name: 'Mar', revenue: 2000 },
        { name: 'Apr', revenue: 2780 },
        { name: 'May', revenue: 1890 },
        { name: 'Jun', revenue: 2390 },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Ringkasan Koperasi</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-600">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Total Anggota</p>
                            <h3 className="text-3xl font-bold text-gray-900">1,245</h3>
                        </div>
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-600">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Total Aset</p>
                            <h3 className="text-3xl font-bold text-gray-900">12.5M</h3>
                        </div>
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-600">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Pinjaman Aktif</p>
                            <h3 className="text-3xl font-bold text-gray-900">8.2M</h3>
                        </div>
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <Briefcase size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-600">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">SHU Tahun Ini</p>
                            <h3 className="text-3xl font-bold text-gray-900">650Jt</h3>
                        </div>
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Pertumbuhan Aset</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#FEF2F2' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="revenue" fill="#DC2626" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Aktivitas Terbaru</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">U{i}</div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Anggota #{100 + i}</p>
                                        <p className="text-xs text-gray-500">Melakukan setoran wajib</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-emerald-600">+ Rp 100.000</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
