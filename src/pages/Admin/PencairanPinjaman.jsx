import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, AlertCircle, ChevronRight } from 'lucide-react';

const PencairanPinjaman = () => {
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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
        fetchLoans();
        fetchCompanies();
    }, []);

    const fetchLoans = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pinjaman')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        full_name,
                        nik,
                        phone,
                        company,
                        work_unit
                    )
                `)
                .eq('status', 'DISETUJUI')
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
        navigate(`/admin/pencairan-pinjaman/${loan.id}`);
    };

    const filteredLoans = loans.filter(loan => {
        const matchesSearch = loan.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.no_pinjaman?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCompany = filterCompany === 'ALL' || loan.personal_data?.company === filterCompany;

        return matchesSearch && matchesCompany;
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
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tight text-left">Pencairan Pinjaman</h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium italic text-left">Tahap 2: Proses pencairan dana ke anggota</p>
                </div>
                {/* Filters Wrapper */}
                <div className="flex flex-col md:flex-row flex-wrap gap-3 items-stretch md:items-end">
                    {/* Search Field */}
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                        <input
                            type="text"
                            placeholder="Cari nama peminjam..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 text-sm shadow-sm font-medium transition-all"
                        />
                    </div>
                    {/* Company Select */}
                    <div className="relative">
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="w-full pl-4 pr-8 py-2.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm font-bold tracking-tight italic appearance-none"
                        >
                            <option value="ALL">Semua PT</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
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
                    <div className="hidden md:block overflow-auto max-h-[70vh]">
                        <table className="w-full text-left border-collapse table-auto">
                            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                                <tr>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Nama</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">NIK</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center bg-emerald-50/50">Nominal</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center bg-emerald-50/50">Tenor</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center bg-emerald-50/50">No. Pinjaman</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center bg-emerald-50/50">Tanggal</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic text-center bg-emerald-50/50">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredLoans.map((loan) => (
                                    <tr
                                        key={loan.id}
                                        onClick={() => handleRowClick(loan)}
                                        className="hover:bg-emerald-50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className="font-black text-slate-900 text-[11px] tracking-tight leading-none">{loan.personal_data?.full_name || '-'}</span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className="text-[9px] text-slate-400 font-mono tracking-tighter">{loan.personal_data?.nik || '-'}</span>
                                        </td>
                                        <td className="px-2 py-1 text-center border-r border-slate-200">
                                            <span className="text-[11px] font-black text-emerald-700 font-mono italic">
                                                Rp {parseFloat(loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-center border-r border-slate-200">
                                            <span className="text-[10px] font-bold text-slate-600 italic">
                                                {loan.tenor_bulan} bln
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-center font-mono font-bold text-[9px] text-slate-400 border-r border-slate-200 tracking-tighter">
                                            {loan.no_pinjaman}
                                        </td>
                                        <td className="px-2 py-1 text-center text-[10px] font-bold text-slate-500 border-r border-slate-200 italic">
                                            {formatDate(loan.created_at)}
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                            <div className="inline-flex p-1 rounded bg-emerald-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                                                <ChevronRight size={12} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-50 text-left">
                        {filteredLoans.map((loan) => (
                            <div
                                key={loan.id}
                                onClick={() => handleRowClick(loan)}
                                className="p-4 active:bg-gray-50 transition-colors flex items-center justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-[8px]">
                                            {loan.personal_data?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div className="text-left">
                                            <span className="text-xs font-black text-gray-900 tracking-tighter italic block">
                                                {loan.personal_data?.full_name || '-'}
                                            </span>
                                            <span className="text-[8px] text-gray-400 font-mono tracking-widest">
                                                {loan.no_pinjaman}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 tracking-widest block">Nominal</label>
                                            <span className="text-sm font-black text-emerald-600 italic">
                                                Rp {parseFloat(loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 tracking-widest block">Tenor</label>
                                            <span className="text-xs font-black text-gray-700 italic">{loan.tenor_bulan} Bln</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-gray-300" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DATA COUNT FOOTER */}
            {!loading && filteredLoans.length > 0 && (
                <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-black text-gray-400 tracking-widest italic text-left">
                        Menampilkan <span className="text-emerald-600">{filteredLoans.length}</span> Pengajuan Menunggu Pencairan
                    </p>
                    <p className="text-[10px] font-bold text-gray-300 italic">
                        Kopssi Management System • {new Date().getFullYear()}
                    </p>
                </div>
            )}

        </div>
    );
};

export default PencairanPinjaman;
