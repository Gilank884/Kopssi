import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import bcrypt from 'bcryptjs';
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
            const userUpdateData = { role: 'MEMBER' };

            // If not self-activated, set password to no_anggota (hashed)
            if (member.status?.toLowerCase() !== 'done verifikasi') {
                const salt = await bcrypt.genSalt(10);
                userUpdateData.password = await bcrypt.hash(member.no_anggota, salt);
            }

            const { error: userUpdateError } = await supabase
                .from('users')
                .update(userUpdateData)
                .eq('id', member.user_id);

            if (userUpdateError) throw userUpdateError;

            // 2. Update Personal Data status to active
            const { error: personalUpdateError } = await supabase
                .from('personal_data')
                .update({ status: 'AKTIF' })
                .eq('id', member.id);

            if (personalUpdateError) throw personalUpdateError;

            alert('Status anggota berhasil diaktifkan!');
            navigate('/admin/pengajuan-anggota');
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
                        onClick={() => navigate('/admin/pengajuan-anggota')}
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
            {/* Minimalist Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/pengajuan-anggota')}
                        className="p-2.5 bg-white hover:bg-gray-50 rounded-xl transition-all text-gray-400 border border-gray-100 shadow-sm"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                            {member.full_name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 italic tracking-tight leading-none">{member.full_name}</h2>
                            <p className="text-[10px] text-gray-400 mt-1 font-black italic tracking-widest uppercase opacity-70">NIK: {member.nik || '-'} • NO: <span className="text-blue-600">{member.no_anggota || '-'}</span></p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`px-4 py-2 rounded-xl font-black text-[10px] tracking-widest italic border shadow-sm ${member.status?.toLowerCase() === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                        STATUS: {member.status || 'UNKNOWN'}
                    </div>
                </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Information Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Key Identity Table - Standardized 'Per Kolom' */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-left">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 font-black text-gray-400 text-[9px] tracking-widest italic uppercase border-r border-gray-50">Nomor Anggota (DRAFT)</th>
                                        <th className="px-6 py-3 font-black text-gray-400 text-[9px] tracking-widest italic uppercase border-r border-gray-50">No. NPP</th>
                                        <th className="px-6 py-3 font-black text-gray-400 text-[9px] tracking-widest italic uppercase border-r border-gray-50 text-center">Unit Kerja</th>
                                        <th className="px-6 py-3 font-black text-gray-400 text-[9px] tracking-widest italic uppercase text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-white">
                                        <td className="px-6 py-4 border-r border-gray-50 bg-blue-50/30">
                                            <span className="text-sm font-black text-blue-600 italic tracking-tighter uppercase">{member.no_anggota || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-50 bg-slate-50/50">
                                            <span className="text-sm font-black text-gray-700 italic tracking-tighter uppercase">{member.no_npp || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-50 text-center bg-gray-50/30">
                                            <span className="text-sm font-bold text-gray-800 italic uppercase">{member.work_unit || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-3 py-1 rounded text-[9px] font-black tracking-widest italic transition-all uppercase ${member.status?.toLowerCase() === 'active' || member.status?.toLowerCase() === 'aktif'
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : member.status?.toLowerCase() === 'rejected' || member.status?.toLowerCase() === 'tolak'
                                                    ? 'bg-red-600 text-white shadow-sm'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                {member.status || 'PENDING'}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Personal Information Card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left">
                        <div className="flex items-center gap-2 mb-4">
                            <User size={15} className="text-emerald-600" />
                            <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Profil & Identitas Lengkap</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-0.5 block">Nama Lengkap</label>
                                <p className="text-sm font-bold text-gray-900 italic uppercase">{member.full_name}</p>
                            </div>
                            <div className="group">
                                <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-0.5 block">NIK / Nomor HP</label>
                                <p className="text-sm font-bold text-gray-900">{member.nik} / {member.phone}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-0.5 block">Nomor Anggota (DRAFT)</label>
                                <p className="text-sm font-black text-blue-600 italic uppercase tracking-tighter">{member.no_anggota || '-'}</p>
                            </div>
                            <div className="md:col-span-3 pb-2 border-b border-gray-50/50">
                                <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-0.5 block">Email</label>
                                <p className="text-sm font-bold text-gray-900 lowercase italic">{member.userData?.email || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Work & Address Information Card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-gray-50">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Briefcase size={15} className="text-emerald-600" />
                                    <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Pekerjaan</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-0.5">Unit Kerja / Perusahaan</label>
                                        <p className="text-[13px] font-bold text-gray-900 uppercase italic">{member.work_unit || '-'} / {member.company || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-0.5">Status</label>
                                        <p className="text-[11px] font-bold text-gray-900 uppercase italic">{member.employment_status || '-'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="pl-8 space-y-4">
                                <div className="flex items-center gap-2">
                                    <MapPin size={15} className="text-emerald-600" />
                                    <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Alamat & Kontak</h4>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-0.5">Alamat KTP</label>
                                        <p className="text-[11px] font-bold text-gray-900 uppercase italic leading-tight">{member.address || '-'}</p>
                                    </div>
                                    <div className="flex gap-6">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-0.5">Telepon Darurat</label>
                                            <p className="text-xs font-bold text-gray-900 italic">{member.emergency_phone || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    {/* Compact Documents Section */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-left">
                        <div className="flex items-center gap-2 mb-6">
                            <Building size={16} className="text-emerald-600" />
                            <h4 className="font-black text-[11px] tracking-[0.2em] text-gray-400 uppercase italic">Dokumen & Persyaratan</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'KTP Member', field: 'ktp_file_path' },
                                { label: 'ID Card', field: 'id_card_file_path' },
                                { label: 'Pas Foto 3x4', field: 'photo_34_file_path' },
                                { label: 'Tanda Tangan', field: 'signature_image' }
                            ].map((doc, i) => (
                                <div key={i} className="group relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:border-emerald-200 transition-all p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-[8px] font-black text-gray-400 tracking-widest uppercase bg-white px-2 py-1 rounded-md border border-gray-100">{doc.label}</span>
                                        {member[doc.field] && <Download size={12} className="text-emerald-400" />}
                                    </div>
                                    {member[doc.field] ? (
                                        <div className="relative aspect-square rounded-xl overflow-hidden shadow-inner bg-white">
                                            <img src={member[doc.field]} alt={doc.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            <a href={member[doc.field]} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                                                <div className="bg-white p-2 rounded-full shadow-lg">
                                                    <Download className="text-emerald-600" size={16} />
                                                </div>
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="aspect-square flex flex-col items-center justify-center text-gray-300 italic rounded-xl bg-white border border-dashed border-gray-200">
                                            <AlertCircle size={20} className="mb-1 opacity-20" />
                                            <span className="text-[9px] font-black tracking-widest">NO FILE</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Integrated Sidebar Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden sticky top-6 text-left">
                        <div className="p-1 px-8 pt-8 pb-4">
                            <h3 className="text-[11px] font-black text-gray-900 tracking-[0.2em] italic uppercase mb-2">Verifikasi</h3>
                            <div className="h-px bg-gray-50 mb-6" />
                        </div>

                        <div className="px-8 pb-8 space-y-4">
                            <div className="space-y-3">
                                {member.status?.toLowerCase() !== 'active' && (
                                    <button
                                        onClick={handleApprove}
                                        disabled={isProcessing}
                                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 italic"
                                    >
                                        <CheckCircle size={18} />
                                        SETUJUI & TERIMA ANGGOTA
                                    </button>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => generateMemberApplicationPDF(member, true)}
                                        className="py-3 bg-white text-amber-600 border border-amber-100 rounded-2xl font-black text-[9px] tracking-widest hover:bg-amber-50 transition-all uppercase italic flex flex-col items-center gap-1 justify-center"
                                    >
                                        <Search size={14} /> PRATINJAU
                                    </button>
                                    <button
                                        onClick={() => generateMemberApplicationPDF(member)}
                                        className="py-3 bg-white text-blue-600 border border-blue-100 rounded-2xl font-black text-[9px] tracking-widest hover:bg-blue-50 transition-all uppercase italic flex flex-col items-center gap-1 justify-center"
                                    >
                                        <Printer size={14} /> CETAK PDF
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => navigate('/admin/pengajuan-anggota')}
                                    className="w-full py-3 bg-white text-gray-400 rounded-2xl font-black text-[10px] tracking-widest hover:text-gray-600 transition-all uppercase italic"
                                >
                                    Batal / Kembali
                                </button>
                            </div>
                        </div>

                        {/* Integrated Guidance Notes */}
                        <div className="bg-emerald-600 px-8 py-6 text-white overflow-hidden relative">
                            <h4 className="text-[10px] font-black tracking-widest mb-4 italic uppercase opacity-80">Petunjuk Verifikasi</h4>
                            <div className="space-y-3 relative z-10">
                                <div className="flex gap-2">
                                    <div className="w-1 h-1 rounded-full bg-white mt-1 shrink-0 opacity-50" />
                                    <p className="text-[10px] font-bold leading-tight italic opacity-90">Periksa kesesuaian NIK dan Nama dengan lampiran KTP.</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-1 h-1 rounded-full bg-white mt-1 shrink-0 opacity-50" />
                                    <p className="text-[10px] font-bold leading-tight italic opacity-90">Pastikan tanda tangan digital sudah terisi.</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-1 h-1 rounded-full bg-white mt-1 shrink-0 opacity-50" />
                                    <p className="text-[10px] font-bold leading-tight italic opacity-90">Klik "Setujui" untuk memberikan akses aplikasi kepada anggota.</p>
                                </div>
                            </div>
                            {/* Decorative background circle */}
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
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

export default MemberApplicationDetail;
