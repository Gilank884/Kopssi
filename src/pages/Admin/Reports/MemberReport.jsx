import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Search, Download, Users, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportMembersReportExcel } from '../../../utils/reportExcel';

const MemberReport = () => {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [members, setMembers] = useState([]);
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('personal_data')
                .select('*')
                .order('full_name', { ascending: true });
            if (error) throw error;
            setMembers(data || []);
        } catch (err) {
            console.error("Error fetching members:", err);
        } finally {
            setLoading(false);
        }
    };

    const companies = ['ALL', ...new Set(members.map(m => m.company).filter(Boolean))];
    const statuses = ['ALL', ...new Set(members.map(m => m.status).filter(Boolean))];

    const filteredMembers = members.filter(m => {
        const matchesSearch = `${m.full_name} ${m.nik} ${m.no_anggota} ${m.company}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompany = filterCompany === 'ALL' || m.company === filterCompany;
        const matchesStatus = filterStatus === 'ALL' || m.status === filterStatus;
        return matchesSearch && matchesCompany && matchesStatus;
    });

    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const paginatedData = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-gray-900 italic tracking-tight">Laporan Anggota</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium italic">Data Profil Anggota Koperasi</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari nama, NIK..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 text-sm shadow-sm"
                    />
                </div>

                <div className="flex flex-wrap gap-3">
                    <select
                        value={filterCompany}
                        onChange={(e) => setFilterCompany(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm italic"
                    >
                        <option value="ALL">Semua Perusahaan</option>
                        {companies.filter(c => c !== 'ALL').map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm italic"
                    >
                        <option value="ALL">Semua Status</option>
                        {statuses.filter(s => s !== 'ALL').map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => exportMembersReportExcel(filteredMembers)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-lg"
                >
                    <Download size={16} /> Export Excel
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-auto max-h-[70vh] text-left">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 w-12 text-center bg-emerald-50/50">No</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Nama / NIK</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center bg-emerald-50/50">No Anggota</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Unit Kerja</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">PT/Company</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic text-center bg-emerald-50/50">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading && members.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        <p className="text-[10px] font-black tracking-widest italic opacity-50">Memuat data...</p>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-slate-400">
                                        <p className="font-black text-[10px] tracking-widest italic">Tidak ada data ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((m, idx) => (
                                    <tr key={m.id} className="hover:bg-emerald-50 transition-colors group">
                                        <td className="px-2 py-1 text-[10px] font-bold text-slate-400 border-r border-slate-200 text-center leading-none">
                                            {(currentPage - 1) * itemsPerPage + idx + 1}
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <p className="text-[11px] font-black text-slate-800 italic tracking-tight leading-none mb-0.5">{m.full_name}</p>
                                            <p className="text-[9px] text-slate-400 font-mono tracking-tighter leading-none">{m.nik}</p>
                                        </td>
                                        <td className="px-2 py-1 text-[10px] font-black text-emerald-600 text-center border-r border-slate-200 font-mono leading-none">
                                            {m.no_anggota}
                                        </td>
                                        <td className="px-2 py-1 text-[10px] font-bold text-slate-600 border-r border-slate-200 leading-tight">
                                            {m.work_unit || '-'}
                                        </td>
                                        <td className="px-2 py-1 text-[10px] font-bold text-slate-600 border-r border-slate-200 leading-tight">
                                            {m.company || '-'}
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest italic shadow-sm border ${m.status === 'active'
                                                ? 'bg-emerald-600 text-white border-emerald-700'
                                                : 'bg-gray-100 text-gray-400 border-gray-200'
                                                }`}>
                                                {m.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs">
                <div className="text-gray-400 font-black italic tracking-widest">
                    Halaman {currentPage} dari {totalPages || 1}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white border rounded-xl hover:bg-gray-50 disabled:opacity-30 shadow-sm"><ChevronLeft size={16} /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 bg-white border rounded-xl hover:bg-gray-50 disabled:opacity-30 shadow-sm"><ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
    );
};

export default MemberReport;
