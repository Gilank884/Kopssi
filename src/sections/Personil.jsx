import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const teamMembers = [
    { name: "John Doe", role: "CEO", img: "bg-gray-300" },
    { name: "Jane Smith", role: "CTO", img: "bg-gray-300" },
    { name: "Mike Johnson", role: "Lead Designer", img: "bg-gray-300" },
    { name: "Sarah Williams", role: "Developer", img: "bg-gray-300" },
];

const Personil = () => {
    const comp = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            gsap.from(".team-card", {
                scrollTrigger: {
                    trigger: ".team-grid",
                    start: "top 80%",
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15
            });
        }, comp);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={comp} className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-gray-900">Our <span className="text-red-600">Team</span></h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">Meet the brilliant minds behind our success.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 team-grid">
                    {teamMembers.map((member, idx) => (
                        <div key={idx} className="team-card group">
                            <div className={`w-full aspect-square ${member.img} rounded-xl mb-4 overflow-hidden relative`}>
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">{member.name}</h3>
                            <p className="text-gray-500">{member.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Personil;
