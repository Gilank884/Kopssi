import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
    const comp = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            gsap.from(".about-left", {
                scrollTrigger: {
                    trigger: ".about-container",
                    start: "top 80%",
                },
                x: -100,
                opacity: 0,
                duration: 1
            });

            gsap.from(".about-right", {
                scrollTrigger: {
                    trigger: ".about-container",
                    start: "top 80%",
                },
                x: 100,
                opacity: 0,
                duration: 1,
                delay: 0.2
            });
        }, comp);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={comp} className="py-20 bg-gray-50 overflow-hidden">
            <div className="container mx-auto px-4 about-container">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="md:w-1/2 about-left">
                        <div className="w-full h-80 bg-gray-200 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden relative">
                            {/* Placeholder Image */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 to-white"></div>
                            <span className="text-gray-400 font-medium relative z-10">Illustration / Image</span>
                        </div>
                    </div>
                    <div className="md:w-1/2 about-right">
                        <h2 className="text-4xl font-bold mb-6 text-gray-900">About <span className="text-red-600">Us</span></h2>
                        <p className="text-gray-600 text-lg leading-relaxed mb-6">
                            Founded with a vision to redefine excellence, we are a team of passionate professionals dedicated to delivering top-tier services.
                            Our commitment to quality and innovation sets us apart in the industry.
                        </p>
                        <div className="w-20 h-1 bg-red-600 rounded-full"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
