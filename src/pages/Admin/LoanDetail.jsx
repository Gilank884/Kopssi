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

const LoanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loan, setLoan] = useState(null);
    const [installments, setInstallments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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

            // ================================
            // REVISI: ambil angsuran berdasarkan ORANG, bukan cuma 1 pinjaman
            // ================================
            const personId = data.personal_data_id;

            const { data: instData, error: instError } = await supabase
                .from('angsuran')
                .select(`
                *,
                pinjaman:pinjaman_id (
                    id,
                    no_pinjaman,
                    personal_data_id
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

    const handleCairkan = async () => {
        if (!loan) return;

        const confirmApprove = window.confirm(`Setujui pencairan pinjaman sebesar Rp ${parseFloat(loan.jumlah_pinjaman).toLocaleString('id-ID')} untuk ${loan.personal_data?.full_name}?`);

        if (!confirmApprove) return;

        try {
            setSubmitting(true);
            const { error: updateError } = await supabase
                .from('pinjaman')
                .update({
                    status: 'DICAIRKAN',
                    disbursed_at: new Date().toISOString()
                })
                .eq('id', loan.id);

            if (updateError) throw updateError;

            // Generate Installments after disbursement
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
            const today = new Date();

            for (let i = 1; i <= tenor; i++) {
                const dueDate = new Date(today);
                dueDate.setMonth(today.getMonth() + i);

                installmentsToCreate.push({
                    pinjaman_id: loan.id,
                    bulan_ke: i,
                    amount: monthlyAmount,
                    tanggal_bayar: dueDate.toISOString(),
                    status: 'UNPAID'
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
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
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

    if (!loan) return <div className="p-8 text-center text-gray-500 font-bold uppercase italic">Data pinjaman tidak ditemukan</div>;

    const totalPaid = installments.filter(i => i.status === 'PAID').reduce((sum, i) => sum + parseFloat(i.amount), 0);
    const totalRemaining = installments.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + parseFloat(i.amount), 0);
    const paidCount = installments.filter(i => i.status === 'PAID').length;

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-all text-gray-400 hover:text-emerald-600"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 italic uppercase tracking-tight">Detail Pinjaman</h2>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest italic">{loan.no_pinjaman} / {loan.personal_data?.full_name}</p>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest italic border ${loan.status === 'DICAIRKAN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-50' :
                    loan.status === 'DISETUJUI' ? 'bg-blue-50 text-blue-700 border-blue-100 shadow-sm shadow-blue-50' :
                        'bg-amber-50 text-amber-700 border-amber-100 shadow-sm shadow-amber-50'
                    }`}>
                    Status: {loan.status}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Areas */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase italic mb-1 tracking-widest">Total Pinjaman</p>
                            <h3 className="text-xl font-black text-gray-900 italic">{formatCurrency(loan.jumlah_pinjaman)}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase italic mb-1 tracking-widest">Pokok Terbayar</p>
                            <h3 className="text-xl font-black text-emerald-600 italic">{formatCurrency(totalPaid)}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase italic mb-1 tracking-widest">Sisa Kewajiban</p>
                            <h3 className="text-xl font-black text-red-600 italic">{formatCurrency(totalRemaining)}</h3>
                        </div>
                    </div>

                    {/* Loan & Member Information */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                            <CreditCard size={18} className="text-emerald-600" />
                            <h3 className="font-black italic uppercase tracking-widest text-xs text-gray-800">Informasi Lengkap</h3>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase italic block mb-1">Nama Peminjam</label>
                                        <p className="text-sm font-black text-gray-800 uppercase italic">{loan.personal_data?.full_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase italic block mb-1">Instansi / Unit Kerja</label>
                                        <p className="text-sm font-bold text-gray-600 uppercase">{loan.personal_data?.company} / {loan.personal_data?.work_unit}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase italic block mb-1">NPP / NIK</label>
                                        <p className="text-sm font-mono font-bold text-gray-800">{loan.personal_data?.no_npp || '-'} / {loan.personal_data?.nik}</p>
                                    </div>
                                </div>
                                <div className="space-y-4 text-left">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase italic block mb-1">Kategori</label>
                                            <p className="text-sm font-bold text-gray-800 uppercase italic tracking-tight">{loan.kategori || 'BIASA'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase italic block mb-1">Tenor</label>
                                            <p className="text-sm font-bold text-gray-800 italic uppercase tracking-tight">{loan.tenor_bulan} Bulan</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase italic block mb-1">Bunga / Margin</label>
                                        <p className="text-sm font-bold text-emerald-600 uppercase italic tracking-tight">
                                            {loan.tipe_bunga === 'PERSENAN' ? `${loan.nilai_bunga}% (Flat/Thn)` :
                                                loan.tipe_bunga === 'NOMINAL' ? `Rp ${parseFloat(loan.nilai_bunga).toLocaleString('id-ID')} (Nominal)` : 'Tanpa Bunga'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase italic block mb-1">Tujuan Pinjaman</label>
                                        <p className="text-sm font-bold text-gray-600 tracking-tight italic">{loan.keperluan || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Installment History */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="text-emerald-600" />
                                <h3 className="font-black italic uppercase tracking-widest text-xs text-gray-800">Riwayat Angsuran ({paidCount}/{loan.tenor_bulan})</h3>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100 italic font-black text-[10px] uppercase tracking-widest text-gray-400">
                                        <th className="px-6 py-3">Bulan Ke</th>
                                        <th className="px-6 py-3">Nominal</th>
                                        <th className="px-6 py-3">Tanggal Bayar</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {installments.map((inst) => (
                                        <tr key={inst.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-3 text-xs font-black text-gray-500 uppercase italic">Angsuran #{inst.bulan_ke}</td>
                                            <td className="px-6 py-3 text-sm font-black text-gray-800 italic">{formatCurrency(inst.amount)}</td>
                                            <td className="px-6 py-3 text-xs font-bold text-gray-600 uppercase italic">{formatDate(inst.tanggal_bayar)}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${inst.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {inst.status === 'PAID' ? 'LUNAS' : 'BELUM BAYAR'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {installments.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-gray-400 font-bold uppercase italic text-xs">Belum ada data angsuran</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Areas */}
                <div className="space-y-6">
                    {/* Action Card - NEW: Cairkan Sekarang */}
                    {loan.status === 'DISETUJUI' && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 text-left space-y-4">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b pb-3 italic">Panel Aksi</h3>
                            <button
                                onClick={handleCairkan}
                                disabled={submitting}
                                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${submitting
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100 active:translate-y-0.5'
                                    }`}
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                {submitting ? 'MEMPROSES...' : 'Cairkan Sekarang'}
                            </button>
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                                <AlertCircle size={20} className="text-blue-500 shrink-0" />
                                <p className="text-[10px] font-black text-blue-700 leading-relaxed uppercase italic">
                                    Pastikan dokumen SPK telah diverifikasi sebelum melakukan pencairan dana.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* SPK Management Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left">
                        <div className="bg-gray-800 px-6 py-4 flex items-center gap-3">
                            <FileText size={18} className="text-white" />
                            <h3 className="font-black italic uppercase tracking-widest text-xs text-white">Dokumen Konfirmasi (SPK)</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <p className="text-[10px] font-black text-blue-400 uppercase italic mb-3">Draft Perjanjian</p>
                                <button
                                    onClick={() => generateLoanAgreementPDF(loan)}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                                >
                                    <Download size={16} /> Unduh Draft SPK
                                </button>
                            </div>

                            <div className="pt-4 border-t border-gray-100 text-left">
                                <p className="text-[10px] font-black text-gray-400 uppercase italic mb-3">Status Konfirmasi Member</p>
                                {loan.link_spk_signed ? (
                                    <a
                                        href={loan.link_spk_signed}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 border border-emerald-200"
                                    >
                                        <CheckCircle size={16} /> Lihat Dokumen Signed
                                    </a>
                                ) : (
                                    <div className="py-3 px-4 bg-amber-50 text-amber-700 rounded-xl font-black uppercase text-[10px] tracking-widest border border-amber-200 text-center italic">
                                        Member belum upload dokumen
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-100 text-left">
                                <p className="text-[10px] font-black text-gray-400 uppercase italic mb-3">Upload dari Admin (Opsi)</p>
                                <input
                                    type="file"
                                    id="admin-spk-upload"
                                    onChange={handleUploadSPK}
                                    className="hidden"
                                    disabled={uploading}
                                />
                                <label
                                    htmlFor="admin-spk-upload"
                                    className={`w-full py-3 border-2 border-dashed ${uploading ? 'bg-gray-50 border-gray-200 text-gray-300' : 'bg-gray-50 border-emerald-200 text-emerald-600 hover:bg-emerald-50'} rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all`}
                                >
                                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                    {uploading ? 'MEMPROSES...' : 'UPLOAD DOKUMEN TTD'}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Sidebar */}
                    <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-100 text-left">
                        <h4 className="font-black italic uppercase tracking-widest text-[10px] mb-4 opacity-70">Ringkasan Statis</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-left">
                                <span className="text-xs font-bold opacity-80 uppercase italic text-left">Pengajuan Awal</span>
                                <span className="text-sm font-black italic">{formatCurrency(loan.jumlah_pengajuan || loan.jumlah_pinjaman)}</span>
                            </div>
                            <div className="flex justify-between items-center text-left">
                                <span className="text-xs font-bold opacity-80 uppercase italic text-left">Nominal Disetujui</span>
                                <span className="text-sm font-black italic">{formatCurrency(loan.jumlah_pinjaman)}</span>
                            </div>
                            <div className="h-px bg-white/20 my-2 text-left" />
                            <div className="flex justify-between items-center text-left">
                                <span className="text-xs font-bold opacity-80 uppercase italic text-left">Tanggal Approve</span>
                                <span className="text-xs font-black italic">{formatDate(loan.approved_at || loan.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoanDetail;
