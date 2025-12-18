import React, { useRef, useState, useLayoutEffect } from 'react';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import Home from './sections/Home';
import About from './sections/About';
import Pengurus from './sections/Pengurus';
import Pengawas from './sections/Pengawas'
import Business from './sections/Business';
import Footer from './components/Footer';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const homeRef = useRef(null);
    const aboutRef = useRef(null);
    const personilRef = useRef(null);
    const pengawasRef = useRef(null);
    const businessRef = useRef(null);

    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const navigate = useNavigate();

    const sectionRefs = {
        home: homeRef,
        about: aboutRef,
        personil: personilRef,
        pengawas: pengawasRef,
        business: businessRef,
    };

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            // ScrollSpy Logic
            const sections = [
                { id: 'home', ref: homeRef },
                { id: 'about', ref: aboutRef },
                { id: 'personil', ref: personilRef },
                { id: 'pengawas', ref: pengawasRef },
                { id: 'business', ref: businessRef },
            ];

            sections.forEach(section => {
                ScrollTrigger.create({
                    trigger: section.ref.current,
                    start: "top center",
                    end: "bottom center",
                    onEnter: () => setActiveTab(section.id),
                    onEnterBack: () => setActiveTab(section.id),
                });
            });
        });

        return () => ctx.revert();
    }, []);

    const handleNavigate = (sectionId) => {
        // ... existing navigation logic ...
        const targetRef = sectionRefs[sectionId];
        if (targetRef && targetRef.current) {
            gsap.to(window, {
                duration: 1,
                scrollTo: { y: targetRef.current, offsetY: 80 },
                ease: "power2.inOut"
            });
        }
    };

    const handleLogin = (role) => {
        setIsLoginOpen(false);
        setTimeout(() => {
            if (role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        }, 300);
    };

    return (
        <div className="relative font-sans text-gray-900">
            <Navbar
                onNavigate={handleNavigate}
                onLoginClick={() => setIsLoginOpen(true)}
                activeTab={activeTab}
            />

            <div ref={homeRef} id="home"><Home /></div>
            <div ref={aboutRef} id="about"><About /></div>
            <div ref={personilRef} id="personil"><Pengurus /></div>
            <div ref={pengawasRef} id="pengawas"><Pengawas /></div>
            <div ref={businessRef} id="business"><Business /></div>

            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onLogin={handleLogin}
            />

            <Footer />
        </div>
    );
};

export default LandingPage;
