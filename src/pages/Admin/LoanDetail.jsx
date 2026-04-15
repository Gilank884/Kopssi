import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CreditCard,
    User,
    FileText,
    Download,
    Upload,
    CheckCircle,
    AlertCircle,
    Clock,
    Wallet,
    Loader2,
    Calendar,
    ChevronRight,
    Search
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { generateLoanAgreementPDF } from '../../utils/loanAgreementPdf';
import InstallmentSummary from '../../components/Admin/InstallmentSummary';

const LoanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loan, setLoan] = useState(null);
    const [userLoans, setUserLoans] = useState([]); // Daftar seluruh pinjaman user ini
    const [installments, setInstallments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedInstallments, setSelectedInstallments] = useState([]); // Angsuran lama yang akan dipotong

    useEffect(() => {
        if (id) {
            fetchLoanDetail();
        }
    }, [id]);

    const fetchLoanDetail = async () => {
        try {
            setLoading(true);

            // Ambil data pinjaman + orangnya
            const { data, error } = await supabase
                .from('pinjaman')
                .select(`
                *,
                personal_data:personal_data_id (*)
            `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setLoan(data);

            const personId = data.personal_data_id;

            // Ambil seluruh pinjaman orang ini
            const { data: loansData, error: loansError } = await supabase
                .from('pinjaman')
                .select('*')
                .eq('personal_data_id', personId);

            if (loansError) throw loansError;
            setUserLoans(loansData || []);

            // Ambil seluruh angsuran orang ini
            const { data: instData, error: instError } = await supabase
                .from('angsuran')
                .select(`
                *,
                pinjaman:pinjaman_id (
                    id,
                    no_pinjaman,
                    personal_data_id,
                    jumlah_pinjaman,
                    tipe_bunga,
                    nilai_bunga,
                    tenor_bulan
                )
            `)
                .eq('pinjaman.personal_data_id', personId)
                .order('tanggal_bayar', { ascending: true });

            if (instError) throw instError;
            setInstallments(instData || []);

        } catch (error) {
            console.error('Error fetching loan detail:', error);
            alert('Gagal memuat detail pinjaman');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSPK = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `spk_signed_admin_${loan.no_pinjaman}_${Date.now()}.${fileExt}`;
            const filePath = `spk/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('pinjaman')
                .update({ link_spk_signed: publicUrl })
                .eq('id', loan.id);

            if (updateError) throw updateError;

            setLoan(prev => ({ ...prev, link_spk_signed: publicUrl }));
            alert('Dokumen Konfirmasi (SPK) Berhasil diupload!');
        } catch (error) {
            console.error('Error uploading SPK:', error);
            alert('Gagal mengupload dokumen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleToggleInstallment = (inst) => {
        setSelectedInstallments(prev => {
            const isSelected = prev.some(si => si.id === inst.id);
            if (isSelected) {
                return prev.filter(si => si.id !== inst.id);
            } else {
                return [...prev, inst];
            }
        });
    };

    const handleToggleAllInstallments = (loanId, unpaidInsts) => {
        setSelectedInstallments(prev => {
            const allSelected = unpaidInsts.every(ui => prev.some(si => si.id === ui.id));
            if (allSelected) {
                // Deselect all for this loan
                return prev.filter(si => si.pinjaman_id !== loanId);
            } else {
                // Select all for this loan (avoid duplicates)
                const otherLoanInsts = prev.filter(si => si.pinjaman_id !== loanId);
                return [...otherLoanInsts, ...unpaidInsts];
            }
        });
    };

    const handleCairkan = async () => {
        const totalDeduction = selectedInstallments.reduce((sum, inst) => sum + parseFloat(inst.amount), 0);
        const netDisbursement = parseFloat(loan.jumlah_pinjaman) - totalDeduction;

        const confirmApprove = window.confirm(
            `Setujui pencairan pinjaman sebesar ${formatCurrency(loan.jumlah_pinjaman)}?\n\n` +
            (totalDeduction > 0
                ? `Potongan Angsuran: ${formatCurrency(totalDeduction)}\n` +
                `Total yang diterima Member: ${formatCurrency(netDisbursement)}\n\n`
                : "") +
            `Konfirmasi pencairan untuk ${loan.personal_data?.full_name}?`
        );

        if (!confirmApprove) return;

        try {
            setSubmitting(true);

            // 1. Update status pinjaman & simpan outstanding (potongan)
            const { error: updateError } = await supabase
                .from('pinjaman')
                .update({
                    status: 'DICAIRKAN',
                    disbursed_at: new Date().toISOString(),
                    outstanding: totalDeduction // Simpan jumlah potongan
                })
                .eq('id', loan.id);

            if (updateError) throw updateError;

            // 2. Tandai angsuran yang dipotong sebagai PAID
            if (selectedInstallments.length > 0) {
                const { error: patchError } = await supabase
                    .from('angsuran')
                    .update({
                        status: 'PROCESSED',
                        tanggal_bayar: new Date().toISOString(),
                        metode_bayar: 'POTONG_PENCAIRAN',
                        keterangan: `Dipotong dari pencairan pinjaman ${loan.no_pinjaman}`
                    })
                    .in('id', selectedInstallments.map(i => i.id));

                if (patchError) throw patchError;
            }

            // 3. Generate Installments for the NEW loan
            const principal = parseFloat(loan.jumlah_pinjaman);
            const tenor = loan.tenor_bulan;
            let totalBunga = 0;

            if (loan.tipe_bunga === 'PERSENAN') {
                totalBunga = principal * (parseFloat(loan.nilai_bunga) / 100) * (tenor / 12);
            } else if (loan.tipe_bunga === 'NOMINAL') {
                totalBunga = parseFloat(loan.nilai_bunga);
            }

            const totalBayar = principal + totalBunga;
            const monthlyAmount = Math.ceil(totalBayar / tenor);

            const installmentsToCreate = [];
            const tenorCount = parseInt(tenor) || 1;
            const refDate = new Date();
            refDate.setDate(1); // Pin to start of month to avoid overflow quirks
            refDate.setHours(12, 0, 0, 0);

            for (let i = 1; i <= tenorCount; i++) {
                // Generate date for the 15th of each consecutive month
                const dueDate = new Date(refDate.getFullYear(), refDate.getMonth() + i, 15, 12, 0, 0);

                installmentsToCreate.push({
                    pinjaman_id: loan.id,
                    personal_data_id: loan.personal_data_id,
                    bulan_ke: i,
                    amount: monthlyAmount,
                    jatuh_tempo: dueDate.toISOString(),
                    tanggal_bayar: null, // Empty until paid
                    status: 'UNPAID' // Explicitly set UNPAID instead of null for better visibility
                });
            }

            const { error: angsuranError } = await supabase
                .from('angsuran')
                .insert(installmentsToCreate);

            if (angsuranError) throw angsuranError;

            alert('Pinjaman berhasil DICAIRKAN! Dana telah dilepaskan ke anggota.');
            fetchLoanDetail();
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Gagal mencairkan pinjaman: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const formatDate = (dateString, withTime = false) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: '2-digit' };
        if (withTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        return date.toLocaleDateString('id-ID', options);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-emerald-600" size={48} />
            </div>
        );
    }

    if (!loan) return <div className="p-8 text-center text-gray-500 font-bold italic">Data pinjaman tidak ditemukan</div>;


    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1500px] mx-auto pb-20">
            {/* Minimalist Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white hover:bg-gray-50 rounded-xl transition-all text-gray-400 border border-gray-100 shadow-sm"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                            {loan.personal_data?.full_name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 italic tracking-tight leading-none">{loan.personal_data?.full_name}</h2>
                            <p className="text-[10px] text-gray-400 mt-1 font-black italic tracking-widest uppercase opacity-70">{loan.no_pinjaman} • {loan.kategori || 'BIASA'}</p>
                        </div>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl font-black text-[10px] tracking-widest italic border shadow-sm ${loan.status === 'DICAIRKAN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    loan.status === 'DISETUJUI' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        loan.status === 'DITOLAK' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                    STATUS: {loan.status}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Information Column */}
                <div className="lg:col-span-2 space-y-4 text-left">
                    {/* Compact Borrower & Loan Info Card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-gray-50">
                            {/* Peminjam Column */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <User size={15} className="text-emerald-600" />
                                    <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Profil Peminjam</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">NPP / NIK</label>
                                        <p className="text-sm font-mono font-black text-gray-700 italic tracking-tighter">{loan.personal_data?.no_npp || '-'} / {loan.personal_data?.nik}</p>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">Instansi / Unit Kerja</label>
                                        <p className="text-[13px] font-bold text-gray-900 uppercase italic leading-tight">{loan.personal_data?.company} / {loan.personal_data?.work_unit}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Parameters Column */}
                            <div className="pl-8 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText size={15} className="text-emerald-600" />
                                    <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Parameter Pinjaman</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">Total & Tenor</label>
                                        <p className="text-sm font-black text-gray-900 italic">
                                            {formatCurrency(loan.jumlah_pinjaman)} <span className="text-blue-600 text-[11px]">• {loan.tenor_bulan} BULAN</span>
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">Tujuan</label>
                                        <p className="text-xs font-bold text-gray-600 italic leading-tight truncate">{loan.keperluan || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Integrated Installment Summary Component */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <InstallmentSummary
                            loan={loan}
                            installments={installments}
                            userLoans={userLoans}
                            formatCurrency={formatCurrency}
                            selectedInstallments={selectedInstallments}
                            onToggleInstallment={handleToggleInstallment}
                            onToggleAllInstallments={handleToggleAllInstallments}
                        />
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6 text-left">
                    {/* Decision / Action Sidebar Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden sticky top-6">
                        {loan.status === 'DISETUJUI' ? (
                            <div className="p-8 space-y-6">
                                <h3 className="text-[11px] font-black text-gray-900 tracking-[0.2em] italic uppercase mb-2">Panel Pencairan</h3>
                                <button
                                    onClick={handleCairkan}
                                    disabled={submitting}
                                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg italic ${submitting
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100 active:translate-y-0.5'
                                        }`}
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                    {submitting ? 'Memproses...' : 'Cairkan Sekarang'}
                                </button>
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                                    <AlertCircle size={20} className="text-blue-500 shrink-0" />
                                    <p className="text-[10px] font-black text-blue-700 leading-relaxed italic">
                                        Pastikan dokumen SPK telah diverifikasi sebelum melakukan pencairan dana.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 space-y-4">
                                <h3 className="text-[11px] font-black text-gray-900 tracking-[0.2em] italic uppercase mb-2">Informasi Status</h3>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[11px] font-black text-gray-400 italic mb-2 uppercase tracking-widest">Catatan Sistem</p>
                                    <p className="text-xs font-bold text-gray-600 leading-relaxed italic">
                                        Status pinjaman saat ini adalah <span className="text-emerald-600 uppercase">{loan.status}</span>.
                                        {loan.status === 'DICAIRKAN' && ' Dana telah dilepaskan ke anggota.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* SPK Management Section - Integrated into Sidebar */}
                        <div className="p-8 pt-0 space-y-6">
                            <h3 className="text-[11px] font-black text-gray-900 tracking-[0.2em] italic uppercase mb-2 border-t border-gray-50 pt-6">Dokumen SPK</h3>
                            
                            <div className="space-y-4">
                                <div className="group space-y-2">
                                    <p className="text-[9px] font-black text-gray-400 uppercase italic tracking-widest px-1">Draft Perjanjian</p>
                                    <button
                                        onClick={() => generateLoanAgreementPDF(loan)}
                                        className="w-full py-3 bg-white text-blue-600 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-blue-50 transition-all border border-blue-100 italic"
                                    >
                                        <Download size={16} /> Unduh Draft SPK
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-gray-400 uppercase italic tracking-widest px-1">Verifikasi Member</p>
                                    {loan.link_spk_signed ? (
                                        <a
                                            href={loan.link_spk_signed}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 border border-emerald-200 italic"
                                        >
                                            <CheckCircle size={16} /> Lihat Dokumen Signed
                                        </a>
                                    ) : (
                                        <div className="py-3 px-4 bg-amber-50 text-amber-500 rounded-xl font-black text-[9px] tracking-widest border border-amber-100 text-center italic uppercase opacity-60">
                                            Menunggu Upload Member
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 pt-2">
                                    <input
                                        type="file"
                                        id="admin-spk-upload"
                                        onChange={handleUploadSPK}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                    <label
                                        htmlFor="admin-spk-upload"
                                        className={`w-full py-3 border-2 border-dashed ${uploading ? 'bg-gray-50 border-gray-200 text-gray-300' : 'bg-gray-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300'} rounded-xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all italic uppercase`}
                                    >
                                        {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                        {uploading ? 'Memproses...' : 'Upload Manual Admin'}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Integrated Footer */}
                        <div className="bg-gray-900 p-8 text-white overflow-hidden relative">
                            <h4 className="text-[10px] font-black tracking-widest mb-6 italic uppercase opacity-40">Ringkasan Statistik</h4>
                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold opacity-60 italic uppercase tracking-widest">Pengajuan</span>
                                    <span className="text-sm font-black italic">{formatCurrency(loan.jumlah_pengajuan || loan.jumlah_pinjaman)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold opacity-60 italic uppercase tracking-widest">Disetujui</span>
                                    <span className="text-sm font-black italic">{formatCurrency(loan.jumlah_pinjaman)}</span>
                                </div>
                                <div className="h-px bg-white/10 my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold opacity-60 italic uppercase tracking-widest">Approve Date</span>
                                    <span className="text-[10px] font-black italic opacity-80 uppercase tracking-tighter">
                                        {formatDate(loan.approved_at || loan.created_at)}
                                    </span>
                                </div>
                            </div>
                            {/* Decorative background element */}
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoanDetail;
