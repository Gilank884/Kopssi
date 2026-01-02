import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import gsap from 'gsap';

const Sidebar = ({ isOpen, navItems, onLogout }) => {
    const sidebarRef = useRef(null);

    useEffect(() => {
        if (!sidebarRef.current) return;

        const ctx = gsap.context(() => {
            gsap.from(sidebarRef.current, {
                x: -40,
                opacity: 0,
                duration: 0.6,
                ease: 'power2.out'
            });
        });
        return () => ctx.revert();
    }, []);

    return (
        <aside
            ref={sidebarRef}
            className={`flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white border-r border-slate-700
            ${isOpen ? 'w-72' : 'w-20'} transition-all duration-300`}
        >
            {/* Logo Section */}
            <div className="h-20 flex items-center justify-center border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
                <span className={`font-bold transition-all duration-300 ${isOpen ? 'text-2xl tracking-wide' : 'text-xl'}`}>
                    {isOpen ? (
                        <>
                            KOP<span className="text-emerald-400">SSI</span>
                        </>
                    ) : (
                        <span className="text-emerald-400">K</span>
                    )}
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden
                            ${isActive
                                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`
                        }
                    >
                        <span className="relative z-10 flex items-center justify-center">
                            {item.icon}
                        </span>

                        {isOpen && (
                            <span className="font-medium relative z-10 whitespace-nowrap">
                                {item.label}
                            </span>
                        )}

                        {/* Hover Effect Line */}
                        {!isOpen && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Logout Section */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300 group
                    ${!isOpen && 'justify-center'}`}
                >
                    <LogOut size={22} className="group-hover:translate-x-[-2px] transition-transform" />
                    {isOpen && <span className="font-medium">Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
