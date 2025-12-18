import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const services = [
    { title: "Consulting", desc: "Expert advice to optimize your strategy." },
    { title: "Development", desc: "Robust software solutions tailored for you." },
    { title: "Marketing", desc: "Reach your audience with precision." },
    { title: "Support", desc: "24/7 dedicated support for your needs." },
    { title: "Analytics", desc: "Data-driven insights to grow your business." },
    { title: "Security", desc: "Protecting your digital assets." },
];

const Business = () => {
    const comp = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            gsap.from(".business-card", {
                scrollTrigger: {
                    trigger: ".business-grid",
                    start: "top 85%",
                },
                scale: 0.9,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1
            });
        }, comp);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={comp} className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-gray-900">Our <span className="text-red-600">Business</span></h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">Diverse solutions for a complex world.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 business-grid">
                    {services.map((service, idx) => (
                        <div key={idx} className="business-card bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 hover:border-red-100">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6 text-red-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                            <p className="text-gray-600">{service.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Business;
