
import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, MapPin, ScrollText, Users, Target, Shield, Award, UserCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
    const mainRef = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            // Animate Sections on Scroll
            const sections = gsap.utils.toArray('.animate-section');
            sections.forEach((section) => {
                gsap.from(section, {
                    scrollTrigger: {
                        trigger: section,
                        start: "top 80%",
                    },
                    y: 50,
                    opacity: 0,
                    duration: 1,
                    ease: "power3.out"
                });
            });

            // Animate Cards
            gsap.from(".founder-card", {
                scrollTrigger: {
                    trigger: ".founders-grid",
                    start: "top 85%",
                },
                y: 30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2
            });

        }, mainRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={mainRef} className="bg-white overflow-hidden">

            {/* Header Section */}
            <section className="py-20 px-4 bg-gray-50 animate-section">
                <div className="container mx-auto text-center max-w-4xl">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                        About <span className="text-red-600">KOPSSI</span>
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        Koperasi Pegawai PT. Swadharma Sarana Informatika (KOPSSI) hadir untuk membangun kesejahteraan bersama melalui pengelolaan yang profesional dan transparan.
                    </p>
                </div>
            </section>

            {/* Sejarah / History Section */}
            <section className="py-20 px-4 animate-section">
                <div className="container mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="lg:w-1/2 relative">
                            {/* Decorative graphics */}
                            <div className="absolute -left-4 -top-4 w-24 h-24 bg-red-100 rounded-full blur-2xl"></div>
                            <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100 z-10">
                                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    <Clock className="text-red-600" />
                                    <span>Sejarah Pendirian</span>
                                </h3>
                                <ul className="space-y-4 text-gray-600">
                                    <li className="flex gap-3">
                                        <div className="mt-1 min-w-[20px]"><ScrollText size={18} className="text-red-500" /></div>
                                        <span>Didirikan pada tanggal 20 September 2002.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="mt-1 min-w-[20px]"><MapPin size={18} className="text-red-500" /></div>
                                        <span>Berlokasi di Gedung Hanglekir Raya No 30, Kel. Gunung, Kebayoran Baru, Jakarta Selatan 12120.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="mt-1 min-w-[20px]"><Shield size={18} className="text-red-500" /></div>
                                        <span>Disahkan dengan nomor akte pendirian: <strong>295/BH/MENEG.I/VIII/2003</strong>.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="mt-1 min-w-[20px]"><Users size={18} className="text-red-500" /></div>
                                        <span>Jumlah anggota awal sebanyak 33 (tiga puluh tiga) orang pendiri.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="lg:w-1/2 space-y-6">
                            <div className="flex items-start gap-4 p-6 bg-red-50 rounded-xl">
                                <div className="p-3 bg-red-600 rounded-lg text-white font-bold text-2xl">20+</div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900">Tahun Pengalaman</h4>
                                    <p className="text-gray-600 mt-1">Berdedikasi dalam melayani dan mensejahterakan anggota sejak tahun 2002.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Visi & Misi Section */}
            <section className="py-20 px-4 bg-gray-900 text-white animate-section relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#e53e3e 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                <div className="container mx-auto relative z-10">
                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Visi */}
                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-red-500 transition-colors duration-300">
                            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-6">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Visi</h3>
                            <p className="text-gray-300 text-lg">
                                "Memberikan kesejahteraan anggotanya."
                            </p>
                        </div>

                        {/* Misi */}
                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-red-500 transition-colors duration-300">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Misi</h3>
                            <ul className="space-y-3 text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                    <span>Meningkatkan kesejahteraan dan taraf hidup anggota pada khususnya, serta masyarakat.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                    <span>Menjadi Koperasi yang bermanfaat bagi anggota.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                    <span>Mengutamakan pelayanan terbaik bagi Anggota, Pelanggan, dan Mitra Usaha.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                    <span>Senantiasa mengutamakan kerja sama.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                    <span>Pengelolaan secara profesional, transparan, dan penuh kehati-hatian.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pengurus Awal (Founders) Section */}
            <section className="py-20 px-4 bg-gray-50 animate-section">
                <div className="container mx-auto">
                    <div className="text-center mb-16">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">Pengurus Awal</h3>
                        <p className="text-gray-600">Tokoh-tokoh yang meletakkan dasar berdirinya KOPSSI.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto founders-grid">

                        {/* Member Card */}
                        <div className="founder-card bg-white p-6 rounded-xl shadow-md text-center border-t-4 border-red-500 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-400">
                                <UserCheck size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-1">Kurtubi Asmar</h4>
                            <span className="inline-block px-3 py-1 bg-red-100 text-red-600 text-sm font-medium rounded-full">Ketua</span>
                        </div>

                        {/* Member Card */}
                        <div className="founder-card bg-white p-6 rounded-xl shadow-md text-center border-t-4 border-blue-500 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-400">
                                <UserCheck size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-1">L. Bambang H.P</h4>
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-full">Sekretaris</span>
                        </div>

                        {/* Member Card */}
                        <div className="founder-card bg-white p-6 rounded-xl shadow-md text-center border-t-4 border-green-500 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-400">
                                <UserCheck size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-1">Amroni</h4>
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-600 text-sm font-medium rounded-full">Bendahara</span>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
