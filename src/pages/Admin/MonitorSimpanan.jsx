import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Filter, Download, ArrowRight, User, Building, Wallet } from 'lucide-react';
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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                <div className="space-y-1">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 italic uppercase tracking-tight leading-none">Monitoring Simpanan</h2>
                    <p className="text-[11px] md:text-sm text-slate-500 font-medium italic mt-1 uppercase tracking-wider">Pantau total simpanan anggota dan riwayat transaksi</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                        <input
                            type="text"
                            placeholder="Cari Nama / NPP..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 text-sm shadow-sm font-medium transition-all"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[11px] font-black uppercase tracking-tight italic appearance-none shadow-sm transition-all"
                        >
                            <option value="ALL">SEMUA PT</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-xl shadow-emerald-900/5 border border-slate-100 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100 italic">
                            <tr>
                                <th className="px-6 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Anggota</th>
                                <th className="px-6 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Perusahaan</th>
                                <th className="px-6 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest text-right">Total Simpanan</th>
                                <th className="px-6 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest text-center">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        <p className="text-[10px] font-black uppercase tracking-widest italic opacity-50">Memuat data...</p>
                                    </td>
                                </tr>
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center text-slate-400 italic">
                                        <User className="mx-auto opacity-20 mb-4" size={48} />
                                        <p className="font-bold text-sm">Tidak ada anggota ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedMembers.map((m) => (
                                    <tr
                                        key={m.id}
                                        className="hover:bg-emerald-50/50 transition-colors group cursor-pointer"
                                        onClick={() => navigate(`/admin/monitor-simpanan/${m.id}`)}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-50/50 rounded-full flex items-center justify-center text-emerald-600 font-black text-xs uppercase border border-emerald-100 italic">
                                                    {m.full_name?.substring(0, 2)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-[13px] font-black text-slate-800 uppercase italic tracking-tight leading-none">{m.full_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                                                        {m.no_npp || '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[11px] font-bold text-slate-500 uppercase italic tracking-tight">
                                                {m.company || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="text-sm font-black text-emerald-700 font-mono italic">
                                                {formatCurrency(m.total_simpanan)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/admin/monitor-simpanan/${m.id}`);
                                                    }}
                                                    className="p-2 text-slate-300 hover:text-emerald-600 transition-colors rounded-xl hover:bg-white border border-transparent shadow-sm hover:border-emerald-100"
                                                >
                                                    <ArrowRight size={18} />
                                                </button>
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
                        <div className="p-20 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="p-12 text-center opacity-30">
                            <User size={40} className="mx-auto mb-2" />
                            <p className="font-black uppercase text-[10px] italic">Data tidak ditemukan</p>
                        </div>
                    ) : (
                        paginatedMembers.map((m) => (
                            <div
                                key={m.id}
                                onClick={() => navigate(`/admin/monitor-simpanan/${m.id}`)}
                                className="p-4 active:bg-slate-50 transition-colors space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-black text-xs uppercase border border-emerald-100">
                                            {m.full_name?.substring(0, 2)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 text-[13px] uppercase tracking-tight leading-none">{m.full_name}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">NPP: {m.no_npp || '-'}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                        Detail →
                                    </span>
                                </div>
                                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Simpanan</span>
                                        <span className="text-[13px] font-black text-emerald-700 font-mono">{formatCurrency(m.total_simpanan)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Perusahaan</span>
                                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{m.company || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* PAGINATION FOOTER */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                        <span>Show</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-600 shadow-sm"
                        >
                            {pageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <span className="hidden md:block">| {filteredMembers.length} Total Data</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        >
                            Prev
                        </button>
                        <span className="text-xs font-black text-emerald-600 mx-2">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitorSimpanan;
