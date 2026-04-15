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

    // Group items by category
    const categories = navItems.reduce((acc, item) => {
        const cat = item.category || 'MENU';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    const categoryOrder = ['UTAMA', 'KEUANGAN', 'LAYANAN', 'AKUN'];

    return (
        <aside
            ref={sidebarRef}
            className={`
                flex flex-col h-full
                bg-[#0f172a]
                border-r border-slate-800/40
                text-slate-300
                shadow-2xl shadow-black/20
                ${isOpen ? 'w-72' : 'w-20'}
                transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                z-50 relative overflow-hidden
            `}
        >
            {/* LOGO AREA */}
            <div className="relative z-10 h-24 flex items-center px-6 border-b border-slate-800/40 bg-slate-900/20 backdrop-blur-md">
                <div className={`flex items-center gap-3.5 transition-all duration-300 ${!isOpen && 'mx-auto'}`}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10 ring-1 ring-white/10 shrink-0">
                        <span className="font-black text-white text-lg italic tracking-tighter">K</span>
                    </div>
                    {isOpen && (
                        <div className="flex flex-col">
                            <h1 className="font-black text-xl text-white tracking-tight italic leading-none">KOPSSI</h1>
                            <span className="text-[9px] text-emerald-500/80 font-black uppercase tracking-[0.2em] leading-none mt-1.5 opacity-80">Portal Anggota</span>
                        </div>
                    )}
                </div>
            </div>

            {/* NAVIGATION AREA */}
            <nav className="relative z-10 flex-1 px-3 py-8 space-y-8 overflow-y-auto scrollbar-hide">
                {Object.keys(categories).sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)).map((catName) => (
                    <div key={catName} className="space-y-2">
                        {isOpen && (
                            <h4 className="px-4 text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase opacity-70 mb-3">
                                {catName}
                            </h4>
                        )}
                        <div className="space-y-1">
                            {categories[catName].map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.end}
                                    onClick={onNavItemClick}
                                    className={({ isActive }) =>
                                        `group relative flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300
                                        ${isActive
                                            ? 'bg-emerald-500/5 text-emerald-400 font-bold'
                                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'
                                        }
                                    `}
                                >
                                    {({ isActive }) => (
                                        <>
                                            {/* Minimal Active Indicator */}
                                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-500 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} />

                                            {/* Icon with subtle glow on active */}
                                            <span className={`relative z-10 transition-all duration-300 ${isActive ? 'text-emerald-400' : 'group-hover:text-slate-200'}`}>
                                                {item.icon}
                                            </span>

                                            {/* Label */}
                                            {isOpen && (
                                                <span className="relative z-10 flex-1 whitespace-nowrap tracking-wide text-[13px]">
                                                    {item.label}
                                                </span>
                                            )}

                                            {/* Refined Chevron */}
                                            {isOpen && (
                                                <ChevronRight 
                                                    size={14} 
                                                    className={`transition-all duration-300 ${isActive ? 'text-emerald-500/40 opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-30 group-hover:translate-x-0'}`} 
                                                />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* FOOTER SECTION: LOGOUT */}
            <div className="relative z-10 p-4 border-t border-slate-800/40">
                <button
                    onClick={onLogout}
                    className={`
                        w-full flex items-center gap-3.5 px-4 py-3 rounded-xl
                        text-[13px] font-bold text-slate-500
                        transition-all duration-300
                        hover:bg-rose-500/5 hover:text-rose-400
                        active:scale-[0.98]
                        group
                        ${!isOpen && 'justify-center'}
                    `}
                >
                    <LogOut size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
                    {isOpen && <span>Keluar Sistem</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
