import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard, Users, FileText, AlertTriangle, MessageSquare,
    Tag, LogOut, ChevronRight, Shield, Bell, UserX
} from 'lucide-react';
import api from '../../lib/axios';

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [signalBadge, setSignalBadge]   = useState(0);
    const [suspectBadge, setSuspectBadge] = useState(0);

    // Charger les badges (signalements en attente + suspects)
    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/admin/stats');
                setSignalBadge(res.data.signal_pending ?? 0);
                setSuspectBadge(res.data.suspects_count ?? 0);
            } catch { /* silencieux */ }
        };
        load();
        const t = setInterval(load, 30000);
        return () => clearInterval(t);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const NAV = [
        { to: '/admin',              label: 'Dashboard',        icon: LayoutDashboard, end: true },
        { to: '/admin/utilisateurs', label: 'Utilisateurs',     icon: Users },
        { to: '/admin/annonces',     label: 'Annonces',         icon: FileText },
        {
            to: '/admin/signalements', label: 'Signalements', icon: AlertTriangle,
            badge: signalBadge > 0 ? signalBadge : null, badgeCls: 'bg-orange-500',
        },
        {
            to: '/admin/suspects', label: 'Comportements', icon: UserX,
            badge: suspectBadge > 0 ? suspectBadge : null, badgeCls: 'bg-red-500',
        },
        { to: '/admin/messages',      label: 'Requêtes Utilisateurs', icon: MessageSquare },
        { to: '/admin/communication', label: 'Communication', icon: Bell },
        { to: '/admin/categories',    label: 'Catégories & Villes', icon: Tag },
    ];

    return (
        <div className="flex h-screen bg-[#0f172a] text-white overflow-hidden">

            {/* ── Sidebar ── */}
            <aside className="w-64 flex-shrink-0 bg-[#0f172a] border-r border-white/5 flex flex-col">
                {/* Logo */}
                <div className="px-6 py-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#4ade80] flex items-center justify-center">
                            <Shield className="w-5 h-5 text-[#0f172a]" />
                        </div>
                        <div>
                            <p className="font-extrabold text-white text-sm leading-none">Axioplace</p>
                            <p className="text-[10px] text-[#4ade80] font-semibold uppercase tracking-widest mt-0.5">Admin Panel</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {NAV.map(({ to, label, icon: Icon, end, badge, badgeCls }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-[#4ade80]/10 text-[#4ade80]'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1">{label}</span>
                            {badge && (
                                <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full ${badgeCls}`}>
                                    {badge > 99 ? '99+' : badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Admin info + Logout */}
                <div className="px-4 py-4 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-[#4ade80]/20 flex items-center justify-center text-sm font-bold text-[#4ade80] uppercase flex-shrink-0">
                            {user?.nom?.charAt(0) || 'A'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.nom}</p>
                            <p className="text-[10px] text-[#4ade80] font-bold uppercase">Super Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Déconnexion
                    </button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main className="flex-1 overflow-y-auto bg-[#0f1f35]">
                {/* Topbar */}
                <div className="sticky top-0 z-10 bg-[#0f1f35]/80 backdrop-blur border-b border-white/5 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>Admin</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white font-medium">Axioplace</span>
                    </div>
                    <a href="/" target="_blank" className="text-xs text-slate-400 hover:text-[#4ade80] transition flex items-center gap-1">
                        ← Voir le site public
                    </a>
                </div>

                {/* Page content */}
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
