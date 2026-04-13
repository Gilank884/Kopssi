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
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all text-gray-400 border border-gray-100 shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-left">
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tight">Detail Simpanan Anggota</h2>
                        <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium italic tracking-tight">{member.no_npp} • {member.full_name}</p>
                    </div>
                </div>
            </div>

            {/* Member Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm">
                            {member.full_name?.substring(0, 2)}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{member.full_name}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 font-medium italic">
                                <span className="flex items-center gap-1"><User size={14} /> {member.no_npp}</span>
                                <span className="flex items-center gap-1"><Building size={14} /> {member.company}</span>
                                <span className="flex items-center gap-1"><CreditCard size={14} /> {member.bank_gaji} - {member.rek_gaji}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 tracking-widest mb-1">Total Saldo Simpanan</p>
                        <h2 className="text-3xl font-bold text-emerald-600">{formatCurrency(summary.total)}</h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">Simp. Pokok</p>
                    <h3 className="text-lg font-bold text-gray-800">{formatCurrency(summary.pokok)}</h3>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">Simp. Wajib</p>
                    <h3 className="text-lg font-bold text-gray-800">{formatCurrency(summary.wajib)}</h3>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">Simp. Wajib Khusus</p>
                    <h3 className="text-lg font-bold text-gray-800">{formatCurrency(summary.wajibKhusus)}</h3>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">Simp. Sukarela</p>
                    <h3 className="text-lg font-bold text-gray-800">{formatCurrency(summary.sukarela)}</h3>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">Uang Parkir</p>
                    <h3 className="text-lg font-bold text-gray-800">{formatCurrency(summary.parkir)}</h3>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-auto max-h-[50vh] text-left">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Tanggal</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center bg-emerald-50/50">Jenis</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Tipe Simpanan</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Keterangan</th>
                                <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic text-right bg-emerald-50/50">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {savings.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                                        <p className="font-black text-[10px] tracking-widest italic">Belum ada riwayat transaksi</p>
                                    </td>
                                </tr>
                            ) : (
                                savings.map((item) => (
                                    <tr key={item.id} className="hover:bg-emerald-50 transition-colors group">
                                        <td className="px-2 py-1 text-[10px] font-bold text-slate-500 border-r border-slate-200 leading-none whitespace-nowrap italic">
                                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-2 py-1 text-center border-r border-slate-200">
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter shadow-sm border ${item.transaction_type === 'SETOR' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-red-600 text-white border-red-700'
                                                }`}>
                                                {item.transaction_type}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1 text-[10px] font-black text-slate-700 border-r border-slate-200 leading-none italic">
                                            {item.type}
                                        </td>
                                        <td className="px-2 py-1 text-[10px] text-slate-400 italic border-r border-slate-200 leading-tight truncate max-w-[200px]">
                                            {item.description || '-'}
                                        </td>
                                        <td className={`px-2 py-1 text-right text-[11px] font-black font-mono leading-none ${item.transaction_type === 'SETOR' ? 'text-emerald-600' : 'text-red-600'
                                            }`}>
                                            {item.transaction_type === 'SETOR' ? '+' : '-'} {formatCurrency(item.amount).replace(/Rp\s?/, '')}
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
