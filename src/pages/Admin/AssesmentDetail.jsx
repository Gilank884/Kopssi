import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { X, User, Wallet, FileText, Check, Eye, ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';
import { generateLoanAnalysisPDF } from '../../utils/loanAnalysisPdf';

const AssesmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loan, setLoan] = useState(null);
    const [runningLoans, setRunningLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analystName, setAnalystName] = useState('Admin');
    const [editingAmount, setEditingAmount] = useState('');

    // Interest configuration state
    const [useInterest, setUseInterest] = useState(false);
    const [interestType, setInterestType] = useState('PERSENAN'); // PERSENAN or NOMINAL
    const [interestValue, setInterestValue] = useState('10'); // Default 10%
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchLoanDetail();
        fetchAnalystInfo();
    }, [id]);

    const fetchAnalystInfo = async () => {
        try {
            const storedUser = localStorage.getItem('auth_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const { data: profile } = await supabase
                    .from('personal_data')
                    .select('full_name')
                    .eq('user_id', user.id)
                    .single();

                if (profile) {
                    setAnalystName(profile.full_name);
                } else {
                    setAnalystName(user.name || 'Admin System');
                }
            }
        } catch (error) {
            console.error('Error fetching analyst info:', error);
        }
    };

    const fetchLoanDetail = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pinjaman')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        *
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setLoan(data);
                // format with dots
                const formatted = data.jumlah_pinjaman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                setEditingAmount(formatted);
                if (data.tipe_bunga && data.tipe_bunga !== 'NONE') {
                    setUseInterest(true);
                    setInterestType(data.tipe_bunga);
                    setInterestValue(data.nilai_bunga.toString());
                }

                // Fetch running loans for this member
                fetchRunningLoans(data.personal_data_id, data.id);
            }
        } catch (error) {
            console.error('Error fetching loan detail:', error);
            alert('Gagal memuat detail pinjaman');
            navigate('/admin/assesment-pinjaman');
        } finally {
            setLoading(false);
        }
    };

    const fetchRunningLoans = async (memberId, currentLoanId) => {
        try {
            const { data, error } = await supabase
                .from('pinjaman')
                .select('*')
                .eq('personal_data_id', memberId)
                .in('status', ['DISETUJUI', 'DICAIRKAN'])
                .neq('id', currentLoanId);

            if (data) setRunningLoans(data);
        } catch (error) {
            console.error('Error fetching running loans:', error);
        }
    };

    const handleSaveDraft = async () => {
        try {
            const rawAmount = parseFloat(editingAmount.replace(/\./g, ''));
            const { error } = await supabase
                .from('pinjaman')
                .update({
                    jumlah_pinjaman: rawAmount,
                    tipe_bunga: useInterest ? interestType : 'NONE',
                    nilai_bunga: useInterest ? parseFloat(interestValue) : 0
                })
                .eq('id', id);

            if (error) throw error;
            alert('Konfigurasi pinjaman & bunga berhasil ditetapkan!');
        } catch (error) {
            console.error('Error saving draft:', error);
            alert('Gagal menetapkan bunga: ' + error.message);
        }
    };

    const handleReject = async () => {
        if (!loan) return;

        const confirmReject = window.confirm(`Tolak pengajuan pinjaman dari ${loan.personal_data?.full_name}?`);
        if (!confirmReject) return;

        try {
            setIsProcessing(true);
            const { error: updateError } = await supabase
                .from('pinjaman')
                .update({
                    status: 'DITOLAK'
                })
                .eq('id', loan.id);

            if (updateError) throw updateError;

            alert('Pengajuan pinjaman telah DITOLAK!');
            navigate('/admin/assesment-pinjaman');
        } catch (error) {
            console.error('Error rejecting loan:', error);
            alert('Gagal menolak pinjaman: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApprove = async () => {
        if (!loan) return;

        const rawAmountString = typeof editingAmount === 'string' ? editingAmount : String(editingAmount);
        const finalAmount = parseFloat(rawAmountString.replace(/\./g, ''));

        if (isNaN(finalAmount) || finalAmount <= 0) {
            alert('Nominal pinjaman tidak valid');
            return;
        }

        if (useInterest) {
            const intValue = parseFloat(interestValue);
            if (isNaN(intValue) || intValue <= 0) {
                alert('Nilai bunga tidak valid');
                return;
            }
        }

        const confirmApprove = window.confirm(
            `Setujui pengajuan pinjaman sebesar Rp ${finalAmount.toLocaleString('id-ID')} untuk ${loan.personal_data?.full_name}?\n\n` +
            (useInterest
                ? `Bunga: ${interestType === 'PERSENAN' ? interestValue + '%' : 'Rp ' + parseFloat(interestValue).toLocaleString('id-ID')}`
                : 'Tanpa Bunga')
        );

        if (!confirmApprove) return;

        try {
            setIsProcessing(true);
            const tenor = loan.tenor_bulan;
            const pokok = finalAmount;

            let totalBunga = 0;
            let tipe_bunga = 'NONE';
            let nilai_bunga = 0;

            if (useInterest) {
                tipe_bunga = interestType;
                nilai_bunga = parseFloat(interestValue);

                if (interestType === 'PERSENAN') {
                    totalBunga = pokok * (nilai_bunga / 100) * (tenor / 12);
                } else {
                    totalBunga = nilai_bunga;
                }
            }

            const totalBayar = pokok + totalBunga;
            const monthlyAmount = Math.ceil(totalBayar / tenor);

            const { error: updateError } = await supabase
                .from('pinjaman')
                .update({
                    status: 'DISETUJUI',
                    jumlah_pinjaman: pokok,
                    tipe_bunga: tipe_bunga,
                    nilai_bunga: nilai_bunga
                })
                .eq('id', loan.id);

            if (updateError) throw updateError;

            alert('Pengajuan pinjaman telah DISETUJUI!');
            navigate('/admin/assesment-pinjaman');
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Gagal menyetujui pinjaman: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">Memuat detail pengajuan...</p>
                </div>
            </div>
        );
    }

    if (!loan) return null;

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-20">
            {/* Minimalist Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/assesment-pinjaman')}
                        className="p-2.5 bg-white hover:bg-gray-50 rounded-xl transition-all text-gray-400 border border-gray-100 shadow-sm"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                            {loan.personal_data?.full_name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 italic tracking-tight leading-none">{loan.personal_data?.full_name}</h2>
                            <p className="text-[10px] text-gray-400 mt-1 font-black italic tracking-widest uppercase opacity-70">{loan.no_pinjaman} • {loan.jenis_pinjaman || 'PINJAMAN'}</p>
                        </div>
                    </div>
                </div>
                <div className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl font-black text-[10px] tracking-widest italic shadow-sm uppercase">
                    Status: {loan.status}
                </div>
            </div>

            {/* Compact Member Profil Data Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left">
                <div className="flex items-center gap-2 mb-4">
                    <User size={15} className="text-emerald-600" />
                    <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Profil & Identitas Member</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-0.5 block">NIK / No. HP</label>
                        <p className="text-sm font-bold text-gray-900">{loan.personal_data?.nik} / {loan.personal_data?.phone}</p>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-0.5 block">Instansi / Unit Kerja</label>
                        <p className="text-[13px] font-black text-gray-900 italic uppercase leading-tight">
                            {loan.personal_data?.company || '-'} / {loan.personal_data?.work_unit || '-'}
                        </p>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-0.5 block">Status / Masa Kerja</label>
                        <p className="text-sm font-bold text-gray-900 italic uppercase">
                            {loan.personal_data?.employment_status || '-'} ({loan.personal_data?.masa_kerja || '-'} thn)
                        </p>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-0.5 block">Alamat Singkat</label>
                        <p className="text-[11px] font-bold text-gray-900 italic uppercase leading-tight truncate">
                            {loan.personal_data?.address || '-'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Loan Configuration Card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left">
                        <div className="space-y-10">
                            {/* Loan Configuration Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Wallet size={15} className="text-emerald-600" />
                                    <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Konfigurasi Pinjaman</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Permohonan Member</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold italic text-lg">Rp</span>
                                            <input
                                                type="text"
                                                value={parseFloat(loan.jumlah_pengajuan || loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                                className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xl font-black text-gray-400 italic focus:outline-none"
                                                disabled
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Nominal Disetujui</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold italic text-lg">Rp</span>
                                            <input
                                                type="text"
                                                value={editingAmount}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    const formatted = val.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                                                    setEditingAmount(formatted);
                                                }}
                                                className="w-full pl-12 pr-6 py-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-xl font-black text-emerald-800 italic focus:outline-none focus:border-emerald-500 transition-all font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Interest & Margin Configuration */}
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="use-interest"
                                                checked={useInterest}
                                                onChange={(e) => setUseInterest(e.target.checked)}
                                                className="w-5 h-5 text-emerald-600 rounded-lg focus:ring-emerald-500 border-gray-300 transition-all"
                                            />
                                            <label htmlFor="use-interest" className="text-xs font-black text-gray-700 italic tracking-tight cursor-pointer">
                                                Margin ?
                                            </label>
                                        </div>
                                        {useInterest && (
                                            <button
                                                onClick={handleSaveDraft}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
                                            >
                                                <Check size={14} /> Tetapkan
                                            </button>
                                        )}
                                    </div>

                                    {useInterest && (
                                        <div className="space-y-6 pt-2 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => setInterestType('PERSENAN')}
                                                    className={`py-3 px-4 rounded-xl font-black text-[10px] tracking-widest transition-all border ${interestType === 'PERSENAN' ? 'bg-emerald-700 text-white border-emerald-700 shadow-md' : 'bg-white text-emerald-600 border-emerald-100 uppercase'}`}
                                                >
                                                    PERSENTASE (%)
                                                </button>
                                                <button
                                                    onClick={() => setInterestType('NOMINAL')}
                                                    className={`py-3 px-4 rounded-xl font-black text-[10px] tracking-widest transition-all border ${interestType === 'NOMINAL' ? 'bg-emerald-700 text-white border-emerald-700 shadow-md' : 'bg-white text-emerald-600 border-emerald-100 uppercase'}`}
                                                >
                                                    NOMINAL (RP)
                                                </button>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                                                    {interestType === 'PERSENAN' ? 'Suku Bunga flat (% / Tahun)' : 'Nominal Bunga Total (Rp)'}
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={interestValue}
                                                        onChange={(e) => setInterestValue(e.target.value)}
                                                        className="w-full px-6 py-3 bg-white border border-gray-100 rounded-xl text-lg font-black text-emerald-900 focus:outline-none focus:border-emerald-500 shadow-sm"
                                                    />
                                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-emerald-500 italic uppercase">
                                                        {interestType === 'PERSENAN' ? '%' : 'Rp'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Results Preview */}
                                            <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Estimasi Bunga</p>
                                                    {(() => {
                                                        const principal = parseFloat(editingAmount.toString().replace(/\./g, '')) || 0;
                                                        const tenor = loan.tenor_bulan;
                                                        let totalBunga = 0;
                                                        if (interestType === 'PERSENAN') {
                                                            totalBunga = principal * (parseFloat(interestValue || 0) / 100) * (tenor / 12);
                                                        } else {
                                                            totalBunga = parseFloat(interestValue || 0);
                                                        }
                                                        return <p className="text-lg font-black text-emerald-600 italic">Rp {Math.round(totalBunga).toLocaleString('id-ID')}</p>;
                                                    })()}
                                                </div>
                                                <div className="space-y-0.5 border-l border-gray-50 pl-4">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Cicilan / Bulan</p>
                                                    {(() => {
                                                        const principal = parseFloat(editingAmount.toString().replace(/\./g, '')) || 0;
                                                        const tenor = loan.tenor_bulan;
                                                        let totalBunga = 0;
                                                        if (interestType === 'PERSENAN') {
                                                            totalBunga = principal * (parseFloat(interestValue || 0) / 100) * (tenor / 12);
                                                        } else {
                                                            totalBunga = parseFloat(interestValue || 0);
                                                        }
                                                        const total = principal + totalBunga;
                                                        const cicilan = Math.ceil(total / tenor);
                                                        return <p className="text-lg font-black text-blue-600 italic">Rp {cicilan.toLocaleString('id-ID')}</p>;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Loan Information & Specifics Card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-gray-50">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText size={15} className="text-emerald-600" />
                                    <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Informasi Pengajuan</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">Jenis Pinjaman / Keperluan</label>
                                        <p className="text-sm font-bold text-gray-900 italic uppercase">{loan.jenis_pinjaman || '-'} • {loan.keperluan || '-'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="pl-8 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Check size={15} className="text-emerald-600" />
                                    <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Parameter & Tenor</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">Tenor</label>
                                        <p className="text-sm font-black text-blue-600 italic uppercase">{loan.tenor_bulan} BULAN</p>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">Dibuat Pada</label>
                                        <p className="text-xs font-bold text-gray-500 italic uppercase">
                                            {new Date(loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Integrated Sidebar Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden sticky top-6 text-left">
                        <div className="p-1 px-8 pt-8 pb-4">
                            <h3 className="text-[11px] font-black text-gray-900 tracking-[0.2em] italic uppercase mb-2">Keputusan Analis</h3>
                            <div className="h-px bg-gray-50 mb-6" />
                        </div>

                        <div className="px-8 pb-8 space-y-4">
                            <div className="space-y-3">
                                <button
                                    onClick={() => generateLoanAnalysisPDF(loan, false, analystName, {
                                        amount: parseFloat(editingAmount.toString().replace(/\./g, '')),
                                        useInterest: useInterest,
                                        interestType: interestType,
                                        interestValue: parseFloat(interestValue)
                                    })}
                                    className="w-full py-4 bg-blue-50 text-blue-700 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-100 transition-all border border-blue-100 italic"
                                >
                                    <Eye size={18} />
                                    PRATINJAU ANALISA
                                </button>

                                <button
                                    onClick={handleApprove}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:translate-y-0.5 italic"
                                >
                                    <Check size={20} />
                                    SETUJUI PINJAMAN
                                </button>

                                <button
                                    onClick={handleReject}
                                    className="w-full py-4 bg-white text-red-600 border border-red-100 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 transition-all italic"
                                >
                                    <X size={18} />
                                    TOLAK PENGAJUAN
                                </button>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => navigate('/admin/assesment-pinjaman')}
                                    className="w-full py-3 bg-white text-gray-400 rounded-2xl font-black text-[10px] tracking-widest hover:text-gray-600 transition-all uppercase italic"
                                >
                                    BATAL / KEMBALI
                                </button>
                            </div>
                        </div>

                        {/* Integrated History of Running Loans */}
                        <div className="bg-gray-900 px-8 py-8 text-white">
                            <h4 className="text-[10px] font-black tracking-widest mb-6 italic uppercase opacity-60">Pinjaman Berjalan Lainnya</h4>
                            <div className="space-y-4">
                                {runningLoans.length === 0 ? (
                                    <div className="py-4 text-center opacity-40 italic">
                                        <AlertCircle className="mx-auto mb-2 opacity-50" size={24} />
                                        <p className="text-[10px] font-black tracking-widest">TIDAK ADA PINJAMAN LAIN</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {runningLoans.map((rl) => (
                                            <Link
                                                key={rl.id}
                                                to={`/admin/loan-detail/${rl.id}`}
                                                className="group block bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all backdrop-blur-sm"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded tracking-tighter shadow-sm border ${rl.status === 'DICAIRKAN' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                                                        {rl.status}
                                                    </span>
                                                    <span className="text-[9px] font-mono font-bold text-white/30">{rl.no_pinjaman}</span>
                                                </div>
                                                <p className="text-sm font-black text-white italic tracking-tight">
                                                    Rp {rl.jumlah_pinjaman.toLocaleString('id-ID')}
                                                </p>
                                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                                                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest italic">
                                                        {rl.tenor_bulan} BULAN
                                                    </p>
                                                    <ChevronLeft size={12} className="text-white/40 group-hover:text-white transition-colors rotate-180" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isProcessing && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-600" size={48} />
                </div>
            )}
        </div>
    );
};

export default AssesmentDetail;
