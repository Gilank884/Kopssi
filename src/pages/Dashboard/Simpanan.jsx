import React, { useEffect, useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const SimpananCard = ({ title, amount, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 text-sm font-medium mb-2">{title}</p>
        <h3 className={`text-2xl font-bold ${color === 'green' ? 'text-emerald-600' : 'text-gray-900'}`}>{amount}</h3>
    </div>
);

const Simpanan = () => {
    const [history, setHistory] = useState([]);
    const [pokok, setPokok] = useState(0);
    const [wajib, setWajib] = useState(0);
    const [totalSaldo, setTotalSaldo] = useState(0);
    const [loading, setLoading] = useState(true);
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            console.log("Simpanan: Fetching started...");
            try {
                // Cek Auth via Supabase
                const { data: { user } } = await supabase.auth.getUser();
                console.log("Simpanan: Supabase User ->", user);

                // Cek Auth via LocalStorage (fallback)
                const storedUser = localStorage.getItem('auth_user');
                console.log("Simpanan: LocalStorage User ->", storedUser);

                let userId = user?.id;

                if (!userId && storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        userId = parsedUser.id;
                        console.log("Simpanan: Using ID from LocalStorage ->", userId);
                    } catch (e) {
                        console.error("Simpanan: Error parsing local storage user", e);
                    }
                }

                if (!userId) {
                    console.warn("Simpanan: No user ID found. Aborting.");
                    setLoading(false);
                    return;
                }

                const { data: personalData } = await supabase
                    .from('personal_data')
                    .select('id')
                    .eq('user_id', userId)
                    .single();

                console.log("Simpanan: Personal Data ->", personalData);

                if (!personalData) {
                    setLoading(false);
                    return;
                }

                const { data: simpananData } = await supabase
                    .from('simpanan')
                    .select('*')
                    .eq('personal_data_id', personalData.id)
                    .order('created_at', { ascending: false });

                console.log("Simpanan: Data ->", simpananData);

                if (simpananData && simpananData.length > 0) {
                    let totalP = 0;
                    let totalW = 0;
                    let currentBalance = 0;

                    // Logic to calculate balances from transactions
                    // We sort ascending to calculate running balance
                    const sortedForCalc = [...simpananData].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                    sortedForCalc.forEach(item => {
                        const amount = parseFloat(item.amount);
                        if (item.transaction_type === 'SETOR') {
                            currentBalance += amount;
                            if (item.type === 'POKOK') totalP += amount;
                            if (item.type === 'WAJIB') totalW += amount;
                        } else if (item.transaction_type === 'TARIK') {
                            currentBalance -= amount;
                            if (item.type === 'POKOK') totalP -= amount;
                            if (item.type === 'WAJIB') totalW -= amount;
                        }
                        item.balanceSnapshot = currentBalance;
                    });

                    // Reverse back for display
                    const displayList = sortedForCalc.reverse().map(item => ({
                        date: new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
                        type: `Simpanan ${item.type.charAt(0) + item.type.slice(1).toLowerCase()}`,
                        nominal: parseFloat(item.amount),
                        status: item.transaction_type === 'SETOR' ? 'Setor' : 'Tarik',
                        balance: item.balanceSnapshot
                    }));

                    setPokok(totalP);
                    setWajib(totalW);
                    setTotalSaldo(currentBalance);
                    setHistory(displayList);
                    setHasData(true);
                } else {
                    setHasData(false);
                }

            } catch (error) {
                console.error("Error fetching simpanan:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    if (loading) return <div>Loading...</div>;

    if (!hasData) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
                <h3 className="text-xl font-bold text-gray-800">Simpanan Tidak ada</h3>
                <p className="text-gray-500 mt-2">Anda belum memiliki riwayat simpanan.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <SimpananCard title="Simpanan Pokok" amount={formatCurrency(pokok)} />
                <SimpananCard title="Simpanan Wajib" amount={formatCurrency(wajib)} />

                <SimpananCard title="Total Saldo" amount={formatCurrency(totalSaldo)} color="green" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Riwayat Transaksi</h3>
                    <button className="text-emerald-600 text-sm font-medium hover:underline">Download Laporan</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="px-6 py-3 font-medium">Tanggal</th>
                                <th className="px-6 py-3 font-medium">Jenis Simpanan</th>
                                <th className="px-6 py-3 font-medium">Transaksi</th>
                                <th className="px-6 py-3 font-medium">Nominal</th>
                                <th className="px-6 py-3 font-medium">Saldo Akhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {history.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-700">{item.date}</td>
                                    <td className="px-6 py-4 text-gray-700">{item.type}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Setor' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {item.status === 'Setor' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 font-medium ${item.status === 'Setor' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {item.status === 'Setor' ? '+' : '-'} {formatCurrency(item.nominal)}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{formatCurrency(item.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-2">Informasi Bunga</h4>
                <p className="text-gray-600 text-sm">Anda mendapatkan bunga simpanan sebesar <span className="font-bold">4% per tahun</span> untuk Simpanan Sukarela. Bunga dihitung berdasarkan saldo terendah setiap bulan dan dikreditkan pada akhir bulan.</p>
            </div>
        </div>
    );
};

export default Simpanan;
