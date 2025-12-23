import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const Angsuran = () => {
    const [schedule, setSchedule] = useState([]);
    const [loanInfo, setLoanInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Coba ambil dari localStorage dulu (mirroring logic PengajuanPinjaman)
                let userId = null;
                const storedUser = localStorage.getItem('auth_user');

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser && parsedUser.id) {
                        userId = parsedUser.id;
                        console.log("User from localStorage:", parsedUser);
                    }
                }

                // If not in local storage, try Supabase session
                if (!userId) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        userId = user.id;
                        console.log("User from Supabase Auth:", user);
                    }
                }

                if (!userId) {
                    console.log("No user found in localStorage or Supabase session.");
                    setLoading(false);
                    return;
                }

                const { data: personalData } = await supabase
                    .from('personal_data')
                    .select('id')
                    .eq('user_id', userId)
                    .single();

                console.log("Personal Data:", personalData);

                if (!personalData) {
                    setLoading(false);
                    return;
                }

                // Fetch Active Loan (DICAIRKAN)
                const { data: loans } = await supabase
                    .from('pinjaman')
                    .select('*')
                    .eq('personal_data_id', personalData.id)
                    .eq('status', 'DICAIRKAN')
                    .order('created_at', { ascending: false });

                console.log("Fetched Loans (DICAIRKAN):", loans);

                if (loans && loans.length > 0) {
                    const activeLoan = loans[0];
                    setLoanInfo(activeLoan);
                    console.log("Active Loan ID:", activeLoan.id);

                    // Fetch actual installments from database
                    const { data: installments } = await supabase
                        .from('angsuran')
                        .select('*')
                        .eq('pinjaman_id', activeLoan.id)
                        .order('bulan_ke', { ascending: true });

                    console.log("Fetched Installments:", installments);

                    if (installments && installments.length > 0) {
                        const generatedSchedule = installments.map(item => ({
                            month: item.bulan_ke,
                            date: new Date(item.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
                            pokok: item.amount,
                            bunga: 0,
                            total: item.amount,
                            status: item.status || 'UNPAID' // Use DB status or default to UNPAID
                        }));

                        setSchedule(generatedSchedule);
                        setHasData(true);
                    } else {
                        // Jika data angsuran belum ada (legacy data), mungkin fallback ke generate manual? 
                        // Untuk sekarang kita set kosong/warning
                        console.log("No installments found for loan ID:", activeLoan.id);
                        setHasData(false);
                    }

                } else {
                    console.log("No active disbursed loans found.");
                    setHasData(false);
                }

            } catch (error) {
                console.error("Error fetching angsuran:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;

    if (!hasData) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
                <h3 className="text-xl font-bold text-gray-800">Tidak Ada Tagihan</h3>
                <p className="text-gray-500 mt-2">Anda tidak memiliki jadwal angsuran aktif.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-lg">Jadwal Angsuran</h3>
                    <p className="text-gray-500 text-sm">Pinjaman Mikro ({loanInfo?.no_pinjaman})</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-medium">Bulan Ke</th>
                                <th className="px-6 py-4 font-medium">Jatuh Tempo</th>
                                <th className="px-6 py-4 font-medium">Pokok</th>
                                <th className="px-6 py-4 font-medium">Bunga</th>
                                <th className="px-6 py-4 font-medium">Total Angsuran</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {schedule.map((item) => (
                                <tr key={item.month} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-900 font-medium text-center w-24">
                                        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">{item.month}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{item.date}</td>
                                    <td className="px-6 py-4 text-gray-600">Rp {item.pokok.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
                                    <td className="px-6 py-4 text-gray-600">Rp {item.bunga.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">Rp {item.total.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
                                    <td className="px-6 py-4">
                                        {item.status === 'PAID' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                <CheckCircle size={14} /> SUDAH DIBAYAR
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                <Clock size={14} /> BELUM DIBAYAR
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Angsuran;
