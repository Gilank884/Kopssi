import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const Home = () => {
  const comp = useRef(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from(".hero-text", { y: 50, opacity: 0, duration: 1, stagger: 0.2 })
        .from(".hero-btn", { scale: 0, opacity: 0, duration: 0.5, ease: "back.out(1.7)" }, "-=0.5");
    }, comp);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={comp} className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-3xl">
        <h1 className="hero-text text-5xl md:text-7xl font-bold text-gray-900 mb-6">
          Innovation for a <span className="text-red-600">Better Future</span>
        </h1>
        <p className="hero-text text-xl text-gray-600 mb-8">
          We deliver cutting-edge solutions to propel your business forward. 
          Professional, reliable, and visionary.
        </p>
        <button className="hero-btn bg-red-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-red-700 transition-colors shadow-lg hover:shadow-red-200">
          Get Started
        </button>
      </div>
    </section>
  );
};

export default Home;
