import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, X, User, Phone, Briefcase, MapPin, CreditCard, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const MemberDetailModal = ({ member, onClose }) => {
    if (!member) return null;

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
                { label: 'Status Keanggotaan', value: member.status?.toUpperCase() || 'PENDING' },
                { label: 'Tanggal Daftar', value: new Date(member.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                            {member.full_name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{member.full_name}</h3>
                            <p className="text-sm text-gray-500">NPP: {member.no_npp || 'Belum diatur'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sections.map((section, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-blue-600">
                                    {section.icon}
                                    <h4 className="font-bold uppercase text-xs tracking-wider">{section.title}</h4>
                                </div>
                                <div className="space-y-3">
                                    {section.items.map((item, i) => (
                                        <div key={i}>
                                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">{item.label}</p>
                                            <p className="text-sm text-gray-800 font-medium capitalize">{item.value?.toLowerCase() || '-'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-blue-600">
                            <Calendar size={18} />
                            <h4 className="font-bold uppercase text-xs tracking-wider">Dokumen</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {['ktp_file_path', 'id_card_file_path', 'photo_34_file_path'].map((field, i) => (
                                <div key={i} className="p-4 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 bg-gray-50">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">{field.replace(/_/g, ' ')}</p>
                                    <span className="text-xs text-gray-400 italic">No Preview Available</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Tutup
                    </button>
                    {member.status === 'pending' && (
                        <button className="px-6 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-colors">
                            Verifikasi Sekarang
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const MemberList = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const { data, error } = await supabase
                    .from('personal_data')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setMembers(data || []);
            } catch (err) {
                console.error("Error fetching members:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, []);

    const filteredMembers = members.filter(m =>
        m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.no_npp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.nik?.includes(searchTerm)
    );

    const handleRowClick = (member) => {
        setSelectedMember(member);
        setIsModalOpen(true);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Data Anggota</h2>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari anggota..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">NPP</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Nama Lengkap</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">NIK</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Perusahaan</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map((member) => (
                                    <tr
                                        key={member.id}
                                        onClick={() => handleRowClick(member)}
                                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.no_npp || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                                    {member.full_name?.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-700 text-sm">{member.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-gray-500">{member.nik}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 capitalize">{member.company?.toLowerCase() || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${member.status === 'active' || member.status === 'verified'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : member.status === 'rejected'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {member.status || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="text-gray-400 group-hover:text-blue-600 transition-colors">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                        Data anggota tidak ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    <p>Menampilkan {filteredMembers.length} anggota</p>
                </div>
            </div>

            {isModalOpen && (
                <MemberDetailModal
                    member={selectedMember}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default MemberList;
