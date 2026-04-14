import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    User,
    Briefcase,
    MapPin,
    CreditCard,
    Calendar,
    Loader2,
    ChevronLeft,
    AlertCircle,
    Download
} from 'lucide-react';

const MemberDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchMemberDetail();
    }, [id]);

    const fetchMemberDetail = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('personal_data')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) throw new Error("Anggota tidak ditemukan.");

            setMember(data);
        } catch (err) {
            console.error('Error fetching member detail:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleActivateMember = async () => {
        if (!window.confirm(`Apakah Anda yakin ingin MENGAKTIFKAN kembali anggota ${member.full_name}?`)) return;
        try {
            setIsProcessing(true);
            const { error } = await supabase
                .from('personal_data')
                .update({
                    status: 'ACTIVE',
                    keluar_anggota: null,
                    tanggal_keluar: null,
                    sebab_keluar: null,
                    exit_realisasi_status: null,
                    exit_realisasi_date: null
                })
                .eq('id', member.id);

            if (error) throw error;
            alert('Anggota berhasil diaktifkan kembali!');
            fetchMemberDetail();
        } catch (err) {
            console.error("Error activating member:", err);
            alert("Gagal mengaktifkan anggota: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSetPassiveMember = async () => {
        if (!window.confirm(`Apakah Anda yakin ingin MEMASIFKAN anggota ${member.full_name}?`)) return;
        try {
            setIsProcessing(true);
            const { error } = await supabase
                .from('personal_data')
                .update({ status: 'PASIF' })
                .eq('id', member.id);

            if (error) throw error;
            alert('Status anggota berhasil diubah menjadi PASIF!');
            fetchMemberDetail();
        } catch (err) {
            console.error("Error setting member to passive:", err);
            alert("Gagal memasifkan anggota: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeactivateMember = async () => {
        if (!window.confirm(`Apakah Anda yakin ingin MENONAKTIFKAN anggota ${member.full_name}?\n\nSeluruh simpanan akan dikembalikan dan pinjaman berjalan akan diperhitungkan.`)) return;
        try {
            setIsProcessing(true);
            const { error } = await supabase
                .from('personal_data')
                .update({
                    status: 'NON_ACTIVE',
                    keluar_anggota: 'Y',
                    tanggal_keluar: new Date().toISOString(),
                    sebab_keluar: 'NONAKTIFKAN OLEH ADMIN',
                    exit_realisasi_status: 'PENDING'
                })
                .eq('id', member.id);

            if (error) throw error;
            alert('Anggota berhasil dinonaktifkan! Silakan proses pengembalian dana di halaman Realisasi.');
            fetchMemberDetail();
        } catch (err) {
            console.error("Error deactivating member:", err);
            alert("Gagal menonaktifkan anggota: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        );
    }

    if (error || !member) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-red-700">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle size={24} />
                        <h2 className="text-lg font-bold">Terjadi Kesalahan</h2>
                    </div>
                    <p>{error || "Data anggota tidak ditemukan"}</p>
                    <button
                        onClick={() => navigate('/admin/members')}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
                    >
                        Kembali ke Database
                    </button>
                </div>
            </div>
        );
    }

    const sections = [
        {
            title: 'Informasi Pribadi',
            icon: <User size={18} />,
            items: [
                { label: 'Nama Lengkap', value: member.full_name },
                { label: 'NIK', value: member.nik },
                { label: 'Nomor HP', value: member.phone },
                { label: 'NPP', value: member.no_npp || '-' },
            ]
        },
        {
            title: 'Pekerjaan',
            icon: <Briefcase size={18} />,
            items: [
                { label: 'Perusahaan', value: member.company || '-' },
                { label: 'Unit Kerja', value: member.work_unit || '-' },
                { label: 'Status Karyawan', value: member.employment_status || '-' },
            ]
        },
        {
            title: 'Alamat & Kontak Darurat',
            icon: <MapPin size={18} />,
            items: [
                { label: 'Alamat', value: member.address || '-' },
                { label: 'Kode Pos', value: member.postal_code || '-' },
                { label: 'Telepon Darurat', value: member.emergency_phone || '-' },
            ]
        },
        {
            title: 'Status & Administrasi',
            icon: <CreditCard size={18} />,
            items: [
                { label: 'Status Keanggotaan', value: member.status || 'Pending' },
                { label: 'Tanggal Daftar', value: new Date(member.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) },
            ]
        }
    ];

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/members')}
                        className="p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all text-gray-400 border border-gray-100 shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shadow-sm border border-blue-200">
                                {member.full_name?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tight">{member.full_name}</h2>
                                <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium italic tracking-tight">NPP: {member.no_npp || 'Belum diatur'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl font-black text-[10px] tracking-widest italic border shadow-sm ${member.status?.toLowerCase() === 'active' || member.status?.toLowerCase() === 'verified'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : member.status?.toLowerCase() === 'pasif'
                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                        : 'bg-red-100 text-red-700 border-red-200'
                    }`}>
                    Status: {member.status || 'Unknown'}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sections.map((section, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left">
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-blue-600">
                                    {section.icon}
                                    <h4 className="font-black text-[10px] tracking-widest italic uppercase">{section.title}</h4>
                                </div>
                                <div className="space-y-4">
                                    {section.items.map((item, i) => (
                                        <div key={i}>
                                            <label className="text-[10px] font-black text-gray-400 tracking-widest block mb-0.5">{item.label}</label>
                                            <p className="text-sm text-gray-800 font-bold capitalize italic">{item.value?.toLowerCase() || '-'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-blue-600">
                            <Calendar size={18} />
                            <h4 className="font-black text-[10px] tracking-widest italic uppercase">Dokumen Lampiran</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'KTP Member', field: 'ktp_file_path' },
                                { label: 'ID Card', field: 'id_card_file_path' },
                                { label: 'Pas Foto 3x4', field: 'photo_34_file_path' }
                            ].map((doc, i) => (
                                <div key={i} className="p-4 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center gap-3 bg-gray-50 transition-colors hover:bg-gray-100/50">
                                    <p className="text-[10px] font-black text-gray-500 tracking-widest uppercase">{doc.label}</p>
                                    {member[doc.field] ? (
                                        <div className="relative group overflow-hidden rounded-lg shadow-md border border-white">
                                            <img src={member[doc.field]} alt={doc.label} className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <a href={member[doc.field]} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Download className="text-white" size={20} />
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="h-32 flex flex-col items-center justify-center text-gray-300 italic border border-gray-200 w-full rounded-lg bg-white/50">
                                            <AlertCircle size={24} className="mb-1 opacity-20" />
                                            <span className="text-[10px] font-black">Tanpa File</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 text-left space-y-4 sticky top-6">
                        <h3 className="text-[10px] font-black text-gray-900 tracking-widest border-b pb-3 italic uppercase">Panel Administrasi</h3>

                        <div className="space-y-3">
                            {(member.status?.toLowerCase() === 'active' || member.status?.toLowerCase() === 'verified' || !member.status) && (
                                <>
                                    <button
                                        onClick={handleSetPassiveMember}
                                        disabled={isProcessing}
                                        className="w-full py-4 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-black text-xs tracking-widest hover:bg-amber-100 transition-all shadow-sm active:translate-y-0.5 disabled:opacity-50"
                                    >
                                        PASIFKAN ANGGOTA
                                    </button>
                                    <button
                                        onClick={handleDeactivateMember}
                                        disabled={isProcessing}
                                        className="w-full py-4 bg-red-50 text-red-700 border border-red-200 rounded-xl font-black text-xs tracking-widest hover:bg-red-100 transition-all shadow-sm active:translate-y-0.5 disabled:opacity-50"
                                    >
                                        NON-AKTIFKAN ANGGOTA
                                    </button>
                                </>
                            )}

                            {(member.status?.toLowerCase() === 'pasif') && (
                                <>
                                    <button
                                        onClick={handleActivateMember}
                                        disabled={isProcessing}
                                        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:translate-y-0.5 disabled:opacity-50"
                                    >
                                        AKTIFKAN KEMBALI
                                    </button>
                                    <button
                                        onClick={handleDeactivateMember}
                                        disabled={isProcessing}
                                        className="w-full py-4 bg-red-50 text-red-700 border border-red-200 rounded-xl font-black text-xs tracking-widest hover:bg-red-100 transition-all shadow-sm active:translate-y-0.5 disabled:opacity-50"
                                    >
                                        NON-AKTIFKAN ANGGOTA
                                    </button>
                                </>
                            )}

                            {(member.status?.toLowerCase() === 'non_active' || member.status?.toLowerCase() === 'nonaktif') && (
                                <button
                                    onClick={handleActivateMember}
                                    disabled={isProcessing}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:translate-y-0.5 disabled:opacity-50"
                                >
                                    AKTIFKAN KEMBALI
                                </button>
                            )}
                        </div>

                        <div className="pt-4 mt-4 border-t border-gray-50 flex flex-col gap-3">
                            <button
                                onClick={() => navigate(`/admin/monitor-simpanan/${member.id}`)}
                                className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl font-black text-[10px] tracking-widest hover:bg-gray-100 transition-all border border-gray-100 uppercase"
                            >
                                Lihat Simpanan
                            </button>
                            <button
                                onClick={() => navigate('/admin/members')}
                                className="w-full py-3 bg-white text-gray-400 rounded-xl font-bold text-[10px] tracking-widest hover:text-gray-600 transition-all uppercase"
                            >
                                Kembali ke Database
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-600/5 rounded-2xl p-6 text-left border border-blue-600/10">
                        <h4 className="text-[10px] font-black text-blue-800 tracking-widest mb-3 italic uppercase">Catatan Admin</h4>
                        <ul className="space-y-3">
                            <li className="flex gap-2 text-[10px] font-bold text-blue-700 leading-tight italic">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5 shrink-0" />
                                Perubahan status akan langsung berdampak pada akses anggota di aplikasi.
                            </li>
                            <li className="flex gap-2 text-[10px] font-bold text-blue-700 leading-tight italic">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5 shrink-0" />
                                Penonaktifan anggota secara otomatis masuk ke antrean realisasi.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {isProcessing && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                </div>
            )}
        </div>
    );
};

export default MemberDetail;
