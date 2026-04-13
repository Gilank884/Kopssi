import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Building2, Briefcase, MapPin, Search, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const MasterData = () => {
    const [activeTab, setActiveTab] = useState('company');
    const [loading, setLoading] = useState(false);
    const [masterData, setMasterData] = useState([]);
    const [newValue, setNewValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const tabs = [
        { id: 'company', label: 'Perusahaan/PT', icon: <Building2 size={18} /> },
        { id: 'loan_category', label: 'Kategori Pinjaman', icon: <FileText size={18} /> },
    ];

    useEffect(() => {
        fetchMasterData();
    }, [activeTab]);

    const fetchMasterData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('master_data')
                .select('*')
                .eq('category', activeTab)
                .order('value', { ascending: true });

            if (error) throw error;
            console.log(`Fetched master data for ${activeTab}:`, data);
            setMasterData(data || []);
        } catch (err) {
            console.error('Error fetching master data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newValue.trim()) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('master_data')
                .insert([{ category: activeTab, value: newValue.trim() }]);

            console.log(`Adding new ${activeTab}:`, newValue.trim());

            if (error) throw error;
            setNewValue('');
            fetchMasterData();
        } catch (err) {
            alert('Gagal menambah data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus data ini?')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('master_data')
                .delete()
                .eq('id', id);

            console.log(`Deleting item with id: ${id} from ${activeTab}`);

            if (error) throw error;
            fetchMasterData();
        } catch (err) {
            alert('Gagal menghapus data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = masterData.filter(item =>
        item.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                <div className="text-left">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tight">Master Data</h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium italic tracking-tight">Kelola data referensi seperti PT dan kategori pinjaman</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Plus size={20} className="text-emerald-500" />
                            Tambah {tabs.find(t => t.id === activeTab)?.label}
                        </h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 tracking-widest mb-2 italic">
                                    Nama/Nilai Baru
                                </label>
                                <input
                                    type="text"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    placeholder={`Contoh: Unit`}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                Simpan Data
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
                            <div className="relative flex-1">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari data..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
                                />
                            </div>
                            <div className="text-xs font-bold text-gray-400 italic">
                                Total: {filteredData.length}
                            </div>
                        </div>

                        <div className="overflow-auto max-h-[60vh] text-left">
                            <table className="w-full text-left border-collapse table-auto">
                                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                                    <tr>
                                        <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200 w-12 text-center">No</th>
                                        <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic border-r border-slate-200">Nilai / Nama</th>
                                        <th className="px-2 py-2 font-black text-slate-700 text-[10px] tracking-widest italic text-center w-20">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {loading && masterData.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                                                <Loader2 className="animate-spin h-8 w-8 text-emerald-600 mx-auto mb-4" />
                                                <p className="text-[10px] font-black tracking-widest italic opacity-50">Memuat data...</p>
                                            </td>
                                        </tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-20 text-center text-slate-400 italic font-black text-[10px] tracking-widest">
                                                Tidak ada data ditemukan
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-emerald-50 transition-colors group">
                                                <td className="px-2 py-1 text-[10px] font-bold text-slate-400 border-r border-slate-200 text-center">{index + 1}</td>
                                                <td className="px-2 py-1 text-[11px] font-black text-slate-800 italic border-r border-slate-200 tracking-tight">{item.value}</td>
                                                <td className="px-2 py-1 text-center">
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-white border border-transparent hover:border-rose-100 rounded shadow-sm transition-all"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterData;
