import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Filter, Download, ArrowRight, User, Building, Wallet, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MonitorSimpanan = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const pageOptions = [10, 20, 50, 100];

    useEffect(() => {
        fetchCompanies();
        fetchMemberSavings();
    }, []);

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

    const fetchMemberSavings = async () => {
        try {
            setLoading(true);

            // Fetch Active & Passive Members Only
            const { data: membersData, error: memberError } = await supabase
                .from('personal_data')
                .select('id, full_name, nik, no_npp, company, work_unit')
                .in('status', [
                    'ACTIVE', 'ACTIVED', 'VERIFIED', 'active', 'verified', 'DONE VERIFIKASI',
                    'PASIF'
                ]);

            if (memberError) throw memberError;

            // Fetch All PAID Savings (Aggregated)
            // Note: For large datasets, this should be done via RPC or View.
            // Assuming manageable size for client-side aggregation for now.
            const { data: savingsData, error: savingsError } = await supabase
                .from('simpanan')
                .select('personal_data_id, amount, transaction_type')
                .eq('status', 'PAID');

            if (savingsError) throw savingsError;

            // Aggregate Savings per Member
            const savingsMap = {};
            savingsData?.forEach(s => {
                const amt = parseFloat(s.amount || 0);
                if (!savingsMap[s.personal_data_id]) savingsMap[s.personal_data_id] = 0;

                if (s.transaction_type === 'SETOR') {
                    savingsMap[s.personal_data_id] += amt;
                } else {
                    savingsMap[s.personal_data_id] -= amt;
                }
            });

            // Merge Data
            const mergedData = membersData.map(m => ({
                ...m,
                total_simpanan: savingsMap[m.id] || 0
            }));

            // Sort by Name
            mergedData.sort((a, b) => a.full_name.localeCompare(b.full_name));

            setMembers(mergedData);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Gagal memuat data monitoring simpanan');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        // TODO: Implement Logic to export Member Savings Summary
        alert("Fitur Export Summary akan segera hadir.");
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.no_npp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.nik?.includes(searchTerm);

        const matchesCompany = filterCompany === 'ALL' || m.company === filterCompany;

        return matchesSearch && matchesCompany;
    });

    // Pagination Calculation
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCompany]);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Unified Header Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Title Row */}
                <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 italic tracking-tight leading-none">Monitoring Simpanan</h2>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium italic tracking-tight">Pantau total simpanan anggota dan riwayat transaksi</p>
                    </div>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[11px] font-black hover:bg-emerald-700 transition-all shadow-sm shrink-0"
                    >
                        <Download size={14} /> Export Summary
                    </button>
                </div>
                {/* Filters Row */}
                <div className="px-5 py-3 flex flex-col sm:flex-row flex-wrap gap-3 items-center bg-gray-50/60">
                    <div className="relative flex-grow sm:max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Cari Nama / NPP..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full text-xs font-medium bg-white shadow-sm"
                        />
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-bold tracking-tight italic appearance-none shadow-sm"
                        >
                            <option value="ALL">Semua PT</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="hidden md:block overflow-auto max-h-[70vh]">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 w-12 text-center bg-emerald-50/50">No</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Nama</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">NIK</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center bg-emerald-50/50">No. Anggota / NPP</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Perusahaan</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-right bg-emerald-50/50">Total Simpanan</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic text-center bg-emerald-50/50">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        <p className="text-[10px] font-black tracking-widest italic opacity-50">Memuat data...</p>
                                    </td>
                                </tr>
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center text-slate-400 italic font-black tracking-widest">
                                        <User className="mx-auto opacity-20 mb-4" size={40} />
                                        <p>Tidak ada anggota ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedMembers.map((m, idx) => (
                                    <tr
                                        key={m.id}
                                        onClick={() => navigate(`/admin/monitor-simpanan/${m.id}`)}
                                        className="hover:bg-emerald-50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-2 py-1 border-r border-slate-200 text-center">
                                            <span className="text-[10px] font-black text-gray-400 italic">{(currentPage - 1) * itemsPerPage + idx + 1}</span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className="text-[11px] font-black text-slate-800 italic tracking-tight leading-none">
                                                {m.full_name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className="text-[9px] text-slate-400 font-mono">
                                                {m.nik || '-'}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-center font-mono font-bold text-[10px] text-slate-500 italic border-r border-slate-200 whitespace-nowrap">
                                            {m.no_npp || '-'}
                                        </td>
                                        <td className="px-2 py-1 text-[11px] font-bold text-slate-500 border-r border-slate-200 italic">
                                            {m.company || '-'}
                                        </td>
                                        <td className="px-2 py-1 text-right border-r border-slate-200">
                                            <span className="text-[11px] font-black text-emerald-700 font-mono italic">
                                                {formatCurrency(m.total_simpanan)}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                            <div className="inline-flex p-1 bg-emerald-600 text-white rounded shadow-sm group-hover:scale-110 transition-transform">
                                                <ChevronRight size={12} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Card Container */}
                <div className="md:hidden divide-y divide-slate-100 italic">
                    {loading ? (
                        <div className="px-6 py-20 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                            Memuat data...
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="px-6 py-20 text-center text-gray-400 italic font-black text-[10px] tracking-widest">
                            <User size={40} className="mx-auto mb-4 opacity-20" />
                            <p>Tidak ada data ditemukan</p>
                        </div>
                    ) : (
                        paginatedMembers.map((m) => (
                            <div
                                key={m.id}
                                onClick={() => navigate(`/admin/monitor-simpanan/${m.id}`)}
                                className="p-4 active:bg-gray-50 transition-colors space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-gray-900 italic">
                                            {m.full_name || '-'}
                                        </span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-gray-400 font-mono tracking-tight underline border-r border-gray-200 pr-2">
                                                {m.no_npp || '-'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-mono tracking-tight">
                                                {m.company || '-'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 tracking-tighter">
                                        Detail
                                    </span>
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-400 tracking-widest italic leading-none mb-1">Total Simpanan</span>
                                        <span className="text-sm font-black text-emerald-700 font-mono italic">
                                            {formatCurrency(m.total_simpanan)}
                                        </span>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-[9px] font-black text-gray-400 tracking-widest italic leading-none mb-1">Unit Kerja</span>
                                        <span className="text-[10px] font-black text-gray-700 italic">
                                            {m.work_unit || '-'}
                                        </span>
                                    </div>
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
                        <span className="hidden sm:block">| Showing {paginatedMembers.length} of {filteredMembers.length} records</span>
                        <span className="sm:hidden">{paginatedMembers.length} / {filteredMembers.length} record</span>
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

export default MonitorSimpanan;
