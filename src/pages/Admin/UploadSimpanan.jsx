import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Info, Download, Filter } from 'lucide-react';
import { exportMonitoringSimpanan } from '../../utils/reportExcel';
import { useEffect } from 'react';

const UploadSimpanan = () => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [uploadStats, setUploadStats] = useState({ matched: 0, unmatched: 0 });
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substring(0, 7);
    });
    const [selectedPT, setSelectedPT] = useState('ALL');
    const [companies, setCompanies] = useState([]);
    const [memberCount, setMemberCount] = useState(0);

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (selectedPT !== 'ALL') {
            fetchMemberCount();
        } else {
            setMemberCount(0);
        }
    }, [selectedPT]);

    const fetchMemberCount = async () => {
        try {
            const { count, error } = await supabase
                .from('personal_data')
                .select('*', { count: 'exact', head: true })
                .eq('company', selectedPT)
                .eq('status', 'active');

            if (error) throw error;
            setMemberCount(count || 0);
        } catch (err) {
            console.error("Error fetching member count:", err);
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

    const handleExportTemplate = async () => {
        if (selectedPT === 'ALL') {
            alert('Silakan pilih PT terlebih dahulu untuk mengunduh template');
            return;
        }

        try {
            setLoading(true);
            const { data: members, error } = await supabase
                .from('personal_data')
                .select('nik, full_name, tagihan_parkir, created_at')
                .eq('company', selectedPT)
                .eq('status', 'active');

            if (error) throw error;

            if (!members || members.length === 0) {
                alert(`Tidak ada anggota aktif untuk PT ${selectedPT}`);
                return;
            }

            // Pass the target month/year for smart template calculation
            const [yearStr, monthStr] = selectedMonth.split('-');
            const yearNum = parseInt(yearStr, 10);
            const monthNum = parseInt(monthStr, 10);

            const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const targetMonthStr = `${monthNames[monthNum - 1]} ${yearNum}`;

            exportMonitoringSimpanan(members, { targetMonth: targetMonthStr, month: monthNum, year: yearNum }, 'TEMPLATE');
        } catch (err) {
            console.error('Error exporting template:', err);
            alert('Gagal mengunduh template');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseExcel(selectedFile);
        }
    };

    const parseExcel = async (file) => {
        try {
            setLoading(true);
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                await matchWithDatabase(jsonData);
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error parsing excel:', error);
            alert('Gagal membaca file Excel');
        } finally {
            setLoading(false);
        }
    };

    const matchWithDatabase = async (excelData) => {
        try {
            // Fetch all active members to validate against
            const { data: members, error } = await supabase
                .from('personal_data')
                .select('id, full_name, nik')
                .eq('status', 'active');

            if (error) throw error;

            const results = excelData.map(row => {
                const excelNIK = String(row.NIK || row['NIK'] || '').trim();
                const amountPokok = parseFloat(row['Simpanan Pokok'] || 0);
                const amountWajib = parseFloat(row['Simpanan Wajib'] || 0);
                const amountWajibKhusus = parseFloat(row['Simpanan Wajib Khusus'] || 0);
                const amountSukarela = parseFloat(row['Simpanan Sukarela'] || 0);
                const amountParkir = parseFloat(row['PARKIR'] || 0);

                const match = members.find(m => String(m.nik).trim() === excelNIK);

                return {
                    excelData: row,
                    dbMatch: match,
                    amountPokok,
                    amountWajib,
                    amountWajibKhusus,
                    amountSukarela,
                    amountParkir,
                    status: match ? 'VALID' : 'INVALID'
                };
            });

            setPreviewData(results);
            setUploadStats({
                matched: results.filter(r => r.status === 'VALID').length,
                unmatched: results.filter(r => r.status === 'INVALID').length
            });
        } catch (error) {
            console.error('Error matching data:', error);
            alert('Gagal melakukan validasi data anggota');
        }
    };

    const handleProcessUpload = async () => {
        const validItems = previewData.filter(r => r.status === 'VALID' && (r.amountPokok > 0 || r.amountWajib > 0 || r.amountWajibKhusus > 0 || r.amountSukarela > 0 || r.amountParkir > 0));
        if (validItems.length === 0) {
            alert('Tidak ada data valid dengan nominal simpanan untuk diproses');
            return;
        }

        if (!window.confirm(`Konfirmasi simpanan untuk ${validItems.length} anggota untuk periode ${selectedMonth}?`)) return;

        try {
            setProcessing(true);

            // Generate bulan_ke from selectedMonth (e.g., 2026-02 -> 2)
            const bulanKe = parseInt(selectedMonth.split('-')[1], 10);
            const jatuhTempo = `${selectedMonth}-01`;

            const inserts = [];
            validItems.forEach(item => {
                if (item.amountPokok > 0) {
                    inserts.push({
                        personal_data_id: item.dbMatch.id,
                        type: 'POKOK',
                        amount: item.amountPokok,
                        status: 'PAID',
                        transaction_type: 'SETOR',
                        bulan_ke: bulanKe,
                        jatuh_tempo: jatuhTempo,
                        created_at: new Date().toISOString()
                    });
                }
                if (item.amountWajib > 0) {
                    inserts.push({
                        personal_data_id: item.dbMatch.id,
                        type: 'WAJIB',
                        amount: item.amountWajib,
                        status: 'PAID',
                        transaction_type: 'SETOR',
                        bulan_ke: bulanKe,
                        jatuh_tempo: jatuhTempo,
                        created_at: new Date().toISOString()
                    });
                }
                if (item.amountWajibKhusus > 0) {
                    inserts.push({
                        personal_data_id: item.dbMatch.id,
                        type: 'WAJIB_KHUSUS',
                        amount: item.amountWajibKhusus,
                        status: 'PAID',
                        transaction_type: 'SETOR',
                        bulan_ke: bulanKe,
                        jatuh_tempo: jatuhTempo,
                        created_at: new Date().toISOString()
                    });
                }
                if (item.amountSukarela > 0) {
                    inserts.push({
                        personal_data_id: item.dbMatch.id,
                        type: 'SUKARELA',
                        amount: item.amountSukarela,
                        status: 'PAID',
                        transaction_type: 'SETOR',
                        bulan_ke: bulanKe,
                        jatuh_tempo: jatuhTempo,
                        created_at: new Date().toISOString()
                    });
                }
                if (item.amountParkir > 0) {
                    inserts.push({
                        personal_data_id: item.dbMatch.id,
                        type: 'PARKIR',
                        amount: item.amountParkir,
                        status: 'PAID',
                        transaction_type: 'SETOR',
                        bulan_ke: bulanKe,
                        jatuh_tempo: jatuhTempo,
                        created_at: new Date().toISOString()
                    });
                }
            });

            const { error } = await supabase
                .from('simpanan')
                .insert(inserts);

            if (error) throw error;

            alert(`Berhasil menginput ${inserts.length} record simpanan!`);
            setPreviewData([]);
            setFile(null);
            setUploadStats({ matched: 0, unmatched: 0 });
        } catch (error) {
            console.error('Error processing bulk insertion:', error);
            alert('Terjadi kesalahan saat menyimpan data: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Unified Header Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Title Row */}
                <div className="px-5 pt-5 pb-4 border-b border-gray-100">
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 italic tracking-tight leading-none">Upload Simpanan Massal</h2>
                    <p className="text-[11px] text-gray-400 mt-1 font-medium italic tracking-tight">Input iuran anggota secara massal via Excel</p>
                </div>
                {/* Filters Row */}
                <div className="px-5 py-3 flex flex-col sm:flex-row flex-wrap gap-3 items-center bg-gray-50/60">
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={selectedPT}
                            onChange={(e) => setSelectedPT(e.target.value)}
                            className="w-full pl-4 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-bold appearance-none shadow-sm min-w-[200px]"
                        >
                            <option value="ALL">Pilih PT</option>
                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    {selectedPT !== 'ALL' && (
                        <div className="flex items-center gap-2 animate-in zoom-in duration-300">
                            <span className="text-[10px] font-black text-gray-400 italic">Jumlah Karyawan:</span>
                            <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-xs font-black text-blue-600 italic">
                                {memberCount} Orang
                            </div>
                        </div>
                    )}
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-bold shadow-sm w-full sm:w-auto"
                    />
                    <button
                        onClick={handleExportTemplate}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-black hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 w-full sm:w-auto justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                        Export Template
                    </button>
                </div>
            </div>

            {/* Upload Area */}
            <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                    <Upload size={32} />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">
                        {file ? file.name : 'Pilih file Excel untuk diunggah'}
                    </p>
                    <p className="text-sm text-gray-400">Gunakan template yang sesuai untuk mapping data nggota</p>
                </div>
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-upload"
                />
                <label
                    htmlFor="excel-upload"
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 cursor-pointer transition-all shadow-sm"
                >
                    {file ? 'Ganti File' : 'Pilih File'}
                </label>
            </div>

            {/* Guidance */}
            {!previewData.length && (
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex gap-4 text-emerald-900 shadow-sm shadow-emerald-100/50">
                    <Info size={24} className="shrink-0" />
                    <div className="text-xs space-y-2">
                        <p className="font-black uppercase tracking-tight italic text-sm">💡 Langkah-langkah:</p>
                        <ul className="list-decimal ml-4 space-y-1 font-bold opacity-80 mt-2">
                            <li>Buka menu <strong>Monitoring Simpanan</strong></li>
                            <li>Klik tombol <strong>Export</strong> dan pilih <strong>Unduh Template Upload</strong></li>
                            <li>Isi nominal <strong>Simpanan Pokok</strong> dan <strong>Simpanan Wajib</strong> pada file Excel</li>
                            <li>Pilih <strong>Periode Simpanan</strong> yang sesuai di halaman ini</li>
                            <li>Unggah file yang sudah diisi dan klik <strong>Proses Simpanan</strong></li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Preview Section */}
            {previewData.length > 0 && (
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex gap-6">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Valid</p>
                            <p className="text-xl font-bold text-emerald-600">{uploadStats.matched}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Error</p>
                            <p className="text-xl font-bold text-red-500">{uploadStats.unmatched}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleProcessUpload}
                        disabled={uploadStats.matched === 0 || processing}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all shadow-sm flex items-center gap-2"
                    >
                        {processing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                        Simpan Data Ke Database
                    </button>
                </div>
            )}            {/* Preview Table */}
            {previewData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-auto max-h-[60vh] text-left">
                        <table className="w-full text-left border-collapse table-auto">
                            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                                <tr className="text-gray-400">
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Validasi</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center bg-emerald-50/50">NIK</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 bg-emerald-50/50">Anggota</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-right bg-emerald-50/50">Pokok</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-right bg-emerald-50/50">Wajib</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-right bg-emerald-50/50">W.Khusus</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-right bg-emerald-50/50">Skr</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-right bg-emerald-50/50">Pkr</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic text-right bg-emerald-50/50">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {previewData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-emerald-50 transition-colors group">
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            {row.status === 'VALID' ? (
                                                <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-black uppercase tracking-tighter shadow-sm">MATCH</span>
                                            ) : (
                                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[8px] font-black uppercase tracking-tighter">MISSING</span>
                                            )}
                                        </td>
                                        <td className="px-2 py-1 text-[10px] font-bold text-slate-500 font-mono italic text-center border-r border-slate-200 leading-none">
                                            {row.excelData.NIK || row.excelData['NIK'] || '-'}
                                        </td>
                                        <td className="px-2 py-1 text-[11px] font-black text-slate-900 uppercase italic tracking-tight border-r border-slate-200 leading-none whitespace-nowrap">
                                            {row.dbMatch?.full_name || row.excelData['Nama Lengkap'] || '-'}
                                        </td>
                                        <td className="px-2 py-1 text-right text-[10px] font-bold text-slate-400 font-mono italic border-r border-slate-200 leading-none">
                                            {(row.amountPokok || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-2 py-1 text-right text-[10px] font-bold text-slate-400 font-mono italic border-r border-slate-200 leading-none">
                                            {(row.amountWajib || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-2 py-1 text-right text-[10px] font-bold text-slate-400 font-mono italic border-r border-slate-200 leading-none">
                                            {(row.amountWajibKhusus || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-2 py-1 text-right text-[10px] font-bold text-slate-400 font-mono italic border-r border-slate-200 leading-none">
                                            {(row.amountSukarela || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-2 py-1 text-right text-[10px] font-bold text-slate-400 font-mono italic border-r border-slate-200 leading-none">
                                            {(row.amountParkir || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-2 py-1 text-right font-black text-emerald-700 text-[11px] font-mono italic leading-none whitespace-nowrap">
                                            {(row.amountPokok + row.amountWajib + row.amountWajibKhusus + row.amountSukarela + row.amountParkir).toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadSimpanan;
