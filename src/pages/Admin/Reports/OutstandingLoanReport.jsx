import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportOutstandingLoansReportExcel } from '../../../utils/reportExcel';

const OutstandingLoanReport = () => {
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
            const { data: loans, error } = await supabase
                .from('pinjaman')
                .select('*, personal_data(*), angsuran(*)')
                .eq('status', 'DICAIRKAN');
            if (error) throw error;

            const outstandingData = (loans || []).map(loan => {
                const principal = parseFloat(loan.jumlah_pinjaman);
                const tenor = loan.tenor_bulan;
                let totalBunga = 0;
                if (loan.tipe_bunga === 'PERSENAN') {
                    totalBunga = principal * (parseFloat(loan.nilai_bunga) / 100) * (tenor / 12);
                } else {
                    totalBunga = parseFloat(loan.nilai_bunga || 0);
                }

                const paidInstallments = loan.angsuran?.filter(a => a.status === 'PROCESSED' || a.status === 'PAID') || [];
                const paidCount = paidInstallments.length;

                const principalPerMonth = Math.round(principal / tenor);
                const interestPerMonth = Math.round(totalBunga / tenor);
                const monthlyTotal = Math.ceil((principal + totalBunga) / tenor);

                const sisaPokok = Math.max(0, principal - (principalPerMonth * paidCount));
                const sisaBunga = Math.max(0, totalBunga - (interestPerMonth * paidCount));

                return {
                    ...loan,
                    sisa_pokok: sisaPokok,
                    sisa_bunga: sisaBunga,
                    monthly_installment: monthlyTotal,
                    is_finished: paidCount >= tenor
                };
            }).filter(l => !l.is_finished);

            setData(outstandingData);
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const filteredData = data.filter(item => {
        const str = `${item.personal_data?.full_name} ${item.no_pinjaman}`.toLowerCase();
        return str.includes(searchTerm.toLowerCase());
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-gray-900 italic uppercase tracking-tight">Sisa Pinjaman</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium italic uppercase tracking-wider">Monitoring Saldo Pinjaman Berjalan</p>
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
                    onClick={() => exportOutstandingLoansReportExcel(filteredData)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
                >
                    <Download size={16} /> Export Excel
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto text-left">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 italic font-black text-[10px] uppercase tracking-widest text-gray-400">
                                <th className="px-6 py-4">No</th>
                                <th className="px-6 py-4">No Pinjaman / Nama</th>
                                <th className="px-6 py-4 text-center">Tenor</th>
                                <th className="px-6 py-4 text-right">Plafon</th>
                                <th className="px-6 py-4 text-right">Sisa Pokok</th>
                                <th className="px-6 py-4 text-right">Sisa Bunga</th>
                                <th className="px-6 py-4 text-right">Angsuran/Bln</th>
                                <th className="px-6 py-4 text-center">Kategori</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">Memuat...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-400 italic">Tidak ada data</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-emerald-50/20">
                                        <td className="px-6 py-4 text-xs font-bold text-gray-400">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-[10px] text-emerald-600 font-mono font-bold tracking-tighter">{item.no_pinjaman}</p>
                                            <p className="text-xs font-black text-gray-900 uppercase italic">{item.personal_data?.full_name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center text-[10px] font-black text-emerald-600">{item.tenor_bulan} bln</td>
                                        <td className="px-6 py-4 text-right text-xs font-black text-gray-700 font-mono italic">{formatCurrency(item.jumlah_pinjaman)}</td>
                                        <td className="px-6 py-4 text-right text-xs font-black text-emerald-600 font-mono italic">{formatCurrency(item.sisa_pokok)}</td>
                                        <td className="px-6 py-4 text-right text-xs font-black text-amber-600 font-mono italic">{formatCurrency(item.sisa_bunga)}</td>
                                        <td className="px-6 py-4 text-right text-xs font-black text-gray-900 font-mono italic">{formatCurrency(item.monthly_installment)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[9px] font-black uppercase italic">{item.kategori || '-'}</span>
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
                <div className="text-gray-400 font-black uppercase italic tracking-widest">Halaman {currentPage} dari {totalPages || 1}</div>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white border rounded-xl hover:bg-gray-50 disabled:opacity-30 shadow-sm"><ChevronLeft size={16} /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 bg-white border rounded-xl hover:bg-gray-50 disabled:opacity-30 shadow-sm"><ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
    );
};

export default OutstandingLoanReport;
