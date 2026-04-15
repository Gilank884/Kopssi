import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    X,
    User,
    Wallet,
    FileText,
    CheckCircle,
    Eye,
    ChevronLeft,
    AlertCircle,
    Download,
    Loader2
} from 'lucide-react';

const PencairanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loan, setLoan] = useState(null);
    const [installments, setInstallments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLoanDetail();
    }, [id]);

    const fetchLoanDetail = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pinjaman')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        full_name,
                        nik,
                        phone,
                        company,
                        work_unit
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) throw new Error("Data pinjaman tidak ditemukan.");

            setLoan(data);

            // Fetch installments
            const { data: instData, error: instError } = await supabase
                .from('angsuran')
                .select('*')
                .eq('pinjaman_id', id)
                .order('bulan_ke', { ascending: true });

            if (instError) throw instError;
            setInstallments(instData || []);

        } catch (err) {
            console.error('Error fetching loan detail:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
            </div>
        );
    }

    if (error || !loan) {
        return (
            <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-red-700">
                <div className="flex items-center gap-3 mb-4">
                    <AlertCircle size={24} />
                    <h2 className="text-lg font-bold">Terjadi Kesalahan</h2>
                </div>
                <p>{error || "Data tidak ditemukan"}</p>
                <button
                    onClick={() => navigate('/admin/pencairan-pinjaman')}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
                >
                    Kembali ke Daftar
                </button>
            </div>
        );
    }

    // Calculate loan summary
    const principal = parseFloat(loan.jumlah_pinjaman);
    const tenor = loan.tenor_bulan;

    let totalBunga = 0;
    if (loan.tipe_bunga === 'PERSENAN') {
        totalBunga = principal * (parseFloat(loan.nilai_bunga) / 100) * (tenor / 12);
    } else if (loan.tipe_bunga === 'NOMINAL') {
        totalBunga = parseFloat(loan.nilai_bunga);
    }

    const totalBayar = principal + totalBunga;
    const cicilan = installments.length > 0 ? parseFloat(installments[0].amount) : (totalBayar / tenor);

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-20">
            {/* Minimalist Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/pencairan-pinjaman')}
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
                            <p className="text-[10px] text-gray-400 mt-1 font-black italic tracking-widest uppercase opacity-70">{loan.no_pinjaman} • PROSES PENCAIRAN</p>
                        </div>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl font-black text-[10px] tracking-widest italic border shadow-sm ${loan.status === 'DISETUJUI' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                    STATUS: {loan.status}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Information Column */}
                <div className="lg:col-span-2 space-y-4 text-left">
                    {/* Compact Member & Reference Info Card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-gray-50">
                            {/* Member Identitiy column */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <User size={15} className="text-emerald-600" />
                                    <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Identitas Anggota</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">Nama Lengkap / NPP-NIK</label>
                                        <p className="text-sm font-bold text-gray-900 italic uppercase">
                                            {loan.personal_data?.full_name || '-'} <span className="text-[10px] font-mono font-black text-gray-400 tracking-tighter ml-2">• {loan.personal_data?.nik || '-'}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">Instansi / Unit Kerja</label>
                                        <p className="text-[11px] font-bold text-gray-900 uppercase italic leading-tight">{loan.personal_data?.company || '-'} / {loan.personal_data?.work_unit || '-'}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Reference & Docs column */}
                            <div className="pl-8 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText size={15} className="text-emerald-600" />
                                    <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Referansi & Pinjaman</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">Plafon / No. Pinjaman</label>
                                        <p className="text-sm font-black text-emerald-600 italic">
                                            Rp {loan.jumlah_pinjaman?.toLocaleString('id-ID')} <span className="text-gray-300 font-mono text-[10px] ml-2">• {loan.no_pinjaman}</span>
                                        </p>
                                    </div>
                                    <div className="pt-2">
                                        {loan.link_spk_signed ? (
                                            <a
                                                href={loan.link_spk_signed}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[9px] tracking-widest flex items-center justify-center gap-2 border border-emerald-100 hover:bg-emerald-100 transition-all italic uppercase"
                                            >
                                                <Download size={14} /> Dokumen SPK Signed
                                            </a>
                                        ) : (
                                            <span className="text-[9px] font-black text-amber-500 italic uppercase bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">Menunggu Upload SPK</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6 text-left">
                    {/* Unified Action Sidebar Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden sticky top-6">
                        <div className="p-1 px-8 pt-8 pb-4">
                            <h3 className="text-[11px] font-black text-gray-900 tracking-[0.2em] italic uppercase mb-2">Panel Aksi</h3>
                            <div className="h-px bg-gray-50 mb-6" />
                        </div>

                        <div className="px-8 pb-8 space-y-4">
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/admin/loan-detail/${loan.id}`)}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:translate-y-0.5 italic uppercase"
                                >
                                    <Eye size={18} />
                                    KELOLA PENCAIRAN
                                </button>

                                <button
                                    onClick={() => navigate('/admin/pencairan-pinjaman')}
                                    className="w-full py-3 bg-white text-gray-400 rounded-2xl font-black text-[10px] tracking-widest hover:text-gray-600 transition-all uppercase italic"
                                >
                                    BATAL / KEMBALI
                                </button>
                            </div>

                            {loan.status === 'DISETUJUI' && (
                                <div className="mt-4 p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                                    <AlertCircle size={20} className="text-blue-500 shrink-0" />
                                    <p className="text-[10px] font-black text-blue-700 leading-relaxed italic">
                                        Pastikan dokumen SPK telah diverifikasi sebelum melakukan pencairan dana.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Integrated System Notes Sidebar */}
                        <div className="bg-gray-900 px-8 py-8 text-white overflow-hidden relative">
                            <h4 className="text-[10px] font-black tracking-widest mb-6 italic uppercase opacity-40">Catatan Sistem</h4>
                            <div className="space-y-4 relative z-10">
                                <div className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                                    <p className="text-[10px] font-bold text-white/70 leading-relaxed italic">Dana akan dilepaskan sesuai dengan plafon yang disetujui.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                                    <p className="text-[10px] font-bold text-white/70 leading-relaxed italic">Status akan berubah menjadi DICAIRKAN di dashboard anggota.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                                    <p className="text-[10px] font-bold text-white/70 leading-relaxed italic">Anggota akan mulai tertagih angsuran pada periode berikutnya.</p>
                                </div>
                            </div>
                            {/* Decorative background circle */}
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl opacity-50" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PencairanDetail;
