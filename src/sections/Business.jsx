
import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Store, Wrench, Wallet } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const businessCategories = [
    {
        title: "Perdagangan",
        icon: <Store className="w-8 h-8" />,
        items: [
            "Pengadaan Barang Cetakan ( formulir )",
            "Pengadaan Barang ATK",
            "Pengadaan Barang Non ATK ( dapur )",
            "Pengadaan AC dan Spareparts AC",
            "Pengadaan ID Card & Visitor Card",
            "Pengadaan Sepeda dan Aksesoris Sepeda",
            "Pengadaan Seragam Pegawai"
        ]
    },
    {
        title: "Jasa",
        icon: <Wrench className="w-8 h-8" />,
        items: [
            "Perbaikan dan service AC Gedung",
            "Pengiriman Barang ( kargo )",
            "Penyewaan kendaraan bermotor.",
            "Penitipan kendaraan ( parkir )."
        ]
    },
    {
        title: "Simpan Pinjam",
        icon: <Wallet className="w-8 h-8" />,
        items: [
            "Memberikan pinjaman kepada seluruh anggota KOPSSI yang menginginkan pinjaman."
        ]
    }
];

const Business = () => {
    const comp = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            // Using .batch() or simpler staggered animation
            gsap.from(".business-card", {
                scrollTrigger: {
                    trigger: ".business-grid",
                    start: "top 85%",
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: "power3.out",
                clearProps: "opacity" // Ensure visibility after animation
            });
        }, comp);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={comp} className="py-24 bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                        Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800">Business</span>
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                        Layanan komprehensif untuk mendukung kebutuhan dan pertumbuhan Anda.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 business-grid">
                    {businessCategories.map((category, idx) => (
                        <div
                            key={idx}
                            className="business-card group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-red-100 transition-all duration-500 relative overflow-hidden"
                        >
                            {/* Decorative Background Element */}
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-50 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-2xl"></div>

                            {/* Icon */}
                            <div className="relative w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mb-8 text-red-600 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                {category.icon}
                            </div>

                            {/* Title */}
                            <h3 className="relative text-2xl font-bold text-gray-900 mb-6 group-hover:text-red-700 transition-colors">
                                {category.title}
                            </h3>

                            {/* List */}
                            <ul className="relative space-y-3">
                                {category.items.map((item, itemIdx) => (
                                    <li key={itemIdx} className="flex items-start text-gray-600 group-hover:text-gray-700 transition-colors">
                                        <span className="w-2 h-2 mt-2 mr-3 bg-red-400 rounded-full flex-shrink-0 group-hover:bg-red-600 transition-colors"></span>
                                        <span className="text-sm leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Business;
