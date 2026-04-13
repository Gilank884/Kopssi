import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Filter, CheckCircle, Banknote, Download, Loader2 } from 'lucide-react';

const RealisasiKaryawan = () => {
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
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const handleExportExcel = async () => {
        try {
            const { exportExitRealisasi } = await import('../../utils/reportExcel');
            exportExitRealisasi(filteredData);
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
        fetchRealisasiData();
        fetchCompanies();
    }, [startDate, endDate, activeTab]);

    useEffect(() => {
        setSelectedIds([]);
        setIsSelectionMode(false);
    }, [activeTab]);

    const fetchRealisasiData = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('personal_data')
                .select('*')
                .eq('status', 'NON_ACTIVE');

            if (activeTab === 'BELUM') {
                query = query.eq('exit_realisasi_status', 'PENDING')
                    .gte('tanggal_keluar', `${startDate}T00:00:00`)
                    .lte('tanggal_keluar', `${endDate}T23:59:59`);
            } else {
                query = query.eq('exit_realisasi_status', 'SENT')
                    .gte('exit_realisasi_date', `${startDate}T00:00:00`)
                    .lte('exit_realisasi_date', `${endDate}T23:59:59`);
            }

            const { data: exitsData, error: exitsError } = await query;

            if (exitsError) throw exitsError;

            // Process Exits Data
            const processedExits = await Promise.all((exitsData || []).map(async (member) => {
                // Fetch Savings
                const { data: savings } = await supabase
                    .from('simpanan')
                    .select('*')
                    .eq('personal_data_id', member.id)
                    .eq('status', 'PAID');

                let sPokok = 0, sWajib = 0, sSukarela = 0;
                savings?.forEach(s => {
                    const amt = parseFloat(s.amount || 0);
                    if (s.transaction_type === 'SETOR') {
                        if (s.type === 'POKOK') sPokok += amt;
                        else if (s.type === 'WAJIB') sWajib += amt;
                        else if (s.type === 'SUKARELA') sSukarela += amt;
                    } else {
                        if (s.type === 'POKOK') sPokok -= amt;
                        else if (s.type === 'WAJIB') sWajib -= amt;
                        else if (s.type === 'SUKARELA') sSukarela -= amt;
                    }
                });

                // Fetch Outstanding Loans (UNPAID installments)
                const { data: unpaidInsts } = await supabase
                    .from('angsuran')
                    .select('*, pinjaman(*)')
                    .eq('personal_data_id', member.id)
                    .eq('status', 'UNPAID');

                let oPokok = 0, oBunga = 0;
                unpaidInsts?.forEach(inst => {
                    const loan = inst.pinjaman;
                    if (loan) {
                        const principal = parseFloat(loan.jumlah_pinjaman || 0);
                        const tenor = loan.tenor_bulan || 1;
                        let totalBunga = 0;
                        if (loan.tipe_bunga === 'PERSENAN') {
                            totalBunga = principal * (parseFloat(loan.nilai_bunga || 0) / 100) * (tenor / 12);
                        } else if (loan.tipe_bunga === 'NOMINAL') {
                            totalBunga = parseFloat(loan.nilai_bunga || 0);
                        }
                        oBunga += (totalBunga / tenor);
                        oPokok += (principal / tenor);
                    }
                });

                return {
                    id: member.id,
                    type: 'EXIT',
                    no_ref: member.no_npp,
                    nama: member.full_name,
                    npp: member.no_npp,
                    uraian: 'UNDUR DIRI',
                    unit_kerja: member.work_unit,
                    masuk: 0,
                    keluar: 0,
                    simp_pokok: sPokok,
                    simp_wajib: sWajib,
                    simp_sukarela: sSukarela,
                    jumlah: sPokok + sWajib + sSukarela,
                    outs_pokok: Math.round(oPokok),
                    outs_bunga: Math.round(oBunga),
                    admin: 5000,
                    no_rek: `${member.rek_gaji || '-'} (${member.bank_gaji || '-'})`,
                    tgl_real: member.exit_realisasi_date,
                    status: member.exit_realisasi_status,
                    company: member.company
                };
            }));

            setLoans(processedExits);
        } catch (error) {
            console.error('Error fetching realisasi data:', error);
            alert('Gagal memuat data realisasi');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelivery = async (item) => {
        if (!window.confirm(`Konfirmasi bahwa pengembalian simpanan untuk ${item.nama} telah dikirimkan?`)) return;

        try {
            setUpdatingId(item.id);
            const { error } = await supabase
                .from('personal_data')
                .update({
                    exit_realisasi_status: 'SENT',
                    exit_realisasi_date: new Date().toISOString()
                })
                .eq('id', item.id);
            if (error) throw error;

            alert('Status pengiriman berhasil diperbarui!');

            fetchRealisasiData();
        } catch (error) {
            console.error('Error updating delivery status:', error);
            alert('Gagal memperbarui status: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleBulkConfirm = async () => {
        const items = filteredData.filter(i => selectedIds.includes(i.id));
        if (items.length === 0) return;

        if (!window.confirm(`Konfirmasi realisasi untuk ${items.length} anggota terpilih?`)) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('personal_data')
                .update({
                    exit_realisasi_status: 'SENT',
                    exit_realisasi_date: new Date().toISOString()
                })
                .in('id', selectedIds);

            if (error) throw error;

            alert(`Berhasil merealisasikan ${items.length} pengembalian!`);

            setSelectedIds([]);
            fetchRealisasiData();
        } catch (err) {
            console.error('Bulk confirm error:', err);
            alert('Gagal memproses realisasi massal');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredData.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredData.map(i => i.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const calculateSelectedTotal = () => {
        return filteredData
            .filter(i => selectedIds.includes(i.id))
            .reduce((sum, i) => sum + (i.jumlah - i.outs_pokok - i.outs_bunga - i.admin), 0);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const filteredData = loans.filter(item => {
        const matchesSearch = item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.npp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.no_ref?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompany = filterCompany === 'ALL' || item.company === filterCompany;
        return matchesSearch && matchesCompany;
    });

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                <div className="text-left">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tight">Realisasi Karyawan</h2>
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

                {/* Filters Wrapper */}
                <div className="flex flex-col md:flex-row flex-wrap gap-3 items-stretch md:items-end">
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama atau NPP..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-bold shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-bold shadow-sm"
                        />
                        <span className="text-gray-400 font-bold">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-bold shadow-sm"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="w-full pl-4 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-bold appearance-none shadow-sm min-w-[180px]"
                        >
                            <option value="ALL">Semua PT</option>
                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {activeTab === 'BELUM' && (
                        <button
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                if (isSelectionMode) setSelectedIds([]);
                            }}
                            className={`flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all shadow-sm border ${isSelectionMode ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'}`}
                        >
                            <CheckCircle size={16} />
                            {isSelectionMode ? 'Batal' : 'Pilih Masal'}
                        </button>
                    )}

                    <button
                        onClick={handleExportExcel}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 h-[40px]"
                    >
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-auto max-h-[70vh] text-left">
                    <table className="w-full text-left border-collapse table-auto min-w-[1500px]">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                            <tr className="italic font-black text-[10px] tracking-tighter text-slate-700">
                                <th className="px-1 py-2 text-center w-8 border-r border-slate-200">
                                    {isSelectionMode && (
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                    )}
                                </th>
                                <th className="px-1 py-2 text-center w-8 border-r border-slate-200">No</th>
                                <th className="px-2 py-2 border-r border-slate-200">Nama</th>
                                <th className="px-2 py-2 border-r border-slate-200 text-center">NPP</th>
                                <th className="px-2 py-2 border-r border-slate-200">Uraian</th>
                                <th className="px-2 py-2 border-r border-slate-200">Unit Kerja</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200">Masuk</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200">Keluar</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200">Pkk</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200">Wjb</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200">Skr</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200 font-black">Sum</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200">Outs.P</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200">Outs.B</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200">Adm</th>
                                <th className="px-2 py-2 text-right border-r border-slate-200 text-emerald-700 bg-emerald-50/50">Return</th>
                                <th className="px-2 py-2 border-r border-slate-200 text-center">No Rek</th>
                                <th className="px-2 py-2 text-center border-r border-slate-200">Tgl Real</th>
                                <th className="px-2 py-2 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="20" className="px-6 py-12 text-center text-slate-500">
                                        <Loader2 className="animate-spin h-8 w-8 text-emerald-600 mx-auto mb-4" />
                                        <p className="text-[10px] font-black tracking-widest italic opacity-50">Memuat data...</p>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="20" className="px-6 py-20 text-center text-slate-400 italic font-black text-[10px] tracking-widest">
                                        <Banknote size={40} className="mx-auto mb-4 opacity-20" />
                                        <p>Tidak ada data realisasi karyawan</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item, idx) => {
                                    const netBack = item.jumlah - item.outs_pokok - item.outs_bunga - item.admin;

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-emerald-50 transition-colors group ${(isSelectionMode && selectedIds.includes(item.id)) ? 'bg-emerald-50/70 shadow-inner' : ''}`}
                                            onClick={() => isSelectionMode && toggleSelect(item.id)}
                                        >
                                            <td className="px-1 py-1 text-center border-r border-slate-200" onClick={(e) => isSelectionMode && e.stopPropagation()}>
                                                {isSelectionMode && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(item.id)}
                                                        onChange={() => toggleSelect(item.id)}
                                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-1 py-1 text-center text-[9px] font-bold text-slate-400 border-r border-slate-200">{idx + 1}</td>
                                            <td className="px-2 py-1 text-[11px] font-black text-slate-900 italic whitespace-nowrap border-r border-slate-200 tracking-tight leading-none">
                                                {item.nama}
                                            </td>
                                            <td className="px-2 py-1 text-[10px] font-bold text-slate-500 font-mono italic text-center border-r border-slate-200">{item.npp}</td>
                                            <td className="px-2 py-1 text-[10px] font-black text-blue-600 italic tracking-tighter border-r border-slate-200 leading-none">{item.uraian}</td>
                                            <td className="px-2 py-1 text-[10px] font-bold text-slate-400 italic truncate max-w-[80px] border-r border-slate-200 leading-none">{item.unit_kerja || '-'}</td>
                                            <td className="px-2 py-1 text-right text-[10px] font-bold text-slate-400 font-mono border-r border-slate-200">{formatCurrency(item.masuk)}</td>
                                            <td className="px-2 py-1 text-right text-[10px] font-bold text-slate-400 font-mono border-r border-slate-200">{formatCurrency(item.keluar)}</td>
                                            <td className="px-2 py-1 text-right text-[10px] font-bold text-emerald-600 font-mono border-r border-slate-200">{formatCurrency(item.simp_pokok)}</td>
                                            <td className="px-2 py-1 text-right text-[10px] font-bold text-emerald-600 font-mono border-r border-slate-200">{formatCurrency(item.simp_wajib)}</td>
                                            <td className="px-2 py-1 text-right text-[10px] font-bold text-emerald-600 font-mono border-r border-slate-200">{formatCurrency(item.simp_sukarela)}</td>
                                            <td className="px-2 py-1 text-right text-[10px] font-black text-slate-700 font-mono border-r border-slate-200">{formatCurrency(item.jumlah)}</td>
                                            <td className="px-2 py-1 text-right text-[10px] font-black text-red-500 font-mono italic border-r border-slate-200">{formatCurrency(item.outs_pokok)}</td>
                                            <td className="px-2 py-1 text-right text-[10px] font-bold text-red-400 font-mono italic border-r border-slate-200">{formatCurrency(item.outs_bunga)}</td>
                                            <td className="px-2 py-1 text-right text-[10px] font-bold text-slate-500 font-mono italic border-r border-slate-200">{formatCurrency(item.admin)}</td>
                                            <td className="px-2 py-1 text-right text-[11px] font-black text-emerald-700 font-mono bg-emerald-50/30 border-r border-slate-200 whitespace-nowrap italic">
                                                {formatCurrency(netBack)}
                                            </td>
                                            <td className="px-2 py-1 text-[9px] font-mono font-bold text-slate-500 italic whitespace-nowrap border-r border-slate-200 text-center tracking-tighter leading-none">{item.no_rek}</td>
                                            <td className="px-2 py-1 text-center text-[10px] font-black text-emerald-600 italic border-r border-slate-200 whitespace-nowrap">
                                                {item.tgl_real ? new Date(item.tgl_real).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                                {item.status !== 'SENT' ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleConfirmDelivery(item); }}
                                                        disabled={updatingId === item.id}
                                                        className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black tracking-tight hover:bg-emerald-700 transition-all disabled:opacity-50 mx-auto shadow-sm"
                                                    >
                                                        {updatingId === item.id ? <Loader2 className="animate-spin" size={10} /> : <CheckCircle size={10} />}
                                                        OK
                                                    </button>
                                                ) : (
                                                    <span className="text-[9px] font-black text-slate-300 italic tracking-widest">Sent</span>
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

            {/* DATA COUNT FOOTER */}
            <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <p className="text-xs font-black text-gray-400 tracking-widest italic">
                    Menampilkan <span className="text-emerald-600">{filteredData.length}</span> Data Terpilih
                </p>
                <p className="text-[10px] font-bold text-gray-300 italic">
                    Kopssi Management System • {new Date().getFullYear()}
                </p>
            </div>

            {/* Selection Summary Popup/Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-gray-900 border border-white/10 text-white rounded-2xl shadow-2xl shadow-black/40 px-8 py-5 flex items-center gap-10 backdrop-blur-md">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-emerald-400 italic">Terpilih</span>
                            <span className="text-2xl font-black italic">{selectedIds.length} <span className="text-sm not-italic opacity-50 tracking-tighter">Record</span></span>
                        </div>

                        <div className="h-10 w-[1px] bg-white/10"></div>

                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-emerald-400 italic">Total Pengembalian</span>
                            <span className="text-2xl font-black italic font-mono text-emerald-400">{formatCurrency(calculateSelectedTotal())}</span>
                        </div>

                        <div className="flex gap-3 ml-4">
                            <button
                                onClick={() => setSelectedIds([])}
                                className="px-6 py-3 border border-white/20 hover:bg-white/10 rounded-xl text-xs font-black transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleBulkConfirm}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
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

export default RealisasiKaryawan;
