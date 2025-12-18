import React from 'react';
import { CreditCard, FileText } from 'lucide-react';

const Pinjaman = () => {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <p className="text-blue-200 text-sm font-medium mb-1">Total Pinjaman Aktif</p>
                        <h2 className="text-4xl font-bold">Rp 8.500.000</h2>
                        <div className="mt-4 flex gap-4 text-sm">
                            <div>
                                <p className="text-blue-200">Nomor Pinjaman</p>
                                <p className="font-medium">PJ-2024-001</p>
                            </div>
                            <div>
                                <p className="text-blue-200">Tanggal Pencairan</p>
                                <p className="font-medium">25 Agustus 2024</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 min-w-[200px]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">Sisa Tenor</span>
                            <span className="font-bold">5 Bulan</span>
                        </div>
                        <div className="w-full bg-blue-900/50 rounded-full h-2 mb-2">
                            <div className="bg-white h-2 rounded-full" style={{ width: '58%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-blue-200">
                            <span>7 Angsuran Paid</span>
                            <span>5 Remaining</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <CreditCard size={20} className="text-blue-600" /> Detail Pinjaman
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Plafon Pinjaman</span>
                            <span className="font-medium text-gray-900">Rp 10.000.000</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Jangka Waktu</span>
                            <span className="font-medium text-gray-900">12 Bulan</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Suku Bunga</span>
                            <span className="font-medium text-gray-900">1.2% / Bulan (Flat)</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Angsuran per Bulan</span>
                            <span className="font-medium text-gray-900">Rp 850.000</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-500">Status</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">BERJALAN</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FileText size={20} className="text-blue-600" /> Ringkasan Pembayaran
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Pokok Terbayar</span>
                            <span className="font-medium text-emerald-600">Rp 5.833.331</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Bunga Terbayar</span>
                            <span className="font-medium text-gray-900">Rp 840.000</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Sisa Pokok</span>
                            <span className="font-medium text-red-600">Rp 4.166.669</span>
                        </div>
                        <div className="mt-6 pt-4 bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 text-center">Pinjaman ini dilindungi asuransi kredit. Jika terjadi resiko meninggal dunia, sisa pinjaman dianggap lunas.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pinjaman;
