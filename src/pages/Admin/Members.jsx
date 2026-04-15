import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MoreHorizontal, X, User, Phone, Briefcase, MapPin, CreditCard, Calendar, Plus, Upload, Loader2, CheckCircle2, AlertCircle, Trash2, UserMinus, ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { exportMembersDatabaseExcel } from '../../utils/reportExcel';


const MemberList = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

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

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('personal_data')
                .select('*, users!fk_personal_data_users(role)')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching members DETAILS:", error);
                alert("Gagal mengambil data anggota: " + (error.message || JSON.stringify(error)));
                throw error;
            }
            setMembers(data || []);
        } catch (err) {
            console.error("Error fetching members:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
        fetchCompanies();
    }, []);



    const filteredMembers = members.filter(m => {
        // Exclude Admins
        if (m.users?.role === 'ADMIN') return false;

        // Include only standardized statuses for the main database
        const status = m.status?.toUpperCase();
        if (!['AKTIF', 'PASIF', 'KELUAR'].includes(status)) return false;

        const matchesSearch = m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.no_npp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.nik?.includes(searchTerm);

        const matchesCompany = filterCompany === 'ALL' || m.company === filterCompany;

        return matchesSearch && matchesCompany;
    });

    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleRowClick = (member) => {
        navigate(`/admin/members/${member.id}`);
    };

    if (loading && members.length === 0) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Unified Header Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Title Row */}
                <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 italic tracking-tight leading-none">Database Anggota</h2>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium italic tracking-tight">Manajemen data seluruh anggota koperasi</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={fetchMembers}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[11px] font-black hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button
                            onClick={() => exportMembersDatabaseExcel(filteredMembers)}
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
                            placeholder="Cari anggota..."
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
                            <option value="ALL">Semua Perusahaan</option>
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

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="hidden md:block overflow-auto max-h-[70vh] text-left">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center w-12 bg-emerald-50/50">No</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center bg-emerald-50/50">Nomor Anggota</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center bg-emerald-50/50">No. NPP</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Nama Anggota</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Unit Kerja</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {paginatedMembers.length > 0 ? (
                                paginatedMembers.map((member, index) => (
                                    <tr
                                        key={member.id}
                                        onClick={() => handleRowClick(member)}
                                        className={`transition-colors cursor-pointer group hover:bg-emerald-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}`}
                                    >
                                        <td className="px-2 py-1 border-r border-slate-200 text-center">
                                            <span className="text-[9px] font-black text-gray-400 italic">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200 text-center font-mono text-[10px] font-bold text-blue-600 italic">
                                            {member.no_anggota || '-'}
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200 text-center font-mono text-[10px] font-bold text-slate-500 italic">
                                            {member.no_npp || '-'}
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200 whitespace-nowrap">
                                            <span className="font-black text-slate-800 text-[11px] italic tracking-tight">{member.full_name}</span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200 text-[10px] font-bold text-slate-500 italic">
                                            {member.work_unit || '-'}
                                        </td>
                                        <td className="px-2 py-1 border-slate-200">
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest italic transition-all ${member.status === 'AKTIF'
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : member.status === 'PASIF'
                                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                    : member.status === 'KELUAR'
                                                        ? 'bg-red-600 text-white shadow-sm'
                                                        : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                {member.status || 'UNKNOWN'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Search size={40} />
                                            <p className="font-black tracking-widest text-[10px] italic">Data anggota tidak ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Card Container */}
                <div className="md:hidden divide-y divide-slate-100">
                    {paginatedMembers.length > 0 ? (
                        paginatedMembers.map((member) => (
                            <div
                                key={member.id}
                                onClick={() => handleRowClick(member)}
                                className="p-4 active:bg-slate-50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs border border-blue-100 italic">
                                            {member.full_name?.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 text-[13px] italic leading-none">{member.full_name}</span>
                                            <span className="text-[10px] font-bold text-blue-600 font-mono tracking-tighter mt-1">NPP: {member.no_npp || '-'}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest italic border ${member.status === 'AKTIF'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        : member.status === 'PASIF'
                                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                                            : 'bg-red-50 text-red-600 border-red-100'
                                        }`}>
                                        {member.status || 'UNKNOWN'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 italic">
                                    <span>NIK: {member.nik}</span>
                                    <span className="text-slate-500">{member.company || '-'}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center opacity-30">
                            <Search size={40} className="mx-auto mb-2" />
                            <p className="font-black text-[10px] italic tracking-widest">Tidak ada data</p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-[10px] font-black tracking-widest text-slate-400 italic order-2 sm:order-1">
                        Menampilkan {paginatedMembers.length} dari {filteredMembers.length} Anggota
                    </div>

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
            </div>
        </div>
    );
};

export default MemberList;
