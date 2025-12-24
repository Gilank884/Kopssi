import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Eye, X, CheckCircle, AlertCircle, User, Wallet, FileText, Banknote } from 'lucide-react';

const PencairanPinjaman = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        try {
            setLoading(true);
            // Hanya ambil data yang statusnya DISETUJUI
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
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setLoans(data || []);
        } catch (error) {
            console.error('Error fetching loans:', error);
            alert('Gagal memuat data pencairan pinjaman');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (loan) => {
        setSelectedLoan(loan);
        setIsDetailModalOpen(true);
    };

    const handleDisburse = async () => {
        if (!selectedLoan) return;

        const confirmDisburse = window.confirm(`Konfirmasi Pencairan Dana Pinjaman:\nNama: ${selectedLoan.personal_data?.full_name}\nNominal: Rp ${parseFloat(selectedLoan.jumlah_pinjaman).toLocaleString('id-ID')}\n\nApakah dana sudah dicairkan ke anggota?`);

        if (!confirmDisburse) return;

        try {
            const { error } = await supabase
                .from('pinjaman')
                .update({
                    status: 'DICAIRKAN',
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedLoan.id);

            if (error) throw error;

            // Remove from local list
            setLoans(prev => prev.filter(loan => loan.id !== selectedLoan.id));

            setIsDetailModalOpen(false);
            setSelectedLoan(null);
            alert('Dana pinjaman Berhasil DICAIRKAN!');
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Gagal mencairkan pinjaman');
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
                    <p className="text-sm text-gray-500 mt-1 text-left uppercase tracking-tighter font-medium text-left">Tahap 2: Proses pencairan dana yang telah disetujui</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari nama anggota..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-left">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 text-left text-center">Memuat data pencairan...</p>
                </div>
            ) : filteredLoans.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-left">
                    <Banknote className="mx-auto text-gray-300 mb-4" size={64} />
                    <p className="text-gray-500 font-medium text-center text-left underline italic uppercase tracking-wider">Belum ada pinjaman yang siap dicairkan</p>
                    <p className="text-gray-400 text-xs text-center text-left mt-2 italic uppercase tracking-[0.3em]">Awaiting approvals from assessment stage</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left shadow-lg border-blue-100">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                            <tr>
                                <th className="px-6 py-4 font-black text-blue-800 text-xs uppercase tracking-widest text-left italic">Anggota</th>
                                <th className="px-6 py-4 font-black text-blue-800 text-xs uppercase tracking-widest text-left italic">Nominal Cair</th>
                                <th className="px-6 py-4 font-black text-blue-800 text-xs uppercase tracking-widest text-left text-center italic">Konfirmasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-left">
                            {filteredLoans.map((loan) => (
                                <tr
                                    key={loan.id}
                                    onClick={() => handleRowClick(loan)}
                                    className="hover:bg-blue-50/20 transition-colors cursor-pointer text-left"
                                >
                                    <td className="px-6 py-5 text-left">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                                                {loan.personal_data?.full_name?.charAt(0) || '?'}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-gray-900 text-sm tracking-tight text-left uppercase italic">{loan.personal_data?.full_name || '-'}</p>
                                                <p className="text-[10px] text-blue-500 font-bold tracking-widest uppercase text-left">{loan.no_pinjaman}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-left">
                                        <div className="text-left">
                                            <p className="font-black text-gray-900 text-base tracking-tighter text-left italic">Rp {parseFloat(loan.jumlah_pinjaman).toLocaleString('id-ID')}</p>
                                            <p className="text-[10px] text-gray-400 font-bold text-left italic uppercase tracking-tighter">{loan.tenor_bulan} Bulan Tenor</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRowClick(loan);
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black hover:bg-blue-700 transition-all uppercase tracking-[0.2em] shadow-lg shadow-blue-100 inline-flex items-center gap-2"
                                        >
                                            <Banknote size={14} />
                                            Cairkan
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4 text-left">
                    <div className="bg-white rounded-[2rem] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20 text-left">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white relative text-left">
                            <button
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    setSelectedLoan(null);
                                }}
                                className="absolute top-8 right-8 text-blue-100 hover:text-white transition-colors bg-white/10 p-2 rounded-full"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-4 mb-2 text-left">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-xl border border-white/30">
                                    <Banknote size={32} />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none text-left">Pencairan Dana</h2>
                                    <p className="text-blue-100 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 opacity-70 text-left italic">Disbursement Confirmation</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 text-left bg-gray-50/50">
                            {/* Ringkasan Dana */}
                            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-blue-500/5 relative overflow-hidden group text-left">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                    <Wallet size={120} />
                                </div>
                                <div className="relative text-left">
                                    <label className="text-[10px] font-black text-blue-500 block uppercase tracking-[0.2em] mb-3 italic text-left">Total yang harus dicairkan</label>
                                    <div className="flex items-baseline gap-2 text-left">
                                        <span className="text-2xl font-black text-blue-800 italic">Rp</span>
                                        <span className="text-5xl font-black text-gray-900 tracking-tighter italic">{parseFloat(selectedLoan.jumlah_pinjaman).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="mt-6 flex items-center gap-6 pt-6 border-t border-gray-100 text-left">
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Bunga</p>
                                            <p className="text-sm font-black text-gray-800 text-left italic">{selectedLoan.bunga_persen}%</p>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Tenor</p>
                                            <p className="text-sm font-black text-gray-800 text-left italic">{selectedLoan.tenor_bulan} bln</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Penerima */}
                            <div className="grid grid-cols-1 gap-4 text-left">
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left">
                                    <h3 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.25em] flex items-center gap-2 italic text-left">
                                        <User size={14} className="text-blue-600" />
                                        Data Penerima Dana
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-blue-300 block uppercase italic text-left">Nama Lengkap</p>
                                            <p className="text-sm font-black text-gray-900 tracking-tight text-left uppercase truncate">{selectedLoan.personal_data?.full_name}</p>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-blue-300 block uppercase italic text-left">NPP / NIK</p>
                                            <p className="text-sm font-black text-gray-900 text-left font-mono">{selectedLoan.personal_data?.nik}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Aksi */}
                        <div className="p-8 bg-white border-t border-gray-100">
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handleDisburse}
                                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl text-sm font-black uppercase tracking-[0.3em] hover:from-blue-700 hover:to-blue-800 transition-all shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <CheckCircle size={20} />
                                    Konfirmasi Pencairan
                                </button>
                                <button
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors italic"
                                >
                                    Tunda Pencairan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PencairanPinjaman;
