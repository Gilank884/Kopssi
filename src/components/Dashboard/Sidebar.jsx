import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut, ChevronRight } from 'lucide-react';
import gsap from 'gsap';

const Sidebar = ({ isOpen, navItems, onLogout, onNavItemClick }) => {
    const sidebarRef = useRef(null);
    const location = useLocation();

    // Entrance animation (mount)
    useEffect(() => {
        if (!sidebarRef.current) return;

        const ctx = gsap.context(() => {
            gsap.from(sidebarRef.current, {
                x: -30,
                opacity: 0,
                duration: 0.6,
                ease: 'power3.out'
            });
        });

        return () => ctx.revert();
    }, []);

    return (
        <aside
            ref={sidebarRef}
            className={`
                flex flex-col h-full
                bg-gradient-to-b from-slate-900 to-slate-950
                border-r border-slate-800/80
                text-slate-300
                shadow-2xl shadow-slate-900/50
                ${isOpen ? 'w-72' : 'w-20'}
                transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                z-50 relative overflow-hidden
            `}
        >
            {/* Background Decorative Elem */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-900/10 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute top-1/2 -left-24 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl opacity-30"></div>
            </div>

            {/* LOGO */}
            <div className="relative z-10 h-24 flex items-center justify-center border-b border-slate-800/60 bg-slate-900/30 backdrop-blur-sm">
                <div className={`flex items-center gap-3 transition-all duration-300 ${!isOpen && 'justify-center'}`}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/10 group-hover:scale-105 transition-transform">
                        <span className="font-black text-white text-lg italic">K</span>
                    </div>
                    {isOpen && (
                        <div className="flex flex-col">
                            <h1 className="font-black text-xl text-white tracking-tight italic leading-none">KOPSSI</h1>
                            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-[0.2em] leading-none mt-1">Member</span>
                        </div>
                    )}
                </div>
            </div>

            {/* NAVIGATION */}
            <nav className="relative z-10 flex-1 px-3 py-6 space-y-1.5 overflow-y-auto [&::-webkit-scrollbar]:hidden pl-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={onNavItemClick}
                        className={({ isActive }) =>
                            `group relative flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300
                            ${isActive
                                ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-600/5 text-emerald-400 font-bold shadow-inner border border-emerald-500/10'
                                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 font-medium'
                            }
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                {/* Active Indicator Bar */}
                                <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)] transition-all duration-300 ${isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'}`} />

                                {/* Icon */}
                                <span className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'group-hover:scale-105'}`}>
                                    {item.icon}
                                </span>

                                {/* Label */}
                                {isOpen && (
                                    <span className="relative z-10 flex-1 whitespace-nowrap tracking-wide text-sm">
                                        {item.label}
                                    </span>
                                )}

                                {/* Hover/Active Chevron */}
                                {isOpen && isActive && (
                                    <ChevronRight size={16} className="text-emerald-500/50 animate-pulse" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* LOGOUT */}
            <div className="relative z-10 p-4 border-t border-slate-800/60 bg-slate-900/30 backdrop-blur-sm">
                <button
                    onClick={onLogout}
                    className={`
                        w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                        text-sm font-bold text-slate-400
                        transition-all duration-300
                        border border-transparent
                        hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 hover:shadow-lg hover:shadow-rose-900/20
                        active:scale-[0.98]
                        group
                        ${!isOpen && 'justify-center px-2'}
                    `}
                >
                    <LogOut size={20} className="transition-transform duration-300 group-hover:-translate-x-1" />
                    {isOpen && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
