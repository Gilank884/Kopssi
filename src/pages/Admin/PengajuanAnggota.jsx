import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, Eye, X, CheckCircle, AlertCircle, User, MapPin, Building, Briefcase, Mail, Phone, FileText, Printer, Filter, Download, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { generateMemberApplicationPDF } from '../../utils/memberApplicationPdf';
import { exportMemberRegistrationExcel } from '../../utils/reportExcel';

const PengajuanAnggota = () => {
    const navigate = useNavigate();
    const [pendingMembers, setPendingMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

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
        const init = async () => {
            await autoActivateExpiredPending();
            fetchCompanies();
        };
        init();
    }, []);

    useEffect(() => {
        fetchPendingMembers();
    }, [debouncedSearchTerm, filterCompany, currentPage, itemsPerPage]);

    // Reset to page 1 on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, filterCompany]);

    const autoActivateExpiredPending = async () => {
        try {
            // Threshold: 2 days ago
            const threshold = new Date();
            threshold.setDate(threshold.getDate() - 2);
            const thresholdISO = threshold.toISOString();

            // 1. Fetch pending/done verifikasi members older than 2 days
            const { data: expiredMembers, error: fetchError } = await supabase
                .from('personal_data')
                .select('id, user_id, full_name')
                .in('status', ['pending', 'DONE VERIFIKASI'])
                .lt('created_at', thresholdISO);

            if (fetchError) throw fetchError;

            if (expiredMembers && expiredMembers.length > 0) {
                console.log(`Auto-activating ${expiredMembers.length} expired applications...`);

                for (const member of expiredMembers) {
                    // 1. Update personal_data status
                    const { error: pError } = await supabase
                        .from('personal_data')
                        .update({ status: 'AKTIF' })
                        .eq('id', member.id);
                    
                    if (pError) console.error(`Failed to auto-activate profile ${member.id}`, pError);

                    // 2. Update user role
                    if (member.user_id) {
                        const { error: uError } = await supabase
                            .from('users')
                            .update({ role: 'MEMBER' })
                            .eq('id', member.user_id);
                        
                        if (uError) console.error(`Failed to update user role for ${member.user_id}`, uError);
                    }
                }
                
                // Optional: Notify UI or just let fetchRefresh handle it
            }
        } catch (err) {
            console.error('Error in auto-activation service:', err);
        }
    };

    const fetchPendingMembers = async () => {
        try {
            setLoading(true);
            const from = (currentPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            let query = supabase
                .from('personal_data')
                .select('*', { count: 'exact' })
                .in('status', ['pending', 'DONE VERIFIKASI']);

            if (filterCompany !== 'ALL') {
                query = query.eq('company', filterCompany);
            }

            if (debouncedSearchTerm) {
                query = query.or(`full_name.ilike.%${debouncedSearchTerm}%, nik.ilike.%${debouncedSearchTerm}%, phone.ilike.%${debouncedSearchTerm}%`);
            }

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            setPendingMembers(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error('Error fetching pending members:', error);
            // alert('Gagal memuat data pengajuan anggota');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (member) => {
        navigate(`/admin/member-applications/${member.id}`);
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

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
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 italic tracking-tight leading-none">Persetujuan Keanggotaan</h2>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium italic tracking-tight">Lakukan verifikasi akhir untuk anggota yang telah menandatangani formulir</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={fetchPendingMembers}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[11px] font-black hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button
                            onClick={() => exportMemberRegistrationExcel(filteredMembers)}
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
                            placeholder="Cari nama, NIK, atau telepon..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full text-xs font-medium bg-white shadow-sm"
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
                    <p className="mt-4 text-gray-500">Memuat data...</p>
                </div>
            ) : pendingMembers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-left">
                    <AlertCircle className="mx-auto text-gray-400 mb-2" size={48} />
                    <p className="mt-4 text-gray-500 font-black tracking-widest text-xs italic">Tidak ada anggota yang menunggu verifikasi akhir</p>
                    <p className="text-[10px] text-gray-400 mt-1 italic">Anggota harus melakukan "Cek Keanggotaan" dan tanda tangan terlebih dahulu</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-auto max-h-[70vh]">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                            <tr className="text-gray-400">
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 w-12 text-center bg-emerald-50/50">No</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Nama Lengkap</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">NIK</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50 text-center">No. Anggota</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">No. Telepon</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Perusahaan</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Status</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Tanggal Pengajuan</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic bg-emerald-50/50 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {pendingMembers.map((member, index) => (
                                <tr
                                    key={member.id}
                                    onClick={() => handleRowClick(member)}
                                    className="transition-colors hover:bg-emerald-50 cursor-pointer"
                                >
                                    <td className="px-2 py-1 border-r border-slate-200 text-center">
                                        <span className="text-[10px] font-black text-gray-400 italic">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                    </td>
                                    <td className="px-2 py-1 border-r border-slate-200 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-slate-900">{member.full_name || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-1 text-[11px] font-bold text-slate-600 border-r border-slate-200 font-mono italic">{member.nik || '-'}</td>
                                    <td className="px-2 py-1 text-[11px] font-bold text-slate-600 border-r border-slate-200 font-mono italic text-center text-blue-600">{member.no_anggota || '-'}</td>
                                    <td className="px-2 py-1 text-[11px] font-bold text-slate-600 border-r border-slate-200 font-mono tracking-tighter">{member.phone || '-'}</td>
                                    <td className="px-2 py-1 text-[11px] font-bold text-slate-600 border-r border-slate-200 italic">{member.company || '-'}</td>
                                    <td className="px-2 py-1 border-r border-slate-200">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-tighter ${member.status?.toLowerCase() === 'pending'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-emerald-600 text-white shadow-sm'
                                            }`}>
                                            {member.status?.toLowerCase() === 'pending' ? 'TUNGGU VERIFIKASI' : 'SIAP DISETUJUI'}
                                        </span>
                                    </td>
                                    <td className="px-2 py-1 text-[11px] font-bold text-slate-500 border-r border-slate-200 italic">{formatDate(member.created_at)}</td>
                                    <td className="px-2 py-1">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRowClick(member);
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
                                                title="Lihat Detail & Terima Anggota"
                                            >
                                                <CheckCircle size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-tight">Terima Anggota</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    generateMemberApplicationPDF(member, true);
                                                }}
                                                className="p-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors shadow-sm"
                                                title="Pratinjau PDF"
                                            >
                                                <Search size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    generateMemberApplicationPDF(member);
                                                }}
                                                className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
                                                title="Cetak Formulir PDF"
                                            >
                                                <Printer size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-[10px] font-black tracking-widest text-slate-400 italic order-2 sm:order-1">
                            Menampilkan {pendingMembers.length} dari {totalCount} Pengajuan
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
            )}
        </div>
    );
};

export default PengajuanAnggota;

