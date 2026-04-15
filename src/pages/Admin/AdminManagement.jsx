import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Users,
    Search,
    ShieldCheck,
    ShieldAlert,
    UserMinus,
    Loader2,
    Plus,
    X,
    Lock,
    Key
} from 'lucide-react';
import bcrypt from 'bcryptjs';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Password Modal State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [newManualPassword, setNewManualPassword] = useState('');

    // Auth context (Superadmin check)
    const currentUser = JSON.parse(localStorage.getItem('auth_user'));
    const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

    useEffect(() => {
        if (isSuperAdmin) {
            fetchAdmins();
        }
    }, []);

    useEffect(() => {
        if (isAddModalOpen && isSuperAdmin) {
            fetchInitialMembers();
        }
    }, [isAddModalOpen]);

    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-red-100">
                    <ShieldAlert size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 italic uppercase tracking-tight">Akses Terbatas</h2>
                <p className="text-sm text-gray-500 mt-2 font-medium italic max-w-md">Hanya akun dengan role <span className="text-indigo-600 font-black">SUPERADMIN</span> yang memiliki otorisasi untuk mengelola user dan hak akses sistem.</p>
                <button 
                    onClick={() => window.history.back()}
                    className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                >
                    Kembali
                </button>
            </div>
        );
    }

    const fetchInitialMembers = async () => {
        try {
            setSearching(true);
            const { data, error } = await supabase
                .from('personal_data')
                .select('id, full_name, no_anggota, user_id, status')
                .eq('status', 'AKTIF')
                .limit(20); // Fetch more to allow for filtering

            if (error) throw error;
            
            // Filter out those who are already admins
            const currentAdminIds = admins.map(a => a.id);
            const filtered = (data || []).filter(m => !currentAdminIds.includes(m.user_id));
            
            setSearchResults(filtered.slice(0, 5)); // Show top 5 eligible
        } catch (err) {
            console.error('Error fetching members:', err);
        } finally {
            setSearching(false);
        }
    };

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            // Fetch users with ADMIN or SUPERADMIN roles joined with personal_data
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id,
                    role,
                    personal_data!fk_personal_data_users (
                        full_name,
                        no_anggota,
                        no_npp,
                        work_unit,
                        status
                    )
                `)
                .in('role', ['ADMIN', 'SUPERADMIN']);

            if (error) throw error;
            setAdmins(data || []);
        } catch (err) {
            console.error('Error fetching admins:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchMembers = async (e) => {
        e.preventDefault();
        if (!memberSearch.trim()) return;

        try {
            setSearching(true);
            const { data, error } = await supabase
                .from('personal_data')
                .select('id, full_name, no_anggota, user_id, status')
                .or(`full_name.ilike.%${memberSearch}%,no_anggota.ilike.%${memberSearch}%`)
                .limit(10);

            if (error) throw error;

            // Filter out those who are already admins
            const currentAdminIds = admins.map(a => a.id);
            const filtered = (data || []).filter(m => !currentAdminIds.includes(m.user_id));

            setSearchResults(filtered);
        } catch (err) {
            console.error('Error searching members:', err);
        } finally {
            setSearching(false);
        }
    };

    const handlePromoteToAdmin = async (member) => {
        if (!member.user_id) {
            alert('Member ini tidak memiliki data user (ID login).');
            return;
        }

        if (!window.confirm(`Jadikan ${member.full_name} sebagai Administrator?`)) return;

        try {
            setIsProcessing(true);
            const { error } = await supabase
                .from('users')
                .update({ role: 'ADMIN' })
                .eq('id', member.user_id);

            if (error) throw error;

            alert('Berhasil mengangkat admin baru!');
            setIsAddModalOpen(false);
            setMemberSearch('');
            setSearchResults([]);
            fetchAdmins();
        } catch (err) {
            console.error('Error promoting member:', err);
            alert('Gagal mengangkat admin: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleChangeRole = async (userId, newRole) => {
        if (!isSuperAdmin) {
            alert('Hanya Superadmin yang bisa mengubah role ini.');
            return;
        }

        if (!window.confirm(`Ubah role menjadi ${newRole}?`)) return;

        try {
            setIsProcessing(true);
            const { error } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;
            fetchAdmins();
        } catch (err) {
            alert('Gagal mengubah role: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRevokeAccess = async (userId, memberName) => {
        if (!isSuperAdmin) {
            alert('Hanya Superadmin yang bisa mencabut akses admin.');
            return;
        }

        if (userId === currentUser.id) {
            alert('Anda tidak bisa mencabut akses Anda sendiri.');
            return;
        }

        if (!window.confirm(`Cabut akses Admin dari ${memberName || 'Sistem Admin'}? Anggota ini akan kembali menjadi MEMBER biasa.`)) return;

        try {
            setIsProcessing(true);
            const { error } = await supabase
                .from('users')
                .update({ role: 'MEMBER' })
                .eq('id', userId);

            if (error) throw error;
            fetchAdmins();
        } catch (err) {
            alert('Gagal mencabut akses: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleResetPassword = async (userId, memberNo, memberName) => {
        if (!memberNo) {
            alert('Admin ini tidak memiliki Nomor Anggota. Silakan gunakan fitur Ubah Password Manual di halaman Detail Anggota.');
            return;
        }

        if (!window.confirm(`Reset password ${memberName || 'Sistem Admin'} ke Nomor Anggota (${memberNo})?`)) return;

        try {
            setIsProcessing(true);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(memberNo, salt);

            const { error } = await supabase
                .from('users')
                .update({ password: hashedPassword })
                .eq('id', userId);

            if (error) throw error;
            alert('Password berhasil di-reset!');
        } catch (err) {
            alert('Gagal reset password: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOpenPasswordModal = (admin) => {
        setSelectedAdmin(admin);
        setNewManualPassword('');
        setIsPasswordModalOpen(true);
    };

    const handleManualChangePassword = async (e) => {
        e.preventDefault();
        if (!newManualPassword.trim() || !selectedAdmin) return;

        try {
            setIsProcessing(true);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newManualPassword, salt);

            const { error } = await supabase
                .from('users')
                .update({ password: hashedPassword })
                .eq('id', selectedAdmin.id);

            if (error) throw error;
            alert('Password berhasil diubah secara manual!');
            setIsPasswordModalOpen(false);
        } catch (err) {
            alert('Gagal mengubah password: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tight uppercase">Manajemen User & Admin</h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium italic">Kelola otorisasi dan hak akses sistem koperasi</p>
                </div>
                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN') && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs tracking-widest transition-all shadow-lg shadow-blue-200 active:scale-95 italic uppercase"
                    >
                        <Plus size={18} /> Tambah Admin Baru
                    </button>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest">Total Admin</p>
                        <h4 className="text-xl font-black text-gray-900 italic">{admins.length} User</h4>
                    </div>
                </div>
            </div>

            {/* Admin Table Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Users size={18} className="text-blue-600" />
                        <h3 className="font-black text-xs tracking-widest text-gray-400 uppercase italic">Daftar Administrator</h3>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari admin..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 w-64 italic"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 font-black text-gray-400 text-[10px] tracking-widest italic uppercase">User / NPP</th>
                                <th className="px-6 py-4 font-black text-gray-400 text-[10px] tracking-widest italic uppercase">Unit Kerja</th>
                                <th className="px-6 py-4 font-black text-gray-400 text-[10px] tracking-widest italic uppercase text-center">Role</th>
                                <th className="px-6 py-4 font-black text-gray-400 text-[10px] tracking-widest italic uppercase text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={32} />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Memuat data...</p>
                                    </td>
                                </tr>
                            ) : admins.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Tidak ada administrator</p>
                                    </td>
                                </tr>
                            ) : admins.filter(a => {
                                if (!searchQuery) return true;
                                const search = searchQuery.toLowerCase();
                                return (
                                    a.personal_data?.full_name?.toLowerCase().includes(search) ||
                                    a.personal_data?.no_anggota?.toLowerCase().includes(search) ||
                                    a.role?.toLowerCase().includes(search)
                                );
                            }).map((admin) => (
                                <tr key={admin.id} className="hover:bg-blue-50/20 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-sm ${admin.role === 'SUPERADMIN' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                                                {admin.personal_data?.full_name?.charAt(0) || <ShieldCheck size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                                                    {admin.personal_data?.full_name || 'Administrator System'}
                                                    {admin.id === currentUser.id && <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded italic">ANDA</span>}
                                                </p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase italic">
                                                    {admin.personal_data?.no_anggota ? `No. ${admin.personal_data.no_anggota}` : `ID: ${admin.id.substring(0, 8)}...`}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-xs font-bold text-gray-600 uppercase italic leading-tight">{admin.personal_data?.work_unit || 'SYSTEM'}</p>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black tracking-widest italic border transition-all ${admin.role === 'SUPERADMIN'
                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm'
                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}>
                                            {admin.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-end items-center gap-2">
                                            {isSuperAdmin && admin.id !== currentUser.id && (
                                                <>
                                                    {admin.role === 'ADMIN' ? (
                                                        <button
                                                            onClick={() => handleChangeRole(admin.id, 'SUPERADMIN')}
                                                            className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                            title="Promosikan ke Superadmin"
                                                        >
                                                            <ShieldCheck size={18} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleChangeRole(admin.id, 'ADMIN')}
                                                            className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                            title="Turunkan ke Admin Biasa"
                                                        >
                                                            <ShieldAlert size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRevokeAccess(admin.id, admin.personal_data.full_name)}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Cabut Akses Admin"
                                                    >
                                                        <UserMinus size={18} />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleResetPassword(admin.id, admin.personal_data?.no_anggota, admin.personal_data?.full_name)}
                                                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                                                title="Reset Password ke No. Anggota"
                                            >
                                                <Key size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenPasswordModal(admin)}
                                                className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                title="Ubah Password Manual"
                                            >
                                                <Lock size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD ADMIN MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                        <div className="bg-blue-900 p-6 text-white relative">
                            <button
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setSearchResults([]);
                                    setMemberSearch('');
                                }}
                                className="absolute top-6 right-6 text-blue-200 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <h3 className="text-xl font-black italic uppercase tracking-tight leading-none">Angkat Admin Baru</h3>
                            <p className="text-blue-300 text-[10px] mt-2 font-black italic uppercase tracking-widest">Cari anggota untuk diberikan akses administrasi</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <form onSubmit={handleSearchMembers} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Cari Nama atau Nomor Anggota</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            required
                                            type="text"
                                            value={memberSearch}
                                            onChange={(e) => setMemberSearch(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none font-bold italic"
                                            placeholder="Gunakan Nama Lengkap atau No. Anggota..."
                                        />
                                    </div>
                                </div>
                                <button
                                    disabled={searching}
                                    className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {searching ? <Loader2 className="animate-spin" /> : 'Mulai Pencarian'}
                                </button>
                            </form>

                            {searchResults.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Hasil Pencarian:</p>
                                    <div className="divide-y divide-gray-50 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                        {searchResults.map(result => (
                                            <div key={result.id} className="p-4 flex items-center justify-between group hover:bg-white transition-all">
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 italic tracking-tight">{result.full_name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase italic tracking-tighter">No. {result.no_anggota} | {result.status}</p>
                                                </div>
                                                <button
                                                    onClick={() => handlePromoteToAdmin(result)}
                                                    className="px-4 py-2 bg-white text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-blue-100 shadow-sm hover:bg-blue-600 hover:text-white transition-all"
                                                >
                                                    JADIKAN ADMIN
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {searchResults.length === 0 && memberSearch && !searching && (
                                <div className="p-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Tidak ada anggota yang ditemukan</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isProcessing && (
                <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                </div>
            )}
            {/* MANUAL PASSWORD MODAL */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                        <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-black italic uppercase text-xs tracking-widest leading-none">Ubah Password Manual</h3>
                                <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Admin: {selectedAdmin?.personal_data?.full_name || 'System User'}</p>
                            </div>
                            <button onClick={() => setIsPasswordModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleManualChangePassword} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 italic">Password Baru</label>
                                <input
                                    required
                                    autoFocus
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
                                className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                            >
                                Simpan Password Baru
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
