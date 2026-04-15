import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import bcrypt from 'bcryptjs';
import {
    User,
    Briefcase,
    MapPin,
    CreditCard,
    TrendingUp,
    Calendar,
    Loader2,
    ChevronLeft,
    AlertCircle,
    Download,
    Lock,
    Key,
    ShieldCheck,
    ShieldAlert
} from 'lucide-react';

const MemberDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [loans, setLoans] = useState([]);
    const [savingsSummary, setSavingsSummary] = useState({ total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [newManualPassword, setNewManualPassword] = useState('');

    const currentUser = JSON.parse(localStorage.getItem('auth_user'));
    const isSuperAdmin = currentUser?.role === 'SUPERADMIN';
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        if (id) {
            fetchMemberDetail();
            fetchUserRole();
        }
    }, [id]);

    const fetchUserRole = async () => {
        try {
            const { data: member } = await supabase
                .from('personal_data')
                .select('user_id')
                .eq('id', id)
                .single();
            
            if (member?.user_id) {
                const { data: user } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', member.user_id)
                    .single();
                setUserRole(user?.role);
            }
        } catch (err) {
            console.error("Error fetching user role:", err);
        }
    };

    const fetchMemberDetail = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch Personal Data
            const { data: memberData, error: memberError } = await supabase
                .from('personal_data')
                .select('*')
                .eq('id', id)
                .single();

            if (memberError) throw memberError;
            if (!memberData) throw new Error("Anggota tidak ditemukan.");
            setMember(memberData);

            // 2. Fetch Active Loans
            const { data: loanData } = await supabase
                .from('loans')
                .select('*')
                .eq('personal_data_id', id)
                .order('created_at', { ascending: false });
            setLoans(loanData || []);

            // 3. Fetch Savings Summary (Calculated)
            const { data: savingsData } = await supabase
                .from('simpanan')
                .select('amount, transaction_type')
                .eq('personal_data_id', id)
                .eq('status', 'PAID');
            
            let total = 0;
            if (savingsData) {
                total = savingsData.reduce((acc, curr) => {
                    const amt = parseFloat(curr.amount || 0);
                    return curr.transaction_type === 'TARIK' ? acc - amt : acc + amt;
                }, 0);
            }
            setSavingsSummary({ total });

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
                    status: 'AKTIF',
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
                    status: 'KELUAR',
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

    const handleResetPassword = async () => {
        if (!window.confirm(`Apakah Anda yakin ingin RESET PASSWORD anggota ${member.full_name}?\n\nPassword akan dikembalikan ke Nomor Anggota (${member.no_anggota}).`)) return;
        
        try {
            setIsProcessing(true);
            
            // 1. Hash the no_anggota
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(member.no_anggota, salt);

            // 2. Update users table
            const { error } = await supabase
                .from('users')
                .update({ password: hashedPassword })
                .eq('id', member.user_id);

            if (error) throw error;
            alert('Password berhasil di-reset ke Nomor Anggota!');
        } catch (err) {
            console.error("Error resetting password:", err);
            alert("Gagal reset password: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualChangePassword = async (e) => {
        e.preventDefault();
        if (!newManualPassword.trim()) return;
        
        try {
            setIsProcessing(true);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newManualPassword, salt);

            const { error } = await supabase
                .from('users')
                .update({ password: hashedPassword })
                .eq('id', member.user_id);

            if (error) throw error;
            alert('Password berhasil diubah secara manual!');
            setIsPasswordModalOpen(false);
            setNewManualPassword('');
        } catch (err) {
            alert("Gagal mengubah password: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleToggleAdmin = async () => {
        if (!isSuperAdmin) return;
        const targetRole = userRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
        if (!window.confirm(`Ubah hak akses ${member.full_name} menjadi ${targetRole}?`)) return;

        try {
            setIsProcessing(true);
            const { error } = await supabase
                .from('users')
                .update({ role: targetRole })
                .eq('id', member.user_id);

            if (error) throw error;
            alert(`Berhasil mengubah hak akses menjadi ${targetRole}!`);
            fetchUserRole();
        } catch (err) {
            alert("Gagal mengubah hak akses: " + err.message);
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
            {/* Minimalist Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/members')}
                        className="p-2.5 bg-white hover:bg-gray-50 rounded-xl transition-all text-gray-400 border border-gray-100 shadow-sm"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                            {member.full_name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 italic tracking-tight leading-none">{member.full_name}</h2>
                            <p className="text-[10px] text-gray-400 mt-1 font-black italic tracking-widest uppercase opacity-70">NPP: {member.no_npp || 'BELUM DIATUR'}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`px-4 py-2 rounded-xl font-black text-[10px] tracking-widest italic border shadow-sm ${member.status === 'AKTIF'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : member.status === 'PASIF'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                        STATUS: {member.status || 'UNKNOWN'}
                    </div>
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
                                        <th className="px-6 py-3 font-black text-gray-400 text-[9px] tracking-widest italic uppercase border-r border-gray-50">Nomor Anggota</th>
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
                                            <span className={`inline-flex px-3 py-1 rounded text-[9px] font-black tracking-widest italic transition-all uppercase ${member.status === 'AKTIF'
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : member.status === 'PASIF'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    : 'bg-red-600 text-white shadow-sm'
                                                }`}>
                                                {member.status || 'UNKNOWN'}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>



                    {/* Active Loans Card */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-left">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp size={16} className="text-blue-600" />
                            <h4 className="font-black text-[11px] tracking-[0.2em] text-gray-400 uppercase italic">Daftar Pinjaman Berjalan</h4>
                        </div>
                        <div className="overflow-x-auto min-h-[100px]">
                            {loans.length === 0 ? (
                                <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
                                    <p className="text-[10px] font-black text-gray-400 italic uppercase tracking-widest">Belum ada riwayat pinjaman</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-3 font-black text-gray-400 text-[9px] tracking-widest italic uppercase border-b border-gray-100">No. Pinjaman</th>
                                            <th className="px-4 py-3 font-black text-gray-400 text-[9px] tracking-widest italic uppercase border-b border-gray-100">Kategori</th>
                                            <th className="px-4 py-3 font-black text-gray-400 text-[9px] tracking-widest italic uppercase border-b border-gray-100 text-right">Nominal</th>
                                            <th className="px-4 py-3 font-black text-gray-400 text-[9px] tracking-widest italic uppercase border-b border-gray-100 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loans.slice(0, 5).map((loan) => (
                                            <tr key={loan.id} className="hover:bg-gray-50/50 transition-all cursor-pointer group" onClick={() => navigate(`/admin/loans/${loan.id}`)}>
                                                <td className="px-4 py-3">
                                                    <p className="text-xs font-black text-gray-700 italic group-hover:text-blue-600 transition-colors uppercase leading-none">{loan.no_pinjaman}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase italic leading-none">{new Date(loan.created_at).toLocaleDateString('id-ID')}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[10px] font-bold text-gray-600 italic uppercase">{loan.kategori || 'BIASA'}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <p className="text-xs font-black text-gray-900 italic tracking-tighter">Rp {parseFloat(loan.jumlah_pinjaman).toLocaleString('id-ID')}</p>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black tracking-widest italic transition-all uppercase ${
                                                        loan.status === 'DICAIRKAN' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                        loan.status === 'DITOLAK' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                        'bg-amber-50 text-amber-700 border border-amber-100'
                                                    }`}>
                                                        {loan.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Personal Information Card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left">
                        <div className="flex items-center gap-2 mb-4">
                            <User size={15} className="text-blue-600" />
                            <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Profil & Identitas</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-0.5 block">Nama Lengkap</label>
                                <p className="text-sm font-bold text-gray-900 italic uppercase">{member.full_name}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-0.5 block">NIK / No. HP</label>
                                <p className="text-sm font-bold text-gray-900">{member.nik} / {member.phone}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-0.5 block">Email</label>
                                <p className="text-sm font-bold text-gray-900 italic">{member.userData?.email || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Work & Address Information Card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-gray-50">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Briefcase size={15} className="text-blue-600" />
                                    <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Pekerjaan</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-0.5">Unit Kerja / Perusahaan</label>
                                        <p className="text-sm font-bold text-gray-900 uppercase italic">{member.work_unit || '-'} / {member.company || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-0.5">Status</label>
                                        <p className="text-sm font-bold text-gray-900 uppercase italic text-xs">{member.employment_status || '-'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="pl-8 space-y-4">
                                <div className="flex items-center gap-2">
                                    <MapPin size={15} className="text-blue-600" />
                                    <h4 className="font-black text-[10px] tracking-widest text-gray-400 uppercase italic">Alamat & Kontak</h4>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-0.5">Alamat KTP</label>
                                        <p className="text-[11px] font-bold text-gray-900 uppercase italic leading-tight">{member.address || '-'}</p>
                                    </div>
                                    <div className="flex gap-6">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-0.5">Kode Pos</label>
                                            <p className="text-xs font-bold text-gray-900 italic">{member.postal_code || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 tracking-widest uppercase block mb-0.5">Emergency</label>
                                            <p className="text-xs font-bold text-gray-900 italic">{member.emergency_phone || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Compact Documents Card */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-left">
                        <div className="flex items-center gap-2 mb-6">
                            <Calendar size={16} className="text-blue-600" />
                            <h4 className="font-black text-[11px] tracking-[0.2em] text-gray-400 uppercase italic">Dokumen Lampiran</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {[
                                { label: 'KTP', field: 'ktp_file_path' },
                                { label: 'ID Card', field: 'id_card_file_path' },
                                { label: 'Pas Foto', field: 'photo_34_file_path' }
                            ].map((doc, i) => (
                                <div key={i} className="group relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:border-blue-200 transition-all p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase bg-white px-2 py-1 rounded-md border border-gray-100">{doc.label}</span>
                                        {member[doc.field] && <Download size={12} className="text-blue-400" />}
                                    </div>
                                    {member[doc.field] ? (
                                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-inner bg-white">
                                            <img src={member[doc.field]} alt={doc.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            <a href={member[doc.field]} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                                                <div className="bg-white p-2 rounded-full shadow-lg">
                                                    <Download className="text-blue-600" size={16} />
                                                </div>
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="aspect-[4/3] flex flex-col items-center justify-center text-gray-300 italic rounded-xl bg-white border border-dashed border-gray-200">
                                            <AlertCircle size={20} className="mb-1 opacity-20" />
                                            <span className="text-[9px] font-black tracking-widest">NO FILE</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Integrated Sidebar Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden sticky top-6">
                        <div className="p-1 px-8 pt-8 pb-4">
                            <h3 className="text-[11px] font-black text-gray-900 tracking-[0.2em] italic uppercase mb-2">Administrasi</h3>
                            <div className="h-px bg-gray-50 mb-6" />
                        </div>

                        <div className="px-8 pb-8 space-y-4">
                            <div className="space-y-3">
                                {(member.status === 'AKTIF' || !member.status) && (
                                    <>
                                        <button
                                            onClick={handleSetPassiveMember}
                                            disabled={isProcessing}
                                            className="w-full py-4 bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl font-black text-xs tracking-widest hover:bg-amber-100 transition-all active:translate-y-0.5 disabled:opacity-50 italic"
                                        >
                                            PASIFKAN ANGGOTA
                                        </button>
                                        <button
                                            onClick={handleDeactivateMember}
                                            disabled={isProcessing}
                                            className="w-full py-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl font-black text-xs tracking-widest hover:bg-red-100 transition-all active:translate-y-0.5 disabled:opacity-50 italic"
                                        >
                                            KELUAR ANGGOTA
                                        </button>
                                    </>
                                )}

                                {(member.status === 'PASIF') && (
                                    <>
                                        <button
                                            onClick={handleActivateMember}
                                            disabled={isProcessing}
                                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:translate-y-0.5 disabled:opacity-50 italic"
                                        >
                                            AKTIFKAN KEMBALI
                                        </button>
                                        <button
                                            onClick={handleDeactivateMember}
                                            disabled={isProcessing}
                                            className="w-full py-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl font-black text-xs tracking-widest hover:bg-red-100 transition-all active:translate-y-0.5 disabled:opacity-50 italic"
                                        >
                                            KELUAR ANGGOTA
                                        </button>
                                    </>
                                )}

                                {(member.status === 'KELUAR') && (
                                    <button
                                        onClick={handleActivateMember}
                                        disabled={isProcessing}
                                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:translate-y-0.5 disabled:opacity-50 italic"
                                    >
                                        AKTIFKAN KEMBALI
                                    </button>
                                )}

                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Keamanan & Akses</p>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handleResetPassword}
                                            disabled={isProcessing}
                                            className="w-full py-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl font-black text-[10px] tracking-widest hover:bg-blue-100 transition-all uppercase italic"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={() => setIsPasswordModalOpen(true)}
                                            disabled={isProcessing}
                                            className="w-full py-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl font-black text-[10px] tracking-widest hover:bg-indigo-100 transition-all uppercase italic flex items-center justify-center gap-2"
                                        >
                                            <Lock size={12} /> Ubah PWD
                                        </button>
                                    </div>

                                    {isSuperAdmin && member.user_id && (
                                        <button
                                            onClick={handleToggleAdmin}
                                            disabled={isProcessing}
                                            className={`w-full py-3 rounded-xl font-black text-[10px] tracking-widest uppercase italic transition-all border flex items-center justify-center gap-2 ${
                                                userRole === 'ADMIN' || userRole === 'SUPERADMIN' 
                                                ? 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100' 
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                            }`}
                                        >
                                            {userRole === 'ADMIN' || userRole === 'SUPERADMIN' ? (
                                                <><ShieldAlert size={14} /> Cabut Admin</>
                                            ) : (
                                                <><ShieldCheck size={14} /> Jadikan Admin</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 pt-6">
                                <button
                                    onClick={() => navigate(`/admin/monitor-simpanan/${member.id}`)}
                                    className="w-full py-3 bg-gray-50 text-gray-600 rounded-2xl font-black text-[10px] tracking-widest hover:bg-gray-100 transition-all border border-gray-100 uppercase italic flex items-center justify-center gap-2"
                                >
                                    <CreditCard size={14} />
                                    Lihat Simpanan
                                </button>
                                <button
                                    onClick={() => navigate('/admin/members')}
                                    className="w-full py-3 bg-white text-gray-400 rounded-2xl font-black text-[10px] tracking-widest hover:text-gray-600 transition-all uppercase italic"
                                >
                                    Tutup Detail
                                </button>
                            </div>
                        </div>

                        {/* Integrated Admin Notes */}
                        <div className="bg-blue-600 px-8 py-6 text-white overflow-hidden relative">
                            <h4 className="text-[10px] font-black tracking-widest mb-4 italic uppercase opacity-80">Catatan Admin</h4>
                            <div className="space-y-3 relative z-10">
                                <div className="flex gap-2">
                                    <div className="w-1 h-1 rounded-full bg-white mt-1 shrink-0 opacity-50" />
                                    <p className="text-[10px] font-bold leading-tight italic opacity-90">Perubahan status berdampak langsung pada akses aplikasi.</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-1 h-1 rounded-full bg-white mt-1 shrink-0 opacity-50" />
                                    <p className="text-[10px] font-bold leading-tight italic opacity-90">Anggota keluar otomatis masuk antrean realisasi.</p>
                                </div>
                            </div>
                            {/* Decorative background circle */}
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                        </div>
                    </div>
                </div>
            </div>

            {isProcessing && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                </div>
            )}
            {/* Password Management Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                        <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
                            <h3 className="font-black italic uppercase text-xs tracking-widest">Ubah Password Manual</h3>
                            <button onClick={() => setIsPasswordModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleManualChangePassword} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 italic">Password Baru</label>
                                <input
                                    required
                                    type="text"
                                    value={newManualPassword}
                                    onChange={(e) => setNewManualPassword(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold italic"
                                    placeholder="Masukkan password baru..."
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all"
                            >
                                Simpan Password
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberDetail;
