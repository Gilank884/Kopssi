import React from 'react';
import { FileText, Download, Printer } from 'lucide-react';

const AdminReports = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Laporan Koperasi</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Report Card 1 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-48">
                    <div>
                        <div className="flex items-center gap-3 mb-4 text-gray-800">
                            <FileText className="text-red-600" size={24} />
                            <h3 className="font-bold text-lg">Laporan Keuangan Bulanan</h3>
                        </div>
                        <p className="text-gray-500 text-sm">Rekapitulasi simpanan, pinjaman, dan arus kas bulan berjalan.</p>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                            <Download size={16} /> PDF
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                            <Printer size={16} /> Print
                        </button>
                    </div>
                </div>

                {/* Report Card 2 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-48">
                    <div>
                        <div className="flex items-center gap-3 mb-4 text-gray-800">
                            <FileText className="text-red-600" size={24} />
                            <h3 className="font-bold text-lg">Laporan SHU Tahunan</h3>
                        </div>
                        <p className="text-gray-500 text-sm">Proyeksi dan realisasi Sisa Hasil Usaha tahun buku 2024.</p>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                            <Download size={16} /> PDF
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                            <Printer size={16} /> Print
                        </button>
                    </div>
                </div>

                {/* Report Card 3 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-48">
                    <div>
                        <div className="flex items-center gap-3 mb-4 text-gray-800">
                            <FileText className="text-red-600" size={24} />
                            <h3 className="font-bold text-lg">Data Anggota Baru</h3>
                        </div>
                        <p className="text-gray-500 text-sm">Daftar anggota yang bergabung dalam periode 30 hari terakhir.</p>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                            <Download size={16} /> Excel
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                            <Printer size={16} /> Print
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
