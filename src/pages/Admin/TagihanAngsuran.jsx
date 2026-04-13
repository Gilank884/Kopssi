import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, CheckCircle, Clock, Banknote, CalendarDays, FileText, Download } from 'lucide-react';

const TagihanAngsuran = () => {
    const [installments, setInstallments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        return new Date(d.getFullYear(), d.getMonth(), lastDay).toISOString().split('T')[0];
    });
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const pageOptions = [10, 20, 50, 100];
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [updatingId, setUpdatingId] = useState(null);
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);

    const fetchCompanies = async () => {
        try {
            const { data, error } = await supabase
                .from('master_data')
                .select('value')
                .eq('category', 'company')
                .order('value', { ascending: true });
            if (error) throw error;
            setCompanies(data?.map(c => c.value) || []);
        } catch (err) {
            console.error("Error fetching companies:", err);
        }
    };

    useEffect(() => {
        fetchInstallments();
        fetchCompanies();
    }, [startDate, endDate]);

    const fetchInstallments = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('angsuran')
                .select(`
                    *,
                    pinjaman (
                        no_pinjaman,
                        personal_data:personal_data_id (
                            full_name,
                            nik,
                            work_unit,
                            company,
                            no_anggota
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            const installmentsToShow = (data || []).filter(inst => {
                // Strictly show only Unpaid / Empty status
                if (inst.status === 'PROCESSED') return false;

                const iDate = inst.tanggal_bayar ? inst.tanggal_bayar.split('T')[0] : null;

                // Show if unpaid and Due on or before endDate (Current + Overdue)
                if (iDate && iDate <= endDate) return true;

                return false;
            });

            // Sort by tanggal_bayar (due date) DESC
            installmentsToShow.sort((a, b) => new Date(a.tanggal_bayar) - new Date(b.tanggal_bayar));

            setInstallments(installmentsToShow);
        } catch (error) {
            console.error('Error fetching installments:', error);
            alert('Gagal memuat data angsuran');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (installment) => {
        if (!window.confirm(`Tandai angsuran ke-${installment.bulan_ke} untuk ${installment.pinjaman?.personal_data?.full_name} sebagai PROCESSED?`)) return;

        try {
            setUpdatingId(installment.id);
            const now = new Date().toISOString();

            const { error } = await supabase
                .from('angsuran')
                .update({
                    status: 'PROCESSED',
                    tanggal_bayar: now
                })
                .eq('id', installment.id);

            if (error) throw error;

            // Update local state
            setInstallments(prev => prev.map(i => i.id === installment.id ? { ...i, status: 'PROCESSED', tanggal_bayar: now } : i));
            alert('Angsuran berhasil dibayar!');
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Gagal memproses pembayaran: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleExportExcel = async () => {
        try {
            const { exportMonitoringAngsuran } = await import('../../utils/reportExcel');
            exportMonitoringAngsuran(filteredInstallments, {
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
            });
        } catch (err) {
            console.error('Excel export error:', err);
        }
    };

    const filteredInstallments = installments.filter(inst => {
        const matchesSearch = inst.pinjaman?.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inst.pinjaman?.personal_data?.nik?.includes(searchTerm) ||
            inst.pinjaman?.no_pinjaman?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCompany = filterCompany === 'ALL' || inst.pinjaman?.personal_data?.company === filterCompany;

        return matchesSearch && matchesCompany;
    });

    // Pagination Calculation
    const totalPages = Math.ceil(filteredInstallments.length / itemsPerPage);
    const paginatedInstallments = filteredInstallments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCompany, startDate, endDate]);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                <div className="text-left">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tight">Tagihan Angsuran</h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium italic">Lacak status pembayaran angsuran pinjaman anggota</p>
                </div>

                {/* Filters Wrapper */}
                <div className="flex flex-col md:flex-row flex-wrap gap-3 items-stretch md:items-end">
                    {/* Date Filter */}
                    <div className="flex items-center gap-2 bg-white px-4 py-2 border border-gray-200 rounded-xl shadow-sm">
                        <CalendarDays size={16} className="text-emerald-500" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold focus:outline-none"
                        />
                        <span className="text-gray-300 text-[10px] font-black italic">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold focus:outline-none"
                        />
                    </div>

                    {/* Search Field */}
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                        <input
                            type="text"
                            placeholder="Cari nama, NIK, atau No Pin..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 text-sm shadow-sm font-medium transition-all"
                        />
                    </div>

                    {/* PT Filter & Export */}
                    <div className="flex items-center gap-3">
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="px-4 py-2.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm font-bold italic appearance-none"
                        >
                            <option value="ALL">Semua PT</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-6 py-2.5 md:py-2 bg-white text-emerald-600 border-2 border-emerald-100 rounded-xl text-xs font-black hover:bg-emerald-50 transition-all shadow-sm h-[42px] md:h-[40px]"
                        >
                            <Download size={16} /> Export
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-auto max-h-[70vh] text-left">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] uppercase tracking-widest italic border-r border-slate-200">Anggota</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] uppercase tracking-widest italic border-r border-slate-200 text-center">No Pinjaman</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] uppercase tracking-widest italic border-r border-slate-200 text-center">Bulan</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] uppercase tracking-widest italic border-r border-slate-200 text-right">Angsuran</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] uppercase tracking-widest italic border-r border-slate-200 text-center">Status</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] uppercase tracking-widest italic border-r border-slate-200 text-center">Tgl Bayar</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] uppercase tracking-widest italic text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        Memuat data angsuran...
                                    </td>
                                </tr>
                            ) : filteredInstallments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center text-slate-400 italic font-black text-[10px] tracking-widest">
                                        <CalendarDays size={40} className="mx-auto mb-4 opacity-20" />
                                        <p>Tidak ada data angsuran</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedInstallments.map((inst) => (
                                    <tr key={inst.id} className="hover:bg-emerald-50 transition-colors group">
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <div className="flex flex-col leading-none">
                                                <span className="text-[11px] font-black text-slate-900 italic tracking-tight">
                                                    {inst.pinjaman?.personal_data?.full_name || '-'}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-mono">
                                                    {inst.pinjaman?.personal_data?.nik || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-1 text-center border-r border-slate-200">
                                            <span className="text-[9px] font-black font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded tracking-tighter">
                                                {inst.pinjaman?.no_pinjaman || '-'}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-center border-r border-slate-200">
                                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-black text-emerald-600">
                                                Bln {inst.bulan_ke}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-right border-r border-slate-200">
                                            <span className="text-[11px] font-black text-red-600 font-mono italic whitespace-nowrap">
                                                {formatCurrency(inst.amount)}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-center border-r border-slate-200">
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter border ${inst.status === 'PROCESSED'
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                                }`}>
                                                {inst.status === 'PROCESSED' ? <CheckCircle size={8} /> : null}
                                                {inst.status === 'PROCESSED' ? 'Lunas' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-center text-[9px] font-bold text-slate-500 italic border-r border-slate-200 whitespace-nowrap">
                                            {inst.tanggal_bayar ? new Date(inst.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                            {inst.status !== 'PROCESSED' ? (
                                                <button
                                                    onClick={() => handleMarkAsPaid(inst)}
                                                    disabled={updatingId === inst.id}
                                                    className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-black hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
                                                >
                                                    {updatingId === inst.id ? '...' : 'Bayar'}
                                                </button>
                                            ) : (
                                                <span className="text-[8px] font-black text-emerald-500 italic">Terekam</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION FOOTER */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
                    <div className="flex items-center gap-4 text-xs font-black text-gray-400 tracking-widest">
                        <span>Tampilkan</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-600 shadow-sm"
                        >
                            {pageOptions.map(opt => <option key={opt} value={opt}>{opt} Data</option>)}
                        </select>
                        <span className="hidden md:block">| Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredInstallments.length)} dari {filteredInstallments.length} data</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border-gray-200 rounded-xl text-[10px] font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        >
                            Sebelumnya
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-110' : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'}`}
                                >
                                    {i + 1}
                                </button>
                            )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-4 py-2 bg-white border-gray-200 rounded-xl text-[10px] font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        >
                            Berikutnya
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TagihanAngsuran;
