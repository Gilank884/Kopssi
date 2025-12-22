
import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Wallet, TrendingUp, Plane, FileText, Banknote, Briefcase } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const savings = [
    {
        title: "Tabungan Koperasi Syariah",
        subtitle: "Investasi Halal yang Produktif",
        description: "Simpanan berbasis prinsip Islam yang dikelola secara amanah, transparan, dan profesional. Dana dikelola tanpa riba melalui sistem bagi hasil syariah yang adil.",
        icon: <Wallet className="w-8 h-8" />,
        items: [
            "Sistem bagi hasil halal & transparan",
            "Dikelola secara amanah dan profesional",
            "Berizin resmi Kementerian Koperasi RI",
            "Mendukung kesejahteraan anggota"
        ]
    },
    {
        title: "Simpanan Berjangka Syariah",
        subtitle: "Investasi Jangka Panjang",
        description: "Produk investasi berbasis akad Mudharabah dengan skema bagi hasil yang adil dan kompetitif. Cocok untuk perencanaan keuangan jangka menengah hingga panjang.",
        icon: <TrendingUp className="w-8 h-8" />,
        items: [
            "Bagi hasil kompetitif sesuai kinerja usaha",
            "Pilihan tenor fleksibel (3, 6, 12 bulan)",
            "Dana dikelola secara aman dan profesional",
            "Sesuai prinsip syariah dan bebas riba"
        ]
    },
    {
        title: "Tabungan Safar",
        subtitle: "Wujudkan Perjalanan Impian",
        description: "Solusi perencanaan dana perjalanan seperti wisata halal, umrah, dan kebutuhan lainnya secara terencana, aman, dan sesuai prinsip syariah.",
        icon: <Plane className="w-8 h-8" />,
        items: [
            "Sistem bagi hasil sesuai prinsip syariah",
            "Perencanaan perjalanan yang terstruktur",
            "Dana aman, halal, dan penuh berkah",
            "Konsultasi perjalanan sesuai kebutuhan"
        ]
    }
];

const loans = [
    {
        title: "Invoice Financing Syariah",
        subtitle: "Likuiditas Cepat Tanpa Riba",
        description: "Solusi pembiayaan bagi pelaku usaha yang membutuhkan likuiditas cepat melalui skema pembiayaan piutang (invoice) yang transparan dan adil.",
        icon: <FileText className="w-8 h-8" />,
        items: [
            "Pembiayaan piutang berbasis syariah",
            "Proses cepat dan efisien",
            "Skema transparan dan adil",
            "Didukung tim profesional berpengalaman"
        ]
    },
    {
        title: "Dana Talangan Syariah",
        subtitle: "Solusi Pembiayaan Mendesak",
        description: "Layanan pembiayaan jangka pendek untuk kebutuhan mendesak secara halal, cepat, dan amanah menggunakan prinsip qardhul hasan.",
        icon: <Banknote className="w-8 h-8" />,
        items: [
            "Menggunakan prinsip qardhul hasan",
            "Proses pencairan cepat",
            "Tanpa riba",
            "Pengembalian ringan dan transparan"
        ]
    },
    {
        title: "Pembiayaan Modal Usaha Syariah",
        subtitle: "Modal Halal untuk Usaha",
        description: "Solusi pendanaan halal untuk mengembangkan usaha produktif dengan sistem bagi hasil yang adil, tanpa riba.",
        icon: <Briefcase className="w-8 h-8" />,
        items: [
            "Sistem bagi hasil yang adil",
            "Bebas riba dan sesuai syariah",
            "Pengelolaan dana secara amanah",
            "Mendukung pertumbuhan usaha"
        ]
    }
];

const Business = () => {
    const comp = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            // Animate Savings
            gsap.from(".savings-card", {
                scrollTrigger: {
                    trigger: ".savings-grid",
                    start: "top 85%",
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: "power3.out",
                clearProps: "opacity"
            });

            // Animate Loans
            gsap.from(".loans-card", {
                scrollTrigger: {
                    trigger: ".loans-grid",
                    start: "top 85%",
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: "power3.out",
                clearProps: "opacity"
            });
        }, comp);

        return () => ctx.revert();
    }, []);

    const CategoryCard = ({ category, className }) => (
        <div
            className={`${className} group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-emerald-100 transition-all duration-500 relative overflow-hidden flex flex-col h-full`}
        >
            {/* Decorative Background Element */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-2xl"></div>

            {/* Icon */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
                {category.icon}
            </div>

            {/* Content Wrapper for Flex Grow */}
            <div className="flex-grow">
                {/* Title & Subtitle */}
                <div className="mb-4">
                    <h3 className="relative text-xl font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors">
                        {category.title}
                    </h3>
                    <p className="text-sm font-semibold text-emerald-500 mb-2">
                        {category.subtitle}
                    </p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {category.description}
                    </p>
                </div>

                {/* List */}
                <ul className="relative space-y-2">
                    {category.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start text-gray-600 group-hover:text-gray-700 transition-colors">
                            <span className="w-1.5 h-1.5 mt-2 mr-2.5 bg-emerald-400 rounded-full flex-shrink-0 group-hover:bg-emerald-600 transition-colors"></span>
                            <span className="text-sm leading-relaxed">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );

    return (
        <section ref={comp} className="py-24 bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                        Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-800">Products</span>
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                        Berbagai pilihan produk simpanan dan pembiayaan syariah untuk kebutuhan masa depan Anda.
                    </p>
                </div>

                {/* Tabungan Section */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-gray-800 mb-8 pl-4 border-l-4 border-emerald-600">
                        Tabungan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 savings-grid">
                        {savings.map((category, idx) => (
                            <CategoryCard key={idx} category={category} className="savings-card" />
                        ))}
                    </div>
                </div>

                {/* Pinjaman Section */}
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-8 pl-4 border-l-4 border-emerald-600">
                        Pinjaman
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 loans-grid">
                        {loans.map((category, idx) => (
                            <CategoryCard key={idx} category={category} className="loans-card" />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Business;

