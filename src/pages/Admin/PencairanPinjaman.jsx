import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, AlertCircle } from 'lucide-react';

const PencairanPinjaman = () => {
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);

    const fetchCompanies = async () => {
        try {
            const { data, error } = await supabase
                .from('master_data')
                .select('value')
                .eq('category', 'company')
                .order('value', { ascending: true });
            if (error) throw error;
            setCompanies(data?.map(c => c.value) || []);
        } catch (err) {
            console.error("Error fetching companies:", err);
        }
    };

    useEffect(() => {
        fetchLoans();
        fetchCompanies();
    }, []);

    const fetchLoans = async () => {
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
                .eq('status', 'DISETUJUI')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLoans(data || []);
        } catch (error) {
            console.error('Error fetching loans:', error);
            alert('Gagal memuat data pengajuan pinjaman');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (loan) => {
        navigate(`/admin/pencairan-pinjaman/${loan.id}`);
    };

    const filteredLoans = loans.filter(loan => {
        const matchesSearch = loan.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.no_pinjaman?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCompany = filterCompany === 'ALL' || loan.personal_data?.company === filterCompany;

        return matchesSearch && matchesCompany;
    });

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 text-left">Pencairan Pinjaman</h2>
                    <p className="text-sm text-gray-500 mt-1 text-left">Tahap 2: Proses pencairan dana ke anggota</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari nama peminjam..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 shadow-sm"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-bold uppercase tracking-tight italic"
                        >
                            <option value="ALL">SEMUA PT</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Memuat data pengajuan...</p>
                </div>
            ) : filteredLoans.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <AlertCircle className="mx-auto text-gray-400" size={48} />
                    <p className="mt-4 text-gray-500 font-medium text-center">Tidak ada pengajuan pinjaman baru yang menunggu persetujuan</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-emerald-50 border-b border-emerald-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic">Peminjam</th>
                                <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic">Nominal</th>
                                <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic">Tenor</th>
                                <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic">No. Pinjaman</th>
                                <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic">Tanggal</th>
                                <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLoans.map((loan) => (
                                <tr
                                    key={loan.id}
                                    onClick={() => handleRowClick(loan)}
                                    className="hover:bg-emerald-50/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                                                {loan.personal_data?.full_name?.charAt(0) || '?'}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900 text-sm">{loan.personal_data?.full_name || '-'}</p>
                                                <p className="text-[10px] text-gray-500 font-mono tracking-tighter">{loan.personal_data?.nik || '-'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-black text-emerald-700 text-sm">
                                        Rp {parseFloat(loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 text-sm font-semibold">{loan.tenor_bulan} bln</td>
                                    <td className="px-6 py-4 text-gray-400 text-[10px] font-mono">{loan.no_pinjaman}</td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(loan.created_at)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRowClick(loan);
                                            }}
                                            className="px-3 py-1 bg-emerald-600 text-white rounded text-[10px] font-black hover:bg-emerald-700 transition-all uppercase tracking-wider shadow-sm"
                                        >
                                            Verifikasi
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
};

export default PencairanPinjaman;
