import React from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';

const Angsuran = () => {
    const schedule = Array.from({ length: 12 }, (_, i) => {
        const isPaid = i < 7;
        return {
            month: i + 1,
            date: `25 ${['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][i % 12]} ${i > 3 ? 2025 : 2024}`,
            pokok: 833333,
            bunga: 120000,
            total: 953333,
            status: isPaid ? 'Lunas' : i === 7 ? 'Belum Bayar' : 'Mendatang'
        };
    });

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-lg">Jadwal Angsuran</h3>
                    <p className="text-gray-500 text-sm">Pinjaman Mikro (PJ-2024-001)</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-medium">Bulan Ke</th>
                                <th className="px-6 py-4 font-medium">Jatuh Tempo</th>
                                <th className="px-6 py-4 font-medium">Pokok</th>
                                <th className="px-6 py-4 font-medium">Bunga</th>
                                <th className="px-6 py-4 font-medium">Total Angsuran</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {schedule.map((item) => (
                                <tr key={item.month} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-900 font-medium text-center w-24">
                                        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">{item.month}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{item.date}</td>
                                    <td className="px-6 py-4 text-gray-600">Rp {item.pokok.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-gray-600">Rp {item.bunga.toLocaleString()}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">Rp {item.total.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        {item.status === 'Lunas' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                <CheckCircle size={14} /> LUNAS
                                            </span>
                                        ) : item.status === 'Belum Bayar' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                <Clock size={14} /> TAGIHAN
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                                                MENUNGGU
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Angsuran;
