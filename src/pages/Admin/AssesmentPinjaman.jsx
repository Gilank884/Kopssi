import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Eye, X, CheckCircle, AlertCircle, User, Wallet, FileText, Check, FileDown } from 'lucide-react';
import { generateLoanAnalysisPDF } from '../../utils/loanAnalysisPdf';

const AssesmentPinjaman = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [analystName, setAnalystName] = useState('Admin');
    const [editingAmount, setEditingAmount] = useState('');

    // Interest configuration state
    const [useInterest, setUseInterest] = useState(false);
    const [interestType, setInterestType] = useState('PERSENAN'); // PERSENAN or NOMINAL
    const [interestValue, setInterestValue] = useState('10'); // Default 10%

    useEffect(() => {
        fetchLoans();
        fetchAnalystInfo();
    }, []);

    const fetchAnalystInfo = async () => {
        try {
            const storedUser = localStorage.getItem('auth_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);

                // Fetch full name from personal_data using the ID from localStorage
                const { data: profile } = await supabase
                    .from('personal_data')
                    .select('full_name')
                    .eq('user_id', user.id)
                    .single();

                if (profile) {
                    setAnalystName(profile.full_name);
                } else {
                    setAnalystName(user.name || 'Admin System');
                }
            }
        } catch (error) {
            console.error('Error fetching analyst info:', error);
        }
    };

    const fetchLoans = async () => {
        try {
            setLoading(true);
            // Hanya ambil data yang statusnya PENGAJUAN
            const { data, error } = await supabase
                .from('pinjaman')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        *
                    )
                `)
                .eq('status', 'PENGAJUAN')
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
        setSelectedLoan(loan);
        setEditingAmount(loan.jumlah_pinjaman.toString());
        // Reset interest config
        setUseInterest(false);
        setInterestType('PERSENAN');
        setInterestValue('10');
        setIsDetailModalOpen(true);
    };



    const handleBatchDownload = async () => {
        if (filteredLoans.length === 0) return;

        const confirmBatch = window.confirm(`Unduh ${filteredLoans.length} analisa pinjaman sekaligus?`);
        if (!confirmBatch) return;

        for (const loan of filteredLoans) {
            await generateLoanAnalysisPDF(loan, true, analystName);
        }
    };

    const handleApprove = async () => {
        if (!selectedLoan) return;

        const finalAmount = parseFloat(editingAmount);
        if (isNaN(finalAmount) || finalAmount <= 0) {
            alert('Nominal pinjaman tidak valid');
            return;
        }

        // Validate interest config
        if (useInterest) {
            const intValue = parseFloat(interestValue);
            if (isNaN(intValue) || intValue <= 0) {
                alert('Nilai bunga tidak valid');
                return;
            }
        }

        const confirmApprove = window.confirm(
            `Setujui pengajuan pinjaman sebesar Rp ${finalAmount.toLocaleString('id-ID')} untuk ${selectedLoan.personal_data?.full_name}?\n\n` +
            (useInterest
                ? `Bunga: ${interestType === 'PERSENAN' ? interestValue + '%' : 'Rp ' + parseFloat(interestValue).toLocaleString('id-ID')}`
                : 'Tanpa Bunga')
        );

        if (!confirmApprove) return;

        try {
            const tenor = selectedLoan.tenor_bulan;
            const pokok = finalAmount;

            // Calculate interest based on configuration
            let totalBunga = 0;
            let tipe_bunga = 'NONE';
            let nilai_bunga = 0;

            if (useInterest) {
                tipe_bunga = interestType;
                nilai_bunga = parseFloat(interestValue);

                if (interestType === 'PERSENAN') {
                    // Calculate flat rate interest
                    totalBunga = pokok * (nilai_bunga / 100) * (tenor / 12);
                } else {
                    // NOMINAL - direct value
                    totalBunga = nilai_bunga;
                }
            }

            const totalBayar = pokok + totalBunga;
            const monthlyAmount = Math.ceil(totalBayar / tenor);

            // 1. Update loan status and interest config
            const { error: updateError } = await supabase
                .from('pinjaman')
                .update({
                    status: 'DISETUJUI',
                    jumlah_pinjaman: pokok,
                    tipe_bunga: tipe_bunga,
                    nilai_bunga: nilai_bunga
                })
                .eq('id', selectedLoan.id);

            if (updateError) throw updateError;

            // 2. Generate angsuran (installments)
            const installments = [];
            const today = new Date();

            for (let i = 1; i <= tenor; i++) {
                const dueDate = new Date(today);
                dueDate.setMonth(today.getMonth() + i);

                installments.push({
                    pinjaman_id: selectedLoan.id,
                    bulan_ke: i,
                    amount: monthlyAmount,
                    tanggal_bayar: dueDate.toISOString(),
                    status: 'UNPAID'
                });
            }

            const { error: angsuranError } = await supabase
                .from('angsuran')
                .insert(installments);

            if (angsuranError) throw angsuranError;

            // Remove from local list
            setLoans(prev => prev.filter(loan => loan.id !== selectedLoan.id));

            setIsDetailModalOpen(false);
            setSelectedLoan(null);

            alert(
                `Pengajuan pinjaman telah DISETUJUI!\n\n` +
                `Nominal: Rp ${pokok.toLocaleString('id-ID')}\n` +
                `Bunga: ${useInterest ? (interestType === 'PERSENAN' ? nilai_bunga + '%' : 'Rp ' + nilai_bunga.toLocaleString('id-ID')) : 'Tidak ada'}\n` +
                `Total Bayar: Rp ${totalBayar.toLocaleString('id-ID')}\n` +
                `Angsuran/Bulan: Rp ${monthlyAmount.toLocaleString('id-ID')}\n\n` +
                `Silakan proses pencairan di menu Pencairan Pinjaman.`
            );
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Gagal menyetujui pinjaman: ' + error.message);
        }
    };

    const filteredLoans = loans.filter(loan => {
        const matchesSearch =
            loan.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.no_pinjaman?.toLowerCase().includes(searchTerm.toLowerCase());

        const loanDate = new Date(loan.created_at).getTime();
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;

        const matchesDate = loanDate >= start && loanDate <= end;

        return matchesSearch && matchesDate;
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
                    <h2 className="text-2xl font-bold text-gray-800 text-left">Penyetujuan Pinjaman</h2>
                    <p className="text-sm text-gray-500 mt-1 text-left">Tahap 1: Verifikasi dan setujui pengajuan anggota</p>
                </div>

                <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cari</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Nama / No. Pinjaman..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-48 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Dari</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Sampai</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        />
                    </div>

                    <button
                        onClick={handleBatchDownload}
                        disabled={filteredLoans.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed h-[38px]"
                    >
                        <FileDown size={18} />
                        Download PDF ({filteredLoans.length})
                    </button>
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
                                <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic text-center">Analisa</th>
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
                                                generateLoanAnalysisPDF(loan, false, analystName);
                                            }}
                                            className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-all shadow-sm"
                                            title="Pratinjau Analisa PDF"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
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
                            <h2 className="text-xl font-black italic tracking-tight uppercase">VERIFIKASI PENGAJUAN</h2>
                            <p className="text-emerald-100 text-xs mt-1 text-left font-medium opacity-80 uppercase tracking-widest text-left">Loan Review Process</p>
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
                                        <div className="text-left group">
                                            <label className="text-[10px] font-black text-emerald-400 block uppercase mb-1 italic text-left">Plafon Pinjaman (Dapat Diubah)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold italic">Rp</span>
                                                <input
                                                    type="number"
                                                    value={editingAmount}
                                                    onChange={(e) => setEditingAmount(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 bg-emerald-50 border-2 border-emerald-100 rounded-xl text-xl font-black text-emerald-700 italic focus:outline-none focus:border-emerald-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Interest Configuration */}
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 mt-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <input
                                                    type="checkbox"
                                                    id="useInterest"
                                                    checked={useInterest}
                                                    onChange={(e) => setUseInterest(e.target.checked)}
                                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                                                />
                                                <label htmlFor="useInterest" className="text-sm font-black text-gray-700 cursor-pointer">
                                                    GUNAKAN BUNGA?
                                                </label>
                                            </div>

                                            {useInterest && (
                                                <div className="space-y-3 mt-4 pl-6 border-l-2 border-amber-300">
                                                    {/* Interest Type Selection */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-500 block uppercase">Tipe Bunga</label>
                                                        <div className="flex gap-3">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="interestType"
                                                                    value="PERSENAN"
                                                                    checked={interestType === 'PERSENAN'}
                                                                    onChange={(e) => setInterestType(e.target.value)}
                                                                    className="w-4 h-4 text-emerald-600"
                                                                />
                                                                <span className="text-xs font-bold text-gray-700">PERSENAN (%)</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="interestType"
                                                                    value="NOMINAL"
                                                                    checked={interestType === 'NOMINAL'}
                                                                    onChange={(e) => setInterestType(e.target.value)}
                                                                    className="w-4 h-4 text-emerald-600"
                                                                />
                                                                <span className="text-xs font-bold text-gray-700">NOMINAL (Rp)</span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Interest Value Input */}
                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-500 block uppercase mb-1">
                                                            {interestType === 'PERSENAN' ? 'Persentase Per Tahun (%)' : 'Nominal Bunga (Rp)'}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={interestValue}
                                                            onChange={(e) => setInterestValue(e.target.value)}
                                                            placeholder={interestType === 'PERSENAN' ? 'Contoh: 10' : 'Contoh: 500000'}
                                                            className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg text-sm font-bold text-gray-700 focus:outline-none focus:border-amber-500"
                                                        />
                                                    </div>

                                                    {/* Preview Calculation */}
                                                    <div className="bg-white/70 rounded-lg p-3 border border-amber-200">
                                                        <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Preview:</p>
                                                        {(() => {
                                                            const principal = parseFloat(editingAmount) || 0;
                                                            const tenor = selectedLoan.tenor_bulan;
                                                            let totalBunga = 0;

                                                            if (interestType === 'PERSENAN') {
                                                                const rate = parseFloat(interestValue) || 0;
                                                                totalBunga = principal * (rate / 100) * (tenor / 12);
                                                            } else {
                                                                totalBunga = parseFloat(interestValue) || 0;
                                                            }

                                                            const totalBayar = principal + totalBunga;
                                                            const cicilan = Math.ceil(totalBayar / tenor);

                                                            return (
                                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                                    <div>
                                                                        <span className="text-gray-500">Bunga:</span>
                                                                        <p className="font-bold text-orange-600">Rp {Math.round(totalBunga).toLocaleString('id-ID')}</p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-500">Total:</span>
                                                                        <p className="font-bold text-emerald-600">Rp {Math.round(totalBayar).toLocaleString('id-ID')}</p>
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <span className="text-gray-500">Cicilan/Bulan:</span>
                                                                        <p className="font-bold text-gray-800">Rp {cicilan.toLocaleString('id-ID')}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}

                                            {!useInterest && (
                                                <div className="text-xs text-gray-500 italic pl-6">
                                                    Pinjaman tanpa bunga. Angsuran = Pokok / Tenor
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-left mt-4">
                                            <div className="text-left">
                                                <label className="text-[10px] font-black text-gray-400 block uppercase italic text-left">Tenor</label>
                                                <p className="text-sm font-black text-gray-800 text-left">{selectedLoan.tenor_bulan} Bulan</p>
                                            </div>
                                        </div>
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        generateLoanAnalysisPDF(selectedLoan, false, analystName, editingAmount);
                                    }}
                                    className="px-6 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-black uppercase hover:bg-blue-100 transition-colors flex items-center gap-2 shadow-sm"
                                    title="Pratinjau Analisa PDF dengan Nominal Baru"
                                >
                                    <Eye size={14} />
                                    Pratinjau PDF
                                </button>

                                <button
                                    onClick={handleApprove}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-100 tracking-widest"
                                >
                                    <Check size={14} />
                                    Setujui Pengajuan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssesmentPinjaman;
