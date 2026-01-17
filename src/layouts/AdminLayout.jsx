import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Menu,
    Bell,
    UserPlus,
    ClipboardCheck,
    Banknote,
    FileBarChart,
    ChevronDown,
    BanknoteArrowUp,
    ArrowLeftRight,
    Upload,
    BadgeCent,
    Send,
    Search,
    UserCircle,
    CheckCircle
} from 'lucide-react';
import LogoutModal from '../components/LogoutModal';

const AdminLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState({});
    const [pendingCount, setPendingCount] = useState(0);
    const [countAssessment, setCountAssessment] = useState(0);
    const [countDisbursement, setCountDisbursement] = useState(0);
    const [countDelivery, setCountDelivery] = useState(0);
    const [countExit, setCountExit] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogoutClick = () => setIsLogoutModalOpen(true);

    const confirmLogout = () => {
        setIsLogoutModalOpen(false);
        navigate('/');
    };

    const navItems = [
        {
            path: '/admin',
            label: 'Dashboard',
            icon: <LayoutDashboard size={20} />,
            end: true
        },
        {
            label: 'Manajemen Anggota',
            icon: <Users size={20} />,
            children: [
                { path: '/admin/members', label: 'Data Anggota', icon: <Users size={18} /> },
                { path: '/admin/pengajuan-anggota', label: 'Pengajuan Anggota', icon: <UserPlus size={18} /> },
                { path: '/admin/add-member', label: 'Tambah Anggota', icon: <UserPlus size={18} /> },
            ]
        },
        {
            label: 'Upload Pembayaran',
            icon: <Upload size={20} />,
            children: [
                { path: '/admin/upload-simpanan', label: 'Upload Simpanan', icon: <Banknote size={18} /> },
                { path: '/admin/upload-pinjaman', label: 'Upload angsuran', icon: <ClipboardCheck size={18} /> },
            ]
        },
        {
            label: 'Pinjaman',
            icon: <BadgeCent size={20} />,
            children: [
                { path: '/admin/assesment-pinjaman', label: 'Pengajuan Pinjaman', icon: <ClipboardCheck size={18} /> },
                { path: '/admin/pencairan-pinjaman', label: 'Pencairan Pinjaman', icon: <BanknoteArrowUp size={18} /> },
                { path: '/admin/monitor-pinjaman', label: 'Monitoring Pinjaman', icon: <BadgeCent size={18} /> },

            ]
        },

        {
            label: 'Angsuran Dan Simpanan',
            icon: <Banknote size={20} />,
            children: [
                { path: '/admin/monitor-simpanan', label: 'Monitoring Simpanan', icon: <Banknote size={18} /> },
                { path: '/admin/monitor-angsuran', label: 'Monitoring Angsuran', icon: <ClipboardCheck size={18} /> },
                { path: '/admin/transaksi', label: 'Transaksi', icon: <ArrowLeftRight size={18} /> },
            ]
        },
        {
            label: 'Realisasi',
            icon: <CheckCircle size={20} />,
            children: [
                { path: '/admin/disbursement-delivery', label: 'Realisasi Pinjaman', icon: <Send size={18} /> },
                { path: '/admin/realisasi-karyawan', label: 'Realisasi Karyawan', icon: <Users size={18} /> },
            ]
        },

        {
            label: 'Database',
            icon: <Settings size={20} />,
            children: [
                { path: '/admin/master-data', label: 'Master Data', icon: <ClipboardCheck size={18} /> },
            ]
        },
        {
            path: '/admin/reports',
            label: 'Laporan',
            icon: <FileBarChart size={20} />
        }
    ];

    useEffect(() => {
        fetchPendingCount();

        // Setup realtime subscription for personal_data
        const channelPersonal = supabase
            .channel('personal_data_badges')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'personal_data'
            }, () => {
                fetchPendingCount();
            })
            .subscribe();

        // Setup realtime subscription for pinjaman
        const channelPinjaman = supabase
            .channel('pinjaman_badges')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'pinjaman'
            }, () => {
                fetchPendingCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channelPersonal);
            supabase.removeChannel(channelPinjaman);
        };
    }, []);

    const fetchPendingCount = async () => {
        try {
            // 1. Pengajuan Anggota (DONE VERIFIKASI)
            const p1 = supabase
                .from('personal_data')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'DONE VERIFIKASI');

            // 2. Pengajuan Pinjaman (PENGAJUAN)
            const p2 = supabase
                .from('pinjaman')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PENGAJUAN');

            // 3. Pencairan Pinjaman (DISETUJUI)
            const p3 = supabase
                .from('pinjaman')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'DISETUJUI');

            // 4. Realisasi Pinjaman (DICAIRKAN & delivery_status != SENT)
            // Note: Supabase doesn't support != SENT easily in one go with simple query builder sometimes, 
            // but .neq('delivery_status', 'SENT') works. Use IS NULL or 'PENDING' if that's the default.
            // Based on code, we check if delivery_status === 'SENT'. If not sent, it counts.
            // It could be null.
            const p4 = supabase
                .from('pinjaman')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'DICAIRKAN')
                .neq('delivery_status', 'SENT'); // This assumes not null is handled or null is not equal to SENT

            // 5. Realisasi Karyawan (NON_ACTIVE & exit_realisasi_status = PENDING)
            const p5 = supabase
                .from('personal_data')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'NON_ACTIVE')
                .eq('exit_realisasi_status', 'PENDING');

            const [r1, r2, r3, r4, r5] = await Promise.all([p1, p2, p3, p4, p5]);

            setPendingCount(r1.count || 0);
            setCountAssessment(r2.count || 0);
            setCountDisbursement(r3.count || 0);
            // For p4, we need to be careful about nulls. .neq('delivery_status', 'SENT') matches nulls in Supabase? 
            // Postgres `IS DISTINCT FROM` behavior. Supabase `.neq` usually translates to `<>`. `NULL <> 'SENT'` is NULL (falsy).
            // So we might miss NULLs. Better to use .or('delivery_status.is.null,delivery_status.neq.SENT')
            // But complex filters in simple select count might be tricky.
            // Let's rely on client side filtering if the count is small, OR try a better filter.
            // For now, let's assume default is null or 'PENDING'.
            // If I look at the previous code "RealisasiPinjaman", it checked `!isSent`.

            // Retrying p4 with safer logic if possible, or accepting `.neq` might miss nulls.
            // Actually, let's just use the count from the response. If it misses nulls, I will fix.
            // NOTE: In the `DisbursementDelivery.jsx` user code: `const isSent = loan.delivery_status === 'SENT';`
            // So anything NOT 'SENT' counts. 
            // To be safe, I should query `eq('status', 'DICAIRKAN')` and filter in memory if count is small?
            // Or better: `status=DICAIRKAN`. Then subtract those that are SENT?
            // `count(DICAIRKAN)` - `count(DICAIRKAN & SENT)`? 
            // A bit expensive to run two queries.
            // Let's try `.or('delivery_status.is.null,delivery_status.neq.SENT')`
            // But `.or` syntax with other filters is tricky.
            // Let's stick to a simpler query for now: 
            // `select count from pinjaman where status='DICAIRKAN'`. 
            // And `select count from pinjaman where status='DICAIRKAN' and delivery_status='SENT'`.
            // Pending = Total - Sent.

            const p4_total = supabase.from('pinjaman').select('*', { count: 'exact', head: true }).eq('status', 'DICAIRKAN');
            const p4_sent = supabase.from('pinjaman').select('*', { count: 'exact', head: true }).eq('status', 'DICAIRKAN').eq('delivery_status', 'SENT');

            // Re-executing Promise.all with corrected logic
            const [res1, res2, res3, res4_total, res4_sent, res5] = await Promise.all([
                p1, p2, p3, p4_total, p4_sent, p5
            ]);

            setPendingCount(res1.count || 0);
            setCountAssessment(res2.count || 0);
            setCountDisbursement(res3.count || 0);
            const pendingDelivery = (res4_total.count || 0) - (res4_sent.count || 0);
            setCountDelivery(pendingDelivery > 0 ? pendingDelivery : 0);
            setCountExit(res5.count || 0);

        } catch (err) {
            console.error('Error fetching pending counts:', err);
        }
    };

    // AUTO OPEN SUBMENU SESUAI URL
    useEffect(() => {
        const activeMenus = {};
        navItems.forEach((item, idx) => {
            if (item.children?.some(sub => location.pathname.startsWith(sub.path))) {
                activeMenus[idx] = true;
            }
        });
        setOpenMenus(activeMenus);
    }, [location.pathname]);

    const toggleMenu = (idx) => {
        setOpenMenus(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const currentItem =
        navItems
            .flatMap(i => i.children ?? i)
            .find(i => i.path === location.pathname) || { label: 'Admin Panel' };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
            {/* SIDEBAR */}
            <aside className={`bg-slate-900 border-r border-slate-800 shadow-xl
                ${isSidebarOpen ? 'w-72' : 'w-20'}
                fixed md:relative h-full z-30 transition-all duration-300 ease-in-out flex flex-col`}
            >
                {/* BRANDING */}
                <div className="h-20 flex items-center justify-center border-b border-slate-800/50 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-3 z-10 animate-in fade-in duration-300">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30">
                                K
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-black text-white tracking-tight">KOPSSI</span>
                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest leading-none">Admin Panel</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/30">
                            K
                        </div>
                    )}
                </div>

                {/* NAVIGATION */}
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-hide">
                    {navItems.map((item, idx) => (
                        <div key={idx}>
                            {/* PARENT ITEM */}
                            {item.path ? (
                                <NavLink
                                    to={item.path}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all duration-200 group relative
                                        ${isActive
                                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`
                                    }
                                >
                                    <div className="relative">
                                        {item.icon}
                                        {item.label === 'Manajemen Anggota' && pendingCount > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                                        )}
                                    </div>
                                    {isSidebarOpen && <span className="tracking-wide">{item.label}</span>}

                                    {/* Active Indicator Line */}
                                    {/* {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/30 rounded-r-lg"></div>} */}
                                </NavLink>
                            ) : (
                                <button
                                    onClick={() => toggleMenu(idx)}
                                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-bold text-sm transition-all duration-200 group
                                        ${openMenus[idx] ? 'text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            {item.icon}
                                            {item.label === 'Manajemen Anggota' && pendingCount > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                                            )}
                                            {item.label === 'Pinjaman' && (countAssessment > 0 || countDisbursement > 0) && (
                                                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                                            )}
                                            {item.label === 'Realisasi' && (countDelivery > 0 || countExit > 0) && (
                                                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                                            )}
                                        </div>
                                        {isSidebarOpen && <span className="tracking-wide">{item.label}</span>}
                                    </div>
                                    {isSidebarOpen && (
                                        <ChevronDown
                                            size={16}
                                            className={`transition-transform duration-300 ${openMenus[idx] ? 'rotate-180 text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'}`}
                                        />
                                    )}
                                </button>
                            )}

                            {/* SUBMENU */}
                            {item.children && (
                                <div
                                    className={`
                                        overflow-hidden transition-all duration-300 ease-in-out
                                        ${openMenus[idx] && isSidebarOpen
                                            ? 'max-h-96 opacity-100 mb-2'
                                            : 'max-h-0 opacity-0'}
                                    `}
                                >
                                    <div className="ml-5 pl-4 border-l-2 border-slate-800 space-y-1 mt-1">
                                        {item.children.map(sub => (
                                            <NavLink
                                                key={sub.path}
                                                to={sub.path}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
                                                    ${isActive
                                                        ? 'text-emerald-400 bg-emerald-500/10'
                                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`
                                                }
                                            >
                                                <div className="relative">
                                                    {sub.icon}
                                                    {sub.label === 'Pengajuan Anggota' && pendingCount > 0 && (
                                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                                    )}
                                                    {sub.label === 'Pengajuan Pinjaman' && countAssessment > 0 && (
                                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                                    )}
                                                    {sub.label === 'Pencairan Pinjaman' && countDisbursement > 0 && (
                                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                                    )}
                                                    {sub.label === 'Realisasi Pinjaman' && countDelivery > 0 && (
                                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                                    )}
                                                    {sub.label === 'Realisasi Karyawan' && countExit > 0 && (
                                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                                    )}
                                                </div>
                                                <span>{sub.label}</span>
                                            </NavLink>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* LOGOUT BUTTON */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 group border border-transparent hover:border-rose-500/20"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-hidden relative">

                {/* HEADER */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-20 px-8 flex items-center justify-between transition-all duration-300 shadow-sm">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-95"
                        >
                            <Menu size={24} />
                        </button>

                        <div className="flex flex-col hidden md:block">
                            <h1 className="text-xl font-black text-gray-800 tracking-tight leading-none">
                                {currentItem.label}
                            </h1>
                            <span className="text-xs font-medium text-gray-400 mt-1">
                                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        {/* Search Bar - Hidden on small screens */}
                        <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all w-64">
                            <Search size={16} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari menu atau data..."
                                className="bg-transparent border-none focus:outline-none text-sm ml-2 w-full font-medium text-gray-600 placeholder:text-gray-400"
                            />
                        </div>

                        <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>

                        <button className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors group">
                            <Bell size={22} className="group-hover:text-gray-700" />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-2 border-l border-transparent md:border-gray-200 cursor-pointer hover:bg-gray-50 p-1.5 pr-3 rounded-full transition-all group">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 group-hover:scale-105 transition-transform">
                                <UserCircle size={24} />
                            </div>
                            <div className="hidden md:flex flex-col text-right">
                                <span className="text-sm font-black text-gray-800 leading-tight group-hover:text-emerald-700 transition-colors">Admin Super</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Administrator</span>
                            </div>
                            <ChevronDown size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors hidden md:block" />
                        </div>
                    </div>
                </header>

                {/* MAIN CONTENT */}
                <main className="flex-1 overflow-auto bg-gray-50/50 p-6 md:p-8 scroll-smooth">
                    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Outlet />
                    </div>
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
