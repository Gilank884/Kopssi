import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, Eye, AlertCircle, FileDown, Filter, Download, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { generateLoanAnalysisPDF } from '../../utils/loanAnalysisPdf';
import { exportLoanApprovalExcel } from '../../utils/reportExcel';

const AssesmentPinjaman = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);
    const [analystName, setAnalystName] = useState('Admin');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const navigate = useNavigate();

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
        fetchLoans();
        fetchAnalystInfo();
        fetchCompanies();
    }, []);

    const fetchAnalystInfo = async () => {
        try {
            const storedUser = localStorage.getItem('auth_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);

                // Fetch full name from personal_data using the ID from localStorage
                const { data: profile } = await supabase
                    .from('personal_data')
                    .select('full_name')
                    .eq('user_id', user.id)
                    .single();

                if (profile) {
                    setAnalystName(profile.full_name);
                } else {
                    setAnalystName(user.name || 'Admin System');
                }
            }
        } catch (error) {
            console.error('Error fetching analyst info:', error);
        }
    };

    const fetchLoans = async () => {
        try {
            setLoading(true);
            // Hanya ambil data yang statusnya PENGAJUAN
            const { data, error } = await supabase
                .from('pinjaman')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        *
                    )
                `)
                .eq('status', 'PENGAJUAN')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLoans(data || []);
        } catch (error) {
            console.error('Error fetching loans:', error);
            alert('Gagal memuat data pengajuan pinjaman');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (loan) => {
        navigate(`/admin/assesment-pinjaman/${loan.id}`);
    };



    const handleBatchDownload = async () => {
        if (filteredLoans.length === 0) return;

        const confirmBatch = window.confirm(`Unduh ${filteredLoans.length} analisa pinjaman sekaligus?`);
        if (!confirmBatch) return;

        for (const loan of filteredLoans) {
            await generateLoanAnalysisPDF(loan, true, analystName);
        }
    };


    const filteredLoans = loans.filter(loan => {
        const matchesSearch =
            loan.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.no_pinjaman?.toLowerCase().includes(searchTerm.toLowerCase());

        const loanDate = new Date(loan.created_at).getTime();
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;

        const matchesDate = loanDate >= start && loanDate <= end;
        const matchesCompany = filterCompany === 'ALL' || loan.personal_data?.company === filterCompany;

        return matchesSearch && matchesDate && matchesCompany;
    });

    const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
    const paginatedLoans = filteredLoans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: '2-digit'
        });
    };

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Unified Header Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Title Row */}
                <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 italic tracking-tight leading-none">Penyetujuan Pinjaman</h2>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium italic tracking-tight">Tahap 1: Verifikasi dan setujui pengajuan anggota</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={fetchLoans}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[11px] font-black hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button
                            onClick={handleBatchDownload}
                            disabled={filteredLoans.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-black hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 shrink-0"
                        >
                            <FileDown size={14} />
                            Unduh PDF ({filteredLoans.length})
                        </button>
                        <button
                            onClick={() => exportLoanApprovalExcel(filteredLoans)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[11px] font-black hover:bg-emerald-700 transition-all shadow-sm shrink-0"
                        >
                            <Download size={14} /> Export Excel
                        </button>
                    </div>
                </div>
                {/* Filters Row */}
                <div className="px-5 py-3 flex flex-col sm:flex-row flex-wrap gap-3 items-center bg-gray-50/60">
                    <div className="relative flex-grow sm:max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Nama / No. Pinjaman..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full text-xs font-medium bg-white shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-bold shadow-sm"
                        />
                        <span className="text-gray-400 font-bold text-xs shrink-0">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-bold shadow-sm"
                        />
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                        <select
                            value={filterCompany}
                            onChange={(e) => {
                                setFilterCompany(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-bold tracking-tight italic appearance-none shadow-sm"
                        >
                            <option value="ALL">Semua PT</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-[10px] font-black italic text-gray-400">Tampilkan:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-bold tracking-tight italic appearance-none shadow-sm"
                        >
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Memuat data pengajuan...</p>
                </div>
            ) : filteredLoans.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <AlertCircle className="mx-auto text-gray-400" size={48} />
                    <p className="mt-4 text-gray-500 font-medium text-center">Tidak ada pengajuan pinjaman baru yang menunggu persetujuan</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-auto max-h-[70vh]">
                        <table className="w-full text-left border-collapse table-auto">
                            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                                <tr>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center w-8">No</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">Nama</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">NIK</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">Nominal Pengajuan</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">Nominal Disetujui</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center">Tenor</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center">No. Pinjaman</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center">Tanggal</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center">Analisa</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {paginatedLoans.map((loan, index) => (
                                    <tr
                                        key={loan.id}
                                        onClick={() => handleRowClick(loan)}
                                        className={`transition-colors cursor-pointer hover:bg-emerald-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}`}
                                    >
                                        <td className="px-2 py-1 border-r border-slate-200 text-center">
                                            <span className="text-[9px] font-black text-gray-400 italic">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className="font-bold text-slate-900 text-[11px] tracking-tight leading-none">{loan.personal_data?.full_name || '-'}</span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className="text-[9px] text-slate-400 font-mono tracking-tighter">{loan.personal_data?.nik || '-'}</span>
                                        </td>
                                        <td className="px-2 py-1 text-[11px] font-bold text-slate-400 border-r border-slate-200 font-mono italic">
                                            Rp {parseFloat(loan.jumlah_pengajuan || loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-2 py-1 text-[11px] font-black text-emerald-700 border-r border-slate-200 font-mono italic">
                                            Rp {parseFloat(loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-2 py-1 text-[11px] font-bold text-slate-600 border-r border-slate-200 text-center">{loan.tenor_bulan} bln</td>
                                        <td className="px-2 py-1 text-slate-400 text-[9px] font-mono border-r border-slate-200 text-center tracking-tighter">{loan.no_pinjaman}</td>
                                        <td className="px-2 py-1 text-slate-500 text-[10px] font-bold italic border-r border-slate-200 text-center whitespace-nowrap">{formatDate(loan.created_at)}</td>
                                        <td className="px-2 py-1 text-center border-r border-slate-200">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    generateLoanAnalysisPDF(loan, false, analystName);
                                                }}
                                                className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all shadow-sm"
                                                title="Pratinjau Analisa PDF"
                                            >
                                                <Eye size={12} />
                                            </button>
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRowClick(loan);
                                                }}
                                                className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black hover:bg-emerald-700 transition-all tracking-widest shadow-sm"
                                            >
                                                Verifikasi
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden divide-y divide-gray-50 text-left">
                        {paginatedLoans.map((loan) => (
                            <div
                                key={loan.id}
                                onClick={() => handleRowClick(loan)}
                                className="p-4 active:bg-gray-50 transition-colors space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-[10px]">
                                            {loan.personal_data?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 tracking-tighter italic block">
                                                {loan.personal_data?.full_name || '-'}
                                            </p>
                                            <p className="text-[8px] text-gray-400 font-mono tracking-widest">
                                                {loan.no_pinjaman}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-400 italic">{formatDate(loan.created_at)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                                    <div>
                                        <label className="text-[8px] font-black text-gray-400 tracking-widest block">Pengajuan</label>
                                        <span className="text-[11px] font-bold text-gray-500 italic">
                                            Rp {parseFloat(loan.jumlah_pengajuan || loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black text-emerald-600 tracking-widest block">Disetujui</label>
                                        <span className="text-sm font-black text-emerald-700 italic">
                                            Rp {parseFloat(loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 px-3">
                                    <div>
                                        <label className="text-[8px] font-black text-gray-400 tracking-widest block">Tenor</label>
                                        <span className="text-xs font-black text-gray-700 italic">{loan.tenor_bulan} Bln</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            generateLoanAnalysisPDF(loan, false, analystName);
                                        }}
                                        className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black tracking-widest flex items-center justify-center gap-2 border border-blue-100"
                                    >
                                        <Eye size={14} /> Analisa PDF
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRowClick(loan);
                                        }}
                                        className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black tracking-widest flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        Verifikasi
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DATA COUNT FOOTER AND PAGINATION */}
            {!loading && filteredLoans.length > 0 && (
                <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs font-black text-gray-400 tracking-widest italic text-left order-2 sm:order-1">
                        Menampilkan <span className="text-emerald-600">{paginatedLoans.length}</span> dari {filteredLoans.length} Pengajuan
                    </p>

                    <div className="flex items-center gap-2 order-1 sm:order-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black italic tracking-widest text-slate-600 shadow-sm">
                            {currentPage} / {totalPages || 1}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AssesmentPinjaman;
