import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Eye, X, CheckCircle, AlertCircle, User, MapPin, Building, Briefcase, Mail, Phone, FileText } from 'lucide-react';

const PengajuanAnggota = () => {
    const [pendingMembers, setPendingMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPendingMembers();
    }, []);

    const fetchPendingMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('personal_data')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPendingMembers(data || []);
        } catch (error) {
            console.error('Error fetching pending members:', error);
            alert('Gagal memuat data pengajuan anggota');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = async (member) => {
        // Fetch user data untuk mendapatkan email jika ada
        let userData = null;
        if (member.user_id) {
            const { data } = await supabase
                .from('users')
                .select('*')
                .eq('id', member.user_id)
                .single();
            userData = data;
        }

        setSelectedMember({ ...member, userData });
        setIsDetailModalOpen(true);
    };

    const handleToggleStatus = async () => {
        if (!selectedMember) return;

        try {
            const { error } = await supabase
                .from('personal_data')
                .update({ status: 'active' })
                .eq('id', selectedMember.id);

            if (error) throw error;

            // Update local state
            setPendingMembers(prev => prev.filter(m => m.id !== selectedMember.id));
            setIsDetailModalOpen(false);
            setSelectedMember(null);
            alert('Status anggota berhasil diubah menjadi aktif!');
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Gagal mengubah status anggota');
        }
    };

    const filteredMembers = pendingMembers.filter(member =>
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.nik?.includes(searchTerm) ||
        member.phone?.includes(searchTerm)
    );

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Pengajuan Anggota</h2>
                    <p className="text-sm text-gray-500 mt-1">Kelola pengajuan anggota yang menunggu persetujuan</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari nama, NIK, atau telepon..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Memuat data...</p>
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <AlertCircle className="mx-auto text-gray-400" size={48} />
                    <p className="mt-4 text-gray-500 font-medium">Tidak ada pengajuan anggota yang menunggu</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600">Nama Lengkap</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">NIK</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">No. Telepon</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Perusahaan</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Tanggal Pengajuan</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredMembers.map((member) => (
                                <tr
                                    key={member.id}
                                    onClick={() => handleRowClick(member)}
                                    className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                                                {member.full_name?.charAt(0) || '?'}
                                            </div>
                                            <span className="font-medium text-gray-900">{member.full_name || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">{member.nik || '-'}</td>
                                    <td className="px-6 py-4 text-gray-700">{member.phone || '-'}</td>
                                    <td className="px-6 py-4 text-gray-700">{member.company || '-'}</td>
                                    <td className="px-6 py-4 text-gray-700">{formatDate(member.created_at)}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRowClick(member);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                        >
                                            <Eye size={16} />
                                            <span className="text-sm font-medium">Lihat Detail</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail Modal */}
            {isDetailModalOpen && selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="bg-emerald-600 p-6 text-white relative">
                            <button
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    setSelectedMember(null);
                                }}
                                className="absolute top-6 right-6 text-emerald-100 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-2xl font-bold">Detail Pengajuan Anggota</h2>
                            <p className="text-emerald-100 text-sm mt-1">Review data lengkap sebelum menyetujui</p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Data Pribadi */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <User size={20} className="text-emerald-600" />
                                    Data Pribadi
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Nama Lengkap</label>
                                        <p className="text-gray-900 font-medium mt-1">{selectedMember.full_name || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">NIK</label>
                                        <p className="text-gray-900 font-medium mt-1">{selectedMember.nik || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">No. Telepon</label>
                                        <p className="text-gray-900 font-medium mt-1">{selectedMember.phone || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">No. Telepon Darurat</label>
                                        <p className="text-gray-900 font-medium mt-1">{selectedMember.emergency_phone || '-'}</p>
                                    </div>
                                    {selectedMember.userData?.password && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Email</label>
                                            <p className="text-gray-900 font-medium mt-1">{selectedMember.userData.email || '-'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Data Perusahaan */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Building size={20} className="text-emerald-600" />
                                    Data Perusahaan
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Perusahaan</label>
                                        <p className="text-gray-900 font-medium mt-1">{selectedMember.company || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Unit Kerja</label>
                                        <p className="text-gray-900 font-medium mt-1">{selectedMember.work_unit || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Status Pegawai</label>
                                        <p className="text-gray-900 font-medium mt-1">{selectedMember.employment_status || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Alamat */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <MapPin size={20} className="text-emerald-600" />
                                    Alamat
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Alamat Lengkap</label>
                                        <p className="text-gray-900 mt-1">{selectedMember.address || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Kode Pos</label>
                                        <p className="text-gray-900 font-medium mt-1">{selectedMember.postal_code || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Dokumen */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <FileText size={20} className="text-emerald-600" />
                                    Dokumen
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {selectedMember.ktp_file_path && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-2 block">KTP</label>
                                            <div className="mt-2">
                                                <img
                                                    src={selectedMember.ktp_file_path}
                                                    alt="KTP"
                                                    className="w-full max-w-md border border-gray-200 rounded-lg shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {selectedMember.id_card_file_path && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-2 block">ID Card Pegawai</label>
                                            <div className="mt-2">
                                                <img
                                                    src={selectedMember.id_card_file_path}
                                                    alt="ID Card Pegawai"
                                                    className="w-full max-w-md border border-gray-200 rounded-lg shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {selectedMember.photo_34_file_path && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-2 block">Foto 3x4</label>
                                            <div className="mt-2">
                                                <img
                                                    src={selectedMember.photo_34_file_path}
                                                    alt="Foto 3x4"
                                                    className="w-full max-w-md border border-gray-200 rounded-lg shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {selectedMember.signature_image && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-2 block">Tanda Tangan</label>
                                            <div className="mt-2">
                                                <img
                                                    src={selectedMember.signature_image}
                                                    alt="Tanda Tangan"
                                                    className="w-full max-w-md border border-gray-200 rounded-lg shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer dengan Toggle */}
                        <div className="p-6 bg-gray-50 border-t border-gray-200">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`px-4 py-2 rounded-lg ${selectedMember.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        <span className="text-sm font-medium">Status: {selectedMember.status === 'pending' ? 'Menunggu Persetujuan' : 'Aktif'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-700">Geser untuk Aktifkan:</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedMember.status === 'active'}
                                                onChange={handleToggleStatus}
                                                className="sr-only peer"
                                            />
                                            <div className="w-16 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-emerald-600"></div>
                                        </label>
                                    </div>
                                    <button
                                        onClick={handleToggleStatus}
                                        disabled={selectedMember.status === 'active'}
                                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircle size={20} />
                                        Setujui & Aktifkan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PengajuanAnggota;

