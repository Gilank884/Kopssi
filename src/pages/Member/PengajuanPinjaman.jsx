import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { FileText, AlertCircle, Loader2, CheckCircle2, History, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const PengajuanHutang = () => {
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        no_anggota: '',
        jumlah_pinjaman: '',
        tenor_bulan: '',
        kategori: '',
        jenis_pinjaman: 'BIASA',
        keperluan: ''
    });

    const [loanCategories, setLoanCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [personalDataId, setPersonalDataId] = useState(null);
    const [lastLoanNo, setLastLoanNo] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
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

                const { data: personalData, error: fetchError } = await supabase
                    .from('personal_data')
                    .select('id, full_name, no_anggota')
                    .eq('user_id', authUser.id)
                    .single();

                if (fetchError) {
                    console.error("Error fetching personal details:", fetchError);
                }

                if (personalData) {
                    setFormData(prev => ({
                        ...prev,
                        full_name: personalData.full_name || '',
                        no_anggota: personalData.no_anggota || ''
                    }));
                    setPersonalDataId(personalData.id);
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
                setError("Terjadi kesalahan saat memuat data.");
            } finally {
                setLoading(false);
            }
        };

        const fetchLoanCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from('master_data')
                    .select('value')
                    .eq('category', 'loan_category')
                    .order('value', { ascending: true });
                if (error) throw error;
                const categories = data?.map(c => c.value) || [];
                setLoanCategories(categories);

                if (categories.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        kategori: prev.kategori || categories[0]
                    }));
                }
            } catch (err) {
                console.error("Error fetching loan categories:", err);
            }
        };

        fetchUserData();
        fetchLoanCategories();
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
            const rawValue = value.replace(/\D/g, '');
            newValue = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }

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

    const generateLoanNumber = async () => {
        const date = new Date();
        const yy = String(date.getFullYear()).slice(-2);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const prefix = `R${yy}${mm}`;

        try {
            // Get the latest loan number with the same prefix (R+YY+MM)
            const { data, error } = await supabase
                .from('pinjaman')
                .select('no_pinjaman')
                .ilike('no_pinjaman', `${prefix}%`)
                .order('no_pinjaman', { ascending: false })
                .limit(1);

            if (error) throw error;

            let sequenceNum = 1;
            if (data && data.length > 0) {
                const lastNo = data[0].no_pinjaman;
                // Extract last 4 digits
                const lastSeqStr = lastNo.slice(-4);
                const lastSeq = parseInt(lastSeqStr, 10);
                if (!isNaN(lastSeq)) {
                    sequenceNum = lastSeq + 1;
                }
            }

            const sequence = String(sequenceNum).padStart(4, '0');
            return `${prefix}${sequence}`;
        } catch (err) {
            console.error("Error generating sequential loan number:", err);
            // Fallback for emergency (prevent blocking user application if query fails)
            const random = Math.floor(1000 + Math.random() * 9000);
            return `${prefix}X${random}`;
        }
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
            const noPinjaman = await generateLoanNumber();
            const rawJumlahPinjaman = parseFloat(formData.jumlah_pinjaman.replace(/\./g, ''));
            const tenor = parseInt(formData.tenor_bulan);

            const { data: insertedLoan, error: insertError } = await supabase
                .from('pinjaman')
                .insert([
                    {
                        personal_data_id: personalDataId,
                        no_pinjaman: noPinjaman,
                        jumlah_pinjaman: rawJumlahPinjaman,
                        jumlah_pengajuan: rawJumlahPinjaman,
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

            setLastLoanNo(noPinjaman);
            setSubmitted(true);
            setFormData(prev => ({
                ...prev,
                jumlah_pinjaman: '',
                tenor_bulan: '',
                keperluan: ''
            }));

            // Redirect is now handled by modal button or auto-close if desired
            // But for now, we leave it open until user interacts or we can set longer timeout
            /*
            setTimeout(() => {
                navigate('/dashboard/riwayat-pengajuan');
            }, 3000);
            */

        } catch (err) {
            console.error("Error submitting loan:", err);
            setError("Gagal mengajukan pinjaman. " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="space-y-6">
            <div className="loan-card-anim bg-white rounded-2xl border border-emerald-100 shadow-sm">
                <div className="px-6 py-4 border-b border-emerald-50 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black italic">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 italic uppercase tracking-tighter">Form Pengajuan Pinjaman</h2>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest text-[10px]">
                            Mohon isi data dengan lengkap dan sesuai.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm italic font-bold">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Data Anggota */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                className="w-full rounded-lg border border-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-gray-50/50 font-bold"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                Nomor Anggota
                            </label>
                            <input
                                type="text"
                                name="no_anggota"
                                value={formData.no_anggota}
                                className="w-full rounded-lg border border-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-gray-50/50 font-bold"
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Detail Pinjaman */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                Jumlah Pinjaman (Rp) *
                            </label>
                            <input
                                type="text"
                                name="jumlah_pinjaman"
                                value={formData.jumlah_pinjaman}
                                onChange={handleChange}
                                placeholder="Contoh: 5.000.000"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-black italic text-emerald-600"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                Tenor (bulan) *
                            </label>
                            <input
                                type="number"
                                name="tenor_bulan"
                                value={formData.tenor_bulan}
                                onChange={handleChange}
                                placeholder="Contoh: 12"
                                min="1"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                                required
                            />
                        </div>
                    </div>

                    {/* Kategori & Jenis Pinjaman */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                Kategori Pinjaman *
                            </label>
                            <select
                                name="kategori"
                                value={formData.kategori}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                                required
                            >
                                {loanCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                Jenis Pinjaman
                            </label>
                            <input
                                type="text"
                                name="jenis_pinjaman"
                                value={formData.jenis_pinjaman}
                                className="w-full rounded-lg border border-gray-100 px-3 py-2 text-sm bg-gray-50/50 font-bold"
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Keperluan */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                            Keperluan / Tujuan Pinjaman *
                        </label>
                        <textarea
                            name="keperluan"
                            value={formData.keperluan}
                            onChange={handleChange}
                            placeholder="Jelaskan keperluan pinjaman Anda..."
                            rows="3"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                            required
                        />
                    </div>

                    {/* Info Persetujuan */}
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-3 text-[10px] text-emerald-700 font-bold flex gap-3">
                        <div className="mt-0.5">
                            <input type="checkbox" required className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500" />
                        </div>
                        <p className="uppercase tracking-tight">
                            Dengan mengirim form ini, saya menyatakan bahwa seluruh data yang saya isi adalah benar dan saya
                            bersedia mengikuti ketentuan serta kebijakan pinjaman yang berlaku di KOPSSI.
                        </p>
                    </div>

                    {/* Aksi */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                        <div className="flex gap-3 md:ml-auto">
                            <button
                                type="submit"
                                disabled={submitting || !personalDataId}
                                className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest bg-emerald-600 text-white shadow-lg shadow-emerald-200 transition-all ${submitting || !personalDataId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0'}`}
                            >
                                {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* SUCCESS MODAL */}
            {submitted && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-emerald-600 p-8 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                <CheckCircle2 size={48} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-white italic tracking-tighter">PENGAJUAN BERHASIL!</h3>
                            <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">Permohonan Anda Telah Tercatat</p>
                        </div>
                        
                        <div className="p-8 space-y-6 text-center">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nomor Pinjaman Anda</p>
                                <div className="bg-gray-50 rounded-xl py-3 border border-gray-100 font-mono text-xl font-black text-gray-800 tracking-tighter italic">
                                    {lastLoanNo}
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                                Pengajuan Anda sedang menunggu proses verifikasi oleh tim Admin KOPSSI. Anda dapat memantau statusnya di menu Riwayat.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => navigate('/dashboard/riwayat-pengajuan')}
                                    className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <History size={16} /> Lihat Riwayat <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                                >
                                    Tutup Halaman Ini
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PengajuanHutang;
