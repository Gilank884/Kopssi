import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    LogOut,
    Menu,
    Bell
} from 'lucide-react';
import LogoutModal from '../components/LogoutModal';

const AdminLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        setIsLogoutModalOpen(false);
        navigate('/');
    };

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} />, end: true },
        { path: '/admin/members', label: 'Data Anggota', icon: <Users size={20} /> },
        { path: '/admin/reports', label: 'Laporan', icon: <FileText size={20} /> },
        { path: '/admin/settings', label: 'Pengaturan', icon: <Settings size={20} /> },
    ];

    const currentPath = location.pathname;
    const currentItem = navItems.find(item => item.path === currentPath)
        || { label: 'Admin Panel' };

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
            {/* Sidebar */}
            <aside
                className={`bg-white text-gray-800 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} fixed h-full z-20 md:relative border-r border-gray-200 shadow-sm`}
            >
                <div className="h-16 flex items-center justify-center border-b border-gray-100 bg-emerald-600">
                    {isSidebarOpen ? <span className="text-xl font-bold tracking-wider text-white">ADMIN PANEL</span> : <span className="text-xl font-bold text-white">AP</span>}
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${isActive ? 'bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`
                            }
                        >
                            <div>{item.icon}</div>
                            {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-3 border-t border-gray-100">
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:text-gray-700">
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 hidden md:block">{currentItem.label}</h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative text-gray-500 hover:text-emerald-600">
                            <Bell size={20} />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-900">Administrator</p>
                                <p className="text-xs text-gray-500 font-medium">Head Office</p>
                            </div>
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold border border-emerald-200">
                                AD
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6 bg-emerald-50/30">
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

export default AdminLayout;
