import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { CreditCard, CalendarDays, FileText, Wallet, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const PengajuanHutang = () => {
    const containerRef = useRef(null);
    const [formData, setFormData] = useState({
        full_name: '',
        no_npp: '',
        jumlah_pinjaman: '',
        tenor_bulan: '',
        kategori: 'UANG',
        jenis_pinjaman: 'BIASA',
        keperluan: ''
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [personalDataId, setPersonalDataId] = useState(null);
    const [loans, setLoans] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Ambil user_id dari localStorage (seperti di DashboardLayout)
                const storedUser = localStorage.getItem('auth_user');
                if (!storedUser) {
                    setLoading(false);
                    setError("Anda belum login. Silakan login terlebih dahulu.");
                    return;
                }

                const authUser = JSON.parse(storedUser);
                if (!authUser || !authUser.id) {
                    setLoading(false);
                    setError("Data user tidak ditemukan. Silakan login ulang.");
                    return;
                }

                // Query personal_data berdasarkan user_id
                const { data: personalData, error: fetchError } = await supabase
                    .from('personal_data')
                    .select('id, full_name, no_npp')
                    .eq('user_id', authUser.id)
                    .single();

                if (fetchError) {
                    console.error("Error fetching personal details:", fetchError);
                    setError("Gagal memuat data profil. Silakan coba lagi.");
                }

                if (personalData) {
                    setFormData(prev => ({
                        ...prev,
                        full_name: personalData.full_name || '',
                        no_npp: personalData.no_npp || ''
                    }));
                    setPersonalDataId(personalData.id);

                    // Ambil semua riwayat pinjaman
                    const { data: loanData, error: loanError } = await supabase
                        .from('pinjaman')
                        .select('*')
                        .eq('personal_data_id', personalData.id)
                        .order('created_at', { ascending: false });

                    if (!loanError && loanData) {
                        setLoans(loanData);
                    }
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
                setError("Terjadi kesalahan saat memuat data.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.loan-card-anim', {
                y: 20,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power2.out',
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;

        if (name === 'jumlah_pinjaman') {
            // Hapus karakter non-digit
            const rawValue = value.replace(/\D/g, '');
            // Tambahkan formatting ribuan dengan titik
            newValue = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }

        // Auto-set jenis_pinjaman based on kategori
        if (name === 'kategori') {
            setFormData((prev) => ({
                ...prev,
                kategori: newValue,
                jenis_pinjaman: newValue === 'UANG' ? 'BIASA' : 'BARANG'
            }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: newValue,
        }));
    };

    const generateLoanNumber = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `RS${year}${month}${day}-${random}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (!personalDataId) {
            setError("Data profil anggota tidak ditemukan. Silahkan lengkapi profil terlebih dahulu.");
            setSubmitting(false);
            return;
        }

        try {
            const noPinjaman = generateLoanNumber();

            // Insert Pinjaman (without interest calculation)
            const rawJumlahPinjaman = parseFloat(formData.jumlah_pinjaman.replace(/\./g, ''));
            const tenor = parseInt(formData.tenor_bulan);

            const { data: insertedLoan, error: insertError } = await supabase
                .from('pinjaman')
                .insert([
                    {
                        personal_data_id: personalDataId,
                        no_pinjaman: noPinjaman,
                        jumlah_pinjaman: rawJumlahPinjaman,
                        tenor_bulan: tenor,
                        status: 'PENGAJUAN',
                        kategori: formData.kategori,
                        jenis_pinjaman: formData.jenis_pinjaman,
                        keperluan: formData.keperluan,
                        tipe_bunga: null,
                        nilai_bunga: 0
                    }
                ])
                .select()
                .single();

            if (insertError) throw insertError;
            if (!insertedLoan) throw new Error("Gagal menyimpan data pinjaman.");

            // Success - no angsuran generation hereh data pengajuan setelah submit
            const { data: updatedLoans } = await supabase
                .from('pinjaman')
                .select('*')
                .eq('personal_data_id', personalDataId)
                .order('created_at', { ascending: false });

            if (updatedLoans) {
                setLoans(updatedLoans);
            }

            setSubmitted(true);
            setFormData(prev => ({
                ...prev,
                jumlah_pinjaman: '',
                tenor_bulan: '',
            }));

        } catch (err) {
            console.error("Error submitting loan:", err);
            setError("Gagal mengajukan pinjaman. " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Helper functions
    const getStatusLabel = (status) => {
        const labels = {
            'PENGAJUAN': 'Menunggu Verifikasi',
            'DISETUJUI': 'Disetujui',
            'DICAIRKAN': 'Dicairkan',
            'LUNAS': 'Lunas',
            'DITOLAK': 'Ditolak'
        };
        return labels[status] || status;
    };

    const getStatusDescription = (status) => {
        const descriptions = {
            'PENGAJUAN': 'Pengajuan sedang dalam proses verifikasi.',
            'DISETUJUI': 'Pengajuan telah disetujui, menunggu pencairan.',
            'DICAIRKAN': 'Pinjaman telah dicairkan.',
            'LUNAS': 'Pinjaman telah lunas.',
            'DITOLAK': 'Pengajuan ditolak.'
        };
        return descriptions[status] || '';
    };

    const getStatusIcon = (status) => {
        const iconClass = "w-8 h-8 rounded-full flex items-center justify-center";
        switch (status) {
            case 'PENGAJUAN':
                return <div className={`${iconClass} bg-amber-100 text-amber-600`}><Clock size={20} /></div>;
            case 'DISETUJUI':
                return <div className={`${iconClass} bg-blue-100 text-blue-600`}><CheckCircle size={20} /></div>;
            case 'DICAIRKAN':
                return <div className={`${iconClass} bg-emerald-100 text-emerald-600`}><CheckCircle size={20} /></div>;
            case 'DITOLAK':
                return <div className={`${iconClass} bg-red-100 text-red-600`}><XCircle size={20} /></div>;
            default:
                return <div className={`${iconClass} bg-gray-100 text-gray-600`}><FileText size={20} /></div>;
        }
    };

    return (
        <div ref={containerRef} className="space-y-6">
            {/* Info Ringkas */}



            {/* Form Pengajuan Pinjaman */}
            <div className="loan-card-anim bg-white rounded-2xl border border-emerald-100 shadow-sm">
                <div className="px-6 py-4 border-b border-emerald-50 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Form Pengajuan Pinjaman</h2>
                        <p className="text-xs text-gray-500">
                            Mohon isi data dengan lengkap dan sesuai. Pengajuan akan diverifikasi oleh pengurus koperasi.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Data Anggota */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
                                readOnly
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Data diambil dari profil anggota.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nomor Anggota
                            </label>
                            <input
                                type="text"
                                name="no_npp"
                                value={formData.no_npp}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
                                readOnly
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Sesuai No. NPP Anda.</p>
                        </div>
                    </div>

                    {/* Detail Pinjaman */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jumlah Pinjaman (Rp) *
                            </label>
                            <input
                                type="text"
                                name="jumlah_pinjaman"
                                value={formData.jumlah_pinjaman}
                                onChange={handleChange}
                                placeholder="Contoh: 5.000.000"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                required
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Isi nominal pinjaman. Minimum Rp 1.000.000</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tenor (bulan) *
                            </label>
                            <select
                                name="tenor_bulan"
                                value={formData.tenor_bulan}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                required
                            >
                                <option value="">Pilih tenor</option>
                                <option value="3">3 bulan</option>
                                <option value="6">6 bulan</option>
                                <option value="12">12 bulan</option>
                                <option value="18">18 bulan</option>
                                <option value="24">24 bulan</option>
                            </select>
                            <p className="text-[11px] text-gray-400 mt-1">Pilih jangka waktu pengembalian pinjaman</p>
                        </div>
                    </div>

                    {/* Kategori & Jenis Pinjaman */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kategori Pinjaman *
                            </label>
                            <select
                                name="kategori"
                                value={formData.kategori}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                required
                            >
                                <option value="UANG">UANG</option>
                                <option value="BARANG">BARANG</option>
                                <option value="SEPATU">SEPATU</option>
                                <option value="MOBIL">MOBIL</option>
                            </select>
                            <p className="text-[11px] text-gray-400 mt-1">Pilih kategori pinjaman yang sesuai</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jenis Pinjaman
                            </label>
                            <input
                                type="text"
                                name="jenis_pinjaman"
                                value={formData.jenis_pinjaman}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
                                readOnly
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Otomatis terisi berdasarkan kategori</p>
                        </div>
                    </div>

                    {/* Keperluan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Keperluan / Tujuan Pinjaman *
                        </label>
                        <textarea
                            name="keperluan"
                            value={formData.keperluan}
                            onChange={handleChange}
                            placeholder="Jelaskan keperluan pinjaman Anda..."
                            rows="3"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            required
                        />
                        <p className="text-[11px] text-gray-400 mt-1">Contoh: Renovasi rumah, modal usaha, dll.</p>
                    </div>

                    {/* Info Persetujuan */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-xs text-emerald-700 flex gap-3">
                        <div className="mt-0.5">
                            <input type="checkbox" required className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500" />
                        </div>
                        <p>
                            Dengan mengirim form ini, saya menyatakan bahwa seluruh data yang saya isi adalah benar dan saya
                            bersedia mengikuti ketentuan serta kebijakan pinjaman yang berlaku di KOPSSI.
                        </p>
                    </div>

                    {/* Aksi */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                        {submitted && (
                            <div className="inline-flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Pengajuan berhasil dikirim. Menunggu persetujuan pengurus.
                            </div>
                        )}
                        <div className="flex gap-3 md:ml-auto">
                            <button
                                type="reset"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        jumlah_pinjaman: '',
                                        tenor_bulan: '',
                                    }))
                                }
                                disabled={submitting}
                                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !personalDataId}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white shadow-sm transition-colors ${submitting || !personalDataId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700'}`}
                            >
                                {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Riwayat Pinjaman */}
            {loans.length > 0 && (
                <div className="loan-card-anim bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Pinjaman Terdaftar</h2>
                                <p className="text-xs text-gray-500">Daftar semua pengajuan pinjaman Anda</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs font-medium uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">No. Pinjaman</th>
                                    <th className="px-6 py-3">Tanggal</th>
                                    <th className="px-6 py-3">Jumlah</th>
                                    <th className="px-6 py-3">Tenor</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loans.map((ln) => (
                                    <tr key={ln.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-gray-900">{ln.no_pinjaman}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(ln.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                                            Rp {parseFloat(ln.jumlah_pinjaman).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {ln.tenor_bulan} Bulan
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ln.status === 'PENGAJUAN' ? 'bg-amber-100 text-amber-700' :
                                                ln.status === 'DISETUJUI' ? 'bg-blue-100 text-blue-700' :
                                                    ln.status === 'DICAIRKAN' ? 'bg-emerald-100 text-emerald-700' :
                                                        ln.status === 'LUNAS' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-red-100 text-red-700'
                                                }`}>
                                                {getStatusLabel(ln.status)}
                                            </span>
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

export default PengajuanHutang;
