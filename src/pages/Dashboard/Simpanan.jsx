import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const SimpananCard = ({ title, amount, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 text-sm font-medium mb-2">{title}</p>
        <h3 className={`text-2xl font-bold ${color === 'green' ? 'text-emerald-600' : 'text-gray-900'}`}>{amount}</h3>
    </div>
);

const Simpanan = () => {
    const history = [
        { date: '12 Dec 2024', type: 'Simpanan Sukarela', nominal: 500000, status: 'Setor', balance: 7000000 },
        { date: '10 Nov 2024', type: 'Simpanan Wajib', nominal: 100000, status: 'Setor', balance: 6500000 },
        { date: '10 Oct 2024', type: 'Simpanan Wajib', nominal: 100000, status: 'Setor', balance: 6400000 },
        { date: '25 Sep 2024', type: 'Penarikan', nominal: 200000, status: 'Tarik', balance: 6300000 },
        { date: '10 Sep 2024', type: 'Simpanan Wajib', nominal: 100000, status: 'Setor', balance: 6500000 },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <SimpananCard title="Simpanan Pokok" amount="Rp 1.000.000" />
                <SimpananCard title="Simpanan Wajib" amount="Rp 3.500.000" />
                <SimpananCard title="Simpanan Sukarela" amount="Rp 2.500.000" />
                <SimpananCard title="Total Saldo" amount="Rp 7.000.000" color="green" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Riwayat Transaksi</h3>
                    <button className="text-emerald-600 text-sm font-medium hover:underline">Download Laporan</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="px-6 py-3 font-medium">Tanggal</th>
                                <th className="px-6 py-3 font-medium">Jenis Simpanan</th>
                                <th className="px-6 py-3 font-medium">Transaksi</th>
                                <th className="px-6 py-3 font-medium">Nominal</th>
                                <th className="px-6 py-3 font-medium">Saldo Akhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {history.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-700">{item.date}</td>
                                    <td className="px-6 py-4 text-gray-700">{item.type}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Setor' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {item.status === 'Setor' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 font-medium ${item.status === 'Setor' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {item.status === 'Setor' ? '+' : '-'} Rp {item.nominal.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-800">Rp {item.balance.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-2">Informasi Bunga</h4>
                <p className="text-gray-600 text-sm">Anda mendapatkan bunga simpanan sebesar <span className="font-bold">4% per tahun</span> untuk Simpanan Sukarela. Bunga dihitung berdasarkan saldo terendah setiap bulan dan dikreditkan pada akhir bulan.</p>
            </div>
        </div>
    );
};

export default Simpanan;
