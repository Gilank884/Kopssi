import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, Eye, AlertCircle, FileDown } from 'lucide-react';
import { generateLoanAnalysisPDF } from '../../utils/loanAnalysisPdf';

const AssesmentPinjaman = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);
    const [analystName, setAnalystName] = useState('Admin');
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
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                <div className="text-left">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tight text-left">Penyetujuan Pinjaman</h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium italic text-left">Tahap 1: Verifikasi dan setujui pengajuan anggota</p>
                </div>

                {/* Filters Wrapper */}
                <div className="flex flex-col md:flex-row flex-wrap gap-3 items-stretch md:items-end">
                    {/* Search Field */}
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                        <input
                            type="text"
                            placeholder="Nama / No. Pinjaman..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-48 text-sm shadow-sm font-medium transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-grow md:flex-grow-0">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs md:text-sm bg-white font-bold transition-all shadow-sm"
                        />
                        <span className="text-slate-400 font-bold px-1 hidden sm:block">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-2.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs md:text-sm bg-white font-bold transition-all shadow-sm"
                        />
                    </div>

                    <div className="relative flex-grow md:flex-grow-0">
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="w-full pl-4 pr-8 py-2.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[11px] bg-white font-black tracking-tight italic appearance-none shadow-sm transition-all"
                        >
                            <option value="ALL">Semua PT</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleBatchDownload}
                        disabled={filteredLoans.length === 0}
                        className="px-6 py-2.5 md:py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 h-[42px] md:h-[40px]"
                    >
                        <FileDown size={18} />
                        Unduh PDF ({filteredLoans.length})
                    </button>
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
                                {filteredLoans.map((loan) => (
                                    <tr
                                        key={loan.id}
                                        onClick={() => handleRowClick(loan)}
                                        className="hover:bg-emerald-50 transition-colors cursor-pointer"
                                    >
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
                        {filteredLoans.map((loan) => (
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

            {/* DATA COUNT FOOTER */}
            {!loading && filteredLoans.length > 0 && (
                <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-black text-gray-400 tracking-widest italic text-left">
                        Menampilkan <span className="text-emerald-600">{filteredLoans.length}</span> Pengajuan Menunggu Assesment
                    </p>
                    <p className="text-[10px] font-bold text-gray-300 italic">
                        Kopssi Management System • {new Date().getFullYear()}
                    </p>
                </div>
            )}

        </div>
    );
};

export default AssesmentPinjaman;
