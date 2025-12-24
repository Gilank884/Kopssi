import React from 'react';
import { Info } from 'lucide-react';

const BioStep = ({ formData, handleChange, passwordError }) => {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3 mb-6">
                <Info className="text-emerald-600 shrink-0" size={20} />
                <p className="text-xs text-emerald-800 leading-relaxed">
                    Pastikan data yang diinput sesuai dengan identitas resmi (KTP/Passport) untuk mempermudah proses validasi.
                </p>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap (Sesuai KTP) *</label>
                <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Contoh: Ahmad Subagja"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIK (16 Digit) *</label>
                    <input
                        type="text"
                        name="nik"
                        value={formData.nik}
                        onChange={handleChange}
                        placeholder="3201xxxxxxxxxxxx"
                        maxLength={16}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nomor Handphone *</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="08xxxxxxxxxx"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Bio Perusahaan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Perusahaan *</label>
                    <select
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    >
                        <option value="">Pilih Perusahaan</option>
                        <option value="PT Swadharma Sarana Informatika">PT Swadharma Sarana Informatika</option>
                        <option value="Lainnya">Lainnya</option>
                    </select>
                    {formData.company === 'Lainnya' && (
                        <input
                            type="text"
                            name="otherCompany"
                            value={formData.otherCompany}
                            onChange={handleChange}
                            placeholder="Tuliskan nama perusahaan"
                            className="mt-2 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                    )}
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unit Kerja *</label>
                    <select
                        name="workUnit"
                        value={formData.workUnit}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    >
                        <option value="">Pilih Unit Kerja</option>
                        <option value="Centra">Centra</option>
                        <option value="Lainnya">Lainnya</option>
                    </select>
                    {formData.workUnit === 'Lainnya' && (
                        <input
                            type="text"
                            name="otherWorkUnit"
                            value={formData.otherWorkUnit}
                            onChange={handleChange}
                            placeholder="Tuliskan unit kerja"
                            className="mt-2 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                    )}
                </div>
            </div>

            {/* Status Pegawai */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status Pegawai *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer text-sm font-medium transition-all ${formData.employmentStatus === 'Pegawai Tetap'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-gray-50 text-gray-700'
                        }`}>
                        <input
                            type="radio"
                            name="employmentStatus"
                            value="Pegawai Tetap"
                            checked={formData.employmentStatus === 'Pegawai Tetap'}
                            onChange={handleChange}
                            className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Pegawai Tetap</span>
                    </label>
                    <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer text-sm font-medium transition-all ${formData.employmentStatus === 'Pegawai Kontrak'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-gray-50 text-gray-700'
                        }`}>
                        <input
                            type="radio"
                            name="employmentStatus"
                            value="Pegawai Kontrak"
                            checked={formData.employmentStatus === 'Pegawai Kontrak'}
                            onChange={handleChange}
                            className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Pegawai Kontrak</span>
                    </label>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nomor Induk Pegawai (NIP)</label>
                <input
                    type="text"
                    name="nip"
                    value={formData.nip}
                    onChange={handleChange}
                    placeholder="Masukkan NIP (Opsional)"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Pegawai *</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Contoh: pegawai@gmail.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Masukkan password"
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${passwordError ? 'border-red-300' : 'border-gray-200'}`}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Masukkan Password Anda Sekali Lagi *</label>
                <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Konfirmasi password"
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${passwordError ? 'border-red-300' : 'border-gray-200'}`}
                />
                {passwordError && (
                    <p className="mt-1.5 text-sm text-red-600 font-medium">{passwordError}</p>
                )}
            </div>
        </div>
    );
};

export default BioStep;
