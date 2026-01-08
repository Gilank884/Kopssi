import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, MoreHorizontal, X, User, Phone, Briefcase, MapPin, CreditCard, Calendar, Plus, Upload, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import * as XLSX from 'xlsx';

const AddMemberModal = ({ isOpen, onClose, onSuccess }) => {
    const [activeTab, setActiveTab] = useState('form'); // 'form' | 'upload'
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        nik: '',
        no_npp: '',
        phone: '',
        company: '',
        work_unit: '',
        employment_status: 'Karyawan Tetap',
        address: '',
    });

    // Bulk Upload State
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef(null);

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // 1. Manage User account
            let userId = null;
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('phone', formData.phone)
                .single();

            if (existingUser) {
                userId = existingUser.id;
            } else {
                const { data: newUser, error: userError } = await supabase
                    .from('users')
                    .insert({
                        phone: formData.phone,
                        password: 'placeholder-password', // Will be updated on approval
                        role: 'MEMBER'
                    })
                    .select()
                    .single();
                if (userError) throw userError;
                userId = newUser.id;
            }

            // 2. Insert Personal Data
            const { error: personalError } = await supabase
                .from('personal_data')
                .insert({
                    ...formData,
                    user_id: userId,
                    status: 'pending',
                    created_at: new Date().toISOString()
                });

            if (personalError) throw personalError;

            alert('Anggota berhasil ditambahkan');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding member:', error);
            alert('Gagal menambahkan anggota: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseExcel(selectedFile);
        }
    };

    const parseExcel = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            setPreviewData(jsonData);
        };
        reader.readAsArrayBuffer(file);
    };

    const handleBulkUpload = async () => {
        if (previewData.length === 0) return;
        setProcessing(true);
        try {
            for (const row of previewData) {
                const phone = String(row['No Telepon'] || row.phone || '');
                const fullName = row['Nama Lengkap'] || row.full_name;

                if (!phone) continue;

                // 1. Find or create user
                let userId = null;
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('phone', phone)
                    .single();

                if (existingUser) {
                    userId = existingUser.id;
                } else {
                    const { data: newUser, error: userError } = await supabase
                        .from('users')
                        .insert({
                            phone: phone,
                            password: 'placeholder-password',
                            role: 'MEMBER'
                        })
                        .select()
                        .single();
                    if (userError) throw userError;
                    userId = newUser.id;
                }

                // 2. Insert personal data
                const { error: personalError } = await supabase
                    .from('personal_data')
                    .insert({
                        full_name: fullName,
                        nik: String(row['NIK'] || row.nik || ''),
                        no_npp: String(row['NPP'] || row.no_npp || ''),
                        phone: phone,
                        company: row['Perusahaan'] || row.company || '',
                        work_unit: row['Unit Kerja'] || row.work_unit || '',
                        employment_status: row['Status Pegawai'] || row.employment_status || 'Karyawan Tetap',
                        address: row['Alamat'] || row.address || '',
                        user_id: userId,
                        status: 'pending',
                        created_at: new Date().toISOString()
                    });

                if (personalError) console.warn(`Failed to insert profile for ${phone}:`, personalError);
            }

            alert(`Proses upload selesai`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error bulk uploading members:', error);
            alert('Gagal mengunggah anggota: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Tambah Anggota Baru</h3>
                        <p className="text-sm text-gray-500">Input data anggota secara manual atau bulk via Excel</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('form')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'form' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Input Form
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Upload Excel
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'form' ? (
                        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nama Lengkap</label>
                                <input
                                    required
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                                    placeholder="Contoh: John Doe"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">NIK (16 Digit)</label>
                                <input
                                    required
                                    name="nik"
                                    maxLength={16}
                                    value={formData.nik}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                                    placeholder="321xxxxxxxxxxxxx"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">NPP</label>
                                <input
                                    name="no_npp"
                                    value={formData.no_npp}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                                    placeholder="PP-2023-001"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">No. Telepon</label>
                                <input
                                    required
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                                    placeholder="0812xxxxxxxx"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Perusahaan</label>
                                <input
                                    name="company"
                                    value={formData.company}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Unit Kerja</label>
                                <input
                                    name="work_unit"
                                    value={formData.work_unit}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Alamat</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                                    rows={3}
                                />
                            </div>

                            <div className="col-span-2 pt-4">
                                <button
                                    disabled={submitting}
                                    className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="animate-spin" /> : 'Simpan Anggota'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div
                                onClick={() => fileInputRef.current.click()}
                                className="border-2 border-dashed border-gray-200 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
                            >
                                <div className="p-4 bg-blue-50 rounded-full text-blue-600 group-hover:scale-110 transition-all">
                                    <Upload size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-gray-900">{file ? file.name : 'Pilih File Excel'}</p>
                                    <p className="text-xs text-gray-400 font-medium tracking-tight">Format: .xlsx atau .xls</p>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".xlsx, .xls"
                                />
                            </div>

                            {previewData.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black uppercase text-gray-400 tracking-widest">Pratinjau Data ({previewData.length} Baris)</h4>
                                        <button onClick={() => { setFile(null); setPreviewData([]); }} className="text-red-500 hover:text-red-700 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-gray-50 sticky top-0 font-bold uppercase text-[10px] tracking-tight">
                                                <tr>
                                                    <th className="px-4 py-2">Nama</th>
                                                    <th className="px-4 py-2">NIK</th>
                                                    <th className="px-4 py-2">NPP</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 bg-white">
                                                {previewData.slice(0, 50).map((row, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2 font-medium">{row['Nama Lengkap'] || row.full_name}</td>
                                                        <td className="px-4 py-2 font-mono">{row['NIK'] || row.nik}</td>
                                                        <td className="px-4 py-2 font-mono">{row['NPP'] || row.no_npp}</td>
                                                    </tr>
                                                ))}
                                                {previewData.length > 50 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-2 text-center text-gray-400 italic">Dan {previewData.length - 50} data lainnya...</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button
                                        onClick={handleBulkUpload}
                                        disabled={processing}
                                        className="w-full bg-gray-900 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {processing ? <Loader2 className="animate-spin" /> : 'Proses Upload Massal'}
                                    </button>
                                </div>
                            )}

                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                <Info size={20} className="text-amber-600 shrink-0" />
                                <div className="text-[10px] font-bold text-amber-900 uppercase tracking-tight opacity-70">
                                    <p>💡 Tips: Pastikan kolom Excel sesuai: Nama Lengkap, NIK, NPP, No Telepon, Perusahaan, Unit Kerja, Alamat.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

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
                                    {member[field] ? (
                                        <img src={member[field]} alt={field} className="w-full h-24 object-cover rounded-md" />
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">No Preview Available</span>
                                    )}
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
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchMembers = async () => {
        try {
            setLoading(true);
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

    useEffect(() => {
        fetchMembers();
    }, []);

    const filteredMembers = members.filter(m =>
        m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.no_npp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.nik?.includes(searchTerm)
    );

    const handleRowClick = (member) => {
        setSelectedMember(member);
        setIsDetailModalOpen(true);
    };

    if (loading && members.length === 0) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Database Anggota</h2>
                    <p className="text-sm text-gray-500 font-medium">Manajemen data seluruh anggota koperasi</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari anggota..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 text-sm font-medium"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] px-6 py-2 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Tambah Anggota
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100 italic">
                            <tr>
                                <th className="px-6 py-4 font-black uppercase text-[10px] text-gray-400 tracking-widest">NPP</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px] text-gray-400 tracking-widest">Nama Lengkap</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px] text-gray-400 tracking-widest">NIK</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px] text-gray-400 tracking-widest">Perusahaan</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px] text-gray-400 tracking-widest">Status</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px] text-gray-400 tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map((member) => (
                                    <tr
                                        key={member.id}
                                        onClick={() => handleRowClick(member)}
                                        className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 text-xs font-bold text-blue-600 font-mono tracking-tighter uppercase">{member.no_npp || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px] uppercase border border-blue-100 italic">
                                                    {member.full_name?.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-900 text-sm uppercase italic tracking-tight">{member.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] font-bold font-mono text-gray-400">{member.nik}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-600 uppercase italic tracking-tight overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">{member.company || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic transition-all ${member.status?.toLowerCase() === 'active' || member.status?.toLowerCase() === 'verified'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : member.status?.toLowerCase() === 'rejected'
                                                    ? 'bg-red-50 text-red-600'
                                                    : member.status?.toLowerCase() === 'done verifikasi'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                {member.status || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="p-2 text-gray-400 group-hover:text-blue-600 transition-colors rounded-full hover:bg-white border border-transparent group-hover:border-blue-100">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Search size={48} />
                                            <p className="font-black uppercase tracking-widest text-xs italic">Data anggota tidak ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
                    <p>Total {filteredMembers.length} Anggota Terdaftar</p>
                </div>
            </div>

            <AddMemberModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchMembers}
            />

            {isDetailModalOpen && (
                <MemberDetailModal
                    member={selectedMember}
                    onClose={() => setIsDetailModalOpen(false)}
                />
            )}
        </div>
    );
};

export default MemberList;
