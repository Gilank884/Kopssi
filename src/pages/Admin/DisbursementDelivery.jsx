import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, Filter, CheckCircle, Banknote, Download, Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const DisbursementDelivery = () => {
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);
    const [updatingId, setUpdatingId] = useState(null);
    const [activeTab, setActiveTab] = useState('BELUM');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        // Awal bulan ini
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const handleExportExcel = async () => {
        try {
            const { exportDisbursementDelivery } = await import('../../utils/reportExcel');
            exportDisbursementDelivery(filteredLoans);
        } catch (err) {
            console.error('Excel export error:', err);
        }
    };

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
        fetchDisbursedLoans();
        fetchCompanies();
    }, [startDate, endDate]);

    useEffect(() => {
        setSelectedIds([]);
        setIsSelectionMode(false);
    }, [activeTab]);

    const fetchDisbursedLoans = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pinjaman')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        full_name, nik, work_unit, company, no_npp, no_anggota, lokasi, rek_gaji, bank_gaji, phone
                    )
                `)
                .eq('status', 'DICAIRKAN')
                .gte('disbursed_at', `${startDate}T00:00:00`)
                .lte('disbursed_at', `${endDate}T23:59:59`)
                .order('disbursed_at', { ascending: false });

            if (error) throw error;

            // Fetch installments for outstanding breakdown
            const { data: settledInsts } = await supabase
                .from('angsuran')
                .select('*, pinjaman(*)')
                .eq('metode_bayar', 'POTONG_PENCAIRAN');

            const loansWithBreakdown = (data || []).map(loan => {
                const matches = (settledInsts || []).filter(inst => inst.keterangan?.includes(loan.no_pinjaman));
                let outsPokok = 0;
                let outsBunga = 0;
                matches.forEach(inst => {
                    const oldLoan = inst.pinjaman;
                    if (oldLoan) {
                        const principal = parseFloat(oldLoan.jumlah_pinjaman || 0);
                        const tenor = oldLoan.tenor_bulan || 1;
                        let totalBunga = 0;
                        if (oldLoan.tipe_bunga === 'PERSENAN') {
                            totalBunga = principal * (parseFloat(oldLoan.nilai_bunga || 0) / 100) * (tenor / 12);
                        } else if (oldLoan.tipe_bunga === 'NOMINAL') {
                            totalBunga = parseFloat(oldLoan.nilai_bunga || 0);
                        }
                        outsBunga += (totalBunga / tenor);
                        outsPokok += (principal / tenor);
                    }
                });

                const totalCalculated = outsPokok + outsBunga;
                const savedTotal = parseFloat(loan.outstanding || 0);
                if (savedTotal > 0 && totalCalculated > 0) {
                    const ratio = savedTotal / totalCalculated;
                    outsPokok = outsPokok * ratio;
                    outsBunga = outsBunga * ratio;
                }

                return {
                    ...loan,
                    calculated_outs_pokok: Math.round(outsPokok),
                    calculated_outs_bunga: Math.round(outsBunga)
                };
            });

            setLoans(loansWithBreakdown);
        } catch (error) {
            console.error('Error fetching loans:', error);
            alert('Gagal memuat data pencairan');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelivery = async (loan) => {
        if (!window.confirm(`Konfirmasi bahwa dana pinjaman untuk ${loan.personal_data?.full_name} telah dikirimkan?`)) return;

        try {
            setUpdatingId(loan.id);
            const { error } = await supabase
                .from('pinjaman')
                .update({
                    delivery_status: 'SENT',
                    delivery_date: new Date().toISOString()
                })
                .eq('id', loan.id);

            if (error) throw error;

            alert('Status pengiriman berhasil diperbarui!');


            fetchDisbursedLoans();
        } catch (error) {
            console.error('Error updating delivery status:', error);
            alert('Gagal memperbarui status: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleBulkConfirm = async () => {
        const selectedLoans = filteredLoans.filter(l => selectedIds.includes(l.id));
        if (selectedLoans.length === 0) return;

        if (!window.confirm(`Konfirmasi realisasi untuk ${selectedLoans.length} pinjaman terpilih?`)) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('pinjaman')
                .update({
                    delivery_status: 'SENT',
                    delivery_date: new Date().toISOString()
                })
                .in('id', selectedIds);

            if (error) throw error;

            alert(`Berhasil merealisasikan ${selectedLoans.length} pinjaman!`);


            setSelectedIds([]);
            fetchDisbursedLoans();
        } catch (err) {
            console.error('Bulk confirm error:', err);
            alert('Gagal memproses realisasi massal');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredLoans.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredLoans.map(l => l.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const calculateSelectedTotal = () => {
        return filteredLoans
            .filter(l => selectedIds.includes(l.id))
            .reduce((sum, l) => {
                const principal = parseFloat(l.jumlah_pinjaman || 0);
                return sum + (principal - (parseFloat(l.outstanding) || 0) - 5000);
            }, 0);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const filteredLoans = loans.filter(loan => {
        const matchesSearch = loan.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.personal_data?.nik?.includes(searchTerm) ||
            loan.no_pinjaman?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompany = filterCompany === 'ALL' || loan.personal_data?.company === filterCompany;

        const isSent = loan.delivery_status === 'SENT';
        const matchesTab = activeTab === 'BELUM' ? !isSent : isSent;

        return matchesSearch && matchesCompany && matchesTab;
    });

    const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
    const paginatedLoans = filteredLoans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Unified Header Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Title & Tabs Row */}
                <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 italic tracking-tight leading-none">Realisasi Pinjaman</h2>
                        <div className="flex gap-4 mt-2">
                            <button
                                onClick={() => setActiveTab('BELUM')}
                                className={`text-[10px] font-black tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'BELUM' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                Belum Direalisasi
                            </button>
                            <button
                                onClick={() => setActiveTab('SUDAH')}
                                className={`text-[10px] font-black tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'SUDAH' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                Sudah Direalisasi
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={fetchDisbursedLoans}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[11px] font-black hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[11px] font-black hover:bg-emerald-700 transition-all shadow-sm shrink-0"
                        >
                            <Download size={14} /> Export
                        </button>
                    </div>
                </div>
                {/* Filters Row */}
                <div className="px-5 py-3 flex flex-col sm:flex-row flex-wrap gap-3 items-center bg-gray-50/60">
                    <div className="relative flex-grow sm:max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Cari nama / NIK..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-medium shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-bold shadow-sm"
                        />
                        <span className="text-gray-400 font-bold text-xs shrink-0">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-bold shadow-sm"
                        />
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-bold appearance-none shadow-sm min-w-[180px]"
                        >
                            <option value="ALL">Semua PT</option>
                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-[10px] font-black italic text-gray-400">Tampilkan:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-bold tracking-tight italic appearance-none shadow-sm"
                        >
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                        </select>
                    </div>
                    {activeTab === 'BELUM' && (
                        <button
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                if (isSelectionMode) setSelectedIds([]);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm border w-full sm:w-auto justify-center ${isSelectionMode ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'}`}
                        >
                            <CheckCircle size={15} />
                            {isSelectionMode ? 'Batal' : 'Pilih Masal'}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-auto max-h-[60vh] text-left">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                            <tr className="italic font-black text-[10px] tracking-widest text-slate-700">
                                <th className="px-2 py-2 text-center w-8 border-r border-slate-200">
                                    {isSelectionMode && (
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === filteredLoans.length && filteredLoans.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                    )}
                                </th>
                                <th className="px-2 py-2 text-center w-8 border-r border-slate-200">No</th>
                                <th className="px-2 py-2 border-r border-slate-200">No Pinjaman</th>
                                <th className="px-2 py-2 border-r border-slate-200">Nama</th>
                                <th className="px-2 py-2 border-r border-slate-200">NPP</th>
                                <th className="px-2 py-2 border-r border-slate-200">No Anggota</th>
                                <th className="px-2 py-2 border-r border-slate-200">Lokasi</th>
                                <th className="px-2 py-2 text-center border-r border-slate-200">Tgl Pin</th>
                                <th className="px-2 py-2 text-center border-r border-slate-200">Tgl Setuju</th>
                                <th className="px-2 py-2 text-center border-r border-slate-200">Tenor</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200">Pengajuan</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200">Disetujui</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200">Bunga</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200">Outs P</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200">Outs B</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200">Admin</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200 text-emerald-700 bg-emerald-50/50">Terima Bersih</th>
                                <th className="px-2 py-2 border-r border-slate-200 whitespace-nowrap">No Rek</th>
                                <th className="px-2 py-2 text-center border-r border-slate-200">Tgl Real</th>
                                <th className="px-2 py-2 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="20" className="px-6 py-12 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        <p className="text-[10px] font-black tracking-widest italic opacity-50">Memuat data pencairan...</p>
                                    </td>
                                </tr>
                            ) : paginatedLoans.length === 0 ? (
                                <tr>
                                    <td colSpan="20" className="px-6 py-20 text-center text-slate-400 font-medium italic">
                                        <Banknote size={48} className="mx-auto mb-4 opacity-10" />
                                        <p className="font-black text-[10px] tracking-widest italic">Tidak ada data untuk ditampilkan</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedLoans.map((loan, idx) => {
                                    const principal = parseFloat(loan.jumlah_pinjaman || 0);
                                    const tenor = loan.tenor_bulan || 1;
                                    let totalBunga = 0;
                                    if (loan.tipe_bunga === 'PERSENAN') {
                                        totalBunga = principal * (parseFloat(loan.nilai_bunga || 0) / 100) * (tenor / 12);
                                    } else if (loan.tipe_bunga === 'NOMINAL') {
                                        totalBunga = parseFloat(loan.nilai_bunga || 0);
                                    }
                                    const netDisbursement = principal - (parseFloat(loan.outstanding) || 0) - 5000;

                                    return (
                                        <tr
                                            key={loan.id}
                                            className={`hover:bg-emerald-50 transition-colors group ${(isSelectionMode && selectedIds.includes(loan.id)) ? 'bg-emerald-50/70' : ''}`}
                                            onClick={() => isSelectionMode && toggleSelect(loan.id)}
                                        >
                                            <td className="px-2 py-1 text-center border-r border-slate-200" onClick={(e) => isSelectionMode && e.stopPropagation()}>
                                                {isSelectionMode && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(loan.id)}
                                                        onChange={() => toggleSelect(loan.id)}
                                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-2 py-1 text-center text-[10px] font-bold text-slate-400 border-r border-slate-200">
                                                {(currentPage - 1) * itemsPerPage + idx + 1}
                                            </td>
                                            <td className="px-2 py-1 text-[10px] font-black font-mono text-slate-600 italic border-r border-slate-200 whitespace-nowrap">
                                                {loan.no_pinjaman}
                                            </td>
                                            <td className="px-2 py-1 text-[11px] font-black text-slate-800 italic border-r border-slate-200 whitespace-nowrap">
                                                {loan.personal_data?.full_name || '-'}
                                            </td>
                                            <td className="px-2 py-1 text-[10px] font-bold text-slate-500 font-mono italic border-r border-slate-200 whitespace-nowrap text-center">
                                                {loan.personal_data?.no_npp || '-'}
                                            </td>
                                            <td className="px-2 py-1 text-[10px] font-bold text-slate-500 font-mono italic border-r border-slate-200 whitespace-nowrap text-center">
                                                {loan.personal_data?.no_anggota || '-'}
                                            </td>
                                            <td className="px-2 py-1 text-[10px] font-bold text-slate-400 italic border-r border-slate-200 truncate max-w-[80px]">
                                                {loan.personal_data?.lokasi || '-'}
                                            </td>
                                            <td className="px-2 py-1 text-center text-[10px] font-bold text-slate-500 italic border-r border-slate-200 whitespace-nowrap">
                                                {loan.created_at ? new Date(loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-2 py-1 text-center text-[10px] font-bold text-slate-500 italic border-r border-slate-200 whitespace-nowrap">
                                                {(loan.approved_at || loan.created_at) ? new Date(loan.approved_at || loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-2 py-1 text-center text-[10px] font-black text-emerald-600 italic border-r border-slate-200">
                                                {tenor}
                                            </td>
                                            <td className="px-2 py-1 text-right text-[10px] font-bold text-slate-400 font-mono border-r border-slate-200 leading-none">
                                                {formatCurrency(loan.jumlah_pengajuan || loan.jumlah_pinjaman).replace(/Rp\s?/, '')}
                                            </td>
                                            <td className="px-2 py-1 text-right text-[10px] font-black text-slate-700 font-mono border-r border-slate-200 leading-none">
                                                {formatCurrency(principal).replace(/Rp\s?/, '')}
                                            </td>
                                            <td className="px-2 py-1 text-right text-[10px] font-bold text-amber-600 font-mono italic border-r border-slate-200 leading-none">
                                                {formatCurrency(totalBunga).replace(/Rp\s?/, '')}
                                            </td>
                                            <td className="px-2 py-1 text-right text-[10px] font-black text-red-500 font-mono italic border-r border-slate-200 leading-none">
                                                {loan.calculated_outs_pokok > 0 ? formatCurrency(loan.calculated_outs_pokok).replace(/Rp\s?/, '') : '-'}
                                            </td>
                                            <td className="px-2 py-1 text-right text-[10px] font-bold text-red-400 font-mono italic border-r border-slate-200 leading-none">
                                                {loan.calculated_outs_bunga > 0 ? formatCurrency(loan.calculated_outs_bunga).replace(/Rp\s?/, '') : '-'}
                                            </td>
                                            <td className="px-2 py-1 text-right text-[10px] font-bold text-slate-500 font-mono italic border-r border-slate-200 leading-none">
                                                {formatCurrency(5000).replace(/Rp\s?/, '')}
                                            </td>
                                            <td className="px-2 py-1 text-right text-[11px] font-black text-emerald-700 font-mono bg-emerald-50/50 border-r border-slate-200 leading-none">
                                                {formatCurrency(netDisbursement).replace(/Rp\s?/, '')}
                                            </td>
                                            <td className="px-2 py-1 text-[10px] font-mono font-bold text-slate-500 italic border-r border-slate-200 whitespace-nowrap">
                                                {loan.personal_data?.bank_gaji} {loan.personal_data?.rek_gaji || '-'}
                                            </td>
                                            <td className="px-2 py-1 text-center text-[10px] font-black text-emerald-600 italic border-r border-slate-200 whitespace-nowrap">
                                                {loan.delivery_date ? new Date(loan.delivery_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                                {loan.delivery_status !== 'SENT' ? (
                                                    <button
                                                        onClick={() => handleConfirmDelivery(loan)}
                                                        disabled={updatingId === loan.id}
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black tracking-tight hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm"
                                                    >
                                                        {updatingId === loan.id ? <Loader2 className="animate-spin" size={10} /> : <CheckCircle size={10} />}
                                                        OK
                                                    </button>
                                                ) : (
                                                    <span className="text-[9px] font-black text-slate-300 italic tracking-tighter">SENT</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DATA COUNT FOOTER AND PAGINATION */}
            <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs font-black text-gray-400 tracking-widest italic order-2 sm:order-1">
                    Menampilkan <span className="text-emerald-600">{paginatedLoans.length}</span> dari {filteredLoans.length} Data
                </p>
                
                <div className="flex items-center gap-2 order-1 sm:order-2">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black italic tracking-widest text-slate-600 shadow-sm">
                        {currentPage} / {totalPages || 1}
                    </div>

                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Selection Summary Popup/Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-gray-900 border border-white/10 text-white rounded-2xl shadow-2xl shadow-black/40 px-8 py-5 flex items-center gap-10 backdrop-blur-md">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black tracking-widest text-emerald-400 italic">Terpilih</span>
                            <span className="text-2xl font-black italic">{selectedIds.length} <span className="text-sm not-italic opacity-50 tracking-tighter">Record</span></span>
                        </div>

                        <div className="h-10 w-[1px] bg-white/10"></div>

                        <div className="flex flex-col">
                            <span className="text-[10px] font-black tracking-widest text-emerald-400 italic">Total Realisasi</span>
                            <span className="text-2xl font-black italic font-mono text-emerald-400">{formatCurrency(calculateSelectedTotal())}</span>
                        </div>

                        <div className="flex gap-3 ml-4">
                            <button
                                onClick={() => setSelectedIds([])}
                                className="px-6 py-3 border border-white/20 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleBulkConfirm}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <CheckCircle size={14} /> Konfirmasi Terpilih
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisbursementDelivery;
