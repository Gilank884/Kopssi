import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Search,
    Filter,
    CheckCircle,
    Clock,
    Banknote,
    User,
    FileText,
    Calendar,
    ArrowUpCircle,
    ArrowDownCircle,
    AlertCircle
} from 'lucide-react';

const Transaksi = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
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

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const pageOptions = [10, 20, 50, 100];

    useEffect(() => {
        fetchAllTransactions();
        fetchCompanies();
    }, [startDate, endDate]);

    const fetchAllTransactions = async () => {
        try {
            setLoading(true);

            // 1. Fetch Simpanan
            const { data: simpanan, error: sError } = await supabase
                .from('simpanan')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        full_name,
                        nik,
                        company
                    )
                `)
                .gte('jatuh_tempo', startDate)
                .lte('jatuh_tempo', endDate)
                .order('jatuh_tempo', { ascending: false });

            if (sError) throw sError;

            // 2. Fetch Angsuran
            const { data: angsuran, error: aError } = await supabase
                .from('angsuran')
                .select(`
                    *,
                    pinjaman (
                        no_pinjaman,
                        personal_data:personal_data_id (
                            full_name,
                            nik,
                            company
                        )
                    )
                `)
                .gte('tanggal_bayar', `${startDate}T00:00:00`)
                .lte('tanggal_bayar', `${endDate}T23:59:59`)
                .order('tanggal_bayar', { ascending: false });

            if (aError) throw aError;

            // Combine and format
            const combined = [
                ...(simpanan || []).map(s => ({
                    id: `S-${s.id}`,
                    type: 'SIMPANAN',
                    category: s.type, // POKOK, WAJIB
                    amount: parseFloat(s.amount || 0),
                    status: s.status,
                    date: s.jatuh_tempo,
                    member: s.personal_data?.full_name || '-',
                    nik: s.personal_data?.nik || '-',
                    company: s.personal_data?.company || '-',
                    reference: 'Iuran Anggota'
                })),
                ...(angsuran || []).map(a => ({
                    id: `A-${a.id}`,
                    type: 'ANGSURAN',
                    category: 'PINJAMAN',
                    amount: parseFloat(a.amount || 0),
                    status: a.status,
                    date: a.tanggal_bayar,
                    member: a.pinjaman?.personal_data?.full_name || '-',
                    nik: a.pinjaman?.personal_data?.nik || '-',
                    company: a.pinjaman?.personal_data?.company || '-',
                    reference: a.pinjaman?.no_pinjaman || '-'
                }))
            ];

            // Sort by date descending
            combined.sort((a, b) => new Date(b.date) - new Date(a.date));

            setTransactions(combined);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            alert('Gagal memuat data transaksi');
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(trx => {
        const matchesSearch = trx.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trx.nik.includes(searchTerm) ||
            trx.reference.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'ALL' || trx.status === filterStatus;
        const matchesCompany = filterCompany === 'ALL' || trx.company === filterCompany;

        return matchesSearch && matchesStatus && matchesCompany;
    });

    // Pagination Calculation
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterCompany, startDate, endDate]);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                <div className="text-left">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 italic">Monitoring Transaksi</h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium italic">Lacak seluruh aktivitas keuangan anggota secara real-time</p>
                </div>

                <div className="flex flex-col md:flex-row flex-wrap gap-3 items-stretch md:items-end">
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                        <input
                            type="text"
                            placeholder="Cari anggota / referensi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 text-sm font-medium shadow-sm transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-grow md:flex-grow-0">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2.5 md:py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs md:text-sm bg-white font-bold transition-all shadow-sm"
                        />
                        <span className="text-slate-400 font-bold px-1 hidden sm:block">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-2.5 md:py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs md:text-sm bg-white font-bold transition-all shadow-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 flex-grow md:flex-grow-0">
                        <div className="relative">
                            <select
                                value={filterCompany}
                                onChange={(e) => setFilterCompany(e.target.value)}
                                className="w-full pl-4 pr-8 py-2.5 md:py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[11px] bg-white font-black tracking-tight italic appearance-none shadow-sm transition-all"
                            >
                                <option value="ALL">Semua PT</option>
                                {companies.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-4 pr-8 py-2.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[11px] bg-white font-black tracking-tight italic appearance-none shadow-sm transition-all"
                            >
                                <option value="ALL">Semua Status</option>
                                <option value="UNPAID">Pending</option>
                                <option value="PAID">Lunas</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="space-y-0.5">
                        <h3 className="font-black text-slate-800 text-sm italic leading-none">Daftar Transaksi</h3>
                        <p className="text-[10px] text-slate-400 font-bold italic opacity-70">Log Aktivitas Keuangan</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 italic leading-none mb-1">Total</p>
                        <p className="font-mono font-black text-xs text-emerald-600 italic leading-none">{filteredTransactions.length}</p>
                    </div>
                </div>

                <div className="hidden md:block overflow-auto max-h-[70vh]">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">Nama</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">NIK</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">PT</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">Tipe</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">Kategori</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">Referensi</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">Tanggal</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-right">Nominal</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        <p className="text-[10px] font-black tracking-widest italic opacity-50">Memuat data...</p>
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-20 text-center text-slate-400">
                                        <AlertCircle className="mx-auto opacity-20 mb-4" size={40} />
                                        <p className="font-black text-[10px] tracking-widest italic">Belum ada data transaksi</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedTransactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-emerald-50 transition-colors group">
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className="text-[11px] font-black text-slate-800 italic">{trx.member}</span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className="text-[9px] text-slate-400 font-mono tracking-tighter">{trx.nik}</span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className="text-[9px] text-slate-400 font-bold italic">{trx.company}</span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className={`text-[8px] font-black tracking-tighter ${trx.type === 'SIMPANAN' ? 'text-blue-600' : 'text-purple-600'}`}>
                                                {trx.type}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className="text-[10px] text-slate-600 font-bold italic">{trx.category}</span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            <span className="text-[9px] font-mono font-black text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 tracking-tighter leading-none">
                                                {trx.reference}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 border-r border-slate-200 whitespace-nowrap">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 italic">
                                                <Calendar size={10} className="shrink-0" />
                                                {formatDate(trx.date)}
                                            </div>
                                        </td>
                                        <td className="px-2 py-1 text-right border-r border-slate-200">
                                            <span className="text-[11px] font-black text-slate-800 font-mono italic">
                                                {formatCurrency(trx.amount).replace(/Rp\s?/, '')}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest italic shadow-sm border ${trx.status === 'PAID'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                                }`}>
                                                {trx.status === 'PAID' ? 'Lunas' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Card Container */}
                <div className="md:hidden divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="p-12 text-center opacity-30 italic">
                            <AlertCircle size={40} className="mx-auto mb-2" />
                                <p className="font-black text-[10px] tracking-widest">Tidak ada data</p>
                        </div>
                    ) : (
                        paginatedTransactions.map((trx) => (
                            <div key={trx.id} className="p-4 active:bg-slate-50 transition-colors space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-black text-slate-800 uppercase italic tracking-tight leading-none mb-1">
                                            {trx.member}
                                        </span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${trx.type === 'SIMPANAN' ? 'text-blue-600' : 'text-purple-600'}`}>
                                            {trx.type} • {trx.category}
                                        </span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${trx.status === 'PAID'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                        }`}>
                                        {trx.status === 'PAID' ? 'LUNAS' : 'PENDING'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Nominal</span>
                                        <span className="text-[13px] font-black text-slate-800 font-mono italic">{formatCurrency(trx.amount)}</span>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Referensi</span>
                                        <span className="text-[10px] font-black text-slate-600 uppercase font-mono">{trx.reference}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 italic">
                                    <span>{formatDate(trx.date)}</span>
                                    <span className="text-[9px]">{trx.company}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* PAGINATION FOOTER */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs font-black text-gray-400 tracking-widest">
                        <span>Tampilkan</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-600 shadow-sm"
                        >
                            {pageOptions.map(opt => <option key={opt} value={opt}>{opt} Data</option>)}
                        </select>
                        <span className="hidden md:block">| Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} dari {filteredTransactions.length} data</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black tracking-widest hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        >
                            Sebelumnya
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-110' : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'}`}
                                >
                                    {i + 1}
                                </button>
                            )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black tracking-widest hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        >
                            Berikutnya
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Transaksi;
