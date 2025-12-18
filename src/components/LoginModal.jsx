import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
    const modalRef = useRef(null);
    const contentRef = useRef(null);
    const [role, setRole] = useState('user'); // 'user' or 'admin'
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    useLayoutEffect(() => {
        if (isOpen) {
            // Open animation
            gsap.to(modalRef.current, {
                duration: 0.1,
                pointerEvents: 'auto',
                opacity: 1
            });
            gsap.fromTo(contentRef.current,
                { scale: 0.8, opacity: 0, y: 20 },
                { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
            );
        } else {
            // Close animation
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

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(role);
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
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">Selamat Datang</h2>
                <p className="text-center text-gray-500 mb-6">Silakan pilih akses masuk Anda</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        {/* User / Anggota Card */}
                        <div
                            onClick={() => setRole('user')}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${role === 'user' ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-red-200'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === 'user' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            </div>
                            <div className="text-center">
                                <h3 className={`font-bold ${role === 'user' ? 'text-red-700' : 'text-gray-700'}`}>Anggota</h3>
                                <p className="text-xs text-gray-500">Akses data pribadi</p>
                            </div>
                        </div>

                        {/* Admin Card */}
                        <div
                            onClick={() => setRole('admin')}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${role === 'admin' ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-red-200'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === 'admin' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                            </div>
                            <div className="text-center">
                                <h3 className={`font-bold ${role === 'admin' ? 'text-red-700' : 'text-gray-700'}`}>Admin</h3>
                                <p className="text-xs text-gray-500">Pengelolaan Koperasi</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">No. Handphone</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                placeholder="Contoh: 08123456789"
                                required
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md hover:shadow-lg mt-6"
                    >
                        Masuk sebagai {role === 'user' ? 'Anggota' : 'Administrator'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
