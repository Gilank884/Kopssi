import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const SHU = () => {
    const data = [
        { name: 'Jasa Modal (Simpanan)', value: 400000, color: '#10B981' },
        { name: 'Jasa Usaha (Pinjaman)', value: 350000, color: '#3B82F6' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-emerald-600 rounded-2xl p-8 text-white shadow-lg text-center relative overflow-hidden">

                <div className="relative z-10">
                    <p className="text-emerald-100 font-medium mb-2">Estimasi SHU Diterima (Tahun 2024)</p>
                    <h2 className="text-5xl font-bold">Rp 750.000</h2>
                    <p className="text-sm mt-4 text-emerald-100 opacity-80">*Nilai ini adalah estimasi sementara dan dapat berubah sesuai Rapat Anggota Tahunan</p>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Komposisi SHU</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6">
                        {data.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-sm text-gray-600">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6">Rincian Perhitungan</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-50">
                            <span className="text-gray-600">Total Simpanan Anda</span>
                            <span className="font-medium">Rp 7.000.000</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-50">
                            <span className="text-gray-600">Total Pinjaman Anda</span>
                            <span className="font-medium">Rp 10.000.000</span>
                        </div>

                        <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Jasa Modal (40%)</span>
                                <span className="font-bold text-gray-800">Rp 400.000</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Jasa Usaha (30%)</span>
                                <span className="font-bold text-gray-800">Rp 350.000</span>
                            </div>
                            <div className="pt-2 border-t border-gray-200 flex justify-between">
                                <span className="font-bold text-emerald-600">Total Estimasi</span>
                                <span className="font-bold text-emerald-600">Rp 750.000</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SHU;
