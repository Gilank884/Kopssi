import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { supabase } from '../lib/supabaseClient'; // sesuaikan path

const LoginModal = ({ isOpen, onClose, onLogin }) => {
    const modalRef = useRef(null);
    const contentRef = useRef(null);

    const [role, setRole] = useState('user'); // user | admin (UI)
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useLayoutEffect(() => {
        if (isOpen) {
            gsap.to(modalRef.current, {
                duration: 0.1,
                pointerEvents: 'auto',
                opacity: 1
            });

            gsap.fromTo(
                contentRef.current,
                { scale: 0.8, opacity: 0, y: 20 },
                { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
            );
        } else {
            gsap.to(contentRef.current, {
                scale: 0.8,
                opacity: 0,
                duration: 0.2,
                onComplete: () => {
                    gsap.to(modalRef.current, {
                        opacity: 0,
                        duration: 0.2,
                        pointerEvents: 'none'
                    });
                }
            });
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // 🔹 Query user berdasarkan phone & password
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .eq('password', password)
            .single();

        if (userError || !userData) {
            setLoading(false);
            alert('Nomor HP atau password salah');
            return;
        }

        const dbRole = userData.role; // ADMIN | MEMBER

        // 🔐 Validasi akses role untuk ADMIN
        if (role === 'admin') {
            // Jika user memilih admin, harus dicek apakah role di database adalah ADMIN
            if (dbRole !== 'ADMIN') {
                setLoading(false);
                alert('Anda bukan ADMIN. Akses ditolak.');
                return;
            }
            // Jika role adalah ADMIN dan user memilih admin, langsung login
            // Tidak perlu cek personal_data untuk admin
            // Admin akan di-redirect ke /admin di handleLogin
        }

        // 🔍 Cek status user dari personal_data (hanya untuk MEMBER)
        if (dbRole === 'MEMBER') {
            const { data: personalData, error: personalError } = await supabase
                .from('personal_data')
                .select('status, full_name')
                .eq('user_id', userData.id)
                .single();

            if (personalError || !personalData) {
                setLoading(false);
                alert('Data personal tidak ditemukan. Silakan hubungi administrator.');
                return;
            }

            // Cek apakah status aktif
            // Status yang diizinkan: 'active' atau 'approved'
            // Status yang ditolak: 'pending', 'rejected', null, atau lainnya
            const activeStatuses = ['active', 'approved'];
            const userStatus = personalData.status?.toLowerCase();

            if (!userStatus || !activeStatuses.includes(userStatus)) {
                setLoading(false);
                if (userStatus === 'pending' || !userStatus) {
                    alert('Akun Anda belum aktif. Pendaftaran Anda masih dalam proses verifikasi. Silakan tunggu persetujuan dari administrator.');
                } else if (userStatus === 'rejected') {
                    alert('Akun Anda ditolak. Silakan hubungi administrator untuk informasi lebih lanjut.');
                } else {
                    alert('Akun Anda belum aktif. Silakan hubungi administrator.');
                }
                return;
            }
        }

        // ✅ Login sukses
        const loginData = {
            id: userData.id,
            phone: userData.phone,
            role: dbRole,
            loginAs: role // admin | user
        };

        onLogin(loginData);

        setLoading(false);
        onClose();
    };

    return (
        <div
            ref={modalRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 opacity-0 pointer-events-none backdrop-blur-sm"
        >
            <div
                ref={contentRef}
                className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">
                    Selamat Datang
                </h2>
                <p className="text-center text-gray-500 mb-6">
                    Silakan pilih akses masuk Anda
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ROLE SELECTION */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* ANGGOTA */}
                        <div
                            onClick={() => setRole('user')}
                            className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all
                                ${role === 'user'
                                    ? 'border-emerald-600 bg-emerald-50'
                                    : 'border-gray-200 hover:border-emerald-200'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center
                                ${role === 'user'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-500'}`}
                            >
                                👤
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold">Anggota</h3>
                                <p className="text-xs text-gray-500">Akses data pribadi</p>
                            </div>
                        </div>

                        {/* ADMIN */}
                        <div
                            onClick={() => setRole('admin')}
                            className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all
                                ${role === 'admin'
                                    ? 'border-emerald-600 bg-emerald-50'
                                    : 'border-gray-200 hover:border-emerald-200'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center
                                ${role === 'admin'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-500'}`}
                            >
                                🛡️
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold">Admin</h3>
                                <p className="text-xs text-gray-500">Pengelolaan Koperasi</p>
                            </div>
                        </div>
                    </div>

                    {/* INPUT */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                No. Handphone
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {loading
                            ? 'Memproses...'
                            : `Masuk sebagai ${role === 'user' ? 'Anggota' : 'Administrator'}`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
