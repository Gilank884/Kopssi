import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { CreditCard, CalendarDays, FileText, Wallet } from 'lucide-react';

const PengajuanHutang = () => {
    const containerRef = useRef(null);
    const [formData, setFormData] = useState({
        nama: 'Gilang Prasetyo',
        nomorAnggota: '12345',
        jenisPinjaman: '',
        jumlahPinjaman: '',
        tenor: '',
        tujuan: '',
        tanggalPengajuan: new Date().toISOString().slice(0, 10),
        metodePembayaran: '',
        catatanTambahan: '',
    });

    const [submitted, setSubmitted] = useState(false);

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
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Untuk saat ini hanya simulasi submit
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
    };

    return (
        <div ref={containerRef} className="space-y-6">
            {/* Info Ringkas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="loan-card-anim bg-white rounded-2xl border border-emerald-100 p-4 flex items-center gap-3 shadow-sm">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                        <Wallet size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Plafon Maksimal</p>
                        <p className="text-lg font-bold text-gray-900">Rp 15.000.000</p>
                        <p className="text-xs text-emerald-500">Sesuai ketentuan koperasi</p>
                    </div>
                </div>
                <div className="loan-card-anim bg-white rounded-2xl border border-emerald-100 p-4 flex items-center gap-3 shadow-sm">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                        <CalendarDays size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Tenor Pinjaman</p>
                        <p className="text-lg font-bold text-gray-900">3 - 24 Bulan</p>
                        <p className="text-xs text-amber-500">Disesuaikan kemampuan angsuran</p>
                    </div>
                </div>
                <div className="loan-card-anim bg-white rounded-2xl border border-emerald-100 p-4 flex items-center gap-3 shadow-sm">
                    <div className="p-3 rounded-xl bg-red-50 text-red-600">
                        <CreditCard size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Status Pengajuan</p>
                        <p className="text-lg font-bold text-gray-900">
                            {submitted ? 'Terkirim' : 'Belum Diajukan'}
                        </p>
                        <p className="text-xs text-red-500">
                            {submitted ? 'Pengajuan Anda menunggu persetujuan.' : 'Lengkapi form untuk mengajukan.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Pengajuan Hutang */}
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
                    {/* Data Anggota */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                name="nama"
                                value={formData.nama}
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
                                name="nomorAnggota"
                                value={formData.nomorAnggota}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Detail Pinjaman */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jenis Pinjaman
                            </label>
                            <select
                                name="jenisPinjaman"
                                value={formData.jenisPinjaman}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                required
                            >
                                <option value="">Pilih jenis pinjaman</option>
                                <option value="konsumtif">Konsumtif</option>
                                <option value="produktif">Produktif / Usaha</option>
                                <option value="darurat">Darurat</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jumlah Pinjaman (Rp)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="100000"
                                name="jumlahPinjaman"
                                value={formData.jumlahPinjaman}
                                onChange={handleChange}
                                placeholder="Contoh: 5000000"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                required
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Gunakan angka tanpa titik/koma.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tenor (bulan)
                            </label>
                            <select
                                name="tenor"
                                value={formData.tenor}
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
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Pengajuan
                            </label>
                            <input
                                type="date"
                                name="tanggalPengajuan"
                                value={formData.tanggalPengajuan}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                required
                            />
                        </div>
                    </div>

                    {/* Tujuan & Metode Pembayaran */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tujuan Penggunaan Dana
                            </label>
                            <textarea
                                name="tujuan"
                                value={formData.tujuan}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Jelaskan secara singkat tujuan penggunaan dana pinjaman..."
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Metode Pembayaran Angsuran
                            </label>
                            <select
                                name="metodePembayaran"
                                value={formData.metodePembayaran}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                required
                            >
                                <option value="">Pilih metode pembayaran</option>
                                <option value="potong-gaji">Potong Gaji</option>
                                <option value="transfer">Transfer Rekening</option>
                                <option value="tunai-kantor">Setor Tunai ke Kantor Koperasi</option>
                            </select>
                            <p className="text-[11px] text-gray-400 mt-1">
                                Detail teknis pembayaran akan diinformasikan setelah pengajuan disetujui.
                            </p>
                        </div>
                    </div>

                    {/* Catatan Tambahan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catatan Tambahan (opsional)
                        </label>
                        <textarea
                            name="catatanTambahan"
                            value={formData.catatanTambahan}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Tambahkan informasi lain yang perlu diketahui pengurus koperasi..."
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                        />
                    </div>

                    {/* Info Persetujuan */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-xs text-emerald-700 flex gap-3">
                        <div className="mt-0.5">
                            <input type="checkbox" checked readOnly className="rounded border-emerald-300 text-emerald-600" />
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
                                        jenisPinjaman: '',
                                        jumlahPinjaman: '',
                                        tenor: '',
                                        tujuan: '',
                                        metodePembayaran: '',
                                        catatanTambahan: '',
                                    }))
                                }
                                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
                            >
                                Kirim Pengajuan
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PengajuanHutang;


