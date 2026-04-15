import React, { useState } from 'react';
import { Users, Banknote, Landmark, Percent } from 'lucide-react';
import MemberReport from '../../components/Admin/Reports/MemberReport';
import InstallmentReport from '../../components/Admin/Reports/InstallmentReport';
import InterestReport from '../../components/Admin/Reports/InterestReport';
import OutstandingLoanReport from '../../components/Admin/Reports/OutstandingLoanReport';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('ANGGOTA');

    const tabs = [
        { id: 'ANGGOTA', label: 'Laporan Anggota', icon: <Users size={16} />, component: <MemberReport /> },
        { id: 'ANGSURAN', label: 'Laporan Angsuran', icon: <Banknote size={16} />, component: <InstallmentReport /> },
        { id: 'BUNGA', label: 'Laporan Pendapatan Bagi Hasil', icon: <Percent size={16} />, component: <InterestReport /> },
        { id: 'SISA_PINJAMAN', label: 'Laporan Sisa Pinjaman', icon: <Landmark size={16} />, component: <OutstandingLoanReport /> },
    ];

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                <div className="text-left">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tight">Pusat Laporan</h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium italic tracking-tight">Laporan Keuangan & Data Anggota Terpadu</p>
                </div>
            </div>

            {/* Sub Bar (Tabs) */}
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-px">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black tracking-widest transition-all border-b-2 ${activeTab === tab.id
                            ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
                            : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Active Report Component */}
            <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-gray-100 p-6">
                {tabs.find(t => t.id === activeTab)?.component}
            </div>
        </div>
    );
};

export default Reports;
