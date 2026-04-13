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
            {/* Unified Header Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Title Row */}
                <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 italic tracking-tight leading-none">Laporan Angsuran</h2>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium italic tracking-tight">Histori Pembayaran Angsuran Lunas</p>
                    </div>
                    <button
                        onClick={() => exportPaidInstallmentsReportExcel(filteredData)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[11px] font-black hover:bg-emerald-700 transition-all shadow-sm shrink-0"
                    >
                        <Download size={14} /> Export Excel
                    </button>
                </div>
                {/* Filters Row */}
                <div className="px-5 py-3 flex flex-col sm:flex-row flex-wrap gap-3 items-center bg-gray-50/60">
                    <div className="relative flex-grow sm:max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Cari nama, No Pinjaman..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full text-xs font-medium bg-white shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-[10px] font-black text-gray-400 shrink-0">Dari</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                        <span className="text-[10px] font-black text-gray-400 shrink-0">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                    </div>
                    <select
                        value={filterCompany}
                        onChange={(e) => setFilterCompany(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm italic w-full sm:w-auto"
                    >
                        <option value="ALL">Semua Perusahaan</option>
                        {companies.filter(c => c !== 'ALL').map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-auto max-h-[70vh] text-left">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 w-12 text-center bg-emerald-50/50">No</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Nama / No Pinjaman</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center bg-emerald-50/50">Bulan Ke</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-right bg-emerald-50/50">Nominal</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic text-center bg-emerald-50/50">Tgl Bayar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading && installments.length === 0 ? (
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
                                paginatedData.map((inst, idx) => (
                                    <tr key={inst.id} className="hover:bg-emerald-50 transition-colors group">
                                        <td className="px-2 py-1 text-[10px] font-bold text-slate-400 border-r border-slate-200 text-center leading-none">
                                            {(currentPage - 1) * itemsPerPage + idx + 1}
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <p className="text-[11px] font-black text-slate-800 italic tracking-tight leading-none mb-0.5">{inst.pinjaman?.personal_data?.full_name}</p>
                                            <p className="text-[9px] text-slate-400 font-mono tracking-tighter leading-none">{inst.pinjaman?.no_pinjaman}</p>
                                        </td>
                                        <td className="px-2 py-1 text-center border-r border-slate-200">
                                            <span className="text-[10px] font-black text-emerald-600 font-mono tracking-tighter leading-none">#{inst.bulan_ke}</span>
                                        </td>
                                        <td className="px-2 py-1 text-right border-r border-slate-200">
                                            <span className="text-[11px] font-black text-emerald-600 font-mono italic leading-none">{formatCurrency(inst.amount).replace(/Rp\s?/, '')}</span>
                                        </td>
                                        <td className="px-2 py-1 text-center text-[10px] font-bold text-slate-500 italic leading-none">
                                            {inst.tanggal_bayar ? new Date(inst.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
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
                <div className="text-gray-400 font-black italic tracking-widest">Halaman {currentPage} dari {totalPages || 1}</div>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white border rounded-xl hover:bg-gray-50 disabled:opacity-30 shadow-sm"><ChevronLeft size={16} /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 bg-white border rounded-xl hover:bg-gray-50 disabled:opacity-30 shadow-sm"><ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
    );
};

export default InstallmentReport;
