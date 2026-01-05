import React, { useEffect, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const Transaksi = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const authUser = JSON.parse(localStorage.getItem('auth_user'));
                if (!authUser?.id) throw new Error('User belum login');

                const { data: personal } = await supabase
                    .from('personal_data')
                    .select('id')
                    .eq('user_id', authUser.id)
                    .single();

                if (!personal) throw new Error('Data personal tidak ditemukan');

                const { data, error } = await supabase
                    .from('v_all_transactions')
                    .select('*')
                    .eq('personal_data_id', personal.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setTransactions(data || []);
            } catch (err) {
                console.error(err);
                setErrorMsg(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const formatCurrency = (val) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val || 0);

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

    if (loading) return <div>Loading transaksi...</div>;

    if (errorMsg)
        return <div className="bg-red-50 p-4 rounded-lg text-red-600">{errorMsg}</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <FileText size={20} /> Riwayat Transaksi
                </h2>
                <p className="text-sm text-gray-500">
                    Seluruh transaksi simpanan dan angsuran
                </p>
            </div>

            {transactions.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border text-center text-gray-500">
                    Tidak ada transaksi
                </div>
            ) : (
                <div className="bg-white rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left">Tanggal</th>
                                <th className="px-4 py-3 text-left">Sumber</th>
                                <th className="px-4 py-3 text-left">Jenis</th>
                                <th className="px-4 py-3 text-right">Nominal</th>
                                <th className="px-4 py-3 text-center">Arus</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(trx => (
                                <tr key={trx.trx_id} className="border-t">
                                    <td className="px-4 py-3">{formatDate(trx.created_at)}</td>
                                    <td className="px-4 py-3">{trx.sumber}</td>
                                    <td className="px-4 py-3">
                                        {trx.kategori} ({trx.trx_type})
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold">
                                        {formatCurrency(trx.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {trx.arus === 'IN' ? (
                                            <span className="text-emerald-600 flex items-center gap-1 justify-center">
                                                <ArrowDownCircle size={16} /> Masuk
                                            </span>
                                        ) : (
                                            <span className="text-red-600 flex items-center gap-1 justify-center">
                                                <ArrowUpCircle size={16} /> Keluar
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Transaksi;
