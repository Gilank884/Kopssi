import React, { useEffect, useState } from 'react';
import { CreditCard, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const Pinjaman = () => {
    const [loan, setLoan] = useState(null);
    const [summary, setSummary] = useState({
        totalPinjaman: 0,
        pokokTerbayar: 0,
        sisaPokok: 0,
        paidMonths: 0,
        unpaidMonths: 0,
        remainingMonths: 0,
        nextBill: 0
    });
    const [loading, setLoading] = useState(true);
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            console.log("Pinjaman: Fetching started...");
            try {
                // Cek Auth via Supabase
                const { data: { user } } = await supabase.auth.getUser();
                console.log("Pinjaman: Supabase User ->", user);

                // Cek Auth via LocalStorage (seperti PengajuanPinjaman)
                const storedUser = localStorage.getItem('auth_user');
                console.log("Pinjaman: LocalStorage User ->", storedUser);

                let userId = user?.id;

                // Jika Supabase Auth user kosong, coba gunakan LocalStorage
                if (!userId && storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        userId = parsedUser.id;
                        console.log("Pinjaman: Using ID from LocalStorage ->", userId);
                    } catch (e) {
                        console.error("Pinjaman: Error parsing local storage user", e);
                    }
                }

                if (!userId) {
                    console.warn("Pinjaman: No user ID found. Aborting.");
                    setLoading(false);
                    return;
                }

                const { data: personalData, error: personalError } = await supabase
                    .from('personal_data')
                    .select('id, full_name')
                    .eq('user_id', userId)
                    .single();

                if (personalError) {
                    console.error("Pinjaman: Error fetching personal_data ->", personalError);
                }
                console.log("Pinjaman: Personal Data ->", personalData);

                if (!personalData) {
                    console.warn("Pinjaman: No personal_data found for user", userId);
                    setLoading(false);
                    return;
                }

                // Fetch Active Loan (First one found for detail view)
                // In a real app with multiple loans, we'd list them. Here we focus on the primary active loan.
                const { data: loans, error: loansError } = await supabase
                    .from('pinjaman')
                    .select('*')
                    .eq('personal_data_id', personalData.id)
                    .eq('status', 'DICAIRKAN')
                    .order('created_at', { ascending: false });

                console.log("Pinjaman: Loans fetch result ->", loans);
                if (loansError) console.error("Pinjaman: Error fetching loans ->", loansError);

                if (loans && loans.length > 0) {
                    const activeLoan = loans[0]; // Take the most recent active loan

                    const { data: angsuran } = await supabase
                        .from('angsuran')
                        .select('*')
                        .eq('pinjaman_id', activeLoan.id);

                    const totalPinjaman = parseFloat(activeLoan.jumlah_pinjaman);
                    let pokokTerbayar = 0;
                    let paidMonths = 0;
                    let unpaidMonths = 0;
                    let nextBill = 0;

                    if (angsuran) {
                        // Sort by bulan_ke to ensure order
                        const sortedAngsuran = angsuran.sort((a, b) => a.bulan_ke - b.bulan_ke);

                        // Find first unpaid installment
                        const nextInstallment = sortedAngsuran.find(a => a.status !== 'PAID');
                        console.log("DEBUG: Next Installment Candidate:", nextInstallment);

                        if (nextInstallment) {
                            nextBill = parseFloat(nextInstallment.amount);
                        }

                        sortedAngsuran.forEach(a => {
                            if (a.status === 'PAID') {
                                pokokTerbayar += parseFloat(a.amount);
                                paidMonths++;
                            } else {
                                // Assume 'UNPAID' or null is unpaid
                                unpaidMonths++;
                            }
                        });
                    }

                    const sisaPokok = totalPinjaman - pokokTerbayar;
                    const tenor = activeLoan.tenor_bulan;
                    const remainingMonths = Math.max(0, tenor - paidMonths);

                    setLoan(activeLoan);
                    setSummary({
                        totalPinjaman,
                        pokokTerbayar,
                        sisaPokok,
                        pokokTerbayar,
                        sisaPokok,
                        paidMonths,
                        unpaidMonths,
                        remainingMonths,
                        nextBill
                    });
                    setHasData(true);
                } else {
                    setHasData(false);
                }

            } catch (error) {
                console.error("Error fetching pinjaman:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    if (loading) return <div>Loading...</div>;

    if (!hasData) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
                <h3 className="text-xl font-bold text-gray-800">Pinjaman Tidak ada</h3>
                <p className="text-gray-500 mt-2">Anda tidak memiliki pinjaman aktif saat ini.</p>
            </div>
        );
    }

    const progressPercent = Math.min(100, Math.round((summary.paidMonths / loan.tenor_bulan) * 100));
    // Calculate estimated monthly installment (simple flat rate from DB or just divide)
    // DB has `bunga_persen`. Assuming `jumlah_pinjaman` is principal. 
    // Installment = (Principal + (Principal * Bunga/100 * Tenor)) / Tenor ? Or just Principal/Tenor + Bunga?
    // User schema: `bunga_persen` numeric DEFAULT 0.
    // Let's assume simple calculation or just show Principal/Tenor if bunga is 0.
    // For display, "Angsuran per Bulan" -> We don't have this field explicitly stored as "bill", 
    // but we can estimate: (Principal / Tenor) + (Principal * (Bunga/100)).
    // Let's just do Principal / Tenor for now if Bunga is not clear, or (Principal * (1 + (Bunga/100 * Tenor/12))) / Tenor.
    // To match typical cooperative: (Principal + Margin) / Tenor. 
    // Let's use simple logic: Principal / Tenor.
    const angsuranPerBulan = summary.totalPinjaman / loan.tenor_bulan;

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <p className="text-blue-200 text-sm font-medium mb-1">Total Pinjaman Aktif</p>
                        <h2 className="text-4xl font-bold">{formatCurrency(summary.totalPinjaman)}</h2>
                        <div className="mt-4 flex gap-4 text-sm">
                            <div>
                                <p className="text-blue-200">Nomor Pinjaman</p>
                                <p className="font-medium">{loan.no_pinjaman}</p>
                            </div>
                            <div>
                                <p className="text-blue-200">Tanggal Pencairan</p>
                                <p className="font-medium">{formatDate(loan.created_at)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 min-w-[200px]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">Sisa Tenor</span>
                            <span className="font-bold">{summary.unpaidMonths} Bulan</span>
                        </div>
                        <div className="w-full bg-blue-900/50 rounded-full h-2 mb-2">
                            <div className="bg-white h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-blue-200">
                            <span>{summary.paidMonths} Angsuran Paid</span>
                            <span>{summary.remainingMonths} Remaining</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <CreditCard size={20} className="text-blue-600" /> Detail Pinjaman
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Plafon Pinjaman</span>
                            <span className="font-medium text-gray-900">{summary.Pinjaman}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Jangka Waktu</span>
                            <span className="font-medium text-gray-900">{loan.tenor_bulan} Bulan</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Suku Bunga</span>
                            <span className="font-medium text-gray-900">{loan.bunga_persen}% / Bulan</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Estimasi Angsuran</span>
                            <span className="font-medium text-gray-900">{formatCurrency(summary.nextBill)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-500">Status</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">{loan.status}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FileText size={20} className="text-blue-600" /> Ringkasan Pembayaran
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Angsuran Sudah Dibayar</span>
                            <span className="font-medium text-emerald-600 font-bold">{summary.paidMonths} kali</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Angsuran Belum Dibayar</span>
                            <span className="font-medium text-amber-600 font-bold">{summary.unpaidMonths} kali</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Pokok Terbayar</span>
                            <span className="font-medium text-emerald-600">{formatCurrency(summary.pokokTerbayar)}</span>
                        </div>
                        {/* 
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Bunga Terbayar</span>
                            <span className="font-medium text-gray-900">-</span>
                        </div>
                        */}
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Sisa Pokok</span>
                            <span className="font-medium text-red-600">{formatCurrency(summary.sisaPokok)}</span>
                        </div>
                        <div className="mt-6 pt-4 bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 text-center">Pinjaman ini dilindungi asuransi kredit. Jika terjadi resiko meninggal dunia, sisa pinjaman dianggap lunas.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pinjaman;
