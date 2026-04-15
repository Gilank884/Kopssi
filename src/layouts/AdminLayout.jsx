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
    CheckCircle,
    Percent,
    Landmark,
    X,
    ChevronLeft,
    ChevronRight,
    ChevronRight as ChevronRightIcon
} from 'lucide-react';
import LogoutModal from '../components/LogoutModal';

const AdminLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState({});
    const [pendingCount, setPendingCount] = useState(0);
    const [countAssessment, setCountAssessment] = useState(0);
    const [countDisbursement, setCountDisbursement] = useState(0);
    const [countDelivery, setCountDelivery] = useState(0);
    const [countExit, setCountExit] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Auto-close sidebar on mobile when route changes
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    }, [location.pathname]);

    // Handle resize to adjust sidebar
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogoutClick = () => setIsLogoutModalOpen(true);

    const confirmLogout = () => {
        setIsLogoutModalOpen(false);
        navigate('/');
    };

    // Get user role for permission checks
    const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

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
                { path: '/admin/tagihan-angsuran', label: 'Tagihan Angsuran', icon: <ClipboardCheck size={18} /> },
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
                ...(isSuperAdmin ? [
                    { path: '/admin/user-management', label: 'Manajemen User', icon: <Users size={18} /> }
                ] : []),
            ]
        },
        {
            label: 'Laporan',
            icon: <FileBarChart size={20} />,
            children: [
                { path: '/admin/reports/members', label: 'Laporan Anggota', icon: <Users size={18} /> },
                { path: '/admin/reports/installments', label: 'Laporan Angsuran', icon: <Banknote size={18} /> },
                { path: '/admin/reports/interest', label: 'Laporan Bagi Hasil', icon: <Percent size={18} /> },
                { path: '/admin/reports/outstanding', label: 'Laporan Sisa Pinjaman', icon: <Landmark size={18} /> },
            ]
        }
    ];

    // SEARCH LOGIC
    const filteredNavItems = searchQuery
        ? navItems.map(item => {
            const matchesParent = item.label.toLowerCase().includes(searchQuery.toLowerCase());
            let matchedChildren = null;

            if (item.children) {
                matchedChildren = item.children.filter(sub =>
                    sub.label.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            if (matchesParent || (matchedChildren && matchedChildren.length > 0)) {
                return {
                    ...item,
                    children: item.children ? (matchesParent ? item.children : matchedChildren) : null
                };
            }
            return null;
        }).filter(Boolean)
        : navItems;

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

    // AUTO OPEN SUBMENU ON SEARCH OR URL CHANGE
    useEffect(() => {
        if (searchQuery.trim() !== '') {
            const activeMenus = {};
            filteredNavItems.forEach((item, idx) => {
                if (item.children && item.children.length > 0) {
                    activeMenus[idx] = true;
                }
            });
            setOpenMenus(activeMenus);
        } else {
            const activeMenus = {};
            navItems.forEach((item, idx) => {
                if (item.children?.some(sub => location.pathname.startsWith(sub.path))) {
                    activeMenus[idx] = true;
                }
            });
            setOpenMenus(activeMenus);
        }
    }, [searchQuery, location.pathname]);

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
        <div className="flex h-screen bg-neutral-50 text-slate-800 font-sans overflow-hidden">
            {/* MOBILE OVERLAY */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`bg-white border-r border-slate-200 shadow-xl relative
                ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'}
                fixed lg:relative h-full z-50 transition-all duration-300 ease-in-out flex flex-col`}
            >
                {/* FLOATING TOGGLE BUTTON */}
                <button
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-4 top-8 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-lg text-slate-400 hover:text-blue-600 transition-all z-[60] group active:scale-90"
                >
                    {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
                {/* BRANDING */}
                <div className="h-20 flex items-center px-5 border-b border-slate-100 relative overflow-hidden group bg-blue-50/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {isSidebarOpen ? (
                        <div className="flex items-center justify-between w-full z-10 animate-in fade-in zoom-in duration-300 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">
                                    K
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-slate-800 tracking-tighter leading-none italic">KOPSSI</span>
                                    <span className="text-[9px] uppercase text-blue-600 font-black tracking-widest mt-1 opacity-80">Admin Panel</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex justify-center">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200 transform hover:scale-110 transition-transform cursor-pointer" onClick={() => setSidebarOpen(true)}>
                                K
                            </div>
                        </div>
                    )}
                </div>

                {/* NAVIGATION */}
                <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto scrollbar-hide">
                    <div className="space-y-3">
                        {isSidebarOpen && (
                            <div className="flex items-center justify-between px-3">
                                <h4 className="text-[10px] font-black text-slate-400 tracking-[1.5px] uppercase opacity-60">Main Menu</h4>
                                {searchQuery && (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-bold animate-pulse">
                                        Filtered
                                    </span>
                                )}
                            </div>
                        )}
                        <div className="space-y-1">
                            {filteredNavItems.length > 0 ? (
                                filteredNavItems.map((item, idx) => (
                                    <div key={idx}>
                                        {/* PARENT ITEM */}
                                        {item.path ? (
                                            <NavLink
                                                to={item.path}
                                                end={item.end}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all duration-200 group relative
                                                    ${isActive
                                                        ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100/30'
                                                        : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`
                                                }
                                            >
                                                <div className="relative">
                                                    {item.icon}
                                                    {item.label === 'Manajemen Anggota' && pendingCount > 0 && (
                                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                                    )}
                                                </div>
                                                {isSidebarOpen && <span className="tracking-tight">{item.label}</span>}
                                            </NavLink>
                                        ) : (
                                            <button
                                                onClick={() => toggleMenu(idx)}
                                                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-bold text-sm transition-all duration-200 group
                                                    ${openMenus[idx] ? 'text-blue-700 bg-blue-50/20' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-700'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        {item.icon}
                                                        {item.label === 'Manajemen Anggota' && pendingCount > 0 && (
                                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                                        )}
                                                        {item.label === 'Pinjaman' && (countAssessment > 0 || countDisbursement > 0) && (
                                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                                        )}
                                                        {item.label === 'Realisasi' && (countDelivery > 0 || countExit > 0) && (
                                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                                        )}
                                                    </div>
                                                    {isSidebarOpen && <span className="tracking-tight">{item.label}</span>}
                                                </div>
                                                {isSidebarOpen && (
                                                    <ChevronDown
                                                        size={14}
                                                        className={`transition-transform duration-300 ${openMenus[idx] ? 'rotate-180 text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`}
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
                                                <div className="ml-7 pl-5 border-l-2 border-slate-100 space-y-1 mt-2">
                                                    {item.children.map(sub => (
                                                        <NavLink
                                                            key={sub.path}
                                                            to={sub.path}
                                                            className={({ isActive }) =>
                                                                `flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-bold transition-all duration-200
                                                                ${isActive
                                                                    ? 'text-blue-700 bg-blue-100/30'
                                                                    : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50/30'}`
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
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                        <Search size={20} />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Menu tidak ditemukan</p>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* LOGOUT BUTTON */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300 group border border-transparent hover:border-rose-100"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-hidden relative">

                {/* HEADER */}
                <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between transition-all duration-300 shadow-sm">
                    <div className="flex items-center gap-3 md:gap-6">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-90"
                        >
                            <Menu size={22} />
                        </button>

                        <div className="flex flex-col">
                            <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight leading-none truncate max-w-[150px] md:max-w-none">
                                {currentItem.label}
                            </h1>
                            <span className="text-[10px] md:text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider hidden sm:block font-mono">
                                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-5">
                        {/* Search Bar - Functional for Sidebar Menu */}
                        <div className="hidden lg:flex items-center bg-gray-100 rounded-2xl px-4 py-2 border border-transparent focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all w-64 relative">
                            <Search size={16} className={`transition-colors duration-300 ${searchQuery ? 'text-blue-500' : 'text-gray-400'}`} />
                            <input
                                type="text"
                                placeholder="Cari menu..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none focus:outline-none text-sm ml-2 w-full font-medium text-gray-600 placeholder:text-gray-400"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                        <button className="relative p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all group active:scale-90">
                            <Bell size={20} className="group-hover:text-slate-700" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>
                        </button>

                        <div className="flex items-center gap-2">
                             <button
                                onClick={() => navigate('/dashboard')}
                                className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-emerald-100 transition-all border border-emerald-100/50 shadow-sm group/mode"
                            >
                                <Users size={14} className="group-hover/mode:scale-110 transition-transform" />
                                Mode User
                            </button>

                            <div className="flex items-center gap-3 md:pl-2 border-l border-transparent md:border-gray-200 cursor-pointer hover:bg-gray-50 p-1 md:p-1.5 md:pr-3 rounded-full transition-all group">
                                <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 group-hover:scale-105 transition-transform overflow-hidden">
                                    <UserCircle size={24} />
                                </div>
                                <div className="hidden sm:flex flex-col text-left">
                                    <span className="text-[13px] font-black text-slate-800 leading-tight group-hover:text-blue-700 transition-colors">Admin Super</span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Administrator</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* MAIN CONTENT */}
                <main className="flex-1 overflow-auto bg-slate-100/70 p-4 md:p-8 scroll-smooth">
                    <div className="max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-3 duration-700 delay-150">
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
