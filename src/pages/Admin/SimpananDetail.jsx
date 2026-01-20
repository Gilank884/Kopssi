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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100 shadow-sm"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Detail Simpanan Anggota</h2>
                    <p className="text-sm text-gray-500">Informasi lengkap saldo dan riwayat transaksi</p>
                </div>
            </div>

            {/* Member Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl uppercase shadow-sm">
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
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Saldo Simpanan</p>
                        <h2 className="text-3xl font-bold text-emerald-600">{formatCurrency(summary.total)}</h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Simp. Pokok</p>
                    <h3 className="text-lg font-bold text-gray-800">{formatCurrency(summary.pokok)}</h3>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Simp. Wajib</p>
                    <h3 className="text-lg font-bold text-gray-800">{formatCurrency(summary.wajib)}</h3>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Simp. Wajib Khusus</p>
                    <h3 className="text-lg font-bold text-gray-800">{formatCurrency(summary.wajibKhusus)}</h3>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Simp. Sukarela</p>
                    <h3 className="text-lg font-bold text-gray-800">{formatCurrency(summary.sukarela)}</h3>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Uang Parkir</p>
                    <h3 className="text-lg font-bold text-gray-800">{formatCurrency(summary.parkir)}</h3>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center text-left">
                    <h3 className="font-bold text-gray-800 text-lg uppercase italic tracking-tighter">Riwayat Transaksi</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Jenis Transaksi</th>
                                <th className="px-6 py-4">Tipe Simpanan</th>
                                <th className="px-6 py-4">Keterangan</th>
                                <th className="px-6 py-4 text-right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {savings.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-medium italic">
                                        Belum ada riwayat transaksi
                                    </td>
                                </tr>
                            ) : (
                                savings.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-gray-600">
                                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight ${item.transaction_type === 'SETOR' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {item.transaction_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-700 uppercase">
                                            {item.type}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 italic">
                                            {item.description || '-'}
                                        </td>
                                        <td className={`px-6 py-4 text-right text-xs font-black font-mono ${item.transaction_type === 'SETOR' ? 'text-emerald-600' : 'text-red-600'
                                            }`}>
                                            {item.transaction_type === 'SETOR' ? '+' : '-'} {formatCurrency(item.amount)}
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
