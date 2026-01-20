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
                    <h2 className="text-3xl font-black text-gray-900 italic uppercase tracking-tight">Laporan Anggota</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium italic uppercase tracking-wider">Data Profil Anggota Koperasi</p>
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
                        className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm uppercase italic"
                    >
                        <option value="ALL">Semua Perusahaan</option>
                        {companies.filter(c => c !== 'ALL').map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm uppercase italic"
                    >
                        <option value="ALL">Semua Status</option>
                        {statuses.filter(s => s !== 'ALL').map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => exportMembersReportExcel(filteredMembers)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
                >
                    <Download size={16} /> Export Excel
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 italic font-black text-[10px] uppercase tracking-widest text-gray-400">
                                <th className="px-6 py-4">No</th>
                                <th className="px-6 py-4">Nama / NIK</th>
                                <th className="px-6 py-4">No Anggota</th>
                                <th className="px-6 py-4">Unit Kerja</th>
                                <th className="px-6 py-4">PT/Company</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Memuat...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">Tidak ada data</td></tr>
                            ) : (
                                paginatedData.map((m, idx) => (
                                    <tr key={m.id} className="hover:bg-emerald-50/20">
                                        <td className="px-6 py-4 text-xs font-bold text-gray-400">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-black text-gray-900 uppercase italic">{m.full_name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono">{m.nik}</p>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] font-black text-emerald-600">{m.no_anggota}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">{m.work_unit || '-'}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">{m.company || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${m.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
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
                <div className="text-gray-400 font-black uppercase italic tracking-widest">
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
