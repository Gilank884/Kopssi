import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportPaidInstallmentsReportExcel } from '../../../utils/reportExcel';

const InstallmentReport = () => {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [installments, setInstallments] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchInstallments();
    }, [startDate, endDate]);

    const fetchInstallments = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('angsuran')
                .select('*, pinjaman(*, personal_data(*))')
                .or('status.eq.PROCESSED,status.eq.PAID')
                .gte('tanggal_bayar', startDate)
                .lte('tanggal_bayar', endDate)
                .order('tanggal_bayar', { ascending: false });
            if (error) throw error;
            setInstallments(data || []);
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const companies = ['ALL', ...new Set(installments.map(inst => inst.pinjaman?.personal_data?.company).filter(Boolean))];

    const filteredData = installments.filter(inst => {
        const matchesSearch = `${inst.pinjaman?.personal_data?.full_name} ${inst.pinjaman?.no_pinjaman}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompany = filterCompany === 'ALL' || inst.pinjaman?.personal_data?.company === filterCompany;
        return matchesSearch && matchesCompany;
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-gray-900 italic uppercase tracking-tight">Laporan Angsuran</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium italic uppercase tracking-wider">Histori Pembayaran Angsuran Lunas</p>
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

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-gray-400">Dari</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-gray-400">Sampai</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                    </div>
                </div>

                <div className="flex items-center">
                    <select
                        value={filterCompany}
                        onChange={(e) => setFilterCompany(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm uppercase italic"
                    >
                        <option value="ALL">Semua Perusahaan</option>
                        {companies.filter(c => c !== 'ALL').map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => exportPaidInstallmentsReportExcel(filteredData)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
                >
                    <Download size={16} /> Export Excel
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 italic font-black text-[10px] uppercase tracking-widest text-gray-400">
                                <th className="px-6 py-4">No</th>
                                <th className="px-6 py-4">Nama / No Pinjaman</th>
                                <th className="px-6 py-4 text-center">Bulan Ke</th>
                                <th className="px-6 py-4 text-right">Nominal</th>
                                <th className="px-6 py-4 text-center">Tgl Bayar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Memuat...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">Tidak ada data</td></tr>
                            ) : (
                                paginatedData.map((inst, idx) => (
                                    <tr key={inst.id} className="hover:bg-emerald-50/20">
                                        <td className="px-6 py-4 text-xs font-bold text-gray-400">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-black text-gray-900 uppercase italic">{inst.pinjaman?.personal_data?.full_name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono tracking-tighter">{inst.pinjaman?.no_pinjaman}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-black text-emerald-600">#{inst.bulan_ke}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-black text-emerald-600 font-mono italic">{formatCurrency(inst.amount)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-[10px] font-bold text-gray-500 italic">
                                            {inst.tanggal_bayar ? new Date(inst.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-xs">
                <div className="text-gray-400 font-black uppercase italic tracking-widest">Halaman {currentPage} dari {totalPages || 1}</div>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white border rounded-xl hover:bg-gray-50 disabled:opacity-30 shadow-sm"><ChevronLeft size={16} /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 bg-white border rounded-xl hover:bg-gray-50 disabled:opacity-30 shadow-sm"><ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
    );
};

export default InstallmentReport;
