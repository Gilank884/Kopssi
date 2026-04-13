import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, Filter, CheckCircle, Banknote, User, BadgeCent, Download } from 'lucide-react';

const MonitorPinjaman = () => {
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const pageOptions = [10, 20, 50, 100];
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
        fetchData();
        fetchCompanies();
    }, [startDate, endDate]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const startD = startDate;
            const endD = endDate;

            // Fetch Loans created in this range
            const { data: loanData, error: loanError } = await supabase
                .from('pinjaman')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        full_name,
                        nik,
                        work_unit,
                        company
                    )
                `)
                .gte('created_at', `${startD}T00:00:00`)
                .lte('created_at', `${endD}T23:59:59`)
                .order('created_at', { ascending: false });

            if (loanError) throw loanError;
            setLoans(loanData || []);

            if (loanError) throw loanError;
            setLoans(loanData || []);

        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Gagal memuat data monitoring');
        } finally {
            setLoading(false);
        }
    };


    const handleExportExcel = async () => {
        try {
            const { exportMonitoringPinjaman } = await import('../../utils/reportExcel');
            exportMonitoringPinjaman(filteredLoans, { startDate, endDate });
        } catch (err) {
            console.error('Excel export error:', err);
        }
    };

    const filteredLoans = loans.filter(loan => {
        const matchesSearch = loan.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.personal_data?.nik?.includes(searchTerm) ||
            loan.no_pinjaman?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompany = filterCompany === 'ALL' || loan.personal_data?.company === filterCompany;
        return matchesSearch && matchesCompany;
    });


    // Pagination Calculation
    const activeData = filteredLoans;
    const totalPages = Math.ceil(activeData.length / itemsPerPage);
    const paginatedData = activeData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCompany, startDate, endDate]);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                <div className="text-left">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tight">Monitoring Pinjaman</h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium italic tracking-tight">Lacak pencairan baru periode ini</p>
                </div>
            </div>

            {/* Content Control Area - Now inside a subtle card for better separation */}
            <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row flex-wrap gap-4 items-center justify-between mb-2">
                 <div className="flex items-center gap-2 text-sm font-bold text-gray-500 italic">
                     <Filter size={16} /> Filter & Kontrol
                 </div>
                 {/* Filters Wrapper */}
                 <div className="flex flex-col md:flex-row flex-wrap gap-3 w-full md:w-auto">
                    {/* Search Field */}
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama, NIK, atau No Pin..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 text-xs shadow-sm font-medium bg-white"
                        />
                    </div>

                    {/* Date Filters */}
                    <div className="flex items-center gap-2 flex-grow md:flex-grow-0">
                        <div className="relative flex-grow">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white shadow-sm font-bold"
                            />
                        </div>
                        <span className="text-gray-400 font-bold hidden sm:block text-xs">s/d</span>
                        <div className="relative flex-grow">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white shadow-sm font-bold"
                            />
                        </div>
                    </div>

                    {/* Company Select */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white shadow-sm font-bold tracking-tight italic appearance-none"
                        >
                            <option value="ALL">Semua PT</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black hover:bg-emerald-700 transition-all shadow-sm"
                    >
                        <Download size={14} /> <span className="md:inline">Export Excel</span>
                    </button>
                </div>
            </div>

            {/* Desktop Table Container */}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="hidden md:block overflow-auto max-h-[70vh]">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Nama</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">NIK</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center bg-emerald-50/50">No Pinjaman</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">PT</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-right bg-emerald-50/50">Pengajuan</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-right bg-emerald-50/50">Disetujui</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center bg-emerald-50/50">Tenor</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Tanggal</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic text-center bg-emerald-50/50">Status</th>

                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-20 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        Memuat data pinjaman...
                                    </td>
                                </tr>
                            ) : filteredLoans.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-24 text-center text-gray-400 italic font-black text-[10px] tracking-widest">
                                        <BadgeCent size={40} className="mx-auto mb-4 opacity-20" />
                                        <p>Tidak ada pinjaman ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((loan) => (
                                    <tr
                                        key={loan.id}
                                        onClick={() => navigate(`/admin/loan-detail/${loan.id}`)}
                                        className="hover:bg-emerald-50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className="text-[11px] font-black text-slate-900 italic tracking-tight leading-none">
                                                {loan.personal_data?.full_name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className="text-[9px] text-slate-400 font-mono">
                                                {loan.personal_data?.nik || '-'}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-center border-r border-slate-200">
                                            <span className="text-[9px] font-black font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded tracking-tighter">
                                                {loan.no_pinjaman}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className="text-[9px] text-slate-400 font-bold italic">
                                                {loan.personal_data?.company || '-'}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-right border-r border-slate-200">
                                            <span className="text-[10px] font-bold text-slate-400 font-mono italic">
                                                {formatCurrency(loan.jumlah_pengajuan || loan.jumlah_pinjaman)}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-right border-r border-slate-200">
                                            <span className="text-[11px] font-black text-emerald-700 font-mono italic">
                                                {formatCurrency(loan.jumlah_pinjaman)}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-center border-r border-slate-200">
                                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-black italic">
                                                {loan.tenor_bulan} bln
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-slate-500 text-[10px] font-bold italic border-r border-slate-200 whitespace-nowrap">
                                            {new Date(loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black tracking-tighter border ${loan.status === 'DICAIRKAN'
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                : loan.status === 'DITOLAK'
                                                    ? 'bg-red-100 text-red-700 border-red-200'
                                                    : 'bg-amber-100 text-amber-700 border-amber-200'
                                                }`}>
                                                {loan.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card Container */}
                <div className="md:hidden divide-y divide-gray-100">
                    {loading ? (
                        <div className="px-6 py-20 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                            Memuat data...
                        </div>
                    ) : filteredLoans.length === 0 ? (
                        <div className="px-6 py-20 text-center text-gray-400 italic">
                            <BadgeCent size={40} className="mx-auto mb-4 opacity-20" />
                            <p className="font-bold">Tidak ada data</p>
                        </div>
                    ) : (
                        paginatedData.map((loan) => (
                            <div
                                key={loan.id}
                                onClick={() => navigate(`/admin/loan-detail/${loan.id}`)}
                                className="p-4 active:bg-gray-50 transition-colors space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-gray-900 italic">
                                            {loan.personal_data?.full_name || '-'}
                                        </span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-gray-400 font-mono tracking-tight underline border-r border-gray-200 pr-2">
                                                {loan.no_pinjaman}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-mono tracking-tight">
                                                 {loan.personal_data?.company || '-'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-tighter border ${loan.status === 'DICAIRKAN'
                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                        : loan.status === 'DITOLAK'
                                            ? 'bg-red-100 text-red-700 border-red-200'
                                            : 'bg-amber-100 text-amber-700 border-amber-200'
                                        }`}>
                                        {loan.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-400 tracking-widest italic leading-none mb-1">Cair</span>
                                        <span className="text-sm font-black text-emerald-700 font-mono italic">
                                            {formatCurrency(loan.jumlah_pinjaman)}
                                        </span>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-[9px] font-black text-gray-400 tracking-widest italic leading-none mb-1">Tenor</span>
                                        <span className="text-[10px] font-black text-gray-700 italic">
                                            {loan.tenor_bulan} Bln
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold italic">
                                    <span>{new Date(loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                    <span className="text-emerald-600 font-black tracking-widest">Detail →</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* PAGINATION FOOTER */}
                <div className="px-4 md:px-6 py-6 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-4 text-[10px] font-black text-gray-400 tracking-widest">
                        <div className="flex items-center gap-2">
                            <span>Tampil</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-600 shadow-sm font-bold"
                            >
                                {pageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <span className="hidden sm:block">| Showing {paginatedData.length} of {activeData.length} records</span>
                        <span className="sm:hidden">{paginatedData.length} / {activeData.length} record</span>
                    </div>

                    <div className="flex items-center gap-1 md:gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="h-9 px-3 bg-white border border-gray-200 rounded-xl text-[9px] font-black tracking-widest hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm mr-1"
                        >
                            ←
                        </button>

                        <div className="flex items-center gap-1.5 px-2">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-110' : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'}`}
                                >
                                    {i + 1}
                                </button>
                            )).slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 1))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="h-9 px-3 bg-white border border-gray-200 rounded-xl text-[9px] font-black tracking-widest hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm ml-1"
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitorPinjaman;
