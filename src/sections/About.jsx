
import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Clock,
    MapPin,
    ScrollText,
    Users,
    Target,
    Shield,
    Award,
    UserCheck,
    Scale,
    HeartHandshake,
    Ban,
    FileSignature,
    Leaf,
    TrendingUp,
    CheckCircle2
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
    const mainRef = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            // Animate Sections Title
            const titles = gsap.utils.toArray('.animate-title');
            titles.forEach((title) => {
                gsap.from(title, {
                    scrollTrigger: {
                        trigger: title,
                        start: "top 85%",
                    },
                    y: 30,
                    opacity: 0,
                    duration: 1,
                    ease: "power3.out"
                });
            });

            // Animate Standard Sections
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

            // Principle Cards Stagger
            gsap.from(".principle-card", {
                scrollTrigger: {
                    trigger: ".principles-grid",
                    start: "top 85%",
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: "back.out(1.7)"
            });

            // Advantage Items Stagger
            gsap.from(".advantage-item", {
                scrollTrigger: {
                    trigger: ".advantages-list",
                    start: "top 80%",
                },
                x: -30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: "power2.out"
            });

            // Founder Cards
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
        <div ref={mainRef} className="bg-white overflow-hidden font-sans">

            {/* Hero / Intro Section */}
            <section className="py-24 px-4 bg-gradient-to-b from-emerald-50 to-white animate-section relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/3"></div>

                <div className="container mx-auto max-w-5xl relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 text-emerald-600 text-sm font-semibold mb-4">
                            Mengenal Lebih Dekat
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
                            Apa Itu <span className="text-emerald-600">Koperasi Syariah?</span>
                        </h2>
                        <div className="w-24 h-1 bg-emerald-500 mx-auto rounded-full mb-8"></div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                            <p>
                                <strong className="text-gray-900">Koperasi Syariah</strong> adalah lembaga keuangan berbasis komunitas yang beroperasi dengan prinsip-prinsip syariah. Berbeda dengan koperasi konvensional, kami menjunjung tinggi hukum Islam dalam semua operasional.
                            </p>
                            <p>
                                Kegiatan kami dijalankan berdasarkan prinsip <span className="text-emerald-600 font-medium">bagi hasil (profit-sharing)</span> dan akad yang jelas, tanpa riba, spekulasi, atau ketidakpastian (gharar).
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-xl border border-emerald-100 relative">
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                                <Leaf className="text-emerald-600 w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Konsep Dasar</h3>
                            <p className="text-gray-600 mb-6">
                                Kerjasama dan tolong-menolong antar anggota untuk kesejahteraan bersama. Keuntungan dibagi adil sesuai kontribusi.
                            </p>
                            <div className="flex items-center gap-4 text-sm font-medium text-emerald-700">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={18} /> Transparan
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={18} /> Adil
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={18} /> Berkah
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Principles Section */}
            <section className="py-20 px-4 bg-emerald-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="text-center mb-16 animate-title">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Prinsip Utama</h2>
                        <p className="text-emerald-100 max-w-2xl mx-auto">Nilai-nilai luhur yang menjadi landasan operasional kami untuk menjamin keberkahan transaksi.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 principles-grid">
                        {/* Principle 1 */}
                        <div className="principle-card bg-emerald-800/50 backdrop-blur-sm p-6 rounded-xl border border-emerald-700 hover:bg-emerald-800 transition-colors">
                            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mb-4">
                                <Ban className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Tanpa Riba</h3>
                            <p className="text-emerald-100/80 text-sm leading-relaxed">
                                Bebas dari bunga yang merugikan. Kami menggunakan sistem bagi hasil yang adil bagi semua pihak.
                            </p>
                        </div>

                        {/* Principle 2 */}
                        <div className="principle-card bg-emerald-800/50 backdrop-blur-sm p-6 rounded-xl border border-emerald-700 hover:bg-emerald-800 transition-colors">
                            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mb-4">
                                <FileSignature className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Akad Jelas</h3>
                            <p className="text-emerald-100/80 text-sm leading-relaxed">
                                Transaksi menggunakan akad syariah (Murabahah, Mudharabah, Ijarah) yang transparan.
                            </p>
                        </div>

                        {/* Principle 3 */}
                        <div className="principle-card bg-emerald-800/50 backdrop-blur-sm p-6 rounded-xl border border-emerald-700 hover:bg-emerald-800 transition-colors">
                            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mb-4">
                                <Scale className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Keadilan</h3>
                            <p className="text-emerald-100/80 text-sm leading-relaxed">
                                Tidak ada pihak yang dirugikan (Dzalim). Transparansi dalam laporan keuangan dan operasional.
                            </p>
                        </div>

                        {/* Principle 4 */}
                        <div className="principle-card bg-emerald-800/50 backdrop-blur-sm p-6 rounded-xl border border-emerald-700 hover:bg-emerald-800 transition-colors">
                            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mb-4">
                                <HeartHandshake className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Sosial</h3>
                            <p className="text-emerald-100/80 text-sm leading-relaxed">
                                Misi sosial kuat. Alokasi keuntungan untuk pemberdayaan ekonomi dan kegiatan amal.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Advantages Section */}
            <section className="py-24 px-4 bg-gray-50">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col lg:flex-row gap-16 items-start">
                        <div className="lg:w-1/3 animate-title sticky top-24">
                            <span className="text-emerald-600 font-bold tracking-wider uppercase text-sm">Mengapa Kami?</span>
                            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-6">Keunggulan Koperasi Syariah</h2>
                            <p className="text-gray-600 leading-relaxed mb-8">
                                Pilihan tepat bagi Anda yang menginginkan ketenangan hati dan keberkahan harta dalam bertransaksi finansial, terhindar dari praktik yang dilarang agama.
                            </p>
                            <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
                                Bergabung Sekarang
                            </button>
                        </div>

                        <div className="lg:w-2/3 grid gap-8 advantages-list">
                            {/* Adv 1 */}
                            <div className="advantage-item flex gap-5 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all">
                                <div className="mt-1">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <Shield size={20} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">Bebas Transaksi Haram</h4>
                                    <p className="text-gray-600">Terhindar dari riba dan praktik terlarang. Memberikan ketenangan dan kenyamanan batin bagi anggota.</p>
                                </div>
                            </div>

                            {/* Adv 2 */}
                            <div className="advantage-item flex gap-5 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all">
                                <div className="mt-1">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <TrendingUp size={20} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">Pemberdayaan Ekonomi</h4>
                                    <p className="text-gray-600">Fokus pada UMKM dan ekonomi lokal. Membantu usaha kecil tumbuh dengan pembiayaan yang suportif.</p>
                                </div>
                            </div>

                            {/* Adv 3 */}
                            <div className="advantage-item flex gap-5 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all">
                                <div className="mt-1">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                        <Scale size={20} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">Bagi Hasil Adil</h4>
                                    <p className="text-gray-600">Risiko dan keuntungan ditanggung bersama secara proporsional. Tidak ada bunga tetap yang mencekik.</p>
                                </div>
                            </div>

                            {/* Adv 4 */}
                            <div className="advantage-item flex gap-5 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all">
                                <div className="mt-1">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <Users size={20} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">Kesejahteraan Bersama</h4>
                                    <p className="text-gray-600">Gotong royong adalah kunci. Keuntungan dikembalikan untuk kemaslahatan seluruh anggota.</p>
                                </div>
                            </div>

                            {/* Adv 5 */}
                            <div className="advantage-item flex gap-5 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all">
                                <div className="mt-1">
                                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                                        <Award size={20} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">Etika & Moral</h4>
                                    <p className="text-gray-600">Mengutamakan nilai kemanusiaan dan etika dalam bisnis, menjadikannya lebih berkah dan manusiawi.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sejarah / History Section (Preserved) */}
            <section className="py-20 px-4 animate-section bg-white border-t border-gray-100">
                <div className="container mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="lg:w-1/2 relative">
                            {/* Decorative graphics */}
                            <div className="absolute -left-4 -top-4 w-24 h-24 bg-emerald-100 rounded-full blur-2xl"></div>
                            <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100 z-10">
                                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    <Clock className="text-emerald-600" />
                                    <span>Sejarah Pendirian</span>
                                </h3>
                                <ul className="space-y-4 text-gray-600">
                                    <li className="flex gap-3">
                                        <div className="mt-1 min-w-[20px]"><ScrollText size={18} className="text-emerald-500" /></div>
                                        <span>Didirikan pada tanggal 20 September 2002.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="mt-1 min-w-[20px]"><MapPin size={18} className="text-emerald-500" /></div>
                                        <span>Berlokasi di Gedung Hanglekir Raya No 30, Kel. Gunung, Kebayoran Baru, Jakarta Selatan 12120.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="mt-1 min-w-[20px]"><Shield size={18} className="text-emerald-500" /></div>
                                        <span>Disahkan dengan nomor akte pendirian: <strong>295/BH/MENEG.I/VIII/2003</strong>.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="mt-1 min-w-[20px]"><Users size={18} className="text-emerald-500" /></div>
                                        <span>Jumlah anggota awal sebanyak 33 (tiga puluh tiga) orang pendiri.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="lg:w-1/2 space-y-6">
                            <div className="flex items-start gap-4 p-6 bg-emerald-50 rounded-xl">
                                <div className="p-3 bg-emerald-600 rounded-lg text-white font-bold text-2xl">20+</div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900">Tahun Pengalaman</h4>
                                    <p className="text-gray-600 mt-1">Berdedikasi dalam melayani dan mensejahterakan anggota sejak tahun 2002.</p>
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900">Fondasi Yang Kuat</h3>
                            <p className="text-gray-600 text-lg">
                                Koperasi Syariah Pegawai PT Swadharma Sarana Informatika (KOPSSI) terus tumbuh dengan memegang teguh amanah para pendirinya untuk memberikan manfaat sebesar-besarnya bagi kesejahteraan anggota.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pengurus Awal (Founders) Section (Preserved) */}
            <section className="py-20 px-4 bg-gray-50 animate-section">
                <div className="container mx-auto">
                    <div className="text-center mb-16">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">Pengurus Awal</h3>
                        <p className="text-gray-600">Tokoh-tokoh yang meletakkan dasar berdirinya KOPSSI.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto founders-grid">

                        {/* Member Card */}
                        <div className="founder-card bg-white p-6 rounded-xl shadow-md text-center border-t-4 border-emerald-500 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-400">
                                <UserCheck size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-1">Kurtubi Asmar</h4>
                            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-600 text-sm font-medium rounded-full">Ketua</span>
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
                        <div className="founder-card bg-white p-6 rounded-xl shadow-md text-center border-t-4 border-emerald-500 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-400">
                                <UserCheck size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-1">Amroni</h4>
                            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-600 text-sm font-medium rounded-full">Bendahara</span>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
