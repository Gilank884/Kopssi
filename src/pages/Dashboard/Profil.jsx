import React from 'react';
import { User, Lock, Mail, MapPin, Phone } from 'lucide-react';

const Profil = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center text-4xl text-emerald-600 font-bold border-4 border-emerald-50">
                    GP
                </div>
                <div className="text-center md:text-left flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">Gilang Prasetyo</h2>
                    <p className="text-gray-500 mb-4">Anggota Tetap • Bergabung sejak 2020</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">Status: Aktif</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">NIK: 3201234567890001</span>
                    </div>
                </div>
                <button className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">Edit Profil</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <User size={20} className="text-emerald-600" /> Informasi Pribadi
                    </h3>
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                            <input type="text" value="Gilang Prasetyo" readOnly className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Mail size={14} /> Email</label>
                            <input type="email" value="gilang.p@example.com" readOnly className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Phone size={14} /> No. Handphone</label>
                            <input type="tel" value="0812-3456-7890" readOnly className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><MapPin size={14} /> Alamat</label>
                            <textarea rows="3" readOnly className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">Jl. Koperasi Makmur No. 45, Jakarta Selatan, DKI Jakarta</textarea>
                        </div>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Lock size={20} className="text-emerald-600" /> Keamanan Akun
                    </h3>
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label>
                            <input type="password" value="********" readOnly className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                            <input type="password" placeholder="Masukkan password baru" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                            <input type="password" placeholder="Ulangi password baru" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                        </div>
                        <button type="button" className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors mt-2">
                            Update Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profil;
