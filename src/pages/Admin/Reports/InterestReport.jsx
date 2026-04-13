import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportInterestIncomeReportExcel } from '../../../utils/reportExcel';

const InterestReport = () => {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: installments, error } = await supabase
                .from('angsuran')
                .select('*, pinjaman(*, personal_data(*))')
                .or('status.eq.PROCESSED,status.eq.PAID')
                .order('tanggal_bayar', { ascending: false });
            if (error) throw error;

            const processedData = (installments || []).map(inst => {
                const loan = inst.pinjaman;
                const principal = parseFloat(loan.jumlah_pinjaman);
                const tenor = loan.tenor_bulan;
                let totalBunga = 0;
                if (loan.tipe_bunga === 'PERSENAN') {
                    totalBunga = principal * (parseFloat(loan.nilai_bunga) / 100) * (tenor / 12);
                } else {
                    totalBunga = parseFloat(loan.nilai_bunga);
                }
                const interestPerMonth = Math.round(totalBunga / tenor);

                return {
                    ...inst,
                    interest_amount: interestPerMonth,
                    nama: loan.personal_data?.full_name,
                    no_pinjaman: loan.no_pinjaman
                };
            });
            setData(processedData);
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const filteredData = data.filter(item => {
        const str = `${item.nama} ${item.no_pinjaman}`.toLowerCase();
        return str.includes(searchTerm.toLowerCase());
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-gray-900 italic tracking-tight">Pendapatan Bunga</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium italic">Laporan Porsi Bunga Pinjaman</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari nama, No Pinjaman..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 text-sm shadow-sm"
                    />
                </div>
                <button
                    onClick={() => exportInterestIncomeReportExcel(filteredData)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-lg"
                >
                    <Download size={16} /> Export Excel
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-auto max-h-[70vh] text-left">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 w-12 text-center">No</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">Nama / No Pinjaman</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center">Bulan Ke</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-right">Porsi Bunga</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic text-center">Tgl Bayar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading && data.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        <p className="text-[10px] font-black tracking-widest italic opacity-50">Memuat data...</p>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                                        <p className="font-black text-[10px] tracking-widest italic">Tidak ada data ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-emerald-50 transition-colors group">
                                        <td className="px-2 py-1 text-[10px] font-bold text-slate-400 border-r border-slate-200 text-center leading-none">
                                            {(currentPage - 1) * itemsPerPage + idx + 1}
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <p className="text-[11px] font-black text-slate-800 italic tracking-tight leading-none mb-0.5">{item.nama}</p>
                                            <p className="text-[9px] text-slate-400 font-mono tracking-tighter leading-none">{item.no_pinjaman}</p>
                                        </td>
                                        <td className="px-2 py-1 text-center border-r border-slate-200">
                                            <span className="text-[10px] font-black text-emerald-600 font-mono tracking-tighter leading-none">#{item.bulan_ke}</span>
                                        </td>
                                        <td className="px-2 py-1 text-right border-r border-slate-200">
                                            <span className="text-[11px] font-black text-emerald-600 font-mono italic leading-none">{formatCurrency(item.interest_amount).replace(/Rp\s?/, '')}</span>
                                        </td>
                                        <td className="px-2 py-1 text-center text-[10px] font-bold text-slate-500 italic leading-none">
                                            {item.tanggal_bayar ? new Date(item.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs text-left">
                <div className="text-gray-400 font-black italic tracking-widest">Halaman {currentPage} dari {totalPages || 1}</div>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white border rounded-xl hover:bg-gray-50 disabled:opacity-30 shadow-sm"><ChevronLeft size={16} /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 bg-white border rounded-xl hover:bg-gray-50 disabled:opacity-30 shadow-sm"><ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
    );
};

export default InterestReport;
