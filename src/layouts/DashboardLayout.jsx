import React, { useState, useLayoutEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    CreditCard,
    CalendarDays,
    PieChart,
    User,
    LogOut,
    Menu,
    Bell,
    FileText
} from 'lucide-react';
import gsap from 'gsap';
import LogoutModal from '../components/LogoutModal';

const DashboardLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarRef = useRef(null);
    const headerRef = useRef(null);

    useLayoutEffect(() => {
        // Reveal animation
        const ctx = gsap.context(() => {
            gsap.from(sidebarRef.current, { x: -50, opacity: 0, duration: 0.6, ease: "power2.out" });
            gsap.from(headerRef.current, { y: -20, opacity: 0, duration: 0.6, delay: 0.2, ease: "power2.out" });
        });
        return () => ctx.revert();
    }, []);

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        setIsLogoutModalOpen(false);
        navigate('/');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, end: true },
        { path: '/dashboard/simpanan', label: 'Simpanan Saya', icon: <Wallet size={20} /> },
        { path: '/dashboard/pinjaman', label: 'Pinjaman Saya', icon: <CreditCard size={20} /> },
        { path: '/dashboard/angsuran', label: 'Angsuran Saya', icon: <CalendarDays size={20} /> },
        { path: '/dashboard/shu', label: 'SHU Saya', icon: <PieChart size={20} /> },
        { path: '/dashboard/pengajuan-pinjaman', label: 'Pengajuan Pinjaman', icon: <FileText size={20} /> },
        { path: '/dashboard/profil', label: 'Profil', icon: <User size={20} /> },
    ];

    const currentPath = location.pathname;
    const currentItem = navItems.find(item => item.path === currentPath)
        || { label: 'Dashboard' };

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={`bg-white border-r border-emerald-100 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} fixed h-full z-20 md:relative shadow-sm`}
            >
                <div className="h-16 flex items-center justify-center border-b border-emerald-50 bg-emerald-600">
                    {isSidebarOpen ? <span className="text-xl font-bold tracking-wider text-white">KOPSSI</span> : <span className="text-xl font-bold text-white">K</span>}
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 ${isActive ? 'bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100 translate-x-1' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`
                            }
                        >
                            <div>{item.icon}</div>
                            {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-3 border-t border-emerald-50">
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header ref={headerRef} className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10 border-b border-emerald-50">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-emerald-600 transition-colors">
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 hidden md:block">{currentItem.label}</h1>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Notification */}
                        <button className="relative text-gray-400 hover:text-emerald-600 transition-colors">
                            <Bell size={20} />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        </button>

                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-6 border-l border-emerald-50">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-900">Gilang Prasetyo</p>
                                <p className="text-xs text-emerald-500 font-medium">Anggota #12345</p>
                            </div>
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold border-2 border-emerald-50 shadow-md">
                                GP
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6 bg-gray-50">
                    <Outlet />
                </main>
            </div>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
            />
        </div>
    );
};

export default DashboardLayout;
