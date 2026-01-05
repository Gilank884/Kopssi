import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';

const UploadSimpanan = () => {
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
            // Fetch all unpaid savings to match against
            const { data: unpaidSimpanan, error } = await supabase
                .from('simpanan')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        full_name,
                        nik
                    )
                `)
                .eq('status', 'UNPAID');

            if (error) throw error;

            const results = excelData.map(row => {
                // Try to find match by NIK + Reference (ID or Bulan Ke)
                // Assuming Excel columns: NIK, Nama, Referensi, Status
                const excelNIK = String(row.NIK || row.nik || '').trim();
                const excelRef = String(row.Referensi || row.referensi || row['ID Simpanan'] || '').trim();

                const match = unpaidSimpanan.find(db =>
                    String(db.personal_data?.nik).trim() === excelNIK &&
                    (String(db.id).trim() === excelRef || String(db.bulan_ke).trim() === excelRef)
                );

                return {
                    excelData: row,
                    dbMatch: match,
                    status: match ? 'MATCHED' : 'UNMATCHED'
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

        if (!window.confirm(`Konfirmasi pembayaran untuk ${matchedItems.length} data yang cocok?`)) return;

        try {
            setProcessing(true);
            const idsToUpdate = matchedItems.map(m => m.dbMatch.id);

            const { error } = await supabase
                .from('simpanan')
                .update({
                    status: 'PAID',
                    updated_at: new Date().toISOString()
                })
                .in('id', idsToUpdate);

            if (error) throw error;

            alert('Berhasil memproses pembayaran massal!');
            setPreviewData([]);
            setFile(null);
            setUploadStats({ matched: 0, unmatched: 0 });
        } catch (error) {
            console.error('Error processing bulk payment:', error);
            alert('Terjadi kesalahan saat mengupdate data');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-gray-900 italic uppercase tracking-tight">Bulk Upload Simpanan</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium italic uppercase tracking-wider">Update status iuran anggota via Excel</p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center space-y-4 hover:border-emerald-400 transition-colors group">
                <div className="p-4 bg-emerald-50 rounded-full text-emerald-600 group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">
                        {file ? file.name : 'Pilih file Excel untuk diunggah'}
                    </p>
                    <p className="text-sm text-gray-400">Pastikan format kolom sesuai (NIK, Nama, Referensi, Status)</p>
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
                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 cursor-pointer shadow-lg shadow-emerald-100 transition"
                >
                    {file ? 'Ganti File' : 'Cari File'}
                </label>
            </div>

            {/* Guidance */}
            {!previewData.length && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-800">
                    <Info size={20} className="shrink-0" />
                    <div className="text-xs space-y-1">
                        <p className="font-bold uppercase tracking-tight italic">Petunjuk Format Excel:</p>
                        <ul className="list-disc ml-4 space-y-1 opacity-80">
                            <li>Gunakan kolom <strong>NIK</strong> (wajib)</li>
                            <li>Gunakan kolom <strong>Referensi</strong> (diisi dengan ID Simpanan atau Nomor Bulan ke-X)</li>
                            <li>Hanya data dengan status <strong>UNPAID</strong> di sistem yang akan dicocokkan</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Statistics & Actions */}
            {previewData.length > 0 && (
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex gap-6">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase italic">Matched</p>
                            <p className="text-2xl font-black text-emerald-600 italic">{uploadStats.matched}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase italic">Unmatched</p>
                            <p className="text-2xl font-black text-red-500 italic">{uploadStats.unmatched}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleProcessPayments}
                        disabled={uploadStats.matched === 0 || processing}
                        className="w-full md:w-auto px-8 py-3 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Memproses...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                Proses Pembayaran LUNAS
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Preview Table */}
            {previewData.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 italic font-black text-[10px] uppercase tracking-widest text-gray-400">
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Excel NIK</th>
                                    <th className="px-6 py-4">System Member</th>
                                    <th className="px-6 py-4">Excel Ref</th>
                                    <th className="px-6 py-4">System Ref</th>
                                    <th className="px-6 py-4">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {previewData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            {row.status === 'MATCHED' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 italic">
                                                    <CheckCircle2 size={12} /> OK
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-500 italic">
                                                    <AlertCircle size={12} /> Unknown
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900 tabular-nums">{row.excelData.NIK || row.excelData.nik || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900 uppercase italic">{row.dbMatch?.personal_data?.full_name || row.excelData.Nama || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-medium text-gray-500">{row.excelData.Referensi || row.excelData.referensi || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-black text-gray-900 italic uppercase">{row.dbMatch ? `ID: ${row.dbMatch.id} (Bulan ${row.dbMatch.bulan_ke})` : '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-black text-gray-900 tabular-nums italic">
                                                {row.dbMatch ? `Rp ${parseFloat(row.dbMatch.amount).toLocaleString('id-ID')}` : '-'}
                                            </p>
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
