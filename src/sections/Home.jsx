
import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Wallet, CreditCard, Users, ArrowRight } from 'lucide-react';

const Home = () => {
  const comp = useRef(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Background Animation
      // Use .to check because we might start from opacity 0 defined in CSS if we wanted, 
      // but here we rely on from() which should be fine if initialized correctly.
      // Added safe defaults and clearProps to ensure visibility at end.
      tl.from(".grid-bg", { opacity: 0, duration: 1.5 })
        .from(".hero-content-left > *", {
          y: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          clearProps: "opacity"
        }, "-=1")
        .from(".hero-card", {
          x: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "back.out(1.7)",
          clearProps: "opacity"
        }, "-=0.5");

    }, comp);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={comp} className="relative min-h-screen flex items-center bg-white overflow-hidden py-20">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 grid-bg pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(to right, #10b981 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
            opacity: 0.4
          }}
        ></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Left Content: Text & History */}
          <div className="lg:w-1/2 hero-content-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Trusted Since 2002
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Koperasi Syariah Indonesia <br />
              <span className="text-emerald-600">PT Swadharma Sarana Informatika</span>
            </h1>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-l-4 border-emerald-600 shadow-sm mb-8">
              <p className="text-gray-600 leading-relaxed italic">
                "KOPSSI Didirikan pada tanggal 20 september 2002 di Gedung Hanglekir Raya No 30 kel Gunung. Kebayoran Baru - Jakarta Selatan 12120. Di sahkan dengan nomor akte pendirian: <strong>295/BH/MENEG.I/VIII/2003</strong>. Dengan Jumlah anggota awal 33 (tiga puluh tiga) orang yang disebut sebagai pendiri Koperasi Pegawai PT SSI."
              </p>
            </div>

            <button className="group bg-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 flex items-center gap-3">
              Explore More
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </div>

          {/* Right Content: Feature Cards */}
          <div className="lg:w-1/2 w-full grid gap-6">

            {/* Simpanan Card */}
            <div className="hero-card bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hover:border-emerald-200 transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-xl text-green-600 group-hover:scale-110 transition-transform">
                  <Wallet size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Simpanan</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Produk Simpanan dapat diikutin oleh seluruh Pegawai PT Swadharma Sarana Informatika yang telah menjadi anggota.
                  </p>
                </div>
              </div>
            </div>

            {/* Pinjaman Card */}
            <div className="hero-card bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hover:border-emerald-200 transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                  <CreditCard size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Pinjaman</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Produk Pinjaman dapat diikuti oleh seluruh Pegawai PT Swadharma Sarana Informatika yang telah menjadi anggota.
                  </p>
                </div>
              </div>
            </div>

            {/* Jumlah Anggota Card */}
            <div className="hero-card bg-gradient-to-r from-emerald-600 to-emerald-800 p-6 rounded-2xl shadow-xl text-white transform hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">Jumlah Anggota</h3>
                  <div className="text-4xl font-bold text-white mb-2">7,000 <span className="text-base font-normal text-white">Orang</span></div>
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <Users size={16} />
                    <span>Active Members</span>
                  </div>
                </div>
                <div className="w-24 h-24 bg-white rounded-full p-2 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <img src="/Ssi.png" alt="SSI Logo" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
