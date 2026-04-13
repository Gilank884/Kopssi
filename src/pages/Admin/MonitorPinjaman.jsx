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
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 italic uppercase tracking-tight">Monitoring Pinjaman</h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium italic uppercase tracking-wider">Lacak pencairan baru periode ini</p>
                </div>

                {/* Filters Wrapper */}
                <div className="flex flex-col md:flex-row flex-wrap gap-3 items-stretch md:items-end">
                    {/* Search Field */}
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama, NIK, atau No Pin..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 text-sm shadow-sm font-medium"
                        />
                    </div>

                    {/* Date Filters */}
                    <div className="flex items-center gap-2 flex-grow md:flex-grow-0">
                        <div className="relative flex-grow">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm font-bold"
                            />
                        </div>
                        <span className="text-gray-400 font-bold hidden sm:block">s/d</span>
                        <div className="relative flex-grow">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm font-bold"
                            />
                        </div>
                    </div>

                    {/* Company Select */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm font-bold uppercase tracking-tight italic appearance-none"
                        >
                            <option value="ALL">SEMUA PT</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 md:py-2 bg-emerald-600 md:bg-white text-white md:text-emerald-600 border-2 border-emerald-600 md:border-emerald-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 md:hover:bg-emerald-50 transition-all shadow-lg md:shadow-sm"
                    >
                        <Download size={16} /> <span className="md:inline">Export Excel</span>
                    </button>
                </div>
            </div>

            {/* Desktop Table Container */}
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl shadow-emerald-900/5 border border-gray-100 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 italic font-black text-[10px] uppercase tracking-widest text-gray-400">
                                <th className="px-6 py-4">Anggota</th>
                                <th className="px-6 py-4 text-center">No Pinjaman</th>
                                <th className="px-6 py-4 text-right">Pengajuan</th>
                                <th className="px-6 py-4 text-right">Disetujui</th>
                                <th className="px-6 py-4 text-center">Tenor</th>
                                <th className="px-6 py-4">Tanggal Cair</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        Memuat data pinjaman...
                                    </td>
                                </tr>
                            ) : filteredLoans.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-24 text-center text-gray-400 italic">
                                        <BadgeCent size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-bold text-lg">Tidak ada pinjaman ditemukan</p>
                                        <p className="text-sm">Coba sesuaikan filter atau kata kunci pencarian Anda</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((loan) => (
                                    <tr
                                        key={loan.id}
                                        onClick={() => navigate(`/admin/loan-detail/${loan.id}`)}
                                        className="hover:bg-emerald-50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900 uppercase italic tracking-tight">
                                                    {loan.personal_data?.full_name || '-'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-mono">
                                                    {loan.personal_data?.nik || '-'} • {loan.personal_data?.company || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-black font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded-md uppercase tracking-widest">
                                                {loan.no_pinjaman}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-bold text-gray-400 font-mono italic">
                                                {formatCurrency(loan.jumlah_pengajuan || loan.jumlah_pinjaman)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-emerald-700 font-mono italic">
                                                {formatCurrency(loan.jumlah_pinjaman)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black italic">
                                                {loan.tenor_bulan} BULAN
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs font-bold italic">
                                            {new Date(loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${loan.status === 'DICAIRKAN'
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
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
                                        <span className="text-sm font-black text-gray-900 uppercase italic">
                                            {loan.personal_data?.full_name || '-'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-mono tracking-tight uppercase">
                                            {loan.no_pinjaman} • {loan.personal_data?.company || '-'}
                                        </span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border ${loan.status === 'DICAIRKAN'
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
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic leading-none mb-1">Cair</span>
                                        <span className="text-sm font-black text-emerald-700 font-mono italic">
                                            {formatCurrency(loan.jumlah_pinjaman)}
                                        </span>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic leading-none mb-1">Tenor</span>
                                        <span className="text-[10px] font-black text-gray-700 italic">
                                            {loan.tenor_bulan} BLN
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold italic">
                                    <span>{new Date(loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                    <span className="text-emerald-600 font-black uppercase tracking-widest">Detail →</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* PAGINATION FOOTER */}
                <div className="px-4 md:px-6 py-6 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
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
                            className="h-9 px-3 bg-white border border-gray-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm mr-1"
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
                            className="h-9 px-3 bg-white border border-gray-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm ml-1"
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
