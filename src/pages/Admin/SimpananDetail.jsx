import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Wallet, TrendingUp, History, Calendar, Building, User, CreditCard } from 'lucide-react';

const SimpananDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [savings, setSavings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        total: 0,
        pokok: 0,
        wajib: 0,
        wajibKhusus: 0,
        parkir: 0,
        sukarela: 0
    });

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        try {
            setLoading(true);

            // Fetch Member Data
            const { data: memberData, error: memberError } = await supabase
                .from('personal_data')
                .select('*')
                .eq('id', id)
                .single();

            if (memberError) throw memberError;
            setMember(memberData);

            // Fetch Savings History
            const { data: savingsData, error: savingsError } = await supabase
                .from('simpanan')
                .select('*')
                .eq('personal_data_id', id)
                .eq('status', 'PAID')
                .order('created_at', { ascending: false });

            if (savingsError) throw savingsError;
            setSavings(savingsData || []);

            // Calculate Summary
            let sPokok = 0, sWajib = 0, sWajibKhusus = 0, sParkir = 0, sSukarela = 0;
            (savingsData || []).forEach(s => {
                const amt = parseFloat(s.amount || 0);
                // Note: Assuming 'amount' is positive. 
                // Checks for withdrawal vs deposit types if necessary.
                // Assuming standard logic: SETOR for deposit, TARIK for withdrawal
                if (s.transaction_type === 'TARIK') {
                    if (s.type === 'POKOK') sPokok -= amt;
                    else if (s.type === 'WAJIB') sWajib -= amt;
                    else if (s.type === 'WAJIB_KHUSUS') sWajibKhusus -= amt;
                    else if (s.type === 'PARKIR') sParkir -= amt;
                    else if (s.type === 'SUKARELA') sSukarela -= amt;
                } else {
                    if (s.type === 'POKOK') sPokok += amt;
                    else if (s.type === 'WAJIB') sWajib += amt;
                    else if (s.type === 'WAJIB_KHUSUS') sWajibKhusus += amt;
                    else if (s.type === 'PARKIR') sParkir += amt;
                    else if (s.type === 'SUKARELA') sSukarela += amt;
                }
            });

            setSummary({
                total: sPokok + sWajib + sWajibKhusus + sParkir + sSukarela,
                pokok: sPokok,
                wajib: sWajib,
                wajibKhusus: sWajibKhusus,
                parkir: sParkir,
                sukarela: sSukarela
            });

        } catch (error) {
            console.error('Error fetching detail:', error);
            alert('Gagal memuat detail simpanan');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!member) {
        return <div className="text-center py-12">Data anggota tidak ditemukan</div>;
    }

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-20">
            {/* Minimalist Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/simpanan-anggota')}
                        className="p-2.5 bg-white hover:bg-gray-50 rounded-xl transition-all text-gray-400 border border-gray-100 shadow-sm"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                            {member.full_name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 italic tracking-tight leading-none">{member.full_name}</h2>
                            <p className="text-[10px] text-gray-400 mt-1 font-black italic tracking-widest uppercase opacity-70">No. Anggota: {member.no_anggota || member.no_npp} • RIWAYAT SIMPANAN</p>
                        </div>
                    </div>
                </div>
                <div className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-black text-[10px] tracking-widest italic shadow-sm uppercase">
                    Status: {member.status_anggota || 'AKTIF'}
                </div>
            </div>

            {/* Compact Profile & Balance Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-left">
                {/* Identity Card */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <User size={15} className="text-emerald-600" />
                        <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Profil Member</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">NPP / NIK</label>
                            <p className="text-sm font-mono font-black text-gray-700 italic tracking-tighter">{member.no_npp || '-'} / {member.nik || '-'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">Status Pekerjaan</label>
                            <p className="text-[11px] font-bold text-gray-900 uppercase italic truncate">{member.company || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <div className="flex justify-between items-end">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block italic leading-none">Total Saldo Simpanan</label>
                            <h3 className="text-2xl font-black text-emerald-600 italic tracking-tighter">
                                {formatCurrency(summary.total)}
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-gray-300 uppercase italic">Update</p>
                            <p className="text-[10px] font-bold text-gray-500 italic">
                                {savings.length > 0 ? new Date(savings[0].created_at).toLocaleDateString('id-ID') : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

                    {/* Breakdown Grid */}
                    {/* Breakdown Grid - Ultra Compact */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-left">
                        {[
                            { label: 'Pokok', val: summary.pokok, color: 'text-gray-800' },
                            { label: 'Wajib', val: summary.wajib, color: 'text-gray-800' },
                            { label: 'Khusus', val: summary.wajibKhusus, color: 'text-gray-800' },
                            { label: 'Sukarela', val: summary.sukarela, color: 'text-gray-800' },
                            { label: 'Parkir', val: summary.parkir, color: 'text-emerald-600' }
                        ].map((item, idx) => (
                            <div key={idx} className="p-3 px-4 bg-white rounded-xl border border-gray-50 shadow-sm">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest italic mb-0.5">Simp. {item.label}</p>
                                <p className={`text-[13px] font-black italic ${item.color}`}>{formatCurrency(item.val)}</p>
                            </div>
                        ))}
                    </div>


            {/* History Table in Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <History size={16} className="text-emerald-600" />
                        </div>
                        <h3 className="font-black italic text-xs text-gray-800 uppercase tracking-widest">Riwayat Transaksi</h3>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest italic border-b border-gray-100">Tanggal</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest italic border-b border-gray-100">Keterangan</th>
                                <th className="px-8 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest italic border-b border-gray-100">Jenis</th>
                                <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest italic border-b border-gray-100">Nominal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {savings.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-12 text-center text-gray-400 italic font-black text-xs uppercase tracking-widest opacity-40">
                                        Belum ada riwayat transaksi
                                    </td>
                                </tr>
                            ) : (
                                savings.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-4">
                                            <p className="text-xs font-bold text-gray-900 italic uppercase">
                                                {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div>
                                                <p className="text-xs font-bold text-gray-600 leading-relaxed uppercase italic">
                                                    {item.description || item.type}
                                                </p>
                                                <p className="text-[9px] font-mono text-gray-400 tracking-tighter uppercase mt-0.5">{item.type} • {item.id.split('-')[0]}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black tracking-widest italic shadow-sm border uppercase ${item.transaction_type === 'SETOR' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                {item.transaction_type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <p className={`text-sm font-black italic ${item.transaction_type === 'SETOR' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {item.transaction_type === 'SETOR' ? '+' : '-'} {formatCurrency(item.amount).replace('Rp', '').trim()}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SimpananDetail;
