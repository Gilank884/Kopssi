import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Eye, X, CheckCircle, AlertCircle, User, Wallet, FileText, Check } from 'lucide-react';

const PencairanPinjaman = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [installments, setInstallments] = useState([]);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLoans();
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

    const fetchInstallments = async (loanId) => {
        try {
            const { data, error } = await supabase
                .from('angsuran')
                .select('*')
                .eq('pinjaman_id', loanId)
                .order('bulan_ke', { ascending: true });

            if (error) throw error;
            setInstallments(data || []);
        } catch (error) {
            console.error('Error fetching installments:', error);
        }
    };

    const handleRowClick = (loan) => {
        setSelectedLoan(loan);
        fetchInstallments(loan.id);
        setIsDetailModalOpen(true);
    };

    const handleApprove = async () => {
        if (!selectedLoan) return;

        const confirmApprove = window.confirm(`Setujui pengajuan pinjaman sebesar Rp ${parseFloat(selectedLoan.jumlah_pinjaman).toLocaleString('id-ID')} untuk ${selectedLoan.personal_data?.full_name}?`);

        if (!confirmApprove) return;

        try {
            const { error } = await supabase
                .from('pinjaman')
                .update({ status: 'DICAIRKAN' })
                .eq('id', selectedLoan.id);

            if (error) throw error;

            // Remove from local list
            setLoans(prev => prev.filter(loan => loan.id !== selectedLoan.id));

            setIsDetailModalOpen(false);
            setSelectedLoan(null);
            alert('Pengajuan pinjaman telah DISETUJUI. Sekarang silakan proses di menu Pencairan.');
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Gagal menyetujui pinjaman');
        }
    };

    const filteredLoans = loans.filter(loan =>
        loan.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.no_pinjaman?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 text-left">Pencairan Pinjaman</h2>
                    <p className="text-sm text-gray-500 mt-1 text-left">Tahap 2: Proses pencairan dana ke anggota</p>
                </div>
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

            {/* Detail Modal */}
            {isDetailModalOpen && selectedLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="bg-emerald-600 p-6 text-white relative">
                            <button
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    setSelectedLoan(null);
                                }}
                                className="absolute top-6 right-6 text-emerald-100 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-xl font-black italic tracking-tight uppercase">PROSES PENCAIRAN</h2>
                            <p className="text-emerald-100 text-xs mt-1 text-left font-medium opacity-80 uppercase tracking-widest text-left">Disbursement Process</p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Profil Peminjam */}
                                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm text-left">
                                    <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2 border-b pb-2 italic text-left">
                                        <User size={16} className="text-emerald-600" />
                                        IDENTITAS ANGGOTA
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="text-left">
                                            <label className="text-[10px] font-black text-gray-400 block uppercase italic text-left">Nama Lengkap</label>
                                            <p className="text-gray-900 font-bold text-sm tracking-tight">{selectedLoan.personal_data?.full_name || '-'}</p>
                                        </div>
                                        <div className="text-left">
                                            <label className="text-[10px] font-black text-gray-400 block uppercase italic text-left">NPP / NIK</label>
                                            <p className="text-gray-900 font-bold text-sm">{selectedLoan.personal_data?.nik || '-'}</p>
                                        </div>
                                        <div className="text-left">
                                            <label className="text-[10px] font-black text-gray-400 block uppercase italic text-left">Instansi / Unit</label>
                                            <p className="text-gray-900 font-bold text-sm uppercase">{selectedLoan.personal_data?.company || '-'} / {selectedLoan.personal_data?.work_unit || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Detail Pinjaman */}
                                <div className="bg-white rounded-xl p-5 border border-emerald-200 shadow-sm text-left">
                                    <h3 className="text-sm font-black text-emerald-800 mb-4 flex items-center gap-2 border-b pb-2 italic text-left">
                                        <Wallet size={16} className="text-emerald-600" />
                                        DATA PINJAMAN
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="text-left">
                                            <label className="text-[10px] font-black text-emerald-400 block uppercase mb-1 italic text-left">Plafon Pinjaman</label>
                                            <p className="text-xl font-black text-emerald-700 tracking-tighter italic text-left">Rp {parseFloat(selectedLoan.jumlah_pinjaman).toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-left">
                                            {(() => {
                                                const principal = parseFloat(selectedLoan.jumlah_pinjaman);
                                                const tenor = selectedLoan.tenor_bulan;

                                                let totalBunga = 0;
                                                if (selectedLoan.tipe_bunga === 'PERSENAN') {
                                                    totalBunga = principal * (parseFloat(selectedLoan.nilai_bunga) / 100) * (tenor / 12);
                                                } else if (selectedLoan.tipe_bunga === 'NOMINAL') {
                                                    totalBunga = parseFloat(selectedLoan.nilai_bunga);
                                                }

                                                const totalBayar = principal + totalBunga;
                                                const cicilan = installments.length > 0 ? parseFloat(installments[0].amount) : (totalBayar / tenor);

                                                return (
                                                    <>
                                                        <div className="text-left">
                                                            <label className="text-[10px] font-black text-gray-400 block uppercase italic text-left">Tenor</label>
                                                            <p className="text-sm font-black text-gray-800 text-left">{tenor} Bulan</p>
                                                        </div>
                                                        <div className="text-left">
                                                            <label className="text-[10px] font-black text-gray-400 block uppercase italic text-left">
                                                                Bunga ({selectedLoan.tipe_bunga === 'PERSENAN' ? `${selectedLoan.nilai_bunga}%` : 'Nominal'})
                                                            </label>
                                                            <p className="text-sm font-black text-gray-800 text-left">Rp {Math.round(totalBunga).toLocaleString('id-ID')}</p>
                                                        </div>
                                                        <div className="text-left">
                                                            <label className="text-[10px] font-black text-gray-400 block uppercase italic text-left">Total Bayar</label>
                                                            <p className="text-sm font-black text-emerald-700 text-left">Rp {Math.round(totalBayar).toLocaleString('id-ID')}</p>
                                                        </div>
                                                        <div className="text-left">
                                                            <label className="text-[10px] font-black text-gray-400 block uppercase italic text-left">Cicilan/Bln</label>
                                                            <p className="text-sm font-black text-red-600 text-left">Rp {Math.round(cicilan).toLocaleString('id-ID')}</p>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dokumen Metadata */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm text-left">
                                <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2 border-b pb-2 italic text-left">
                                    <FileText size={16} className="text-emerald-600" />
                                    REFERENSI SISTEM
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-left uppercase">
                                    <div className="text-left">
                                        <label className="text-gray-400 block mb-1 text-left">ID Transaksi</label>
                                        <p className="font-mono font-black text-gray-800 tracking-widest text-left">{selectedLoan.no_pinjaman}</p>
                                    </div>
                                    <div className="text-left">
                                        <label className="text-gray-400 block mb-1 text-left">Tanggal Submit</label>
                                        <p className="font-black text-gray-800 tracking-tight text-left">{formatDate(selectedLoan.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Aksi */}
                        <div className="p-6 bg-white border-t border-gray-100">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase shadow-inner border border-amber-200 bg-amber-50 text-amber-700`}>
                                        STATUS: {selectedLoan.status}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsDetailModalOpen(false)}
                                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-black uppercase hover:bg-gray-50 transition-colors shadow-sm"
                                    >
                                        Batal
                                    </button>

                                    <button
                                        onClick={handleApprove}
                                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-100 tracking-widest"
                                    >
                                        <Check size={14} />
                                        Cairkan Pinjaman
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

export default PencairanPinjaman;
