import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    User,
    Briefcase,
    MapPin,
    Building,
    FileText,
    Loader2,
    ChevronLeft,
    AlertCircle,
    CheckCircle,
    Printer,
    Search,
    Download
} from 'lucide-react';
import { generateMemberApplicationPDF } from '../../utils/memberApplicationPdf';

const MemberApplicationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchApplicationDetail();
    }, [id]);

    const fetchApplicationDetail = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('personal_data')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            if (!data) throw new Error("Pengajuan tidak ditemukan.");

            // Fetch user data for email if available
            let userData = null;
            if (data.user_id) {
                const { data: uData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.user_id)
                    .single();
                userData = uData;
            }

            setMember({ ...data, userData });
        } catch (err) {
            console.error('Error fetching application detail:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!window.confirm(`Apakah Anda yakin ingin menyetujui dan mengaktifkan anggota ${member.full_name}?`)) return;

        try {
            setIsProcessing(true);

            // 1. Manage User account (Updating role to MEMBER)
            const { error: userUpdateError } = await supabase
                .from('users')
                .update({ role: 'MEMBER' })
                .eq('id', member.user_id);

            if (userUpdateError) throw userUpdateError;

            // 2. Update Personal Data status to active
            const { error: personalUpdateError } = await supabase
                .from('personal_data')
                .update({ status: 'active' })
                .eq('id', member.id);

            if (personalUpdateError) throw personalUpdateError;

            alert('Status anggota berhasil diaktifkan!');
            navigate('/admin/member-applications');
        } catch (err) {
            console.error('Error approving application:', err);
            alert('Gagal menyetujui pengajuan: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
            </div>
        );
    }

    if (error || !member) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-700">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle size={24} />
                        <h2 className="text-lg font-bold">Terjadi Kesalahan</h2>
                    </div>
                    <p>{error || "Data pengajuan tidak ditemukan"}</p>
                    <button
                        onClick={() => navigate('/admin/member-applications')}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl font-bold"
                    >
                        Kembali ke Pengajuan
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/member-applications')}
                        className="p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all text-gray-400 border border-gray-100 shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl shadow-sm border border-emerald-200">
                                {member.full_name?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tight">{member.full_name}</h2>
                                <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium italic tracking-tight">NIK: {member.nik || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl font-black text-[10px] tracking-widest italic border shadow-sm ${member.status?.toLowerCase() === 'pending'
                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                    Status: {member.status || 'Unknown'}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Data Pribadi */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left">
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-emerald-600">
                                <User size={18} />
                                <h4 className="font-black text-[10px] tracking-widest italic uppercase">Data Pribadi</h4>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 tracking-widest block mb-0.5">NAMA LENGKAP</label>
                                    <p className="text-sm text-gray-800 font-bold italic">{member.full_name || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 tracking-widest block mb-0.5">NIK</label>
                                    <p className="text-sm text-gray-800 font-bold italic">{member.nik || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 tracking-widest block mb-0.5">NOMOR HP</label>
                                    <p className="text-sm text-gray-800 font-bold italic">{member.phone || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 tracking-widest block mb-0.5">EMAIL</label>
                                    <p className="text-sm text-gray-800 font-bold italic">{member.userData?.email || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Data Pekerjaan */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left">
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-emerald-600">
                                <Briefcase size={18} />
                                <h4 className="font-black text-[10px] tracking-widest italic uppercase">Pekerjaan</h4>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 tracking-widest block mb-0.5">PERUSAHAAN / PT</label>
                                    <p className="text-sm text-gray-800 font-bold italic">{member.company || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 tracking-widest block mb-0.5">UNIT KERJA</label>
                                    <p className="text-sm text-gray-800 font-bold italic">{member.work_unit || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 tracking-widest block mb-0.5">STATUS KARYAWAN</label>
                                    <p className="text-sm text-gray-800 font-bold italic">{member.employment_status || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Alamat */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-emerald-600">
                                <MapPin size={18} />
                                <h4 className="font-black text-[10px] tracking-widest italic uppercase">Alamat & Kontak Darurat</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 tracking-widest block mb-0.5">ALAMAT LENGKAP</label>
                                    <p className="text-sm text-gray-800 font-bold italic">{member.address || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 tracking-widest block mb-0.5">TELEPON DARURAT</label>
                                    <p className="text-sm text-gray-800 font-bold italic">{member.emergency_phone || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dokumen Section */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-emerald-600">
                            <FileText size={18} />
                            <h4 className="font-black text-[10px] tracking-widest italic uppercase">Dokumen & Persyaratan</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'KTP Member', field: 'ktp_file_path' },
                                { label: 'ID Card', field: 'id_card_file_path' },
                                { label: 'Pas Foto 3x4', field: 'photo_34_file_path' },
                                { label: 'Tanda Tangan', field: 'signature_image' }
                            ].map((doc, i) => (
                                <div key={i} className="p-4 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center gap-3 bg-gray-50 transition-colors hover:bg-gray-100/50">
                                    <p className="text-[10px] font-black text-gray-500 tracking-widest uppercase">{doc.label}</p>
                                    {member[doc.field] ? (
                                        <div className="relative group overflow-hidden rounded-lg shadow-md border border-white w-full">
                                            <img src={member[doc.field]} alt={doc.label} className="w-full h-24 object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <a href={member[doc.field]} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Download className="text-white" size={20} />
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="h-24 flex flex-col items-center justify-center text-gray-300 italic border border-gray-200 w-full rounded-lg bg-white/50">
                                            <AlertCircle size={20} className="mb-1 opacity-20" />
                                            <span className="text-[10px] font-black">Tanpa File</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Administration Panel */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 text-left space-y-4 sticky top-6">
                        <h3 className="text-[10px] font-black text-gray-900 tracking-widest border-b pb-3 italic uppercase">Panel Verifikasi</h3>

                        <div className="space-y-3">
                            {member.status?.toLowerCase() !== 'active' && (
                                <button
                                    onClick={handleApprove}
                                    disabled={isProcessing}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={18} />
                                    SETUJUI & AKTIFKAN
                                </button>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => generateMemberApplicationPDF(member, true)}
                                    className="py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-black text-[10px] tracking-widest hover:bg-amber-100 transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    <Search size={14} /> PRATINJAU
                                </button>
                                <button
                                    onClick={() => generateMemberApplicationPDF(member)}
                                    className="py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-black text-[10px] tracking-widest hover:bg-blue-100 transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    <Printer size={14} /> CETAK PDF
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-gray-50">
                            <button
                                onClick={() => navigate('/admin/member-applications')}
                                className="w-full py-3 bg-white text-gray-400 rounded-xl font-bold text-[10px] tracking-widest hover:text-gray-600 transition-all uppercase"
                            >
                                Kembali ke Daftar
                            </button>
                        </div>
                    </div>

                    <div className="bg-emerald-600/5 rounded-2xl p-6 text-left border border-emerald-600/10">
                        <h4 className="text-[10px] font-black text-emerald-800 tracking-widest mb-3 italic uppercase">Petunjuk Verifikasi</h4>
                        <ul className="space-y-3">
                            <li className="flex gap-2 text-[10px] font-bold text-emerald-700 leading-tight italic">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
                                Periksa kesesuaian NIK dan Nama dengan lampiran KTP.
                            </li>
                            <li className="flex gap-2 text-[10px] font-bold text-emerald-700 leading-tight italic">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
                                Pastikan tanda tangan digital sudah terisi.
                            </li>
                            <li className="flex gap-2 text-[10px] font-bold text-emerald-700 leading-tight italic">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
                                Klik "Setujui" untuk memberikan akses aplikasi kepada anggota.
                            </li>
                        </ul>
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

export default MemberApplicationDetail;
