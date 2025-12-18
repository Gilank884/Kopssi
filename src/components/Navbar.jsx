import React, { useState, useEffect } from 'react';

const Navbar = ({ onNavigate, onLoginClick, activeTab }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { id: 'home', label: 'Home' },
        { id: 'about', label: 'About Us' },
        { id: 'personil', label: 'Personil' },
        { id: 'business', label: 'Business' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-4' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-4 flex items-center justify-between">
                {/* Logo */}
                <div className="text-2xl font-bold text-gray-900 cursor-pointer" onClick={() => onNavigate('home')}>
                    Brand<span className="text-red-600">.</span>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id);
                            }}
                            className={`text-sm font-medium transition-colors hover:text-red-600 ${activeTab === item.id ? 'text-red-600' : 'text-gray-600'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                    <button
                        onClick={onLoginClick}
                        className="px-5 py-2 rounded-full border border-red-600 text-red-600 font-medium hover:bg-red-600 hover:text-white transition-all text-sm"
                    >
                        Login
                    </button>
                </div>

                {/* Mobile Menu Button (Hamburger) - simplified for this demo */}
                <button className="md:hidden text-gray-900">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
