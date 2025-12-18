import React from 'react';
import { Search, Filter, MoreHorizontal } from 'lucide-react';

const MemberList = () => {
    const members = [
        { id: '12345', name: 'Gilang Prasetyo', joinDate: '20 Jan 2020', savings: 'Rp 7.000.000', loan: 'Rp 4.200.000', status: 'Aktif' },
        { id: '12346', name: 'Siti Aminah', joinDate: '15 Feb 2021', savings: 'Rp 5.500.000', loan: '-', status: 'Aktif' },
        { id: '12347', name: 'Budi Santoso', joinDate: '10 Mar 2022', savings: 'Rp 2.100.000', loan: 'Rp 10.000.000', status: 'Macet' },
        { id: '12348', name: 'Dewi Lestari', joinDate: '05 Apr 2023', savings: 'Rp 8.900.000', loan: '-', status: 'Aktif' },
        { id: '12349', name: 'Eko Kurniawan', joinDate: '12 May 2019', savings: 'Rp 15.000.000', loan: 'Rp 5.000.000', status: 'Aktif' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Data Anggota</h2>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" placeholder="Cari anggota..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50">
                        <Filter size={20} /> <span className="hidden md:inline">Filter</span>
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        + Tambah Anggota
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-600">ID Anggota</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Nama</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Tgl Bergabung</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Total Simpanan</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Sisa Pinjaman</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {members.map((member) => (
                            <tr key={member.id} className="hover:bg-red-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">#{member.id}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">{member.name.charAt(0)}</div>
                                        <span className="font-medium text-gray-700">{member.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{member.joinDate}</td>
                                <td className="px-6 py-4 font-medium text-emerald-600">{member.savings}</td>
                                <td className="px-6 py-4 font-medium text-red-600">{member.loan}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${member.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {member.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    <p>Menampilkan 5 dari 1245 data</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border rounded hover:bg-gray-50">Sebelumnya</button>
                        <button className="px-3 py-1 border rounded hover:bg-gray-50">Selanjutnya</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberList;
