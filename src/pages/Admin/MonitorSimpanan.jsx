import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Filter, CheckCircle, XCircle, Clock, Banknote, User } from 'lucide-react';

const MonitorSimpanan = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterMonth, setFilterMonth] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const [schemaError, setSchemaError] = useState(false);

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        try {
            setLoading(true);
            setSchemaError(false);

            const { data, error } = await supabase
                .from('simpanan')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        full_name,
                        nik,
                        work_unit,
                        company
                    )
                `)
                .eq('status', 'UNPAID')
                .not('bulan_ke', 'is', null)
                .order('jatuh_tempo', { ascending: true });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            // Group by personal_data_id and bulan_ke
            const grouped = {};
            (data || []).forEach(item => {
                const key = `${item.personal_data_id}_${item.bulan_ke}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        id: key,
                        personal_data_id: item.personal_data_id,
                        personal_data: item.personal_data,
                        bulan_ke: item.bulan_ke,
                        jatuh_tempo: item.jatuh_tempo,
                        amount_pokok: 0,
                        amount_wajib: 0,
                        items: []
                    };
                }
                if (item.type === 'POKOK') {
                    grouped[key].amount_pokok = parseFloat(item.amount || 0);
                }
                if (item.type === 'WAJIB') {
                    grouped[key].amount_wajib = parseFloat(item.amount || 0);
                }
                grouped[key].items.push(item);
            });

            setBills(Object.values(grouped));
        } catch (error) {
            console.error('Error fetching bills:', error);
            alert('Gagal memuat data tagihan simpanan');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (bill) => {
        if (!window.confirm(`Tandai tagihan bulan ke-${bill.bulan_ke} untuk ${bill.personal_data?.full_name} sebagai LUNAS?`)) return;

        try {
            setUpdatingId(bill.id);

            // Update all items for this bill (both POKOK and WAJIB) to PAID
            const itemIds = bill.items.map(item => item.id);

            const { error } = await supabase
                .from('simpanan')
                .update({ status: 'PAID' })
                .in('id', itemIds);

            if (error) throw error;

            // Update local state - remove from unpaid list
            setBills(prev => prev.filter(b => b.id !== bill.id));
            alert('Tagihan berhasil dibayar!');
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Gagal memproses pembayaran: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredBills = bills.filter(bill => {
        const matchesSearch = bill.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.personal_data?.nik?.includes(searchTerm);
        const matchesStatus = filterStatus === 'ALL' || bill.status === filterStatus;

        // Month filter
        let matchesMonth = true;
        if (filterMonth) {
            const billDate = new Date(bill.jatuh_tempo);
            const [year, month] = filterMonth.split('-');
            const billYear = billDate.getFullYear();
            const billMonth = billDate.getMonth() + 1; // 0-indexed
            matchesMonth = billYear === parseInt(year) && billMonth === parseInt(month);
        }

        return matchesSearch && matchesStatus && matchesMonth;
    });

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Monitoring Simpanan</h2>
                    <p className="text-sm text-gray-500 mt-1">Lacak dan kelola pembayaran iuran wajib & pokok anggota</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama atau NIK..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 text-sm"
                        />
                    </div>
                    <input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                        placeholder="Filter Bulan"
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="UNPAID">Belum Bayar</option>
                        <option value="PAID">Lunas</option>
                    </select>
                    {filterMonth && (
                        <button
                            onClick={() => setFilterMonth('')}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                        >
                            Reset Bulan
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4 font-black">Anggota</th>
                                <th className="px-6 py-4 font-black text-center">Bulan Ke</th>
                                <th className="px-6 py-4 font-black">Jatuh Tempo</th>
                                <th className="px-6 py-4 font-black text-right">Simp. Pokok</th>
                                <th className="px-6 py-4 font-black text-right">Simp. Wajib</th>
                                <th className="px-6 py-4 font-black text-right">Total</th>
                                <th className="px-6 py-4 font-black text-center">Status</th>
                                <th className="px-6 py-4 font-black text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 italic">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        <Clock className="mx-auto text-gray-300 mb-4" size={48} />
                                        <p>Tidak ada tagihan ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => {
                                    const total = parseFloat(bill.amount_pokok || 0) + parseFloat(bill.amount_wajib || 0);
                                    return (
                                        <tr key={bill.id} className="hover:bg-emerald-50/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-900 not-italic uppercase tracking-tighter">
                                                        {bill.personal_data?.full_name || '-'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        {bill.personal_data?.nik || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-black text-gray-500">
                                                    #{bill.bulan_ke}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-xs font-bold">
                                                {new Date(bill.jatuh_tempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-medium text-gray-500 font-mono">
                                                {formatCurrency(bill.amount_pokok)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-medium text-gray-500 font-mono">
                                                {formatCurrency(bill.amount_wajib)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-gray-800 font-mono">
                                                    {formatCurrency(total)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border ${bill.status === 'PAID'
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                    : 'bg-amber-100 text-amber-700 border-amber-200'
                                                    }`}>
                                                    {bill.status === 'PAID' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                                    {bill.status === 'PAID' ? 'LUNAS' : 'PENDING'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {bill.status !== 'PAID' ? (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(bill)}
                                                        disabled={updatingId === bill.id}
                                                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1 mx-auto disabled:opacity-50"
                                                    >
                                                        <Banknote size={12} />
                                                        {updatingId === bill.id ? 'Loading...' : 'BAYAR'}
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">TEREKAM</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MonitorSimpanan;
