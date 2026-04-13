import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Info, ClipboardCheck } from 'lucide-react';

const UploadPinjaman = () => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [uploadStats, setUploadStats] = useState({ matched: 0, unmatched: 0 });

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

                // Try to find the header row (containing 'NIK')
                const range = XLSX.utils.decode_range(worksheet['!ref']);
                let headerRowIndex = 0;
                for (let r = range.s.r; r <= range.e.r; r++) {
                    let isHeader = false;
                    for (let c = range.s.c; c <= range.e.c; c++) {
                        const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
                        const val = cell ? String(cell.v).toUpperCase() : '';
                        if (val === 'NIK' || val === 'NOPEG') {
                            isHeader = true;
                            break;
                        }
                    }
                    if (isHeader) {
                        headerRowIndex = r;
                        break;
                    }
                }

                const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });
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
            // Fetch all unpaid installments (angsuran) joined with pinjaman and personal_data
            const { data: unpaidAngsuran, error } = await supabase
                .from('angsuran')
                .select(`
                    *,
                    pinjaman (
                        no_pinjaman,
                        personal_data:personal_data_id (
                            full_name,
                            nik
                        )
                    )
                `)
                .or('status.is.null,status.eq.UNPAID');

            if (error) throw error;

            const results = excelData.map(row => {
                // Mapping from Tagihan Excel: NOPEG, NAMAPEG, NoAnggota, JMLGAJI, KETERANGAN1, KETERANGAN2, KETERANGAN3, STATUS
                const excelNIK = String(row.NOPEG || row.nik || row.NIK || '').trim();
                const excelID = String(row.KETERANGAN2 || '').trim(); // Format: NoPinj-BulanKe
                const excelNoPinj = String(row.KETERANGAN3 || row['No Pinjaman'] || '').trim();
                const excelStatus = String(row.STATUS || row.status || '').toUpperCase();

                // Only match if the status in Excel is PROCESSED or LUNAS
                const isPaidInExcel = excelStatus === 'PROCESSED' || excelStatus === 'LUNAS' || excelStatus === 'PAID';

                const match = isPaidInExcel ? unpaidAngsuran.find(db => {
                    const dbNIK = String(db.pinjaman?.personal_data?.nik).trim();
                    const dbNoPinj = String(db.pinjaman?.no_pinjaman).trim();
                    const dbBulan = String(db.bulan_ke).trim();
                    const dbID = `${dbNoPinj}-${dbBulan}`;

                    // Primary match by KETERANGAN2 (ID)
                    if (excelID && excelID === dbID) return true;

                    // Fallback match by NIK + NoPinj (if ID missing)
                    if (!excelID && excelNIK === dbNIK && excelNoPinj === dbNoPinj) return true;

                    return false;
                }) : null;

                return {
                    excelData: row,
                    dbMatch: match,
                    status: match ? 'MATCHED' : (isPaidInExcel ? 'UNMATCHED' : 'SKIPPED')
                };
            });

            setPreviewData(results);
            setUploadStats({
                matched: results.filter(r => r.status === 'MATCHED').length,
                unmatched: results.filter(r => r.status === 'UNMATCHED').length
            });
        } catch (error) {
            console.error('Error matching data:', error);
            alert('Gagal melakukan sinkronisasi data');
        }
    };

    const handleProcessPayments = async () => {
        const matchedItems = previewData.filter(r => r.status === 'MATCHED');
        if (matchedItems.length === 0) return;

        if (!window.confirm(`Konfirmasi pembayaran untuk ${matchedItems.length} angsuran yang cocok?`)) return;

        try {
            setProcessing(true);
            const now = new Date().toISOString();
            const idsToUpdate = matchedItems.map(m => m.dbMatch.id);

            const { error } = await supabase
                .from('angsuran')
                .update({
                    status: 'PROCESSED',
                    tanggal_bayar: now
                })
                .in('id', idsToUpdate);

            if (error) throw error;

            alert('Berhasil memproses angsuran massal!');
            setPreviewData([]);
            setFile(null);
            setUploadStats({ matched: 0, unmatched: 0 });
        } catch (error) {
            console.error('Error processing bulk installments:', error);
            alert('Terjadi kesalahan saat mengupdate data angsuran');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                <div className="text-left">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tight">Bulk Upload Angsuran</h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium italic">Update status angsuran pinjaman via Excel</p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center space-y-4 hover:border-blue-400 transition-colors group">
                <div className="p-4 bg-blue-50 rounded-full text-blue-600 group-hover:scale-110 transition-transform">
                    <ClipboardCheck size={32} />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">
                        {file ? file.name : 'Pilih file Excel untuk diunggah'}
                    </p>
                    <p className="text-sm text-gray-400">Pastikan format kolom sesuai (NOPEG, NAMAPEG, NoAnggota, KETERANGAN2, STATUS)</p>
                </div>
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-upload-pinjaman"
                />
                <label
                    htmlFor="excel-upload-pinjaman"
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 cursor-pointer shadow-lg shadow-blue-100 transition"
                >
                    {file ? 'Ganti File' : 'Cari File'}
                </label>
            </div>

            {/* Guidance */}
            {!previewData.length && (
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex gap-4 text-blue-900 shadow-sm shadow-blue-100/50">
                    <Info size={24} className="shrink-0" />
                    <div className="text-xs space-y-2">
                        <p className="font-black italic text-sm">💡 Tips: Gunakan File Monitoring</p>
                        <p className="font-medium leading-relaxed opacity-90">
                            Anda dapat mengunduh data dari menu <strong>Tagihan Angsuran</strong>, mengubah kolom <strong>STATUS</strong> menjadi <strong>PROCESSED</strong> untuk tiap baris yang telah dibayar, lalu unggah kembali file tersebut di sini.
                        </p>
                        <ul className="list-disc ml-4 space-y-1 font-bold opacity-80 mt-2">
                            <li>Kolom Wajib: <strong>NOPEG</strong>, <strong>NoAnggota</strong>, <strong>KETERANGAN2</strong>, <strong>STATUS</strong></li>
                            <li>Hanya baris dengan Status <strong>PROCESSED</strong> yang akan diproses</li>
                            <li>Hanya data yang saat ini berstatus <strong>Kosong/UNPAID</strong> di sistem yang dapat diperbarui</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Preview Section */}
            {previewData.length > 0 && (
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex gap-6">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400">Matched</p>
                            <p className="text-xl font-bold text-blue-600">{uploadStats.matched}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400">Unmatched</p>
                            <p className="text-xl font-bold text-red-500">{uploadStats.unmatched}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleProcessPayments}
                        disabled={uploadStats.matched === 0 || processing}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all shadow-sm flex items-center gap-2"
                    >
                        {processing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                        Update Data Angsuran
                    </button>
                </div>
            )}
            {/* Preview Table */}
            {previewData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-auto max-h-[60vh] text-left">
                        <table className="w-full text-left border-collapse table-auto">
                            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                                <tr>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">Validasi</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 text-center">Nopeg</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">ID Tagihan</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">Anggota</th>
                                    <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {previewData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50 transition-colors group">
                                        <td className="px-2 py-1 border-r border-slate-200">
                                            {row.status === 'MATCHED' ? (
                                                <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-black italic shadow-sm">Match</span>
                                            ) : (
                                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[8px] font-black italic">Missing</span>
                                            )}
                                        </td>
                                        <td className="px-2 py-1 text-[10px] font-bold text-slate-500 font-mono italic text-center border-r border-slate-200 whitespace-nowrap leading-none">
                                            {row.excelData.NOPEG || row.excelData.nik || '-'}
                                        </td>
                                        <td className="px-2 py-1 text-[10px] font-bold text-slate-400 font-mono border-r border-slate-200 tracking-tighter leading-none whitespace-nowrap">
                                            {row.excelData.KETERANGAN2 || '-'}
                                        </td>
                                        <td className="px-2 py-1 text-[11px] font-black text-slate-900 italic tracking-tight border-r border-slate-200 leading-none truncate max-w-[200px]">
                                            {row.dbMatch?.pinjaman?.personal_data?.full_name || 'No Match'}
                                        </td>
                                        <td className="px-2 py-1 text-right font-black text-blue-700 text-[11px] font-mono italic leading-none whitespace-nowrap">
                                            {row.dbMatch ? parseFloat(row.dbMatch.amount).toLocaleString('id-ID') : '-'}
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

export default UploadPinjaman;
